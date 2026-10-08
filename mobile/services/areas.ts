import areasData from '../data/areas.json';
import type { Area } from '../types/area';

// TODO: reemplazar por GET /municipios/:municipioId/areas cuando exista el backend.
// Por ahora las áreas son las mismas para todos los municipios.
export const AREAS = areasData as Area[];

export function areaPorId(areaId: string | undefined): Area | undefined {
  if (!areaId) return undefined;
  return AREAS.find((area) => area.id === areaId);
}