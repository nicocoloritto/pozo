import { ReclamoCercanoError, ReclamoError } from '../lib/reclamoError';
import type { ReclamoErrorCode } from '../lib/reclamoError';
import { validarNuevoReclamo } from '../lib/validarReclamo';
import { ApiError, llamar } from './api';
import { subirFoto } from './fotos';
import type { Categoria, EstadoReclamo, MotivoRechazo, OrigenUbicacion, Reclamo, TipoVoto } from '../types/reclamo';

export { ReclamoCercanoError, ReclamoError };
export type { ReclamoErrorCode };

// Los reclamos viven en el servidor (repo pozo-backend). Las pantallas llaman a estas
// funciones y nunca a la red directamente. Las reglas (estados, confirmaciones, permisos) las
// aplica el servidor: acá se valida lo mínimo para avisar rápido, pero la garantía es la del
// servidor. Quién publica, vota o gestiona sale de la sesión, no de lo que mande la app.

export type PublicarReclamoInput = {
  municipioId: string;
  category: Categoria;
  severity: Reclamo['severity'];
  notes?: string;
  // Foto local (cámara o galería) o URL: si es local, se sube antes de publicar.
  photoUrl: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: OrigenUbicacion;
  address?: string;
  neighborhood?: string;
  comuna?: number;
  // La persona vio el aviso de reclamo cercano y dijo que es otro problema.
  publicarIgual?: boolean;
};

const CODIGOS: ReclamoErrorCode[] = [
  'OWN_RECLAMO',
  'ALREADY_CONFIRMED',
  'NOT_FOUND',
  'INVALID_TRANSITION',
  'AREA_REQUIRED',
  'FOTO_REQUIRED',
  'MOTIVO_REQUIRED',
  'NOTA_VACIA',
  'RECLAMO_CERCANO',
  'INVALID_INPUT',
  'FORBIDDEN',
  'UNAUTHENTICATED',
  'NETWORK',
];

function comoReclamoError(err: unknown): unknown {
  if (!(err instanceof ApiError)) return err;
  return new ReclamoError(CODIGOS.find((c) => c === err.code) ?? 'SERVER', err.message);
}

async function pedir<T>(ruta: string, opciones?: Parameters<typeof llamar>[1]): Promise<T> {
  try {
    return await llamar<T>(ruta, opciones);
  } catch (err) {
    throw comoReclamoError(err);
  }
}

async function subir(uri: string): Promise<string> {
  try {
    return await subirFoto(uri);
  } catch (err) {
    if (err instanceof ApiError) {
      throw new ReclamoError(err.code === 'NETWORK' ? 'NETWORK' : 'INVALID_INPUT', err.message);
    }
    throw err;
  }
}

const idEn = (id: string) => `/reclamos/${encodeURIComponent(id)}`;

export async function obtenerReclamos(): Promise<Reclamo[]> {
  return pedir<Reclamo[]>('/reclamos');
}

// Devuelve undefined si el reclamo no existe; cualquier otro problema (sin conexión…) tira.
export async function obtenerReclamoPorId(id: string): Promise<Reclamo | undefined> {
  try {
    return await pedir<Reclamo>(idEn(id));
  } catch (err) {
    if (err instanceof ReclamoError && err.code === 'NOT_FOUND') return undefined;
    throw err;
  }
}

// Para el mapa: el servidor omite los Resueltos o Rechazados hace más de 7 días.
export async function obtenerReclamosParaMapa(): Promise<Reclamo[]> {
  return pedir<Reclamo[]>('/reclamos?mapa=1');
}

// El servidor le devuelve al municipio solo los reclamos de su propio municipio.
export async function obtenerReclamosPorMunicipio(): Promise<Reclamo[]> {
  return pedir<Reclamo[]>('/reclamos');
}

function esReclamo(valor: unknown): valor is Reclamo {
  return typeof valor === 'object' && valor !== null && typeof (valor as { id?: unknown }).id === 'string';
}

// El servidor rechaza con RECLAMO_CERCANO si ya hay un reclamo abierto de la misma categoría a
// menos de 50 m (salvo con `publicarIgual`): se convierte en ReclamoCercanoError con ese
// reclamo, para que la pantalla ofrezca confirmarlo.
export async function publicarReclamo(input: PublicarReclamoInput): Promise<Reclamo> {
  validarNuevoReclamo(input);
  const photoUrl = await subir(input.photoUrl);
  try {
    return await llamar<Reclamo>('/reclamos', { metodo: 'POST', cuerpo: { ...input, photoUrl } });
  } catch (err) {
    if (err instanceof ApiError && err.code === 'RECLAMO_CERCANO' && esReclamo(err.datos.reclamo)) {
      throw new ReclamoCercanoError(err.message, err.datos.reclamo, photoUrl);
    }
    throw comoReclamoError(err);
  }
}

// Voto "¿Sigue ahí?" estilo Waze. Un voto por vecino: "sigue" (cuenta como confirmación) o
// "yaNoEsta", nunca los dos; votar lo otro cambia el voto y tocar el mismo otra vez lo saca.
export async function votarReclamo(id: string, voto: TipoVoto): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/votos`, { metodo: 'POST', cuerpo: { tipo: voto } });
}

// Un vecino confirma un reclamo ajeno una sola vez.
export async function confirmarReclamo(id: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/confirmaciones`, { metodo: 'POST' });
}

// --- Gestión municipal ------------------------------------------------------------

export async function tomar(id: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/tomar`, { metodo: 'POST' });
}

export async function pasarAReparacion(id: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/reparacion`, { metodo: 'POST' });
}

export async function resolver(id: string, fotoResolucion: string): Promise<Reclamo> {
  if (!fotoResolucion) throw new ReclamoError('FOTO_REQUIRED', 'La foto del "después" es obligatoria para resolver');
  return pedir<Reclamo>(`${idEn(id)}/resolver`, {
    metodo: 'POST',
    cuerpo: { fotoResolucion: await subir(fotoResolucion) },
  });
}

// `motivo` es uno de MOTIVOS_RECHAZO; `detalle` es texto opcional.
export async function rechazar(id: string, motivo: MotivoRechazo, detalle: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/rechazar`, { metodo: 'POST', cuerpo: { motivo, detalle } });
}

export async function definirFechaEstimada(id: string, fechaEstimada: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/fecha-estimada`, { metodo: 'PUT', cuerpo: { fechaEstimada } });
}

export async function agregarNota(id: string, texto: string): Promise<Reclamo> {
  return pedir<Reclamo>(`${idEn(id)}/notas`, { metodo: 'POST', cuerpo: { texto } });
}

// Los 6 estados posibles, para filtros, contadores y gráficos de distribución.
export const ESTADOS_RECLAMO: EstadoReclamo[] = [
  'Reportado',
  'ConfirmadoPorVecinos',
  'EnviadoAlMunicipio',
  'EnReparacion',
  'Resuelto',
  'Rechazado',
];

// Los 5 pasos lineales que ve el vecino en el timeline del Detalle. "Rechazado" queda
// afuera a propósito: puede llegar desde cualquiera de estos, no es el siguiente paso
// de "EnReparacion".
export const ESTADOS_TIMELINE_VECINO: EstadoReclamo[] = [
  'Reportado',
  'ConfirmadoPorVecinos',
  'EnviadoAlMunicipio',
  'EnReparacion',
  'Resuelto',
];
