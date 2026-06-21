/**
 * Design tokens — fuente: UXUI.md §2 "Sistema de Diseño", identidad "Athletic Precision".
 * Dark-first nativo. NO improvisar valores fuera de esta paleta (Capa 2, vigente).
 */
export const colors = {
  // Fondos
  backgroundBase: '#080810',
  surface100: '#10101C',
  surface200: '#18182A',
  surface300: '#22223A',
  borderSubtle: '#2A2A42',

  // Acento primario — Electric Lime (rendimiento, progreso)
  lime500: '#C8FF47',
  lime400: '#D4FF6E',
  lime300: '#E8FFB0',
  lime100: '#C8FF471A',

  // Acento secundario — Recovery Mint (hidratación, recuperación)
  mint500: '#3DFFC8',
  mint100: '#3DFFC81A',

  // Semánticos
  success: '#3DFFC8',
  warning: '#FFBB33',
  error: '#FF4D6A',
  info: '#4D9EFF',

  // Texto
  textPrimary: '#F0F0FA',
  textSecondary: '#8888AA',
  textDisabled: '#44445A',
  textInverse: '#080810',
} as const;

export const spacing = {
  sp1: 4,
  sp2: 8,
  sp3: 12,
  sp4: 16,
  sp5: 20,
  sp6: 24,
  sp8: 32,
  sp10: 40,
  sp12: 48,
  sp16: 64,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/** Roles tipográficos — Space Grotesk (display/headlines), Inter (body), JetBrains Mono (datos). */
export const typography = {
  displayXL: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 48, letterSpacing: -0.5 },
  displayL: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 36 },
  displayM: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28 },
  h1: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24 },
  h2: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20 },
  h3: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 },
  bodyL: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  bodyM: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  bodyS: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  monoL: { fontFamily: 'JetBrainsMono_500Medium', fontSize: 14 },
  monoS: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 12 },
} as const;

export const minTouchTarget = 44; // UXUI.md §15.1 — mínimo de accesibilidad
