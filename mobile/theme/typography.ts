// Single source of truth for typography. With custom fonts each weight is its own
// family: never pair these with a `fontWeight` style.
export const fonts = {
  display: 'ArchivoBlack_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  bodyExtraBold: 'Inter_800ExtraBold',
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
  monoSemiBold: 'IBMPlexMono_600SemiBold',
} as const;

export const fontSizes = {
  xs: 10,
  sm: 13,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  display: 44,
} as const;

export type FontName = keyof typeof fonts;
export type FontSizeName = keyof typeof fontSizes;
