/**
 * videoRung.ts — which encode of the hero loop a given screen actually needs.
 *
 * G-H5. The site ships one 12.3 s greeting loop, cut from a single genuine
 * 3840x2160 @ 24 fps master (artifacts/masters/minivic-greeting-2160p-master.mp4,
 * never committed). Until this file existed only the 720p downscale was
 * published, and the adversarial reviewer was right about what that meant: a
 * higher source demonstrably exists, so "720p is the ceiling" was false and
 * every larger URL the ladder implied answered 404.
 *
 * The answer is not to make the critical-path file bigger. It is to keep the
 * 720p rung exactly where it is — the default, the fallback, the only file a
 * normal reader ever fetches — and to publish the larger rungs under
 * `public/assets/avatar/`, which `scripts/validate/overhaul_static_audit.mjs`
 * gives a 5 MB budget precisely because the `<video>` carries no `src` until
 * someone asks it to play. Bytes there are only ever spent by a reader who has
 * already decided to watch, on a screen that can actually resolve them.
 *
 * The choice is arithmetic, not taste:
 *
 *   need = rendered CSS height x devicePixelRatio        (device pixels down the box)
 *   rung = the smallest published rung whose height >= need
 *
 * with three hard edges:
 *
 *   1. `navigator.connection.saveData` pins the choice to the base rung. A
 *      reader who asked for less data is not overruled by their own DPR.
 *   2. A rung whose container/codec the browser will not commit to
 *      (`canPlayType` returns '') is not a candidate. The AV1 rung is real for
 *      Chrome, Edge and Firefox and simply absent for a browser without an AV1
 *      decoder, which then lands on 1080p H.264.
 *   3. Nothing above the largest playable rung exists, so a wall-sized display
 *      gets that one rather than an error.
 *
 * `selectVideoRung` is pure and is the unit under test
 * (tests/unit/video-rung.spec.ts). `readRungConditions` and `selectLoopSrc` are
 * the browser glue: two DOM reads and one navigator read, done at the moment of
 * play, when the box has a measured size.
 */

/** One published encode of the same loop. `type` is what `canPlayType` is asked. */
export interface VideoRung {
  /** Encoded height in pixels — the number the arithmetic compares against. */
  readonly height: number;
  /** Encoded width in pixels, carried so a caller can size a box without a fetch. */
  readonly width: number;
  /** Absolute site path of the file. */
  readonly src: string;
  /** MIME type plus codecs string, precise enough for `canPlayType` to refuse. */
  readonly type: string;
}

/** Everything the choice depends on, gathered once so the rule can be pure. */
export interface RungConditions {
  /** CSS pixels down the rendered box. `0` or worse means "not measurable yet". */
  readonly renderedHeight: number;
  /** Device pixels per CSS pixel. Values below 1 are treated as 1. */
  readonly devicePixelRatio: number;
  /** The reader asked for less data (Save-Data / data saver). */
  readonly saveData: boolean;
  /** Whether this browser will commit to a container/codec string. */
  readonly canPlay: (type: string) => boolean;
}

/**
 * Choose the rung for one set of conditions.
 *
 * `ladder[0]` is the base rung by construction: the critical-path 720p file,
 * which is assumed playable everywhere (H.264 baseline in MP4) and is what a
 * save-data reader, an unmeasured box, or a browser that refuses everything
 * else receives.
 */
export function selectVideoRung(ladder: readonly VideoRung[], conditions: RungConditions): VideoRung {
  if (ladder.length === 0) {
    throw new Error('selectVideoRung: the ladder is empty — there is nothing to play.');
  }
  const base = ladder[0];
  if (conditions.saveData) return base;

  const { renderedHeight, devicePixelRatio } = conditions;
  if (!Number.isFinite(renderedHeight) || renderedHeight <= 0) return base;

  const ratio = Number.isFinite(devicePixelRatio) && devicePixelRatio > 1 ? devicePixelRatio : 1;
  const need = renderedHeight * ratio;

  // The base rung is the fallback and is never filtered out; every rung above it
  // has to earn its place by being playable here.
  const playable = ladder.filter((rung, index) => index === 0 || conditions.canPlay(rung.type));
  const ascending = [...playable].sort((a, b) => a.height - b.height);

  return ascending.find((rung) => rung.height >= need) ?? ascending[ascending.length - 1];
}

/** True for `'maybe'` and `'probably'`; false for the empty string a browser returns to refuse. */
function browserCanPlay(type: string): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('video');
  return probe.canPlayType(type) !== '';
}

/** `navigator.connection.saveData`, which no lib.dom version types yet. */
function readSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Measure the conditions around one element. The height is the element's own
 * rendered box — for the hero that is the media rect the loop covers, for
 * MiniVic the panel stage or the launcher pill — because that, times the pixel
 * ratio, is the only number that says how many real pixels the decode has to
 * resolve.
 */
export function readRungConditions(element: Element | null): RungConditions {
  const rect = element?.getBoundingClientRect();
  return {
    renderedHeight: rect ? rect.height : 0,
    devicePixelRatio: typeof window === 'undefined' ? 1 : window.devicePixelRatio,
    saveData: readSaveData(),
    canPlay: browserCanPlay,
  };
}

/** The one call a component makes: element in, source URL out. */
export function selectLoopSrc(ladder: readonly VideoRung[], element: Element | null): string {
  return selectVideoRung(ladder, readRungConditions(element)).src;
}
