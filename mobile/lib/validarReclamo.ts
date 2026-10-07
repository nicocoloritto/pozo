import { ReclamoError } from './reclamoError';
import { CATEGORIAS, NOTAS_MAX_CARACTERES, ORIGENES_UBICACION, SEVERIDADES } from '../types/reclamo';
import type { Reclamo } from '../types/reclamo';

export type NuevoReclamoInput = Pick<
  Reclamo,
  | 'autorId'
  | 'municipioId'
  | 'category'
  | 'severity'
  | 'photoUrl'
  | 'latitude'
  | 'longitude'
  | 'locationSource'
> &
  Partial<Pick<Reclamo, 'notes' | 'accuracyMeters'>>;

function invalido(mensaje: string): never {
  throw new ReclamoError('INVALID_INPUT', mensaje);
}

// Reglas de un reclamo nuevo, centralizadas acá y no solo en la pantalla: la pantalla
// deshabilita "Publicar", pero esa es una comodidad de la interfaz, no una garantía. Cuando
// exista el backend, estas mismas reglas tienen que vivir del lado del servidor. Función
// pura: tira ReclamoError('INVALID_INPUT') con el motivo, o no devuelve nada.
export function validarNuevoReclamo(input: NuevoReclamoInput): void {
  if (!input.autorId) invalido('Falta el autor del reclamo.');
  if (!input.municipioId) invalido('Falta el municipio del reclamo.');

  if (typeof input.photoUrl !== 'string' || !input.photoUrl.trim()) {
    invalido('La foto es obligatoria para publicar un reclamo.');
  }

  const { latitude, longitude } = input;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    invalido('El reclamo necesita una ubicación válida.');
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    invalido('Las coordenadas del reclamo están fuera de rango.');
  }
  // (0, 0) es lo que devuelven muchos sistemas cuando no pudieron obtener un GPS: en
  // el golfo de Guinea, nunca un reclamo real.
  if (latitude === 0 && longitude === 0) invalido('No pudimos determinar la ubicación del reclamo.');

  if (input.accuracyMeters !== undefined && (!Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0)) {
    invalido('La precisión de la ubicación no es válida.');
  }

  if (!CATEGORIAS.includes(input.category)) invalido('Elegí una categoría válida.');
  if (!SEVERIDADES.includes(input.severity)) invalido('Elegí una severidad válida.');
  if (!ORIGENES_UBICACION.includes(input.locationSource)) invalido('El origen de la ubicación no es válido.');

  if ((input.notes ?? '').trim().length > NOTAS_MAX_CARACTERES) {
    invalido(`Las notas pueden tener hasta ${NOTAS_MAX_CARACTERES} caracteres.`);
  }
}
