// Single source of truth for colors. Must match the palette in the mockup and the PDF.
export const colors = {
  asphalt: '#1C1B1A',
  asphalt2: '#26241F',
  concrete: '#8A857D',
  concreteLight: '#C9C4B8',
  chalk: '#EDEAE2',
  chalk2: '#E2DDCF',
  yellow: '#E8B23D',
  rust: '#C0472B',
  green: '#4C7A5E',
  blue: '#2E4C59',
} as const;

export type ColorName = keyof typeof colors;
