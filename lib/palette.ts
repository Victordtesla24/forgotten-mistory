/**
 * palette.ts — single source of truth for raw colour values used in WebGL/Canvas
 * scenes (where CSS custom properties can't reach). Monochromatic by mandate
 * (docs/overhaul/SPEC.md §3.1): near-black inks, cool greys, luminous white.
 * Keeping hex here (not in components) preserves the "no raw hex in components"
 * token-discipline invariant enforced by scripts/validate/overhaul_static_audit.mjs.
 */
export const PALETTE = {
  // Surfaces
  ink900: '#0A0A0A',
  ink800: '#131313',
  ink700: '#1C1C1C',
  black: '#000000',

  // The single hue, for scenes. Taken verbatim from the Aether brand palette so
  // the portfolio and the product read as the same hand. Same rule as the CSS
  // token: gold marks a value with a source, never anything merely important.
  gold: '#c9a84c',
  goldLight: '#d4b65c',
  goldPale: '#e8d5a3',

  // Light
  white: '#F6F6F6',
  accent: '#EBEBEB',
  steel: '#B8B8B8',

  // Starfield — monochrome whites/greys (no blue/warm tint)
  star: ['#F6F6F6', '#CDCDCD', '#EBEBEB', '#B8B8B8'] as const,
  starGlow: '#EBEBEB',

  // Nebula clouds — neutral near-black (hue removed)
  nebula: ['#0A0A0A', '#0D0D0D', '#0A0A0A'] as const,
} as const;

export type Palette = typeof PALETTE;
