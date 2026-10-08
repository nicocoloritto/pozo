import type { Categoria } from '../types/reclamo';
import { colors } from '../theme';

// Spanish labels for the UI. Screen-visible text is Spanish; identifiers stay English.
export const categoryLabels: Record<Categoria, string> = {
  Pothole: 'Pozo',
  BrokenSidewalk: 'Vereda',
  TrafficLight: 'Semáforo',
  StreetLight: 'Luminaria',
  FallenPole: 'Poste',
  FallenTree: 'Árbol o rama caída',
  Trench: 'Zanja',
  Outage: 'Luz/agua',
  OverflowingBin: 'Residuos',
};

// Ionicons names matching the road-sign rombo look of the mockup (design/pozo-pantallas-hifi.html).
// Picked to read clearly at 22px inside a small rombo — verified against a real device,
// not just that the glyph name exists (TypeScript doesn't catch a bad-but-valid name).
export const categoryIcons: Record<Categoria, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  Pothole: 'ellipse',
  BrokenSidewalk: 'walk-outline',
  TrafficLight: 'stop-circle-outline',
  StreetLight: 'bulb-outline',
  FallenPole: 'remove-outline',
  FallenTree: 'leaf-outline',
  Trench: 'reorder-two-outline',
  Outage: 'flash-outline',
  OverflowingBin: 'trash-outline',
};

export const categoryOrder: Categoria[] = [
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

// Color de cada categoría: fondo suave e ícono en el tono profundo del mismo acento.
// Agrupadas por familia (calzada, luz, verde, cielo) para que el mapa no sea un arcoíris.
type CategoryTint = { soft: string; deep: string; base: string };

const MANDARIN: CategoryTint = { soft: colors.mandarinSoft, deep: colors.mandarinDeep, base: colors.mandarin };
const PINK: CategoryTint = { soft: colors.pinkSoft, deep: colors.pinkDeep, base: colors.pink };
const LIME: CategoryTint = { soft: colors.limeSoft, deep: colors.limeDeep, base: colors.lime };
const SKY: CategoryTint = { soft: colors.skySoft, deep: colors.skyDeep, base: colors.sky };
const COBALT: CategoryTint = { soft: colors.cobaltSoft, deep: colors.cobaltDeep, base: colors.cobalt };

export const categoryTints: Record<Categoria, CategoryTint> = {
  Pothole: MANDARIN,
  BrokenSidewalk: COBALT,
  TrafficLight: PINK,
  StreetLight: MANDARIN,
  FallenPole: SKY,
  FallenTree: LIME,
  Trench: COBALT,
  Outage: SKY,
  OverflowingBin: LIME,
};
