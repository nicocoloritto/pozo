import type { Categoria } from './reclamo';

// Un área del municipio (GET /areas). Cada categoría pertenece a una sola área;
// `plazoMaximoDias` es lo que usa el servidor para decidir si un reclamo está vencido
// (campo `vencido` de cada reclamo).
export type Area = {
  id: string;
  nombre: string;
  categorias: Categoria[];
  plazoMaximoDias: number;
};
