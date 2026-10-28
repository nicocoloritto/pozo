import AsyncStorage from '@react-native-async-storage/async-storage';
import { devLog } from '../lib/devLog';
import { ApiError, borrarToken, cargarToken, guardarToken, llamar } from './api';
import type { User } from '../types/user';

// Registro e inicio de sesión contra la API (repo pozo-backend). El servidor guarda las
// cuentas y las contraseñas (con hash); acá solo queda el token y una copia del usuario para
// abrir la app sin esperar a la red.

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

export type AuthErrorCode =
  | 'EMAIL_TAKEN'
  | 'DNI_TAKEN'
  | 'EMAIL_NOT_FOUND'
  | 'WRONG_PASSWORD'
  | 'INVALID_INPUT'
  | 'NETWORK'
  | 'SERVER';

const CODIGOS: AuthErrorCode[] = [
  'EMAIL_TAKEN',
  'DNI_TAKEN',
  'EMAIL_NOT_FOUND',
  'WRONG_PASSWORD',
  'INVALID_INPUT',
  'NETWORK',
];

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function comoAuthError(err: unknown): unknown {
  if (!(err instanceof ApiError)) return err;
  const code = CODIGOS.find((c) => c === err.code) ?? 'SERVER';
  return new AuthError(code, err.message);
}

type RespuestaAuth = { token: string; user: User };

async function iniciarSesionCon(respuesta: RespuestaAuth): Promise<User> {
  await guardarToken(respuesta.token);
  await guardarSesion(respuesta.user);
  return respuesta.user;
}

// Siempre crea un usuario con rol "vecino": los admin no se registran desde la app.
export async function registrar(input: RegisterInput): Promise<User> {
  try {
    return await iniciarSesionCon(await llamar<RespuestaAuth>('/auth/registro', { metodo: 'POST', cuerpo: input, sinSesion: true }));
  } catch (err) {
    throw comoAuthError(err);
  }
}

// Se consulta apenas se escanea el DNI, antes de pedir email y contraseña. Manda DNI, sexo y
// fecha de nacimiento (no solo el número) para que la consulta no sirva para averiguar si un
// DNI ajeno tiene cuenta. Si no se puede consultar (sin conexión…) devuelve false y el registro
// sigue: el servidor igual rechaza un DNI repetido al registrar.
export async function dniRegistrado(dni: Pick<RegisterInput, 'documentNumber' | 'sex' | 'birthDate'>): Promise<boolean> {
  try {
    const { registrado } = await llamar<{ registrado: boolean }>('/auth/dni-registrado', {
      metodo: 'POST',
      cuerpo: { documentNumber: dni.documentNumber, sex: dni.sex, birthDate: dni.birthDate },
      sinSesion: true,
    });
    return registrado;
  } catch (err) {
    devLog('auth.dniRegistrado:fallo', err);
    return false;
  }
}

export async function login(email: string, password: string): Promise<User> {
  try {
    return await iniciarSesionCon(
      await llamar<RespuestaAuth>('/auth/login', { metodo: 'POST', cuerpo: { email, password }, sinSesion: true })
    );
  } catch (err) {
    throw comoAuthError(err);
  }
}

async function guardarSesion(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('[auth] No se pudo guardar la sesión', err);
  }
}

// La sesión guardada en el teléfono, sin consultar al servidor: así la app abre al instante y
// también sin conexión. Nunca throws: una sesión que no se puede leer se trata como "no hay
// sesión". Para confirmar que sigue vigente, ver verificarSesion().
export async function obtenerSesion(): Promise<User | null> {
  devLog('auth.obtenerSesion:start');
  try {
    const [token, raw] = await Promise.all([cargarToken(), AsyncStorage.getItem(SESSION_KEY)]);
    const session = token && raw ? (JSON.parse(raw) as User) : null;
    devLog('auth.obtenerSesion:end', session ? `${session.email} (${session.rol})` : 'sin sesión');
    return session;
  } catch (err) {
    console.warn('[auth] No se pudo leer la sesión guardada', err);
    return null;
  }
}

// Pregunta al servidor si la sesión sigue valiendo y trae los datos actualizados. Si el
// servidor responde que no, api.ts descarta el token y avisa (ver alSesionVencida). Si no hay
// conexión devuelve null y se sigue con la sesión guardada.
export async function verificarSesion(): Promise<User | null> {
  try {
    const { user } = await llamar<{ user: User }>('/auth/me');
    await guardarSesion(user);
    return user;
  } catch (err) {
    if (!(err instanceof ApiError && err.code === 'NETWORK')) devLog('auth.verificarSesion:fallo', err);
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await borrarToken();
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[auth] No se pudo borrar la sesión', err);
  }
}
