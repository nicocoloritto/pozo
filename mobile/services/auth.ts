import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import adminSeed from '../data/usuarios-admin.json';
import vecinosSeed from '../data/usuarios-vecinos.json';
import { devLog } from '../lib/devLog';
import type { Admin, User, Vecino } from '../types/user';

// TODO: esto guarda los usuarios en AsyncStorage porque todavía no hay backend. Cuando
// exista la API, esta es la única pieza que hay que reemplazar: las pantallas solo
// llaman a emailExiste/registrar/login, nunca tocan el storage directamente.
//
// usuarios-vecinos.json y usuarios-admin.json son datos de prueba (contraseña en texto
// plano, "123456" para todos) que se precargan una sola vez, ya hasheados, para poder
// loguearse sin pasar por el registro con DNI. init() nunca pisa un email que ya exista
// en el storage, así que una cuenta real registrada nunca se pierde por el seed.

const USERS_KEY = 'pozo:usuarios';
const SESSION_KEY = 'pozo:sesion';

export type RegisterInput = {
  firstName: string;
  lastName: string;
  sex: string;
  documentNumber: string;
  birthDate: string;
  email: string;
  password: string;
};

type VecinoSeed = Omit<RegisterInput, 'password'> & {
  id: string;
  password: string;
  neighborhood?: string;
};
type AdminSeed = { id: string; firstName: string; email: string; password: string; municipioId: string };

type StoredUser = (Vecino | Admin) & { passwordHash: string; salt: string };

export type AuthErrorCode = 'EMAIL_TAKEN' | 'EMAIL_NOT_FOUND' | 'WRONG_PASSWORD';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function sameEmail(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

// Nunca deja que un storage corrupto/no disponible tire abajo el arranque: si falla la
// lectura, seguimos como si no hubiera usuarios guardados todavía.
async function loadUsers(): Promise<StoredUser[]> {
  devLog('auth.loadUsers:start');
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    const users = raw ? (JSON.parse(raw) as StoredUser[]) : [];
    devLog('auth.loadUsers:end', users.length, 'usuarios');
    return users;
  } catch (err) {
    console.warn('[auth] No se pudieron leer los usuarios de AsyncStorage', err);
    devLog('auth.loadUsers:end (error, devuelve [])');
    return [];
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  devLog('auth.saveUsers:start', users.length, 'usuarios');
  try {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    devLog('auth.saveUsers:end');
  } catch (err) {
    console.warn('[auth] No se pudieron guardar los usuarios en AsyncStorage', err);
    devLog('auth.saveUsers:end (error)');
  }
}

function toUser(stored: StoredUser): User {
  const { passwordHash, salt, ...user } = stored;
  return user;
}

// Loads usuarios-vecinos.json / usuarios-admin.json into AsyncStorage, hashing each
// test password the same way registrar() does. Call once when the app starts, before
// reading any session. Safe to call more than once: every email already in storage is
// skipped. Never throws: un seed roto no debe bloquear el arranque de la app.
export async function init(): Promise<void> {
  devLog('auth.init:start');
  const users = await loadUsers();
  let changed = false;

  for (const seed of vecinosSeed as VecinoSeed[]) {
    try {
      if (users.some((user) => sameEmail(user.email, seed.email))) continue;
      devLog('auth.init:hash vecino:start', seed.email);
      const { password, ...rest } = seed;
      const salt = Crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);
      devLog('auth.init:hash vecino:end', seed.email);
      // Id fijo (no Crypto.randomUUID()): data/reclamos.json referencia estos ids como
      // autorId, así que tienen que ser estables entre arranques.
      users.push({ rol: 'vecino', ...rest, passwordHash, salt });
      changed = true;
    } catch (err) {
      console.warn('[auth] No se pudo precargar un vecino de prueba', err);
    }
  }

  for (const seed of adminSeed as AdminSeed[]) {
    try {
      if (users.some((user) => sameEmail(user.email, seed.email))) continue;
      devLog('auth.init:hash admin:start', seed.email);
      const { password, ...rest } = seed;
      const salt = Crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);
      devLog('auth.init:hash admin:end', seed.email);
      users.push({ rol: 'admin', ...rest, passwordHash, salt });
      changed = true;
    } catch (err) {
      console.warn('[auth] No se pudo precargar un admin de prueba', err);
    }
  }

  if (changed) await saveUsers(users);
  devLog('auth.init:end', changed ? 'con cambios' : 'sin cambios');
}

export async function emailExiste(email: string): Promise<boolean> {
  const users = await loadUsers();
  return users.some((user) => sameEmail(user.email, email));
}

// Siempre crea un usuario con rol "vecino": los admin no se registran desde la app.
export async function registrar(input: RegisterInput): Promise<User> {
  const users = await loadUsers();
  if (users.some((user) => sameEmail(user.email, input.email))) {
    throw new AuthError('EMAIL_TAKEN', 'Este email ya está registrado');
  }

  const { password, ...rest } = input;
  const salt = Crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  const stored: StoredUser = { id: Crypto.randomUUID(), rol: 'vecino', ...rest, passwordHash, salt };

  users.push(stored);
  await saveUsers(users);
  return toUser(stored);
}

export async function login(email: string, password: string): Promise<User> {
  const users = await loadUsers();
  const stored = users.find((user) => sameEmail(user.email, email));
  if (!stored) {
    throw new AuthError('EMAIL_NOT_FOUND', 'No hay una cuenta con este email');
  }

  const passwordHash = await hashPassword(password, stored.salt);
  if (passwordHash !== stored.passwordHash) {
    throw new AuthError('WRONG_PASSWORD', 'Contraseña incorrecta');
  }

  return toUser(stored);
}

export async function guardarSesion(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('[auth] No se pudo guardar la sesión', err);
  }
}

// Nunca throws: una sesión que no se puede leer se trata como "no hay sesión", no como
// un error que bloquee el arranque.
export async function obtenerSesion(): Promise<User | null> {
  devLog('auth.obtenerSesion:start');
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    const session = raw ? (JSON.parse(raw) as User) : null;
    devLog('auth.obtenerSesion:end', session ? `${session.email} (${session.rol})` : 'sin sesión');
    return session;
  } catch (err) {
    console.warn('[auth] No se pudo leer la sesión guardada', err);
    devLog('auth.obtenerSesion:end (error, sin sesión)');
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[auth] No se pudo borrar la sesión', err);
  }
}
