import type { Categoria } from './reclamo';

// Un área del municipio (data/areas.json). Cada categoría pertenece a una sola área;
// `plazoMaximoDias` es lo que services/reclamos.ts usa para decidir si un reclamo está
// vencido (ver lib/prioridad.ts).
export type Area = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  plazoMaximoDias: number;
};
