import AsyncStorage from '@react-native-async-storage/async-storage';
import reclamosSeed from '../data/reclamos.json';
import { devLog } from '../lib/devLog';
import {
  decidirPasarAReparacion,
  decidirRechazar,
  decidirResolver,
  decidirTomar,
  esEstadoFinal,
} from '../lib/maquinaEstados';
import type { Decision } from '../lib/maquinaEstados';
import { ReclamoError } from '../lib/reclamoError';
import type { ReclamoErrorCode } from '../lib/reclamoError';
import { CONFIRMACIONES_NECESARIAS } from '../types/reclamo';
import type { Categoria, EstadoReclamo, OrigenUbicacion, Reclamo } from '../types/reclamo';

export { ReclamoError };
export type { ReclamoErrorCode };

// TODO: esto guarda los reclamos en AsyncStorage porque todavía no hay backend. Cuando
// exista la API, esta es la única pieza que hay que reemplazar: las pantallas solo
// llaman a estas funciones, nunca tocan el storage directamente.
//
// reclamos.json son datos de prueba (coordenadas reales de varios barrios de CABA) que
// se precargan una sola vez. Si ya hay reclamos guardados (incluidos los publicados por
// el usuario o gestionados por el municipio), el seed no los pisa.

const RECLAMOS_KEY = 'pozo:reclamos';

export type PublicarReclamoInput = {
  autorId: string;
  municipioId: string;
  category: Categoria;
  severity: Reclamo['severity'];
  notes?: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: OrigenUbicacion;
  address?: string;
  neighborhood?: string;
  comuna?: number;
};

async function loadReclamos(): Promise<Reclamo[]> {
  devLog('reclamos.loadReclamos:start');
  try {
    const raw = await AsyncStorage.getItem(RECLAMOS_KEY);
    const reclamos = raw ? (JSON.parse(raw) as Reclamo[]) : [];
    devLog('reclamos.loadReclamos:end', reclamos.length, 'reclamos');
    return reclamos;
  } catch (err) {
    console.warn('[reclamos] No se pudieron leer los reclamos de AsyncStorage', err);
    devLog('reclamos.loadReclamos:end (error, devuelve [])');
    return [];
  }
}

async function saveReclamos(reclamos: Reclamo[]): Promise<void> {
  devLog('reclamos.saveReclamos:start', reclamos.length, 'reclamos');
  try {
    await AsyncStorage.setItem(RECLAMOS_KEY, JSON.stringify(reclamos));
    devLog('reclamos.saveReclamos:end');
  } catch (err) {
    console.warn('[reclamos] No se pudieron guardar los reclamos en AsyncStorage', err);
    devLog('reclamos.saveReclamos:end (error)');
  }
}

function generarCaseNumber(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = Math.floor(10000 + Math.random() * 90000);
  return `EXP-${year}-${sequence}`;
}

// Carga reclamos.json en AsyncStorage una sola vez. Nunca pisa reclamos ya guardados
// (ni los de prueba ya migrados, ni los que publicó o gestionó alguien). Corre en
// segundo plano desde AuthProvider: no bloquea el arranque. Nunca throws.
export async function init(): Promise<void> {
  devLog('reclamos.init:start');
  try {
    const existing = await AsyncStorage.getItem(RECLAMOS_KEY);
    if (existing !== null) {
      devLog('reclamos.init:end (ya había reclamos guardados)');
      return;
    }
    await saveReclamos(reclamosSeed as Reclamo[]);
    devLog('reclamos.init:end (seed cargado)', (reclamosSeed as Reclamo[]).length);
  } catch (err) {
    console.warn('[reclamos] No se pudo precargar el seed de reclamos', err);
    devLog('reclamos.init:end (error)');
  }
}

export async function obtenerReclamos(): Promise<Reclamo[]> {
  return loadReclamos();
}

export async function obtenerReclamoPorId(id: string): Promise<Reclamo | undefined> {
  const reclamos = await loadReclamos();
  return reclamos.find((reclamo) => reclamo.id === id);
}

// Del más nuevo al más viejo: así se muestran en "Mis reclamos".
export async function obtenerReclamosPorAutor(autorId: string): Promise<Reclamo[]> {
  const reclamos = await loadReclamos();
  return reclamos
    .filter((reclamo) => reclamo.autorId === autorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// El admin solo ve los reclamos de su propio municipio (hoy, siempre "caba"): el campo
// se fija al crear el reclamo, no se deduce después.
export async function obtenerReclamosPorMunicipio(municipioId: string): Promise<Reclamo[]> {
  const reclamos = await loadReclamos();
  return reclamos.filter((reclamo) => reclamo.municipioId === municipioId);
}

export async function publicarReclamo(input: PublicarReclamoInput): Promise<Reclamo> {
  const reclamos = await loadReclamos();
  const now = new Date().toISOString();
  const caseNumber = generarCaseNumber();

  const reclamo: Reclamo = {
    id: caseNumber,
    caseNumber,
    status: 'Reportado',
    confirmaciones: [],
    createdAt: now,
    history: [{ status: 'Reportado', description: 'Ingresado', createdAt: now, autor: input.autorId }],
    ...input,
  };

  reclamos.unshift(reclamo);
  await saveReclamos(reclamos);
  return reclamo;
}

// Un vecino confirma un reclamo ajeno una sola vez. Al llegar a
// CONFIRMACIONES_NECESARIAS, y solo si todavía está "Reportado", pasa solo a
// "ConfirmadoPorVecinos". Los estados siguientes los cambia el municipio.
export async function confirmarReclamo(id: string, vecinoId: string): Promise<Reclamo> {
  const reclamos = await loadReclamos();
  const reclamo = reclamos.find((item) => item.id === id);
  if (!reclamo) {
    throw new ReclamoError('NOT_FOUND', 'Este reclamo no existe o fue eliminado');
  }
  if (reclamo.autorId === vecinoId) {
    throw new ReclamoError('OWN_RECLAMO', 'No podés confirmar tu propio reclamo');
  }
  if (reclamo.confirmaciones.includes(vecinoId)) {
    throw new ReclamoError('ALREADY_CONFIRMED', 'Ya confirmaste este reclamo');
  }

  reclamo.confirmaciones.push(vecinoId);

  if (reclamo.status === 'Reportado' && reclamo.confirmaciones.length >= CONFIRMACIONES_NECESARIAS) {
    const now = new Date().toISOString();
    reclamo.status = 'ConfirmadoPorVecinos';
    reclamo.history.push({
      status: 'ConfirmadoPorVecinos',
      description: `Confirmado por ${CONFIRMACIONES_NECESARIAS} vecinos`,
      createdAt: now,
    });
  }

  await saveReclamos(reclamos);
  return reclamo;
}

// --- Gestión municipal ------------------------------------------------------------
//
// Toda transición de estado pasa por `transicionar`: un solo lugar que busca el
// reclamo, le pide a `decidir` (lib/maquinaEstados.ts) el próximo estado — o que tire
// ReclamoError si la transición no vale en el estado actual —, aplica los campos extra
// que correspondan y deja constancia en el historial con fecha y autor. Así este
// archivo es solo persistencia; las reglas de negocio están centralizadas y son puras.

async function transicionar(id: string, decidir: (reclamo: Reclamo) => Decision, autor: string): Promise<Reclamo> {
  const reclamos = await loadReclamos();
  const reclamo = reclamos.find((item) => item.id === id);
  if (!reclamo) {
    throw new ReclamoError('NOT_FOUND', 'Este reclamo no existe o fue eliminado');
  }

  const { status, description, extra } = decidir(reclamo);
  const now = new Date().toISOString();

  if (extra) Object.assign(reclamo, extra);
  reclamo.status = status;
  reclamo.history.push({ status, description, createdAt: now, autor });

  await saveReclamos(reclamos);
  return reclamo;
}

export async function tomar(id: string, adminId: string): Promise<Reclamo> {
  return transicionar(id, decidirTomar, adminId);
}

export async function pasarAReparacion(id: string, adminId: string): Promise<Reclamo> {
  return transicionar(id, decidirPasarAReparacion, adminId);
}

export async function resolver(id: string, adminId: string, fotoResolucion: string): Promise<Reclamo> {
  return transicionar(id, (reclamo) => decidirResolver(reclamo, fotoResolucion), adminId);
}

export async function rechazar(id: string, adminId: string, motivo: string): Promise<Reclamo> {
  return transicionar(id, (reclamo) => decidirRechazar(reclamo, motivo), adminId);
}

export async function asignarArea(id: string, areaId: string): Promise<Reclamo> {
  const reclamos = await loadReclamos();
  const reclamo = reclamos.find((item) => item.id === id);
  if (!reclamo) {
    throw new ReclamoError('NOT_FOUND', 'Este reclamo no existe o fue eliminado');
  }
  if (esEstadoFinal(reclamo.status)) {
    throw new ReclamoError('INVALID_TRANSITION', 'No se puede asignar un área a un reclamo cerrado');
  }

  reclamo.areaAsignada = areaId;
  await saveReclamos(reclamos);
  return reclamo;
}

export async function definirFechaEstimada(id: string, fechaEstimada: string): Promise<Reclamo> {
  const reclamos = await loadReclamos();
  const reclamo = reclamos.find((item) => item.id === id);
  if (!reclamo) {
    throw new ReclamoError('NOT_FOUND', 'Este reclamo no existe o fue eliminado');
  }
  if (esEstadoFinal(reclamo.status)) {
    throw new ReclamoError('INVALID_TRANSITION', 'No se puede definir una fecha estimada en un reclamo cerrado');
  }

  reclamo.fechaEstimada = fechaEstimada;
  await saveReclamos(reclamos);
  return reclamo;
}

export async function agregarNota(id: string, texto: string, autor: string): Promise<Reclamo> {
  if (!texto.trim()) {
    throw new ReclamoError('NOTA_VACIA', 'La nota no puede estar vacía');
  }
  const reclamos = await loadReclamos();
  const reclamo = reclamos.find((item) => item.id === id);
  if (!reclamo) {
    throw new ReclamoError('NOT_FOUND', 'Este reclamo no existe o fue eliminado');
  }

  reclamo.notas = [...(reclamo.notas ?? []), { fecha: new Date().toISOString(), texto: texto.trim(), autor }];
  await saveReclamos(reclamos);
  return reclamo;
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
