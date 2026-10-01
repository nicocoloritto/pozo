import areasData from '../data/areas.json';
import type { Area } from '../types/area';
import type { Categoria } from '../types/reclamo';

// TODO: reemplazar por GET /municipios/:municipioId/areas cuando exista el backend.
// Por ahora las áreas son las mismas para todos los municipios.
export async function obtenerAreas(): Promise<Area[]> {
  return areasData as Area[];
}

export function areaPorId(areaId: string | undefined): Area | undefined {
  if (!areaId) return undefined;
  return (areasData as Area[]).find((area) => area.id === areaId);
}

// Cada categoría pertenece a una sola área (ver data/areas.json): usado para sugerir
// el área al tomar un reclamo.
export function areaPorCategoria(categoria: Categoria): Area | undefined {
  return (areasData as Area[]).find((area) => area.categorias.includes(categoria));
}
