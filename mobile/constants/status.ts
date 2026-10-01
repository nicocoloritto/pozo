import type { EstadoReclamo, Severidad } from '../types/reclamo';
import { colors } from '../theme';

export const statusLabels: Record<EstadoReclamo, string> = {
  Reportado: 'Reportado',
  ConfirmadoPorVecinos: 'Confirmado por vecinos',
  EnviadoAlMunicipio: 'Enviado al municipio',
  EnReparacion: 'En reparación',
  Resuelto: 'Resuelto',
  Rechazado: 'Rechazado',
};

// Colores de los sellos y tags (design/pozo-pantallas-hifi.html): concrete = recién
// ingresado, amarillo = validado por la comunidad, rust = ya está en el municipio,
// azul = en reparación, verde = resuelto, asfalto = rechazado (un sello "muerto",
// nunca se confunde con el verde de resuelto).
export const statusColors: Record<EstadoReclamo, string> = {
  Reportado: colors.concrete,
  ConfirmadoPorVecinos: colors.yellow,
  EnviadoAlMunicipio: colors.rust,
  EnReparacion: colors.blue,
  Resuelto: colors.green,
  Rechazado: colors.asphalt,
};

// Texto claro sobre fondos oscuros (rust/blue/green/asphalt), texto oscuro sobre
// fondos claros (concrete/yellow) — contraste suficiente en los tags de estado
// chicos, incluso sobre fondos de pantalla oscuros: el tag de "Rechazado" lleva su
// propio fondo asfalto con texto chalk (igual a los demás estados oscuros), nunca
// texto oscuro flotando directamente sobre un fondo oscuro.
export const statusTextColors: Record<EstadoReclamo, string> = {
  Reportado: colors.asphalt,
  ConfirmadoPorVecinos: colors.asphalt,
  EnviadoAlMunicipio: colors.chalk,
  EnReparacion: colors.chalk,
  Resuelto: colors.chalk,
  Rechazado: colors.chalk,
};

export const severityLabels: Record<Severidad, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
};
