import type { Area } from '../types/area';
import { CATEGORIAS_PELIGROSAS } from '../types/reclamo';
import type { Reclamo } from '../types/reclamo';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

function diasDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / MS_POR_DIA));
}

type CamposPrioridad = Pick<Reclamo, 'confirmaciones' | 'createdAt' | 'category'> & Partial<Pick<Reclamo, 'votosYaNoEsta'>>;

// Función pura: más confirmaciones, más antigüedad y ser de una categoría peligrosa
// suben la prioridad; cada "Ya no está" resta lo mismo que suma una confirmación, y nunca
// queda negativa. `ahora` es un parámetro (no Date.now() interno) para que esto
// sea testeable de forma determinística.
export function calcularPrioridad(reclamo: CamposPrioridad, ahora: number = Date.now()): number {
  const porConfirmaciones = reclamo.confirmaciones.length * 10;
  const porYaNoEsta = (reclamo.votosYaNoEsta?.length ?? 0) * 10;
  const porAntiguedad = diasDesde(reclamo.createdAt, ahora) * 2;
  const porPeligro = CATEGORIAS_PELIGROSAS.includes(reclamo.category) ? 50 : 0;
  return Math.max(0, porConfirmaciones - porYaNoEsta + porAntiguedad + porPeligro);
}

export function ordenarPorPrioridad<T extends CamposPrioridad>(
  reclamos: T[],
  ahora: number = Date.now()
): T[] {
  return [...reclamos].sort((a, b) => calcularPrioridad(b, ahora) - calcularPrioridad(a, ahora));
}

// El plazo es del área, así que solo corre una vez que el municipio tomó el reclamo
// (EnviadoAlMunicipio/EnReparacion): antes de eso todavía no hay ninguna
// responsabilidad asignada, así que "vencido" no aplica — ni tampoco después de
// Resuelto/Rechazado, que ya están cerrados.
export function estaVencido(
  reclamo: Pick<Reclamo, 'status' | 'createdAt' | 'areaAsignada'>,
  areas: Pick<Area, 'id' | 'plazoMaximoDias'>[],
  ahora: number = Date.now()
): boolean {
  if (reclamo.status !== 'EnviadoAlMunicipio' && reclamo.status !== 'EnReparacion') return false;
  if (areas.length === 0) return false;

  const areaAsignada = reclamo.areaAsignada
    ? areas.find((area) => area.id === reclamo.areaAsignada)
    : undefined;
  // Todavía sin área asignada: el límite más corto de todas, para no dejarlo sin
  // clasificar indefinidamente.
  const plazo = areaAsignada
    ? areaAsignada.plazoMaximoDias
    : Math.min(...areas.map((area) => area.plazoMaximoDias));

  return diasDesde(reclamo.createdAt, ahora) > plazo;
}
