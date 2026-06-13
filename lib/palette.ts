/**
 * palette.ts — single source of truth for raw colour values used in WebGL/Canvas
 * scenes (where CSS custom properties can't reach). Monochromatic by mandate
 * (docs/overhaul/SPEC.md §3.1): near-black inks, cool greys, luminous white.
 * Keeping hex here (not in components) preserves the "no raw hex in components"
 * token-discipline invariant enforced by scripts/validate/overhaul_static_audit.mjs.
 */
export const PALETTE = {
  // Surfaces
  ink900: '#0A0B0D',
  ink800: '#121317',
  ink700: '#1B1D23',
  black: '#000000',

  // Light
  white: '#F4F6FA',
  accent: '#E8EBF0',
  steel: '#AEB6C2',

  // Starfield — monochrome whites/greys (no blue/warm tint)
  star: ['#F4F6FA', '#C9CDD6', '#E8EBF0', '#AEB6C2'] as const,
  starGlow: '#E8EBF0',

  // Nebula clouds — neutral near-black (hue removed)
  nebula: ['#0A0B0D', '#0C0D11', '#090A0C'] as const,
} as const;

export type Palette = typeof PALETTE;
