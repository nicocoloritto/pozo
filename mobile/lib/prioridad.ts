import { severityLabels } from '../constants/status';
import type { Area } from '../types/area';
import { CATEGORIAS_PELIGROSAS } from '../types/reclamo';
import type { Reclamo, Severidad } from '../types/reclamo';

const MS_POR_DIA = 1000 * 60 * 60 * 24;

// Los pesos de la fórmula, en un solo lugar: si cambian, cambia docs/decisiones.md.
// La severidad pesa poco a propósito: la elige el autor y nadie la verifica, así que
// "Alta" vale lo mismo que dos confirmaciones de otros vecinos.
export const PUNTOS_PRIORIDAD = {
  peligro: 50,
  severidad: { Low: 0, Medium: 10, High: 20 } satisfies Record<Severidad, number>,
  porConfirmacion: 10,
  porYaNoEsta: -10,
  porDia: 2,
};

function diasDesde(iso: string, ahora: number): number {
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / MS_POR_DIA));
}

function plural(n: number, singular: string, varios: string): string {
  return `${n} ${n === 1 ? singular : varios}`;
}

type CamposPrioridad = Pick<Reclamo, 'confirmaciones' | 'createdAt' | 'category' | 'severity'> &
  Partial<Pick<Reclamo, 'votosYaNoEsta'>>;

export type ParteDePrioridad = { motivo: string; puntos: number };

// Cada término de la fórmula con su motivo, para que el municipio vea por qué un reclamo está
// arriba en la bandeja. Se omiten los que valen 0. La antigüedad se cuenta desde que se creó:
// mide cuánto lleva esperando el vecino, no cuánto lleva el municipio con él. `ahora` es un
// parámetro (no Date.now() interno) para que esto sea testeable de forma determinística.
export function desglosarPrioridad(reclamo: CamposPrioridad, ahora: number = Date.now()): ParteDePrioridad[] {
  const confirmaciones = reclamo.confirmaciones.length;
  const yaNoEsta = reclamo.votosYaNoEsta?.length ?? 0;
  const dias = diasDesde(reclamo.createdAt, ahora);

  const partes: ParteDePrioridad[] = [
    {
      motivo: 'Categoría peligrosa',
      puntos: CATEGORIAS_PELIGROSAS.includes(reclamo.category) ? PUNTOS_PRIORIDAD.peligro : 0,
    },
    {
      motivo: `Severidad ${severityLabels[reclamo.severity].toLowerCase()}`,
      puntos: PUNTOS_PRIORIDAD.severidad[reclamo.severity],
    },
    {
      motivo: plural(confirmaciones, 'confirmación', 'confirmaciones'),
      puntos: confirmaciones * PUNTOS_PRIORIDAD.porConfirmacion,
    },
    { motivo: `${yaNoEsta} "ya no está"`, puntos: yaNoEsta * PUNTOS_PRIORIDAD.porYaNoEsta },
    { motivo: plural(dias, 'día abierto', 'días abierto'), puntos: dias * PUNTOS_PRIORIDAD.porDia },
  ];
  return partes.filter((parte) => parte.puntos !== 0);
}

// La suma del desglose, que nunca queda negativa: muchos "ya no está" bajan un reclamo al
// fondo de la bandeja, pero no por debajo de uno recién ingresado.
export function calcularPrioridad(reclamo: CamposPrioridad, ahora: number = Date.now()): number {
  return Math.max(0, desglosarPrioridad(reclamo, ahora).reduce((total, parte) => total + parte.puntos, 0));
}

export function ordenarPorPrioridad<T extends CamposPrioridad>(
  reclamos: T[],
  ahora: number = Date.now()
): T[] {
  return [...reclamos].sort((a, b) => calcularPrioridad(b, ahora) - calcularPrioridad(a, ahora));
}

// Cuándo lo tomó el municipio: el primer "Enviado al municipio" del historial. Si el historial
// no lo tiene (datos viejos), la fecha de creación.
function fechaDeToma(reclamo: Pick<Reclamo, 'createdAt' | 'history'>): string {
  return reclamo.history.find((cambio) => cambio.status === 'EnviadoAlMunicipio')?.createdAt ?? reclamo.createdAt;
}

// El plazo es del área, así que solo corre una vez que el municipio tomó el reclamo
// (EnviadoAlMunicipio/EnReparacion), y se cuenta desde ese momento: el tiempo que esperó
// confirmaciones de vecinos no es responsabilidad del área. Antes de la toma, o después de
// Resuelto/Rechazado, "vencido" no aplica.
export function estaVencido(
  reclamo: Pick<Reclamo, 'status' | 'createdAt' | 'history' | 'areaAsignada'>,
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

  return diasDesde(fechaDeToma(reclamo), ahora) > plazo;
}
