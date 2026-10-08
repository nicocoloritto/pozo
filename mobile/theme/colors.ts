export const colors = {
  ink: '#17202A',
  inkRaised: '#263241',
  inkSoft: '#5E6977',
  inkMuted: '#A6AFBC',
  line: '#E3E6F2',
  bg: '#F7F8FF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0FF',

  cobalt: '#5653FF',
  cobaltDeep: '#3431B8',
  cobaltSoft: '#E7E6FF',
  mandarin: '#FF7A21',
  mandarinDeep: '#A63E00',
  mandarinSoft: '#FFE6D5',
  lime: '#C8F45D',
  limeDeep: '#41640A',
  limeSoft: '#EEFFD0',
  pink: '#FF5C8A',
  pinkDeep: '#A8184A',
  pinkSoft: '#FFE1EA',
  sky: '#53C8FF',
  skyDeep: '#0B5F88',
  skySoft: '#DDF4FF',
} as const;

export type ColorName = keyof typeof colors;
