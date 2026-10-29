import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { File, UploadType } from 'expo-file-system';
import { devLog } from '../lib/devLog';

// Cliente de la API (repo pozo-backend). Los servicios de auth, reclamos y fotos hablan con el
// servidor a través de acá; las pantallas nunca llaman a fetch directamente.

const TOKEN_KEY = 'pozo:token';
const PUERTO_API = 3000;

// La app en desarrollo se sirve desde la computadora (Metro), y el backend corre en esa misma
// máquina: se toma su IP de Expo y no hace falta configurar nada. EXPO_PUBLIC_API_URL
// permite apuntar a otro servidor (por ejemplo uno desplegado).
function urlBase(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL;
  if (configurada) return configurada.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:${PUERTO_API}`;
}

export const API_URL = urlBase();

export class ApiError extends Error {
  code: string;
  status: number;
  // El objeto `error` completo de la respuesta, por si trae algo más que código y mensaje
  // (por ejemplo, el reclamo cercano de RECLAMO_CERCANO).
  datos: Record<string, unknown>;

  constructor(code: string, message: string, status: number, datos: Record<string, unknown> = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.datos = datos;
  }
}

let token: string | null = null;
let alVencerSesion: (() => void) | null = null;

export async function cargarToken(): Promise<string | null> {
  try {
    token = await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[api] No se pudo leer el token guardado', err);
    token = null;
  }
  return token;
}

export async function guardarToken(nuevo: string): Promise<void> {
  token = nuevo;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, nuevo);
  } catch (err) {
    console.warn('[api] No se pudo guardar el token', err);
  }
}

export async function borrarToken(): Promise<void> {
  token = null;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[api] No se pudo borrar el token', err);
  }
}

// AuthContext se registra acá para enterarse cuando el servidor rechaza el token (venció o la
// cuenta ya no existe) y mandar a la persona al login.
export function alSesionVencida(callback: (() => void) | null): void {
  alVencerSesion = callback;
}

type Opciones = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  // Archivo local a subir como multipart. No va en un FormData: el fetch de Expo no acepta
  // { uri } en FormData y tira antes de enviar, así que la subida usa expo-file-system.
  archivo?: { uri: string; campo: string; mimeType: string };
  // Login y registro: un 401 ahí es "contraseña incorrecta", no una sesión vencida.
  sinSesion?: boolean;
  // Milisegundos de espera; por defecto TIMEOUT_MS. La subida de fotos necesita más.
  timeoutMs?: number;
};

const TIMEOUT_MS = 20000;

export async function llamar<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, archivo, sinSesion = false, timeoutMs = TIMEOUT_MS } = opciones;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

  const controlador = new AbortController();
  const timer = setTimeout(() => controlador.abort(), timeoutMs);
  let status: number;
  let texto: string;
  try {
    devLog('api', metodo, ruta);
    if (archivo) {
      const subida = await new File(archivo.uri).upload(`${API_URL}${ruta}`, {
        httpMethod: 'POST',
        uploadType: UploadType.MULTIPART,
        fieldName: archivo.campo,
        mimeType: archivo.mimeType,
        headers,
        signal: controlador.signal,
      });
      status = subida.status;
      texto = subida.body;
    } else {
      const respuesta = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
        signal: controlador.signal,
      });
      status = respuesta.status;
      texto = await respuesta.text();
    }
  } catch (err) {
    devLog('api', 'falló', metodo, ruta, err);
    throw new ApiError('NETWORK', 'No pudimos conectar con el servidor. Revisá tu conexión y probá de nuevo.', 0);
  } finally {
    clearTimeout(timer);
  }

  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    // Respuesta que no es JSON (por ejemplo una página de error de un proxy): se trata abajo.
  }

  if (status < 200 || status >= 300) {
    const error = (datos as { error?: { code?: string; message?: string } & Record<string, unknown> } | null)?.error;
    if (status === 401 && !sinSesion) {
      await borrarToken();
      alVencerSesion?.();
    }
    throw new ApiError(
      error?.code ?? 'SERVER',
      error?.message ?? 'El servidor tuvo un problema. Probá de nuevo en un rato.',
      status,
      error
    );
  }
  return datos as T;
}
