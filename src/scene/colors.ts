// Shared palette — mirrors graphl-mobile / NodeMap so scenes feel visually
// consistent across apps. Tuned for a dark background.
export const BLUE = '#5b8cff'
export const GREEN = '#37d39a'
export const ORANGE = '#ff7a59'
export const PURPLE = '#b98bff'
export const RED = '#ff5d6c'
export const TEAL = '#3fd0d6'
export const GRAY = '#9aa3b2'

const PALETTE: Record<string, string> = {
  blue: BLUE,
  green: GREEN,
  orange: ORANGE,
  purple: PURPLE,
  red: RED,
  teal: TEAL,
  gray: GRAY,
  grey: GRAY,
}

/**
 * Resolve a scene's `color` field to a hex string. Content authors a palette
 * name ('orange') for readability; a raw hex (or any non-name) passes through.
 * Falls back to GRAY when omitted.
 */
export function resolveColor(color?: string): string {
  if (!color) return GRAY
  return PALETTE[color.toLowerCase()] ?? color
}
