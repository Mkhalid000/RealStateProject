/**
 * AUREVIA — luxury real-estate palette.
 * Gold-on-ink aesthetic shared with the web app (amber #F2A65A primary).
 */
export const colors = {
  // base / ink
  bg: '#1B1818',
  bgSoft: '#211D1D',
  surface: '#2A2525',
  surfaceAlt: '#352F2F',
  surface2: '#454040',

  // gold accent family (primary)
  gold: '#F2A65A',
  goldLight: '#F6B978',
  goldDark: '#D98A3E',
  // kept as `primary` aliases so older call-sites keep working
  primary: '#F2A65A',
  primaryDark: '#D98A3E',
  accent: '#F2A65A',

  text: '#F6F1EA',
  textDim: '#C9C1B6',
  textMuted: '#8E867D',

  border: '#3A3434',
  borderSoft: '#2F2A2A',

  danger: '#EF6B6B',
  success: '#5FD08A',
  info: '#7FA8E8',

  // translucent helpers
  goldGlow: 'rgba(242,166,90,0.16)',
  goldFaint: 'rgba(242,166,90,0.08)',
  overlay: 'rgba(15,12,12,0.72)',
  white12: 'rgba(255,255,255,0.10)',
  white06: 'rgba(255,255,255,0.06)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

// Cross-platform shadow presets.
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },
};

// Serif-ish display face for headings (system serif fallback on Android/iOS).
export const fonts = {
  serif: 'serif',
  sans: undefined, // platform default
};

export const typography = {
  display: {fontFamily: fonts.serif, fontWeight: '600', letterSpacing: 0.5},
};
