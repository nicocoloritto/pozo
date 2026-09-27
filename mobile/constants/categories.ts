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
export const categoryIcons: Record<Category, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  Pothole: 'ellipse',
  BrokenSidewalk: 'trail-sign-outline',
  TrafficLight: 'phone-portrait-outline',
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
