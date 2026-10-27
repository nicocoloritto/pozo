import type { Barrio, EstadisticasBarrio, EvolucionMensual, RankingBarrio } from '../types/estadisticas';
import { llamar } from './api';
import { listarMunicipios } from './municipios';

// Las estadísticas las calcula el servidor a partir de los reclamos; las pantallas solo llaman
// a estas funciones.

export function obtenerBarrios(municipioId: string): Promise<Barrio[]> {
  return llamar<Barrio[]>(`/municipios/${municipioId}/barrios`);
}

export function obtenerEstadisticasBarrio(barrioId: string): Promise<EstadisticasBarrio> {
  return llamar<EstadisticasBarrio>(`/barrios/${barrioId}/estadisticas`);
}

export function obtenerRanking(municipioId: string): Promise<RankingBarrio[]> {
  return llamar<RankingBarrio[]>(`/municipios/${municipioId}/ranking`);
}

export function obtenerEvolucionMunicipio(municipioId: string): Promise<EvolucionMensual[]> {
  return llamar<EvolucionMensual[]>(`/municipios/${municipioId}/evolucion`);
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
export async function obtenerBarrioPorCoordenadas(latitude: number, longitude: number): Promise<Barrio | undefined> {
  const municipios = await listarMunicipios();
  const barrios = (await Promise.all(municipios.map((municipio) => obtenerBarrios(municipio.id)))).flat();
  return barrioMasCercano(barrios, latitude, longitude);
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
