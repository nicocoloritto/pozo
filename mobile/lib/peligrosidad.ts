import type { Reclamo, Severidad } from '../types/reclamo';

// Semáforo de la bandeja: sale solo de la severidad que eligió el vecino (la categoría no
// cuenta): High = alta, Medium = media, Low = baja.
export type NivelPeligrosidad = 'alta' | 'media' | 'baja';

const NIVELES: Record<Severidad, NivelPeligrosidad> = { High: 'alta', Medium: 'media', Low: 'baja' };

export function nivelPeligrosidad(reclamo: Pick<Reclamo, 'severity'>): NivelPeligrosidad {
  return NIVELES[reclamo.severity];
}

// Para ordenar: primero las altas, después las medias y las bajas.
export const ORDEN_PELIGROSIDAD: Record<NivelPeligrosidad, number> = { alta: 0, media: 1, baja: 2 };
