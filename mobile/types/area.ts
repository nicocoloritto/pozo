import type { Categoria } from './reclamo';

// Un área del municipio (GET /areas). Cada categoría pertenece a una sola área.
export type Area = {
  id: string;
  nombre: string;
  categorias: Categoria[];
};
