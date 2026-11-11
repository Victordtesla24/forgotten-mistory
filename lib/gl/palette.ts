/**
 * The design tokens as shared colour uniforms. Every shader reads these same uniform
 * objects, so a theme change updates the colours in place: no material is touched and
 * nothing re-renders. Nothing here names a colour; the tokens come from computed style.
 * Colours are parsed into three's linear working space and written out through the
 * `colorspace_fragment` chunk with tone mapping off, so a token on screen is the token.
 */

import { Color } from 'three';

type Token = 'bg' | 'surface' | 'raised' | 'line' | 'lineStrong' | 'text' | 'muted' | 'accent' | 'proof';

const CSS_NAMES: Readonly<Record<Token, string>> = {
  bg: '--bg',
  surface: '--surface',
  raised: '--raised',
  line: '--line',
  lineStrong: '--line-strong',
  text: '--text',
  muted: '--muted',
  accent: '--accent',
  proof: '--proof',
};

/** Below this relative luminance of the page background the theme counts as dark. */
const DARK_BACKGROUND = 0.2;

export interface Uniform<T> {
  value: T;
}

export interface Palette {
  colors: Readonly<Record<Token, Uniform<Color>>>;
  /** 1 on a dark theme, 0 on a light one: the field is drawn as light on dark or ink on paper. */
  dark: Uniform<number>;
}

function createUniforms(): Palette {
  const colors = {} as Record<Token, Uniform<Color>>;
  for (const token of Object.keys(CSS_NAMES) as Token[]) colors[token] = { value: new Color() };
  return { colors, dark: { value: 1 } };
}

/** The one palette of the page. */
export const palette: Palette = createUniforms();

/**
 * Re-reads every token from the active theme into `palette`. Computed colours of sRGB
 * tokens are always `rgb()` strings, which `Color.setStyle` reads exactly. Returns false
 * when nothing changed, so callers can skip the redraw.
 */
export function syncPalette(): boolean {
  const probe = document.createElement('span');
  document.documentElement.append(probe);
  const next = new Color();
  let changed = false;
  for (const token of Object.keys(CSS_NAMES) as Token[]) {
    probe.style.color = `var(${CSS_NAMES[token]})`;
    next.setStyle(getComputedStyle(probe).color);
    const current = palette.colors[token].value;
    if (!current.equals(next)) {
      current.copy(next);
      changed = true;
    }
  }
  probe.remove();
  const { r, g, b } = palette.colors.bg.value;
  const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < DARK_BACKGROUND ? 1 : 0;
  if (dark !== palette.dark.value) {
    palette.dark.value = dark;
    changed = true;
  }
  return changed;
}

/** Calls `onChange` when the theme attribute flips or the system colour scheme does. */
export function watchTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = window.matchMedia('(prefers-color-scheme: light)');
  scheme.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    scheme.removeEventListener('change', onChange);
  };
}
