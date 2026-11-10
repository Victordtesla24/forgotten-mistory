/**
 * Canvas visuals cannot read CSS variables, so they read the resolved tokens of
 * the active theme from computed style and derive every colour from those. Nothing
 * here names a colour: change a token and the canvas follows.
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** The tokens the hero field is built from, in the order `readThemeSnapshot` returns them. */
const TOKEN_NAMES = ['--bg', '--surface', '--accent', '--proof'] as const;

/** Below this relative luminance a page background counts as a dark theme. */
const DARK_BACKGROUND = 0.2;

/**
 * The resolved colours of the tokens above, as one string, so that a theme change
 * is a change of value. Computed colours of sRGB tokens are always `rgb()` strings.
 */
export function readThemeSnapshot(): string {
  const probe = document.createElement('span');
  document.documentElement.append(probe);
  const resolved = TOKEN_NAMES.map((name) => {
    probe.style.color = `var(${name})`;
    return getComputedStyle(probe).color;
  });
  probe.remove();
  return resolved.join('|');
}

/** Calls `onChange` when the theme attribute flips or the system colour scheme does. */
export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = window.matchMedia('(prefers-color-scheme: light)');
  scheme.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    scheme.removeEventListener('change', onChange);
  };
}

function parseRgb(computed: string): Rgb | null {
  const match = /rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/.exec(computed);
  if (!match) return null;
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * amount,
    g: from.g + (to.g - from.g) * amount,
    b: from.b + (to.b - from.b) * amount,
  };
}

function channel(value: number): number {
  const unit = value / 255;
  return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function css({ r, g, b }: Rgb): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * The colour spots of the hero mesh for the theme in `snapshot`. In a dark theme
 * the spots are deep neutral blues with one faint warm note; in a light theme they
 * are soft paper tints. Every spot stays close to the page background, so body
 * copy keeps its contrast. Returns null when a token cannot be read.
 */
export function heroFieldColors(snapshot: string): string[] | null {
  const [bg, surface, accent, proof] = snapshot.split('|').map(parseRgb);
  if (!bg || !surface || !accent || !proof) return null;

  if (luminance(bg) < DARK_BACKGROUND) {
    return [
      mix(bg, accent, 0.13),
      mix(bg, accent, 0.28),
      mix(bg, surface, 0.6),
      mix(bg, proof, 0.14),
      mix(bg, accent, 0.19),
    ].map(css);
  }
  return [
    mix(bg, accent, 0.06),
    mix(bg, accent, 0.12),
    mix(bg, surface, 0.8),
    mix(bg, proof, 0.16),
    mix(bg, accent, 0.08),
  ].map(css);
}
