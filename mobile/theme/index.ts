export { colors } from './colors';
export type { ColorName } from './colors';
export { fonts, fontSizes } from './typography';
export type { FontName, FontSizeName } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

// Sombras cálidas (no gris puro) para que las tarjetas blancas floten sobre el crema.
// `elevation` es el equivalente en Android.
export const shadows = {
  card: {
    shadowColor: '#5A3E16',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: '#5A3E16',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
