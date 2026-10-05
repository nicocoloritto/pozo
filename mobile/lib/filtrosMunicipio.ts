import type { Categoria, Reclamo } from '../types/reclamo';

// Filtros del panel del municipio. Los usan la Bandeja y el Mapa del admin: así los dos
// filtran exactamente igual.
export type FiltrosMunicipio = {
  barrio: string | null;
  comuna: number | null;
  categoria: Categoria | null;
  area: string | null;
};

export const FILTROS_VACIOS: FiltrosMunicipio = { barrio: null, comuna: null, categoria: null, area: null };

export function hayFiltrosActivos(filtros: FiltrosMunicipio): boolean {
  return Object.values(filtros).some(Boolean);
}

export function aplicarFiltros(reclamos: Reclamo[], filtros: FiltrosMunicipio): Reclamo[] {
  return reclamos.filter((r) => {
    if (filtros.barrio && r.neighborhood !== filtros.barrio) return false;
    if (filtros.comuna && r.comuna !== filtros.comuna) return false;
    if (filtros.categoria && r.category !== filtros.categoria) return false;
    if (filtros.area && r.areaAsignada !== filtros.area) return false;
    return true;
  });
}
