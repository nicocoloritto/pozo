import type { Categoria, EstadoReclamo } from './reclamo';

// Pensados como la respuesta de la futura API del municipio (ver services/estadisticas.ts
// para el TODO de cada endpoint). Por ahora los datos salen de JSON locales.

export type Barrio = {
  id: string;
  nombre: string;
  comuna: number;
  municipioId: string;
  latitude: number;
  longitude: number;
};

export type EvolucionMensual = {
  mes: string;
  reclamos: number;
};

export type EstadisticasBarrio = {
  barrioId: string;
  totalReclamos: number;
  resueltos: number;
  porcentajeResolucion: number;
  tiempoPromedioResolucionDias: number;
  porCategoria: Record<Categoria, number>;
  porEstado: Record<EstadoReclamo, number>;
  evolucionUltimos6Meses: EvolucionMensual[];
};

export type RankingBarrio = {
  barrioId: string;
  nombre: string;
  porcentajeResolucion: number;
  puesto: number;
};
