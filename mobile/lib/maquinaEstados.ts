// La máquina de estados de un Reclamo, centralizada acá: cada función es pura (recibe
// el reclamo, devuelve el próximo estado o tira ReclamoError) y no toca storage — eso
// lo maneja `transicionar()` en services/reclamos.ts, que es el único lugar que
// persiste. Separarla así también permite probarla sin AsyncStorage (ver
// scripts/test-maquina-estados.ts).
import { ReclamoError } from './reclamoError';
import { CATEGORIAS_PELIGROSAS } from '../types/reclamo';
import type { EstadoReclamo, Reclamo } from '../types/reclamo';

export type Decision = {
  status: EstadoReclamo;
  description: string;
  extra?: Partial<Reclamo>;
};

type ReclamoParaTransicion = Pick<Reclamo, 'status' | 'category' | 'areaAsignada'>;

export function esEstadoFinal(status: EstadoReclamo): boolean {
  return status === 'Resuelto' || status === 'Rechazado';
}

// Confirmado por vecinos → Enviado al municipio (caso normal), o directamente
// Reportado → Enviado al municipio si la categoría es peligrosa: ahí no se espera a
// que junte confirmaciones.
export function decidirTomar(reclamo: ReclamoParaTransicion): Decision {
  const esPeligrosoSinConfirmar =
    reclamo.status === 'Reportado' && CATEGORIAS_PELIGROSAS.includes(reclamo.category);

  if (reclamo.status !== 'ConfirmadoPorVecinos' && !esPeligrosoSinConfirmar) {
    throw new ReclamoError(
      'INVALID_TRANSITION',
      'Este reclamo todavía no se puede tomar: necesita confirmaciones de vecinos o ser una categoría peligrosa'
    );
  }

  return {
    status: 'EnviadoAlMunicipio',
    description: esPeligrosoSinConfirmar
      ? 'Tomado por el municipio (categoría peligrosa)'
      : 'Tomado por el municipio',
  };
}

export function decidirPasarAReparacion(reclamo: ReclamoParaTransicion): Decision {
  if (reclamo.status !== 'EnviadoAlMunicipio') {
    throw new ReclamoError(
      'INVALID_TRANSITION',
      'El reclamo tiene que estar enviado al municipio para pasar a reparación'
    );
  }
  if (!reclamo.areaAsignada) {
    throw new ReclamoError('AREA_REQUIRED', 'Asigná un área antes de pasar a reparación');
  }
  return { status: 'EnReparacion', description: 'En reparación' };
}

export function decidirResolver(reclamo: ReclamoParaTransicion, fotoResolucion: string): Decision {
  if (!fotoResolucion) {
    throw new ReclamoError('FOTO_REQUIRED', 'La foto del "después" es obligatoria para resolver');
  }
  if (reclamo.status !== 'EnReparacion') {
    throw new ReclamoError('INVALID_TRANSITION', 'El reclamo tiene que estar en reparación para resolverse');
  }
  return { status: 'Resuelto', description: 'Resuelto', extra: { fotoResolucion } };
}

export function decidirRechazar(reclamo: ReclamoParaTransicion, motivo: string): Decision {
  if (!motivo.trim()) {
    throw new ReclamoError('MOTIVO_REQUIRED', 'El motivo de rechazo es obligatorio');
  }
  if (esEstadoFinal(reclamo.status)) {
    throw new ReclamoError('INVALID_TRANSITION', 'Este reclamo ya está cerrado');
  }
  return {
    status: 'Rechazado',
    description: `Rechazado: ${motivo.trim()}`,
    extra: { motivoRechazo: motivo.trim() },
  };
}
