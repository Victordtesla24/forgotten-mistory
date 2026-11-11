/**
 * A position on the track, 0 to 1, as a CSS percentage. It stands alone so that the controls, which
 * run in the browser, do not take the time scale of `lib/timeline.ts` along with it.
 */
export const percent = (at: number): string => `${(at * 100).toFixed(4)}%`;
