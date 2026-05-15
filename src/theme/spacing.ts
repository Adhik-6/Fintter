/**
 * Fintter Spacing System
 * Based on a 4px grid for consistent visual rhythm.
 */

export const spacing = {
  /** 2px */ 0.5: 2,
  /** 4px */ 1: 4,
  /** 6px */ 1.5: 6,
  /** 8px */ 2: 8,
  /** 10px */ 2.5: 10,
  /** 12px */ 3: 12,
  /** 16px */ 4: 16,
  /** 20px */ 5: 20,
  /** 24px */ 6: 24,
  /** 32px */ 8: 32,
  /** 40px */ 10: 40,
  /** 48px */ 12: 48,
  /** 64px */ 16: 64,
  /** 80px */ 20: 80,
} as const;

export const borderRadius = {
  sm: 6,
  default: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
