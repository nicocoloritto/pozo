// See docs/diseno-funcional.md y docs/modelo-de-datos.md — desactualizados respecto a
// este archivo; esta es la fuente de verdad actual.

// El vecino solo produce "Reportado" (al publicar) y "ConfirmadoPorVecinos" (al llegar
// a CONFIRMACIONES_NECESARIAS, o de inmediato si el municipio toma un reclamo
// peligroso). Los siguientes los cambia el municipio desde su panel: el vecino nunca
// los setea. "Rechazado" es final y puede llegar desde cualquier estado no final.
export type EstadoReclamo =
  | 'Reportado'
  | 'ConfirmadoPorVecinos'
  | 'EnviadoAlMunicipio'
  | 'EnReparacion'
  | 'Resuelto'
  | 'Rechazado';

export type Categoria =
  | 'Pothole'
  | 'BrokenSidewalk'
  | 'TrafficLight'
  | 'StreetLight'
  | 'FallenPole'
  | 'FallenTree'
  | 'Trench'
  | 'Outage'
  | 'OverflowingBin';

export type Severidad = 'Low' | 'Medium' | 'High';

// De dónde salieron las coordenadas de la foto. Solo `Device` es plenamente confiable:
// ver docs/diseno-funcional.md ("Origen de la ubicación de una foto").
export type OrigenUbicacion = 'Device' | 'Exif' | 'Manual';

export type CambioEstado = {
  status: EstadoReclamo;
  description: string;
  createdAt: string; // ISO date
  autor?: string; // id del vecino o admin que lo provocó; ausente en el seed más viejo
};

export type NotaReclamo = {
  fecha: string; // ISO date
  texto: string;
  autor: string;
};

export type Reclamo = {
  id: string;
  caseNumber: string; // "EXP-26-00813"
  autorId: string;
  municipioId: string;
  category: Categoria;
  severity: Severidad;
  status: EstadoReclamo;
  notes?: string;
  photoUrl: string; // URI de la foto sacada por el vecino
  photoKey?: string; // foto empaquetada de un reclamo de prueba (assets/reclamos)
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: OrigenUbicacion;
  address?: string;
  neighborhood?: string;
  comuna?: number;
  // Ids de los vecinos que confirmaron que el problema sigue ahí. Un vecino confirma
  // una sola vez (no puede estar repetido) y nunca puede ser el autor del reclamo.
  confirmaciones: string[];
  // Votos "Ya no está" (pulgar abajo). Un vecino está en confirmaciones o acá, nunca en los
  // dos. Opcional porque los reclamos ya guardados no lo tienen.
  votosYaNoEsta?: string[];
  // Último voto recibido, para mostrar "Último aviso: sigue ahí · hace 2 h".
  ultimoVoto?: { tipo: 'sigue' | 'yaNoEsta'; fecha: string };
  createdAt: string; // ISO date
  history: CambioEstado[];

  // Gestión municipal (services/reclamos.ts: tomar/asignarArea/pasarAReparacion/
  // resolver/rechazar/agregarNota). Nada de esto lo toca el vecino directamente.
  areaAsignada?: string; // id de data/areas.json
  fechaEstimada?: string; // ISO date
  notas?: NotaReclamo[];
  fotoResolucion?: string;
  fotoResolucionKey?: string; // idem photoKey, para la foto de resolución del seed
  motivoRechazo?: string;
};

// Configuración, no un número mágico: a cuántas confirmaciones de otros vecinos pasa
// de Reportado a ConfirmadoPorVecinos.
export const CONFIRMACIONES_NECESARIAS = 3;

// Desde cuántos "Ya no está" (y más que "Sigue ahí") se avisa al municipio que el
// reclamo posiblemente ya se resolvió.
export const VOTOS_YA_NO_ESTA_PARA_AVISO = 3;

export type TipoVoto = 'sigue' | 'yaNoEsta';

// Categorías que ameritan atención del municipio sin esperar confirmaciones de
// vecinos: un poste o árbol caído, un corte de luz/agua o un semáforo roto son
// riesgos inmediatos, no solo una molestia.
export const CATEGORIAS_PELIGROSAS: Categoria[] = ['FallenPole', 'FallenTree', 'Outage', 'TrafficLight'];

// Valores permitidos de cada union type, para validar en tiempo de ejecución (un tipo de
// TypeScript no existe cuando corre la app, y los datos pueden venir de un JSON o de
// AsyncStorage).
export const CATEGORIAS: Categoria[] = [
  'Pothole',
  'BrokenSidewalk',
  'TrafficLight',
  'StreetLight',
  'FallenPole',
  'FallenTree',
  'Trench',
  'Outage',
  'OverflowingBin',
];
export const SEVERIDADES: Severidad[] = ['Low', 'Medium', 'High'];
export const ORIGENES_UBICACION: OrigenUbicacion[] = ['Device', 'Exif', 'Manual'];

export const NOTAS_MAX_CARACTERES = 280;
