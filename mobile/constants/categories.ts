import type { Category } from '../types/report';

// Spanish labels for the UI. Screen-visible text is Spanish; identifiers stay English.
export const categoryLabels: Record<Category, string> = {
  Pothole: 'Pozo',
  BrokenSidewalk: 'Vereda',
  TrafficLight: 'Semáforo',
  StreetLight: 'Luminaria',
  FallenPole: 'Poste',
  Trench: 'Zanja',
  Outage: 'Luz/agua',
  OverflowingBin: 'Residuos',
};

// Ionicons names matching the road-sign rombo look of the mockup (design/figma/04-nuevo-reclamo.png).
// Picked to read clearly at 22px inside a small rombo — verified against a real device,
// not just that the glyph name exists (TypeScript doesn't catch a bad-but-valid name).
export const categoryIcons: Record<Category, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  Pothole: 'ellipse',
  BrokenSidewalk: 'walk-outline',
  TrafficLight: 'stop-circle-outline',
  StreetLight: 'bulb-outline',
  FallenPole: 'remove-outline',
  Trench: 'reorder-two-outline',
  Outage: 'flash-outline',
  OverflowingBin: 'trash-outline',
};

export const categoryOrder: Category[] = [
  'Pothole',
  'BrokenSidewalk',
  'TrafficLight',
  'StreetLight',
  'FallenPole',
  'Trench',
  'Outage',
  'OverflowingBin',
];
