/**
 * Fintter Color System
 * AMOLED-friendly, dark-theme-first palette with neon cyan/purple accents.
 * All colors are carefully chosen for contrast, readability, and visual depth.
 */

export const colors = {
  // Base (AMOLED-friendly surface layers)
  black: '#000000',
  surface0: '#0A0A0F', // deepest background
  surface1: '#12121A', // cards
  surface2: '#1A1A28', // elevated cards
  surface3: '#222235', // input fields, chips

  // Accent — Neon Cyan + Purple
  cyan: '#00E5FF',
  cyanDim: '#00B8D9',
  cyanGlow: 'rgba(0, 229, 255, 0.15)',
  purple: '#A855F7',
  purpleDim: '#7C3AED',
  purpleGlow: 'rgba(168, 85, 247, 0.15)',

  // Semantic
  income: '#22C55E',
  incomeDim: '#16A34A',
  incomeGlow: 'rgba(34, 197, 94, 0.15)',
  expense: '#EF4444',
  expenseDim: '#DC2626',
  expenseGlow: 'rgba(239, 68, 68, 0.15)',
  transfer: '#F59E0B',
  transferDim: '#D97706',
  transferGlow: 'rgba(245, 158, 11, 0.15)',
  warning: '#F59E0B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  textDisabled: '#334155',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.12)',

  // Glassmorphism helpers
  glass: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Status colors
  success: '#22C55E',
  error: '#EF4444',
  info: '#00E5FF',

  // Budget health gradient stops
  budgetSafe: '#22C55E',
  budgetWarning: '#F59E0B',
  budgetDanger: '#EF4444',
} as const;

export type ColorKey = keyof typeof colors;
export type ColorValue = (typeof colors)[ColorKey];
