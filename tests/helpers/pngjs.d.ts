/**
 * Minimal ambient types for `pngjs`.
 *
 * `pngjs` is already resolvable from this repo's `node_modules` (it ships with
 * the Playwright toolchain) but publishes no types, and `@types/pngjs` is not
 * installed — adding either would mean touching `package.json`, which the
 * flagship-visibility lane is not permitted to do. Only the surface actually
 * used by `tests/overhaul/flagship-visibility.spec.ts` is declared: decoding a
 * PNG buffer to raw RGBA. Widen it when a test needs more, not before.
 */
declare module 'pngjs' {
  interface PNGImage {
    width: number;
    height: number;
    /** Row-major RGBA, four bytes per pixel. */
    data: Buffer;
  }

  export const PNG: {
    sync: {
      read(buffer: Buffer): PNGImage;
    };
  };
}
