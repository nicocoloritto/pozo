import type { Categoria } from '../types/reclamo';

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
