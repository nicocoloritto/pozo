// La máquina de estados de un Reclamo, centralizada acá: cada función es pura (recibe
// el reclamo, devuelve el próximo estado o tira ReclamoError) y no toca storage — eso
// lo maneja `transicionar()` en services/reclamos.ts, que es el único lugar que
// persiste. Separarla así también permite probarla sin AsyncStorage (ver
// scripts/test-maquina-estados.ts).
import { ReclamoError } from './reclamoError';
import { CATEGORIAS_PELIGROSAS, MOTIVOS_RECHAZO, VOTOS_YA_NO_ESTA_NECESARIOS } from '../types/reclamo';
import type { EstadoReclamo, MotivoRechazo, Reclamo } from '../types/reclamo';

export type Decision = {
  status: EstadoReclamo;
  description: string;
  extra?: Partial<Reclamo>;
};

type ReclamoParaTransicion = Pick<Reclamo, 'status' | 'category'>;

export function esEstadoFinal(status: EstadoReclamo): boolean {
  return status === 'Resuelto' || status === 'Rechazado';
}

// Confirmado por vecinos → Enviado al municipio (caso normal), o directamente
// Reportado → Enviado al municipio si la categoría es peligrosa: ahí no se espera a
// que junte confirmaciones. Al tomar se asigna el área de la categoría (solo se usa para el
// plazo).
export function decidirTomar(reclamo: ReclamoParaTransicion, areaId: string | undefined): Decision {
  const esPeligrosoSinConfirmar =
    reclamo.status === 'Reportado' && CATEGORIAS_PELIGROSAS.includes(reclamo.category);

  if (reclamo.status !== 'ConfirmadoPorVecinos' && !esPeligrosoSinConfirmar) {
    throw new ReclamoError(
      'INVALID_TRANSITION',
      'Este reclamo todavía no se puede tomar: necesita confirmaciones de vecinos o ser una categoría peligrosa'
    );
  }

  if (!areaId) throw new ReclamoError('AREA_REQUIRED', 'No hay un área del municipio para esta categoría');

  return {
    status: 'EnviadoAlMunicipio',
    description: esPeligrosoSinConfirmar
      ? 'Tomado por el municipio (categoría peligrosa)'
      : 'Tomado por el municipio',
    extra: { areaAsignada: areaId },
  };
}

export function decidirPasarAReparacion(reclamo: ReclamoParaTransicion): Decision {
  if (reclamo.status !== 'EnviadoAlMunicipio') {
    throw new ReclamoError(
      'INVALID_TRANSITION',
      'El reclamo tiene que estar enviado al municipio para pasar a reparación'
    );
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

// Al llegar a VOTOS_YA_NO_ESTA_NECESARIOS "Ya no está", un reclamo abierto pasa solo a Resuelto
// (sin foto). Devuelve null si todavía no corresponde.
export function decidirResolverPorVecinos(reclamo: ReclamoParaTransicion, votosYaNoEsta: number): Decision | null {
  if (esEstadoFinal(reclamo.status) || votosYaNoEsta < VOTOS_YA_NO_ESTA_NECESARIOS) return null;
  return {
    status: 'Resuelto',
    description: 'Resuelto por los vecinos: el problema ya no está (se resolvió y el municipio todavía no lo actualizó)',
  };
}

// El motivo es uno de MOTIVOS_RECHAZO; el detalle es texto libre y opcional.
export function decidirRechazar(reclamo: ReclamoParaTransicion, motivo: string, detalle = ''): Decision {
  if (!MOTIVOS_RECHAZO.includes(motivo as MotivoRechazo)) {
    throw new ReclamoError('MOTIVO_REQUIRED', 'Elegí un motivo de rechazo de la lista');
  }
  if (esEstadoFinal(reclamo.status)) {
    throw new ReclamoError('INVALID_TRANSITION', 'Este reclamo ya está cerrado');
  }
  const texto = detalle.trim();
  return {
    status: 'Rechazado',
    description: `Rechazado: ${motivo}${texto ? `: ${texto}` : ''}`,
    extra: { motivoRechazoTipo: motivo as MotivoRechazo, motivoRechazo: texto || undefined },
  };
}
