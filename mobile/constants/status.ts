import type { Seccion } from '../lib/filtrosMunicipio';
import type { NivelPeligrosidad } from '../lib/peligrosidad';
import type { EstadoReclamo, Severidad } from '../types/reclamo';
import { colors } from '../theme';

export const statusLabels: Record<EstadoReclamo, string> = {
  Reportado: 'Reportado',
  ConfirmadoPorVecinos: 'Confirmado por vecinos',
  EnviadoAlMunicipio: 'Tomado por el municipio',
  EnReparacion: 'En reparación',
  Resuelto: 'Resuelto',
  Rechazado: 'Rechazado',
};

// Cada estado tiene un color propio: neutro = recién ingresado, mango = validado por la
// comunidad, lavanda = ya está en el municipio, cielo = en reparación, menta = resuelto,
// coral = rechazado. `statusColors` es el tono vivo (puntos, barras, marcadores);
// las píldoras usan el fondo suave con el texto en el tono profundo del mismo color.
export const statusColors: Record<EstadoReclamo, string> = {
  Reportado: colors.inkMuted,
  ConfirmadoPorVecinos: colors.mandarin,
  EnviadoAlMunicipio: colors.cobalt,
  EnReparacion: colors.sky,
  Resuelto: colors.lime,
  Rechazado: colors.pink,
};

export const statusSoftColors: Record<EstadoReclamo, string> = {
  Reportado: colors.surfaceAlt,
  ConfirmadoPorVecinos: colors.mandarinSoft,
  EnviadoAlMunicipio: colors.cobaltSoft,
  EnReparacion: colors.skySoft,
  Resuelto: colors.limeSoft,
  Rechazado: colors.pinkSoft,
};

export const statusTextColors: Record<EstadoReclamo, string> = {
  Reportado: colors.inkSoft,
  ConfirmadoPorVecinos: colors.mandarinDeep,
  EnviadoAlMunicipio: colors.cobaltDeep,
  EnReparacion: colors.skyDeep,
  Resuelto: colors.limeDeep,
  Rechazado: colors.pinkDeep,
};

// Semáforo de la bandeja del municipio, según la severidad que eligió el vecino.
export const peligrosidadColors: Record<NivelPeligrosidad, string> = {
  alta: colors.pink,
  media: colors.mandarin,
  baja: colors.limeDeep,
};

export const peligrosidadLabels: Record<NivelPeligrosidad, string> = {
  alta: 'Severidad alta',
  media: 'Severidad media',
  baja: 'Severidad baja',
};

// Secciones de la bandeja, con el color de sus pines en el mapa del municipio.
export const seccionColors: Record<Seccion, string> = {
  nuevos: colors.mandarin,
  gestion: colors.cobalt,
  cerrados: colors.lime,
};

export const seccionLabels: Record<Seccion, string> = {
  nuevos: 'Nuevos',
  gestion: 'En gestión',
  cerrados: 'Cerrados',
};

export const severityLabels: Record<Severidad, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
};
