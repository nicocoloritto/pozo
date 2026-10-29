import type { Categoria, Reclamo } from '../types/reclamo';

// Sección de la bandeja a la que pertenece un reclamo. El mapa del admin la usa para pintar
// los pines y para el filtro "Sección".
export type Seccion = 'nuevos' | 'gestion' | 'cerrados';

export function seccionDe(reclamo: Pick<Reclamo, 'status'>): Seccion {
  if (reclamo.status === 'Reportado' || reclamo.status === 'ConfirmadoPorVecinos') return 'nuevos';
  if (reclamo.status === 'EnviadoAlMunicipio' || reclamo.status === 'EnReparacion') return 'gestion';
  return 'cerrados';
}

// Filtros del panel del municipio. Los usan la Bandeja y el Mapa del admin: así los dos
// filtran exactamente igual. `seccion` solo se elige en el mapa (la bandeja tiene segmentos).
export type FiltrosMunicipio = {
  barrio: string | null;
  comuna: number | null;
  categoria: Categoria | null;
  seccion: Seccion | null;
};

export const FILTROS_VACIOS: FiltrosMunicipio = { barrio: null, comuna: null, categoria: null, seccion: null };

export function hayFiltrosActivos(filtros: FiltrosMunicipio): boolean {
  return Object.values(filtros).some(Boolean);
}

export function aplicarFiltros(reclamos: Reclamo[], filtros: FiltrosMunicipio): Reclamo[] {
  return reclamos.filter((r) => {
    if (filtros.barrio && r.neighborhood !== filtros.barrio) return false;
    if (filtros.comuna && r.comuna !== filtros.comuna) return false;
    if (filtros.categoria && r.category !== filtros.categoria) return false;
    if (filtros.seccion && seccionDe(r) !== filtros.seccion) return false;
    return true;
  });
}
