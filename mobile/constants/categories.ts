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

const MANGO: CategoryTint = { soft: colors.mangoSoft, deep: colors.mangoDeep, base: colors.mango };
const CORAL: CategoryTint = { soft: colors.coralSoft, deep: colors.coralDeep, base: colors.coral };
const MINT: CategoryTint = { soft: colors.mintSoft, deep: colors.mintDeep, base: colors.mint };
const SKY: CategoryTint = { soft: colors.skySoft, deep: colors.skyDeep, base: colors.sky };
const LAVENDER: CategoryTint = { soft: colors.lavenderSoft, deep: colors.lavenderDeep, base: colors.lavender };

export const categoryTints: Record<Categoria, CategoryTint> = {
  Pothole: MANGO,
  BrokenSidewalk: LAVENDER,
  TrafficLight: CORAL,
  StreetLight: MANGO,
  FallenPole: SKY,
  FallenTree: MINT,
  Trench: LAVENDER,
  Outage: SKY,
  OverflowingBin: MINT,
};
