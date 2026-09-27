import type { ReportStatus, Severity } from '../types/report';
import { colors } from '../theme';

export const statusLabels: Record<ReportStatus, string> = {
  Reported: 'Ingresado',
  Validated: 'Validado',
  Escalated: 'Elevado a comuna',
  InProgress: 'En curso',
  Resolved: 'Resuelto',
};

// Colors match the stamps and tags in design/figma/ (yellow = own actions,
// green = resolved, blue = in progress, concrete = neutral/reported).
export const statusColors: Record<ReportStatus, string> = {
  Reported: colors.concrete,
  Validated: colors.yellow,
  Escalated: colors.rust,
  InProgress: colors.blue,
  Resolved: colors.green,
};

export const severityLabels: Record<Severity, string> = {
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
};
