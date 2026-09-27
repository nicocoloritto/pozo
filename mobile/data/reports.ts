import type { Report } from '../types/report';

// Seed data for Sprint 1 (no backend yet). Mirrors the shape the API will return in
// Sprint 2, plus the sample report from design/figma/03-detalle.png (EXP-24-08813).
export const REPORTS: Report[] = [
  {
    id: '1',
    caseNumber: 'EXP-26-08813',
    category: 'Pothole',
    severity: 'High',
    status: 'Escalated',
    notes: 'Ya rompió el amortiguador de dos autos esta semana.',
    photoUrl: 'https://picsum.photos/id/1071/600/600',
    latitude: -34.61873,
    longitude: -58.43091,
    accuracyMeters: 6,
    locationSource: 'Device',
    address: 'Av. Rivadavia 4212, Caballito',
    neighborhood: 'Caballito',
    comuna: 6,
    confirmations: 47,
    authorName: 'M. González',
    createdAt: '2026-08-16T09:12:00-03:00',
    history: [
      { status: 'Reported', description: 'Ingresado', createdAt: '2026-08-16T09:12:00-03:00' },
      { status: 'Validated', description: 'Validado ×10', createdAt: '2026-08-18T14:40:00-03:00' },
      { status: 'Escalated', description: 'Elevado a Comuna 6', createdAt: '2026-08-24T11:05:00-03:00' },
    ],
  },
  {
    id: '2',
    caseNumber: 'EXP-26-07120',
    category: 'StreetLight',
    severity: 'Medium',
    status: 'Resolved',
    photoUrl: 'https://picsum.photos/id/1059/600/600',
    latitude: -34.6151,
    longitude: -58.4336,
    accuracyMeters: 8,
    locationSource: 'Device',
    address: 'Rojas 850, Caballito',
    neighborhood: 'Caballito',
    comuna: 6,
    confirmations: 31,
    crewName: 'Cuadrilla 14',
    authorName: 'M. González',
    createdAt: '2026-07-02T10:00:00-03:00',
    history: [
      { status: 'Reported', description: 'Ingresado', createdAt: '2026-07-02T10:00:00-03:00' },
      { status: 'Validated', description: 'Validado ×10', createdAt: '2026-07-05T09:00:00-03:00' },
      { status: 'Escalated', description: 'Elevado a Comuna 6', createdAt: '2026-07-10T09:00:00-03:00' },
      { status: 'InProgress', description: 'Tomado por Cuadrilla 14', createdAt: '2026-07-15T09:00:00-03:00' },
      { status: 'Resolved', description: 'Cerrado por Cuadrilla 14', createdAt: '2026-07-23T09:00:00-03:00' },
    ],
  },
  {
    id: '3',
    caseNumber: 'EXP-26-06944',
    category: 'BrokenSidewalk',
    severity: 'Low',
    status: 'Reported',
    photoUrl: 'https://picsum.photos/id/1076/600/600',
    latitude: -34.6172,
    longitude: -58.4321,
    accuracyMeters: 12,
    locationSource: 'Exif',
    address: 'Av. Rivadavia 4180, Caballito',
    neighborhood: 'Caballito',
    comuna: 6,
    confirmations: 6,
    authorName: 'M. González',
    createdAt: '2026-06-21T08:30:00-03:00',
    history: [{ status: 'Reported', description: 'Ingresado', createdAt: '2026-06-21T08:30:00-03:00' }],
  },
  {
    id: '4',
    caseNumber: 'EXP-26-08790',
    category: 'TrafficLight',
    severity: 'Medium',
    status: 'InProgress',
    photoUrl: 'https://picsum.photos/id/1080/600/600',
    latitude: -34.6161,
    longitude: -58.4298,
    accuracyMeters: 9,
    locationSource: 'Device',
    address: 'Scalabrini Ortiz y Guatemala',
    neighborhood: 'Palermo',
    comuna: 14,
    confirmations: 12,
    authorName: 'J. Pereyra',
    createdAt: '2026-09-14T18:22:00-03:00',
    history: [
      { status: 'Reported', description: 'Ingresado', createdAt: '2026-09-14T18:22:00-03:00' },
      { status: 'InProgress', description: 'Tomado por Cuadrilla 3', createdAt: '2026-09-20T09:00:00-03:00' },
    ],
  },
];

export function getReportById(id: string): Report | undefined {
  return REPORTS.find((report) => report.id === id);
}

export type RankingRow = {
  neighborhood: string;
  activeReports: number;
  isOwn?: boolean;
};

// Seed data for the "Termómetro" screen (design/figma/06-ranking.png).
export const NEIGHBORHOOD_RANKING: RankingRow[] = [
  { neighborhood: 'La Boca', activeReports: 412 },
  { neighborhood: 'Constitución', activeReports: 377 },
  { neighborhood: 'Flores', activeReports: 298 },
  { neighborhood: 'Caballito', activeReports: 241, isOwn: true },
  { neighborhood: 'Almagro', activeReports: 188 },
  { neighborhood: 'Palermo', activeReports: 96 },
];

export const APP_STATS = {
  totalReports: 12487,
  resolvedReports: 3902,
  neighborhoods: 48,
};
