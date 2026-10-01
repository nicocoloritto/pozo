import barriosData from '../data/barrios.json';
import estadisticasPorBarrio from '../data/estadisticas-barrios.json';
import { devLog } from '../lib/devLog';
import type { Barrio, EstadisticasBarrio, EvolucionMensual, RankingBarrio } from '../types/estadisticas';

// Simula la futura API del municipio: las pantallas solo llaman a estas funciones, así
// que el día que exista el backend real, se reemplaza esta implementación y nada más.
// La demora artificial deja ver los estados de carga mientras tanto.

const DELAY_MS = 450;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS));
}

// TODO: reemplazar por GET /municipios/:municipioId/barrios
export async function obtenerBarrios(municipioId: string): Promise<Barrio[]> {
  devLog('estadisticas.obtenerBarrios', municipioId);
  const barrios = (barriosData as Barrio[]).filter((barrio) => barrio.municipioId === municipioId);
  return delay(barrios);
}

// TODO: reemplazar por GET /barrios/:barrioId/estadisticas
export async function obtenerEstadisticasBarrio(barrioId: string): Promise<EstadisticasBarrio | undefined> {
  devLog('estadisticas.obtenerEstadisticasBarrio', barrioId);
  const data = (estadisticasPorBarrio as Record<string, EstadisticasBarrio>)[barrioId];
  return delay(data);
}

// TODO: reemplazar por GET /municipios/:municipioId/ranking
export async function obtenerRanking(municipioId: string): Promise<RankingBarrio[]> {
  devLog('estadisticas.obtenerRanking', municipioId);
  const barrios = (barriosData as Barrio[]).filter((barrio) => barrio.municipioId === municipioId);
  const stats = estadisticasPorBarrio as Record<string, EstadisticasBarrio>;

  const ranking = barrios
    .map((barrio) => ({
      barrioId: barrio.id,
      nombre: barrio.nombre,
      porcentajeResolucion: stats[barrio.id]?.porcentajeResolucion ?? 0,
    }))
    .sort((a, b) => b.porcentajeResolucion - a.porcentajeResolucion)
    .map((item, index): RankingBarrio => ({ ...item, puesto: index + 1 }));

  return delay(ranking);
}

// Distancia aproximada en metros (fórmula de Haversine) para elegir el barrio más
// cercano a una coordenada — no necesita ser exacta, solo ordenar candidatos.
function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Para resolver el municipioId/barrio/comuna de un reclamo nuevo a partir de sus
// coordenadas reales (no del barrio del perfil del vecino, que puede vivir en un
// barrio distinto de donde reportó el problema). Busca en TODOS los barrios, de
// cualquier municipio — hoy solo existe "caba", pero esto no asume eso.
// TODO: reemplazar por un reverse-geocoding real del backend cuando exista.
export async function obtenerBarrioPorCoordenadas(latitude: number, longitude: number): Promise<Barrio | undefined> {
  devLog('estadisticas.obtenerBarrioPorCoordenadas', latitude, longitude);
  return delay(barrioMasCercano(barriosData as Barrio[], latitude, longitude));
}

// Suma la evolución mensual de los últimos 6 meses de todos los barrios del
// municipio — hoy no hay un endpoint a nivel municipio, así que se agrega acá.
// TODO: reemplazar por GET /municipios/:municipioId/evolucion
export async function obtenerEvolucionMunicipio(municipioId: string): Promise<EvolucionMensual[]> {
  devLog('estadisticas.obtenerEvolucionMunicipio', municipioId);
  const barrios = (barriosData as Barrio[]).filter((barrio) => barrio.municipioId === municipioId);
  const stats = estadisticasPorBarrio as Record<string, EstadisticasBarrio>;

  const totalesPorMes = new Map<string, number>();
  for (const barrio of barrios) {
    const evolucion = stats[barrio.id]?.evolucionUltimos6Meses ?? [];
    for (const { mes, reclamos } of evolucion) {
      totalesPorMes.set(mes, (totalesPorMes.get(mes) ?? 0) + reclamos);
    }
  }

  const evolucion = Array.from(totalesPorMes, ([mes, reclamos]) => ({ mes, reclamos }));
  return delay(evolucion);
}

export function barrioMasCercano(barrios: Barrio[], latitude: number, longitude: number): Barrio | undefined {
  if (barrios.length === 0) return undefined;
  return barrios.reduce((closest, barrio) => {
    const distActual = distanciaMetros(latitude, longitude, barrio.latitude, barrio.longitude);
    const distClosest = distanciaMetros(latitude, longitude, closest.latitude, closest.longitude);
    return distActual < distClosest ? barrio : closest;
  });
}

export function buscarBarrioPorNombre(barrios: Barrio[], nombre: string): Barrio | undefined {
  const normalizado = nombre.trim().toLowerCase();
  return barrios.find((barrio) => barrio.nombre.toLowerCase() === normalizado);
}
