/**
 * visemeSchedule.ts — the greeting's words, turned into mouth shapes on a clock.
 *
 * ElevenLabs' `/v1/text-to-speech/{voice}/with-timestamps` returns, alongside the
 * MP3, the start and end time of every *character* it spoke. This module is the
 * one piece between that alignment and the face: it groups the characters into
 * pronounceable runs, gives each run a viseme, and emits a cue list the renderer
 * can look a time up in.
 *
 * Three properties are load-bearing, and `tests/viseme_schedule.test.mjs`
 * asserts all three (VS-01…VS-08):
 *
 *   1. **It is a partition of the audio.** The cues are sorted, gapless and
 *      non-overlapping and together cover `[0, durationSeconds]`, so
 *      `visemeIndexAt` is total: no frame can fall between two cues and leave
 *      the mouth frozen on whatever it was last told.
 *   2. **It introduces no new taxonomy.** Every index it emits is an index of
 *      `VISEME_SHAPES` in ./visemeMap.ts — the same 22-entry D-ID/Microsoft set
 *      (0–21, 0 = `sil`) the canvas mouth, the GLSL stage and the analyser
 *      fallback already share. The indices appear here as numbers rather than as
 *      an import so this module stays dependency-free and `node --test` can load
 *      it directly; the test reads the labels out of visemeMap.ts and asserts
 *      the correspondence, so the two cannot drift apart silently.
 *   3. **Times are never rounded.** `MIN_CUE_S` is 0.040 s — the drift budget of
 *      MINIVIC-AVATAR-v1.md §5.4 expressed as a floor on cue length, because a
 *      cue the renderer cannot be *proven* to hit is a cue that should not
 *      exist. Rounding cue boundaries to milliseconds would spend up to 0.5 ms
 *      of that budget for nothing, so the float64 seconds go through untouched.
 *
 * This is an approximation of English orthography, not a phonemiser. It has no
 * lexicon and no stress model, so `read` (past) and `read` (present) get the
 * same mouth. MINIVIC-AVATAR-v1.md §9-2 keeps that on the OPEN register; it is
 * never described to a visitor as phoneme-accurate.
 *
 * Pure: no DOM, no React, no I/O, no clock, no randomness. Same input, same
 * bytes out (VS-06).
 */

/** The character alignment as the generation run recorded it. */
export interface CharacterAlignment {
  /** One entry per character of the spoken text, in order. */
  readonly characters: readonly string[];
  /** Start time of each character, seconds from the top of the audio. */
  readonly characterStartTimesSeconds: readonly number[];
  /** End time of each character, seconds from the top of the audio. */
  readonly characterEndTimesSeconds: readonly number[];
  /** SHA-256 of the audio this alignment was produced with, when it carries one. */
  readonly sourceSha256?: string;
}

/** A cue: `[tStart, tEnd, visemeIndex]`, seconds, never rounded. */
export type VisemeCue = [number, number, number];

export interface VisemeSchedule {
  readonly version: 1;
  /** SHA-256 of the audio these cues describe. Never absent. */
  readonly sourceSha256: string;
  readonly durationSeconds: number;
  readonly cues: VisemeCue[];
}

export interface BuildScheduleOptions {
  /** Digest of the audio; falls back to the alignment's own `sourceSha256`. */
  readonly sourceSha256?: string;
  /**
   * Length of the audio. Defaults to the last character end time. A value
   * shorter than that is raised to it — the schedule never truncates the words
   * the alignment says were spoken.
   */
  readonly durationSeconds?: number;
}

/**
 * A punctuation or whitespace gap becomes a real viseme-0 cue only when it lasts
 * at least this long. Shorter gaps are absorbed into the run before them:
 * without this every space in a 61-word greeting shuts the mouth for a frame and
 * the face flickers (MINIVIC-AVATAR-v1.md §3.4).
 */
export const SILENCE_MIN_S = 0.06;

/**
 * After merging, no cue may be shorter than this; a shorter one is merged into
 * its longer neighbour. 0.040 s is the renderer drift budget of §5.4, written
 * here in seconds and never restated in another unit.
 */
export const MIN_CUE_S = 0.04;

/** Index 0 in VISEME_SHAPES — the closed, resting mouth. */
const SILENCE_VISEME = 0;

const VOWELS = 'aeiouy';

function isLetter(ch: string | undefined): boolean {
  return ch !== undefined && ch >= 'a' && ch <= 'z';
}

function isVowel(ch: string | undefined): boolean {
  return ch !== undefined && VOWELS.includes(ch);
}

function isConsonantLetter(ch: string | undefined): boolean {
  return isLetter(ch) && !isVowel(ch);
}

/** True when nothing but a non-letter (or the end of the text) follows `at`. */
function endsWord(text: string, at: number): boolean {
  return !isLetter(text[at]);
}

/**
 * The "magic e" open syllable: a vowel, one consonant, then a word-final `e`
 * — `like`, `make`, `time`. The cheapest signal English orthography gives for a
 * long vowel, and the only one used here.
 */
function isOpenSyllable(text: string, at: number): boolean {
  return (
    isConsonantLetter(text[at + 1]) && text[at + 2] === 'e' && endsWord(text, at + 3)
  );
}

interface GraphemeRule {
  /** Lowercase grapheme to match at the cursor. */
  readonly g: string;
  /** VISEME_SHAPES index this grapheme wears. */
  readonly v: number;
  /** Extra condition; `at` is the cursor, i.e. the index of `g[0]`. */
  readonly when?: (text: string, at: number) => boolean;
}

/**
 * The rule table of MINIVIC-AVATAR-v1.md §3.2, row order preserved: the doc's
 * ~22 rule classes spelled out as the graphemes it names, 88 entries in all.
 * `graphemeRuns` applies them longest-match-first, so `th` can never resolve as
 * `t` + `h`; entries of equal length are tried in the order written here, which
 * is the order of the doc's own table.
 */
const RULES: readonly GraphemeRule[] = [
  // dental fricative — 17 TH
  { g: 'th', v: 17 },

  // postalveolar — 16 SH
  { g: 'sh', v: 16 },
  { g: 'ch', v: 16 },
  { g: 'tch', v: 16 },
  { g: 'ti', v: 16, when: (t, i) => t.startsWith('on', i + 2) },
  { g: 'si', v: 16, when: (t, i) => t.startsWith('on', i + 2) },
  { g: 'j', v: 16 },
  { g: 'ge', v: 16, when: (t, i) => endsWord(t, i + 2) },

  // labiodental — 18 FV
  { g: 'f', v: 18 },
  { g: 'ph', v: 18 },
  { g: 'v', v: 18 },
  { g: 'gh', v: 18 },

  // velar — 19 NG
  { g: 'ng', v: 19 },
  { g: 'nk', v: 19 },
  { g: 'k', v: 19 },
  { g: 'ck', v: 19 },
  { g: 'c', v: 19, when: (t, i) => !isVowel(t[i + 1]) || 'aou'.includes(t[i + 1] ?? '') },
  { g: 'q', v: 19 },
  { g: 'g', v: 19 },

  // bilabial — 20 PB
  { g: 'p', v: 20 },
  { g: 'b', v: 20 },
  { g: 'm', v: 20 },
  { g: 'mm', v: 20 },
  { g: 'pp', v: 20 },
  { g: 'bb', v: 20 },

  // alveolar stop / nasal — 21 TD
  { g: 't', v: 21 },
  { g: 'd', v: 21 },
  { g: 'n', v: 21 },
  { g: 'tt', v: 21 },
  { g: 'dd', v: 21 },
  { g: 'nn', v: 21 },
  { g: 'ed', v: 21, when: (t, i) => endsWord(t, i + 2) },

  // sibilant — 15 S
  { g: 's', v: 15 },
  { g: 'z', v: 15 },
  { g: 'ss', v: 15 },
  { g: 'zz', v: 15 },
  { g: 'c', v: 15, when: (t, i) => 'eiy'.includes(t[i + 1] ?? '') },
  { g: 'ce', v: 15 },
  // `x` is a velar release into a sibilant. It is one character, and the
  // alignment gives one character one time span; splitting it would mean
  // inventing a boundary the audio never reported, so it wears the half the eye
  // reads — the sibilant.
  { g: 'x', v: 15 },

  // lateral — 14 L
  { g: 'l', v: 14 },
  { g: 'll', v: 14 },

  // rhotic — 13 R
  { g: 'r', v: 13 },
  { g: 'rr', v: 13 },
  { g: 'wr', v: 13 },

  // aspirate — 12 H
  { g: 'h', v: 12 },

  // rounded glide — 7 UW
  { g: 'w', v: 7 },
  { g: 'wh', v: 7 },
  { g: 'oo', v: 7 },
  { g: 'u', v: 7, when: (t, i) => 'rj'.includes(t[i - 1] ?? '') },
  { g: 'ew', v: 7 },
  { g: 'ue', v: 7 },
  { g: 'oe', v: 7, when: (t, i) => t.slice(i - 2, i) === 'sh' },

  // back rounded — 8 OW
  { g: 'ow', v: 8 },
  { g: 'oa', v: 8 },
  { g: 'o', v: 8 },
  { g: 'oe', v: 8 },

  // open back — 9 AW
  { g: 'aw', v: 9 },
  { g: 'au', v: 9 },
  { g: 'augh', v: 9 },
  { g: 'ough', v: 9 },

  // diphthong /ɔɪ/ — 10 OY
  { g: 'oy', v: 10 },
  { g: 'oi', v: 10 },

  // diphthong /aɪ/ — 11 AY
  { g: 'i', v: 11, when: isOpenSyllable },
  { g: 'igh', v: 11 },
  // `ie` is the diphthong in `tie` but the front vowel in `field`; the narrower
  // rule is written first so longest-match's tie-break reaches it.
  { g: 'ie', v: 6, when: (t, i) => t.startsWith('ld', i + 2) },
  { g: 'ie', v: 11 },

  // front spread — 6 IH
  { g: 'ee', v: 6 },
  { g: 'ea', v: 6 },
  { g: 'i', v: 6 },
  { g: 'y', v: 6 },

  // mid front — 4 EY
  { g: 'e', v: 4 },
  { g: 'eh', v: 4 },
  { g: 'ai', v: 4 },
  { g: 'ay', v: 4 },
  { g: 'ei', v: 4 },
  { g: 'ey', v: 4 },

  // r-coloured — 5 ER
  { g: 'er', v: 5 },
  { g: 'ir', v: 5 },
  { g: 'ur', v: 5 },
  { g: 'ar', v: 5 },
  { g: 'or', v: 5 },
  { g: 'our', v: 5 },

  // rounded mid-back — 3 AO. `aw`, `au` and `or` are claimed by the rows above,
  // which the doc's table order puts first; `al` before a velar is what is left.
  { g: 'alk', v: 3 },

  // open front — 2 AA
  { g: 'a', v: 2, when: isOpenSyllable },
  { g: 'aa', v: 2 },
  { g: 'ah', v: 2 },

  // default vowel / schwa — 1 AE
  { g: 'a', v: 1 },
  { g: 'u', v: 1 },
];

/**
 * The table, stably re-ordered longest grapheme first. A stable sort keeps the
 * declared row order as the tie-break, so `RULES` reads as the doc's table while
 * matching behaves as "ordered longest-match".
 */
const ORDERED_RULES: readonly GraphemeRule[] = RULES.map((rule, order) => ({ rule, order }))
  .sort((a, b) => b.rule.g.length - a.rule.g.length || a.order - b.order)
  .map(({ rule }) => rule);

/** A maximal stretch of text pronounced as one viseme. `end` is exclusive. */
export interface GraphemeRun {
  readonly start: number;
  readonly end: number;
  readonly viseme: number;
}

/**
 * Walks `text` left to right, consuming the longest rule that matches at each
 * cursor. Punctuation and whitespace produce viseme 0; an unmatched letter falls
 * back to 1 (schwa) if it is a vowel and 21 (TD) if it is not, so the walk never
 * stalls and never leaves a character unspoken.
 */
export function graphemeRuns(text: string): GraphemeRun[] {
  const lower = text.toLowerCase();
  const runs: GraphemeRun[] = [];
  let i = 0;
  while (i < lower.length) {
    const ch = lower[i];

    if (!isLetter(ch)) {
      runs.push({ start: i, end: i + 1, viseme: SILENCE_VISEME });
      i += 1;
      continue;
    }

    let matched: GraphemeRule | undefined;
    for (const rule of ORDERED_RULES) {
      if (!lower.startsWith(rule.g, i)) continue;
      if (rule.when && !rule.when(lower, i)) continue;
      matched = rule;
      break;
    }

    if (matched) {
      runs.push({ start: i, end: i + matched.g.length, viseme: matched.v });
      i += matched.g.length;
      continue;
    }

    runs.push({ start: i, end: i + 1, viseme: isVowel(ch) ? 1 : 21 });
    i += 1;
  }
  return runs;
}

interface MutableCue {
  a: number;
  b: number;
  v: number;
}

/** Collapses neighbouring cues that wear the same viseme into one. */
function mergeIdentical(cues: MutableCue[]): MutableCue[] {
  const merged: MutableCue[] = [];
  for (const cue of cues) {
    const last = merged[merged.length - 1];
    if (last && last.v === cue.v && last.b === cue.a) last.b = cue.b;
    else merged.push({ ...cue });
  }
  return merged;
}

/**
 * Absorbs every viseme-0 cue shorter than `SILENCE_MIN_S` into the run before it
 * (or, at the very start, the run after it). Adjacent silences have already been
 * merged, so the neighbour is never itself silence.
 */
function absorbShortSilences(cues: MutableCue[]): MutableCue[] {
  const kept: MutableCue[] = [];
  for (let i = 0; i < cues.length; i += 1) {
    const cue = cues[i];
    const isShortSilence = cue.v === SILENCE_VISEME && cue.b - cue.a < SILENCE_MIN_S;
    if (!isShortSilence) {
      kept.push(cue);
      continue;
    }
    const previous = kept[kept.length - 1];
    if (previous) {
      previous.b = cue.b;
      continue;
    }
    const next = cues[i + 1];
    if (next) {
      next.a = cue.a;
      continue;
    }
    kept.push(cue);
  }
  return kept;
}

/**
 * Merges away every cue under `MIN_CUE_S`. The longer neighbour wins and keeps
 * its own viseme; a tie goes to the left. Both choices are arbitrary, and both
 * are fixed here so the output is order-independent and reproducible (VS-06).
 */
function enforceMinimumCue(cues: MutableCue[]): MutableCue[] {
  let working = cues;
  for (let guard = cues.length; guard >= 0 && working.length > 1; guard -= 1) {
    const index = working.findIndex((cue) => cue.b - cue.a < MIN_CUE_S);
    if (index === -1) break;

    const cue = working[index];
    const left = working[index - 1];
    const right = working[index + 1];
    const leftLength = left ? left.b - left.a : -1;
    const rightLength = right ? right.b - right.a : -1;

    if (left && leftLength >= rightLength) left.b = cue.b;
    else if (right) right.a = cue.a;
    else break;

    working.splice(index, 1);
    working = mergeIdentical(working);
  }
  return working;
}

/**
 * Turns a character alignment into the cue list the renderer reads.
 *
 * Throws rather than guessing when the alignment cannot describe an audio file:
 * a wrong schedule is worse than none, and the caller (the greeting generator,
 * and later the reply path) has a named fallback for the absent case.
 */
export function buildSchedule(
  alignment: CharacterAlignment,
  options: BuildScheduleOptions = {},
): VisemeSchedule {
  const { characters, characterStartTimesSeconds, characterEndTimesSeconds } = alignment;
  if (
    !Array.isArray(characters) ||
    !Array.isArray(characterStartTimesSeconds) ||
    !Array.isArray(characterEndTimesSeconds)
  ) {
    throw new TypeError('buildSchedule: alignment must carry characters and both time arrays');
  }
  if (
    characters.length !== characterStartTimesSeconds.length ||
    characters.length !== characterEndTimesSeconds.length
  ) {
    throw new RangeError(
      `buildSchedule: alignment arrays disagree (${characters.length} characters, ` +
        `${characterStartTimesSeconds.length} starts, ${characterEndTimesSeconds.length} ends)`,
    );
  }
  if (characters.length === 0) {
    throw new RangeError('buildSchedule: the alignment is empty');
  }

  const sourceSha256 = options.sourceSha256 ?? alignment.sourceSha256;
  if (!sourceSha256) {
    throw new TypeError(
      'buildSchedule: a sourceSha256 is required — a schedule that cannot name the audio ' +
        'it describes can be applied to the wrong render without anything noticing',
    );
  }

  // Which alignment entry owns each position of the joined text. Entries are one
  // character each in practice; the map keeps the arithmetic honest if one is not.
  const text = characters.join('');
  const owner = new Int32Array(text.length);
  let position = 0;
  for (let index = 0; index < characters.length; index += 1) {
    const width = characters[index].length;
    for (let k = 0; k < width; k += 1) owner[position + k] = index;
    position += width;
  }

  let cues: MutableCue[] = [];
  for (const run of graphemeRuns(text)) {
    const first = owner[run.start];
    const last = owner[run.end - 1];
    const a = characterStartTimesSeconds[first];
    const b = characterEndTimesSeconds[last];
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) continue;
    const previous = cues[cues.length - 1];
    // Clamp any overlap the upstream alignment reports; never let one cue start
    // inside another.
    const start = previous && a < previous.b ? previous.b : a;
    if (b <= start) continue;
    cues.push({ a: start, b, v: run.viseme });
  }

  if (cues.length === 0) {
    const total = Math.max(options.durationSeconds ?? 0, MIN_CUE_S);
    return { version: 1, sourceSha256, durationSeconds: total, cues: [[0, total, SILENCE_VISEME]] };
  }

  // Holes between cues become explicit silence when they are long enough to be
  // one, and are absorbed by the cue before them when they are not. Either way
  // the list comes out gapless (VS-02).
  const gapless: MutableCue[] = [cues[0]];
  for (let i = 1; i < cues.length; i += 1) {
    const previous = gapless[gapless.length - 1];
    const cue = cues[i];
    const gap = cue.a - previous.b;
    if (gap > 0) {
      if (gap >= SILENCE_MIN_S) gapless.push({ a: previous.b, b: cue.a, v: SILENCE_VISEME });
      else previous.b = cue.a;
    }
    gapless.push(cue);
  }

  cues = mergeIdentical(gapless);
  cues = mergeIdentical(absorbShortSilences(cues));
  cues = enforceMinimumCue(cues);

  const spokenEnd = cues[cues.length - 1].b;
  const durationSeconds = Math.max(options.durationSeconds ?? spokenEnd, spokenEnd);

  // Lead-in and tail: a silence long enough to be a cue becomes one, otherwise
  // the neighbouring cue is stretched, so the list still covers [0, duration].
  if (cues[0].a > 0) {
    if (cues[0].a >= MIN_CUE_S) cues.unshift({ a: 0, b: cues[0].a, v: SILENCE_VISEME });
    else cues[0].a = 0;
  }
  const tail = cues[cues.length - 1];
  if (durationSeconds > tail.b) {
    if (durationSeconds - tail.b >= MIN_CUE_S) {
      cues.push({ a: tail.b, b: durationSeconds, v: SILENCE_VISEME });
    } else {
      tail.b = durationSeconds;
    }
  }
  cues = mergeIdentical(cues);

  return {
    version: 1,
    sourceSha256,
    durationSeconds,
    cues: cues.map((cue): VisemeCue => [cue.a, cue.b, cue.v]),
  };
}

/**
 * The viseme playing at `t` seconds. Binary search, so the rAF loop can call it
 * sixty times a second without walking the cue list.
 *
 * Returns 0 — the closed mouth — before the first cue, after the last one, and
 * whenever there is no schedule at all. That is the honest answer in every one
 * of those cases: the audio is not saying anything.
 */
export function visemeIndexAt(schedule: VisemeSchedule | null | undefined, t: number): number {
  if (!schedule || schedule.cues.length === 0 || !Number.isFinite(t)) return SILENCE_VISEME;
  const { cues } = schedule;
  if (t < cues[0][0] || t >= cues[cues.length - 1][1]) return SILENCE_VISEME;

  let low = 0;
  let high = cues.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const cue = cues[mid];
    if (t < cue[0]) high = mid - 1;
    else if (t >= cue[1]) low = mid + 1;
    else return cue[2];
  }
  return SILENCE_VISEME;
}
