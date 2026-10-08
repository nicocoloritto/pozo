// Single source of truth for colors. Each accent comes in three tones: the base (fills,
// icons), `Soft` (pill and tile backgrounds) and `Deep` (text on top of the Soft tone,
// which keeps contrast readable on small labels).
export const colors = {
  ink: '#211C17',
  inkRaised: '#2E2822',
  inkSoft: '#6B6259',
  inkMuted: '#A69D92',
  line: '#EDE5D8',
  bg: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EDE2',

  mango: '#FFB21E',
  mangoDeep: '#9A5F00',
  mangoSoft: '#FFF1D2',
  mint: '#2DBE8C',
  mintDeep: '#13704F',
  mintSoft: '#DCF6EB',
  coral: '#FF6A55',
  coralDeep: '#B8321F',
  coralSoft: '#FFE4DF',
  lavender: '#8A7CF8',
  lavenderDeep: '#4B3BC4',
  lavenderSoft: '#ECE9FF',
  sky: '#3E9BF0',
  skyDeep: '#1A5C9F',
  skySoft: '#E0EFFD',
} as const;

export type ColorName = keyof typeof colors;
