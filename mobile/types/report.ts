// See docs/diseno-funcional.md and docs/modelo-de-datos.md for the source of truth.

export type ReportStatus = 'Reported' | 'Validated' | 'Escalated' | 'InProgress' | 'Resolved';

export type Category =
  | 'Pothole'
  | 'BrokenSidewalk'
  | 'TrafficLight'
  | 'StreetLight'
  | 'FallenPole'
  | 'Trench'
  | 'Outage'
  | 'OverflowingBin';

export type Severity = 'Low' | 'Medium' | 'High';

// Where a report's coordinates came from. Only `Device` is fully trusted: see
// docs/diseno-funcional.md ("Origen de la ubicación de una foto").
export type LocationSource = 'Device' | 'Exif' | 'Manual';

export type StatusChange = {
  status: ReportStatus;
  description: string;
  createdAt: string; // ISO date
};

export type Report = {
  id: string;
  caseNumber: string; // "EXP-26-00813"
  category: Category;
  severity: Severity;
  status: ReportStatus;
  notes?: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationSource: LocationSource;
  address?: string;
  neighborhood?: string;
  comuna?: number;
  confirmations: number;
  crewName?: string;
  authorName: string;
  createdAt: string; // ISO date
  history: StatusChange[];
};

// Thresholds are configuration, not magic numbers scattered in the code.
export const CONFIRMATIONS_TO_VALIDATE = 10;
export const CONFIRMATIONS_TO_ESCALATE = 50;

// "Urgente" is computed, never a stored field: see docs/diseno-funcional.md.
export function isUrgent(report: Pick<Report, 'severity' | 'confirmations'>): boolean {
  return report.severity === 'High' && report.confirmations >= CONFIRMATIONS_TO_VALIDATE;
}
