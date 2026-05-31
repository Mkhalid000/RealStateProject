/**
 * AUREVIA — luxury real-estate palette.
 * Gold-on-ink aesthetic with a warm-ivory light counterpart.
 *
 * Theme is runtime-switchable: components read colors via `useColors()` /
 * `useThemedStyles()` (both react to the persisted theme mode). The static
 * `colors` export equals the dark palette and is kept only for back-compat.
 */
import {useMemo} from 'react';
import {useThemeStore} from './store/themeStore';

export const darkColors = {
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
  primary: '#F2A65A',
  primaryDark: '#D98A3E',
  accent: '#F2A65A',
  onGold: '#211D1D', // text/icon color sitting on a gold fill

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

  isDark: true,
};

export const lightColors = {
  // base / warm ivory
  bg: '#F5F0E8',
  bgSoft: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F2ECE2',
  surface2: '#E9E1D5',

  // gold accent family — deeper on light for contrast
  gold: '#C0892E',
  goldLight: '#9A6B1E',
  goldDark: '#8C5E18',
  primary: '#C0892E',
  primaryDark: '#8C5E18',
  accent: '#C0892E',
  onGold: '#FFFFFF', // text/icon color sitting on a gold fill

  text: '#2A2320',
  textDim: '#5C534B',
  textMuted: '#8A8077',

  border: '#E4DBCE',
  borderSoft: '#EEE7DC',

  danger: '#D2453F',
  success: '#2FA866',
  info: '#3F73C4',

  // translucent helpers
  goldGlow: 'rgba(193,137,46,0.16)',
  goldFaint: 'rgba(193,137,46,0.10)',
  overlay: 'rgba(40,30,20,0.45)',
  white12: 'rgba(0,0,0,0.06)',
  white06: 'rgba(0,0,0,0.035)',

  isDark: false,
};

const PALETTES = {dark: darkColors, light: lightColors};

/** Static dark palette — back-compat for non-component call sites. */
export const colors = darkColors;

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

// Cross-platform shadow presets (theme-independent — black depth + gold glow).
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 10},
    elevation: 8,
  },
  glow: {
    shadowColor: '#C9893B',
    shadowOpacity: 0.35,
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

/** Current palette object, reactive to the selected theme mode. */
export function useColors() {
  const mode = useThemeStore(s => s.mode);
  return PALETTES[mode] || darkColors;
}

/** Current theme mode string ('dark' | 'light'). */
export function useThemeMode() {
  return useThemeStore(s => s.mode);
}

/**
 * Build a StyleSheet from the active palette and memoise it per palette.
 * Usage:
 *   const makeStyles = c => StyleSheet.create({ root: {backgroundColor: c.bg} });
 *   const styles = useThemedStyles(makeStyles);
 */
export function useThemedStyles(factory) {
  const palette = useColors();
  return useMemo(() => factory(palette), [factory, palette]);
}
