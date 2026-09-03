# SPEC — Telemetry, Data Currency, and the Two Red Pipelines

Run `v6-20260903T195241Z` · **Requirements** R-87, R-88, R-108, R-182, R-183, R-184, R-175, R-119, R-162, R-105 ·
**Success criteria** SC-94.1, SC-01a, SC-02, SC-04b, SC-05, SC-30 · **Gates J and R** · **Tests** T-17, T-37, T-40
· **Decisions** D-01, D-03, D-04, D-05, D-06

**Authority.** `AUDIT-RECONCILIATION.md` is the ground truth for this run and corrects the contract where the two
disagree. `DECISIONS.md` D-04 is binding: every server-side layer in this spec is built on the **already-working
Firebase Cloud Functions path** that serves `minivicChat` — not on the uninstalled `services/` stack, not on a new
VPS vhost.

**Status: design only.** Nothing below is implemented. Every path, type, number and command is a build
instruction, not a description of the tree. No file under `app/`, `components/`, `lib/`, `scripts/` or `tests/`
was modified to write this document.

---

## 0 · What this spec ships, and the three things it must never do

Four deliverables, in the order they must land:

| # | Deliverable | Requirement | Lands with |
|---|---|---|---|
| **A** | First-party, cookieless, identifier-free telemetry — beacon, collector, storage, retention, aggregation | R-87, R-88, Gate J, T-17 | **B**, in the same commit — no exception |
| **B** | The rewritten self-claim: colophon, plate 06, the MiniVic answer, and the mechanism that makes drift impossible | R-183, T-40, SC-94.1 | **A** |
| **C** | Deploy-time data refresh over the real GitHub and YouTube APIs, and the currency copy generated from the manifest | R-108, R-182, SC-04b | **B**'s second half — the copy and the refresh are one commit |
| **D** | Both red pipelines repaired: this repository's CI (defect C-1) and the flagship's (R-184), with the flagship's *Limits* line rewritten to what remains true | R-184, R-105, SC-05 | independently, but **before** any certification run |

### 0.1 · The zero-mark ruling

**This spec ships no visual mark.** It adds no chart, no counter, no dashboard, no visible figure that did not
already exist. Three consequences, all binding:

1. **R-95, R-97, R-99, R-109, R-110, R-112 bind this spec only negatively.** There is no visualisation to give
   a dossier, a dual read, four interactions or a takeaway line — because there is nothing to look at. A
   visualisation invented here to satisfy those requirements would itself be the violation.
2. **The site never publishes its own traffic.** Visit counts, dwell averages, "N people read this section"
   — every one of them is a vanity metric, banned outright by R-119 and by §9 of the contract. Telemetry
   exists to tell the owner which sections to reopen (R-88); it is never content.
3. **Gold spend for this spec: zero marks.** No gold is added by A, B, C or D. The one gold mark in the closing
   section is the build bracket, owned by `SPEC-closing-section.md` §6.3. The currency line this spec rewrites
   (`Vitrine.module.css` `.stamp`) is `--mist-400` mono and stays that way — a date is provenance, not a figure
   with a source you can open, and grading it up to gold would be exactly the inflation R-110 forbids.

### 0.2 · Ordering dependencies on the sibling specs

| This spec needs | From | Why |
|---|---|---|
| `app/data/canonical/**` (provenance kernel, envelope, `assertModule`, `build_dataset.mjs`, `retain.mjs`) | `dataset-layer-design.md` §1–§3 | Part 3 is the *refresh policy and the copy*; the dataset design owns the types and the orchestrator. Part 3 does not restate them and must not fork them. |
| `firebase-admin` in `functions/package.json`, the `(default)` Firestore database in `us-central1`, `firestore.rules` denying all client access, `firestore.indexes.json` | `SPEC-closing-section.md` §3.2 | The collector reuses exactly that database and exactly those rules. If the closing section lands first, Part 1 adds collections only. If Part 1 lands first, it creates them on the same terms. **Neither may create a second database.** |
| `components/site/Footer.tsx` and `app/data/portfolio/listen.ts` `colophon` | `SPEC-closing-section.md` §6, §8.3 | Part 2 **supersedes** §8.3's colophon draft. See §15.0. |
| `data-contact-route="canonical"`, `data-role="route"`, the `fm:ask` event, `#conversation-home` | `SPEC-closing-section.md` §4 | Part 1's conversion paths key on those attributes and on that event. They are the contract; Part 1 adds no new markup to carry them. |
| `data-explainer-video` on the explainer `<video>` | `SPEC-explainer.md` §5.3 | Part 1's play/completion instrumentation keys on it. R-147 deletes the self-presentational avatar; the events measure the **explainer**, which is what replaces it. |

**If C has not landed, B must not claim it.** The currency sentence in §22 is generated from the manifest; until
`app/data/canonical/generated/manifest.v1.json` exists, the shipped sentence is the one the current code can
prove, and the plate 06 *limits* line stays as it is. A half-refresh with a full claim is the precise failure
R-182 names.

---
---

# PART 1 — FIRST-PARTY TELEMETRY (R-87, R-88, Gate J, T-17)

## 1 · File manifest

### 1.1 Create

| Path | Kind | What it is |
|---|---|---|
| `lib/telemetry/events.ts` | TS, **no React, no DOM** | The closed event union, the copy map, the never-collected list. The single source of truth for both the code and the sentence. |
| `lib/telemetry/runtime.ts` | TS, browser, dynamically imported | Observers, timers, buffer, flush. The only file that touches the DOM. |
| `lib/telemetry/beacon.ts` | TS, browser | Transport. `sendBeacon` → `fetch(keepalive)` → drop. |
| `lib/telemetry/consent.ts` | TS, browser | GPC / DNT / `prefers-reduced-data` gate. Pure predicate, no side effects. |
| `components/site/TelemetryBoot.tsx` | client component | Renders `null`. One `useEffect`. **Zero `useState`, zero `useSyncExternalStore`, zero context.** |
| `functions/telemetry.js` | Cloud Function module | `collectTelemetry`, `purgeTelemetry`, `aggregateTelemetry`, `recordChatTopic`. |
| `functions/kb-topics.json` | generated, committed | `{ topicId, keywords[] }[]` produced from `app/data/miniVicKnowledge.ts` at build. |
| `scripts/build/kb_topics.mjs` | build script | Generates the above. Fails the build on a topic with fewer than two keywords. |
| `scripts/build/read_time.mjs` | build script | Word count per section → `app/data/generated/read-time.ts`. Feeds §9's threshold. |
| `app/data/generated/read-time.ts` | generated, committed | `{ [sectionId]: { words: number; readTimeMs: number } }` |
| `tests/overhaul/telemetry-runtime.spec.ts` | Playwright | TM-01 … TM-14 |
| `tests/unit/telemetry-events.test.mjs` | `node --test` | TM-20 … TM-26 |
| `tests/unit/telemetry-collector.test.mjs` | `node --test` | TM-30 … TM-38 (collector handler, invoked directly) |

### 1.2 Change

| Path | Change |
|---|---|
| `app/layout.tsx` | Mount `<TelemetryBoot />` as the **last** child of `<body>`, after `<ServiceWorkerRegister />`. |
| `firebase.json` | One rewrite: `{ "source": "/api/telemetry", "function": { "functionId": "collectTelemetry", "region": "us-central1" } }`. **CSP unchanged** — `connect-src 'self'` already permits a same-origin beacon. |
| `functions/index.js` | `require("./telemetry")` and re-export the four functions; `minivicChat` calls `recordChatTopic(...)` after a successful completion (§7.3). |
| `functions/package.json` | Add `firebase-admin` (shared with `SPEC-closing-section.md` §3.3) and `firebase-functions` already present. Nothing else. |
| `package.json` | `build` and `build:static` gain `node scripts/build/kb_topics.mjs && node scripts/build/read_time.mjs` before `next build`. |
| `scripts/validate/overhaul_static_audit.mjs` | Four new checks, `TC-TELEMETRY-01 … 04` (§13.1). |
| `tests/overhaul/telemetry-stability.spec.ts` | Two new cases, TS-07 and TS-08 (§13.3). **The file's existing six cases are not modified.** |

### 1.3 Delete

Nothing. `lib/githubTelemetry.ts` was already deleted after the 2026-07-09 outage; there is no residue to remove.
This spec does not resurrect it, does not reuse its name, and does not reuse its shape.

---

## 2 · The outage this implementation cannot repeat

`tests/overhaul/telemetry-stability.spec.ts:6-35` records the failure verbatim. Two defects, one outage:

> A `useSyncExternalStore` in `lib/githubTelemetry.ts` returned a fresh object from
> `getSnapshot()`/`getServerSnapshot()` on every call. React compares snapshots with `Object.is`, so a new
> reference each render meant "store changed" forever → React #185 *"Maximum update depth exceeded"* → the root
> error boundary in `app/error.tsx` replaced the ENTIRE page with "Something went wrong". Every visitor saw a dead
> portfolio. A second defect in the same outage: `TeslaDashboard` read `navigator.connection` inside a `useState`
> initializer, so the server prerendered "—" and the client hydrated to "4G" → React #425 hydration text mismatch.

The file's own reasoning is the more important half: *"neither of them was really a telemetry bug: they were a
store that broke referential identity and a component that read a device API before mount."* A design that only
avoided those two lines would learn nothing. So the rule below is structural, not vigilant.

### 2.1 The five structural rules

**R1 · Telemetry never enters React's render path.** `lib/telemetry/**` exports imperative functions only. There
is no hook, no context, no provider, no store, no subscription, and **no `useSyncExternalStore` anywhere in the
repository**. No telemetry value is ever read during a render, so no telemetry value can ever cause a re-render.
The class of bug that killed the page in July is not merely avoided — it is unrepresentable, because there is no
store for a snapshot to be unstable in.

*Enforced by* `TC-TELEMETRY-01`: `grep -rn "useSyncExternalStore" app components lib` must return **zero** hits
repo-wide, and no file under `lib/telemetry/` may contain `from 'react'` or `from "react"`.

**R2 · `TelemetryBoot` holds no state.** It is:

```tsx
'use client';
import { useEffect } from 'react';

/**
 * The only mount point. It renders nothing, holds nothing, and subscribes to
 * nothing React can observe. Its entire job is to import the runtime after the
 * page has settled and to hand back a teardown.
 *
 * It has no useState by design, not by accident: see docs/…/SPEC-telemetry-and-data.md §2.
 */
export default function TelemetryBoot() {
  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      import('@/lib/telemetry/runtime')
        .then((m) => { if (!cancelled) dispose = m.start(); })
        .catch(() => { /* telemetry never surfaces an error to the page */ });
    };

    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
      .requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 2000 }) : window.setTimeout(start, 2000);

    return () => {
      cancelled = true;
      if (idle) (window as unknown as { cancelIdleCallback: (h: number) => void }).cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      dispose?.();
    };
  }, []);

  return null;
}
```

Zero `useState`, zero derived render output, zero device reads during render. There is no server/client value to
disagree about, so React #425 has no surface. *Enforced by* TM-20: parse the file, assert zero occurrences of
`useState`, `useMemo`, `useSyncExternalStore`, `useLayoutEffect`, and exactly one `useEffect`.

**R3 · Device APIs are read after mount, in an event handler, and never rendered.** `navigator.connection`,
`matchMedia`, `screen`, `navigator.hardwareConcurrency` — the runtime reads **none of them** (see §16's
never-collected list). The only environment values it reads are `window.innerWidth` (bucketed to one of four
labels) and `matchMedia('(prefers-reduced-motion: reduce)')`, both read **inside `start()`**, which runs from an
idle callback long after hydration, and both of which travel only into a beacon payload. Nothing the runtime
observes is ever written to the DOM, so no hydration comparison can involve it.

**R4 · If a future change ever must expose telemetry to React, it obeys the frozen-snapshot contract.** This is
written down now so that the next author does not have to rediscover it:

```ts
// lib/telemetry/snapshot.ts — DOES NOT SHIP TODAY. The contract if it ever must.
let version = 0;
let cached: Readonly<Snapshot> = Object.freeze({ version: 0, events: 0 });

export function bump(next: Omit<Snapshot, 'version'>) {
  version += 1;
  cached = Object.freeze({ ...next, version });   // rebuilt ONLY here
}
/** Referentially stable between bumps. This is the whole rule. */
export const getSnapshot = (): Readonly<Snapshot> => cached;
export const getServerSnapshot = getSnapshot;      // the SAME frozen object, never a new one
```

*Enforced by* TM-21, which is written **now** even though `snapshot.ts` does not ship: the test imports the module
if it exists and asserts `Object.is(getSnapshot(), getSnapshot())` across 1,000 calls with no `bump()` between,
and `Object.is(getSnapshot(), getServerSnapshot())`. A file that does not exist passes trivially; a file that
appears later and is wrong fails on its first commit.

**R5 · Zero scroll listeners, zero per-frame state writes.** Scroll depth is measured with four sentinel elements
and one `IntersectionObserver` (§4.3), not a `scroll` handler. The spec file's own warning names
`Vitrine`'s rail as *"the one place on the page where a scroll handler writes into React state on every frame"* —
telemetry adds no second one. The runtime writes only to plain module-scope variables and a plain array.

### 2.2 Failure containment

Every runtime entry point is wrapped so a telemetry fault can never reach `app/error.tsx`:

```ts
const guard = <T extends unknown[]>(fn: (...a: T) => void) => (...a: T) => {
  try { fn(...a); } catch { stop(); }   // one fault → telemetry stops for this view, page unaffected
};
```

`stop()` disconnects every observer, clears every timer, empties the buffer and sets `dead = true`. It never
retries, never logs to the console (R-105 requires a silent console), and never rethrows. **A dead telemetry
runtime is a normal page.** TM-13 proves it by forcing a throw inside the flush path and asserting the page still
renders all six sections with zero `pageerror`.

---

## 3 · The event model — exact types

`lib/telemetry/events.ts`, in full. This file is the contract that Part 2's sentence is generated from, which is
why it is a data file and not a set of string literals scattered through the runtime.

```ts
/**
 * The closed event vocabulary.
 *
 * Two invariants make R-183 mechanical rather than aspirational:
 *   1. Every member of TelemetryEventType has an entry in EVENT_COPY — a human
 *      phrase, in the site's voice, describing what that event records. The
 *      colophon sentence is GENERATED from those phrases (see §16), so a new
 *      event type that nobody described fails `tsc`, not review.
 *   2. NEVER_COLLECTED is the other half of the same sentence, and the static
 *      audit greps the runtime for every entry in it.
 */

export const TELEMETRY_SCHEMA = 1 as const;

export type SectionId = 'hero' | 'about' | 'experience' | 'skills' | 'vitrine' | 'contact';

/** The four widths the layout actually branches on. Never a raw pixel value. */
export type ViewportBucket = 'xs' | 'sm' | 'md' | 'lg';

/** Every path to a conversation, closed set. Adding one is a contract change. */
export type ConversionPathId =
  | 'contact-canonical'    // the one mailto in #contact  (data-contact-route="canonical")
  | 'conversation-seed'    // the fm:ask dispatch from the closing section
  | 'conversation-open'    // the visitor opened the conversational layer themselves
  | 'cv-download'          // a[href="/docs/Vik_Resume_Final.pdf"]
  | 'route-linkedin'       // the one surviving nav route  (data-role="route")
  | 'route-github';        // the hero identity link       (data-role="identity-link")

export type TelemetryEventType =
  | 'view_start'
  | 'section_dwell'
  | 'scroll_depth'
  | 'drop_off'
  | 'carousel_depth'
  | 'explainer_progress'
  | 'chat_session_start'
  | 'conversion'
  | 'cap_reached';

interface Base<T extends TelemetryEventType> {
  readonly t: T;
  /** ms since the runtime started, integer, monotonic. Never a wall clock. */
  readonly ms: number;
}

export type TelemetryEvent =
  | (Base<'view_start'> & {
      readonly viewport: ViewportBucket;
      readonly reducedMotion: boolean;
      /** Which page-level render path the visitor got. Never a GPU string. */
      readonly gl: 'on' | 'off';
    })
  | (Base<'section_dwell'> & {
      readonly section: SectionId;
      /** Accumulated ms with >=50% of the section visible AND the tab visible. */
      readonly dwellMs: number;
    })
  | (Base<'scroll_depth'> & { readonly pct: 25 | 50 | 75 | 95 })
  | (Base<'drop_off'> & { readonly section: SectionId })
  | (Base<'carousel_depth'> & { readonly index: 0 | 1 | 2 | 3 | 4 | 5 })
  | (Base<'explainer_progress'> & { readonly pct: 0 | 25 | 50 | 75 | 100 })
  | (Base<'chat_session_start'>)
  | (Base<'conversion'> & { readonly path: ConversionPathId })
  | (Base<'cap_reached'>);

/**
 * The phrase for each event, in the site's voice, second person.
 * These phrases are the colophon. Changing one changes the page.
 */
export const EVENT_COPY: Record<TelemetryEventType, string> = {
  view_start:         'that a page was opened, at one of four screen widths',
  section_dwell:      'how long each of the six sections was on your screen',
  scroll_depth:       'how far down the page you got',
  drop_off:           'which section you were in when you stopped',
  carousel_depth:     'how deep into the vitrine rail you went',
  explainer_progress: 'whether the explainer was played, and how much of it you watched',
  chat_session_start: 'that a conversation was opened',
  conversion:         'which of the six paths to a conversation you took',
  cap_reached:        'that a visit hit the sixty-event ceiling and stopped recording',
};

/** The other half of the sentence. Each entry is grepped for by TC-TELEMETRY-02. */
export const NEVER_COLLECTED: readonly string[] = [
  'your IP address',
  'your user agent',
  'your language or timezone',
  'your screen size',
  'the page you came from',
  'a cookie, or anything stored on your device',
  'a fingerprint, or any identifier that survives the tab closing',
  'one word of anything you typed',
] as const;

/** The envelope a beacon carries. Exactly these five keys, in this order. */
export interface TelemetryBatch {
  readonly v: typeof TELEMETRY_SCHEMA;
  /** Random, in-memory only, dies with the tab. Groups a batch to one view. */
  readonly view: string;
  /** Batch ordinal within the view, from 0. Lets the collector spot a gap. */
  readonly seq: number;
  readonly events: readonly TelemetryEvent[];
}

export const LIMITS = {
  /** Hard ceiling on events recorded in one view. The 61st is refused. */
  maxEventsPerView: 60,
  /** Flush when the buffer reaches this. */
  flushAtEvents: 20,
  /** Flush this long after the last event, if the buffer is non-empty. */
  flushIdleMs: 15_000,
  /** Refused by the collector above this many bytes of UTF-8. */
  maxBodyBytes: 8_192,
  /** A section must be >=50% visible for this long to start accruing dwell. */
  dwellQualifyMs: 1_000,
  /** IntersectionObserver ratio at which a section counts as "on screen". */
  dwellRatio: 0.5,
  /** Ratio at which a vitrine plate counts as reached. */
  plateRatio: 0.6,
} as const;
```

### 3.1 What is deliberately absent from the type, and why

| Not a field | Why |
|---|---|
| `url`, `path`, `query`, `hash` | One page. A query string is a place to smuggle an identifier. |
| `referrer` | It is the visitor's browsing history, not the site's business. |
| `userAgent`, `platform`, `language`, `timezone`, `screen` | The four of them together are a fingerprint. The layout needs one bucket; it gets one bucket. |
| `timestamp` (wall clock) | `ms` is monotonic-from-start. The only wall clock in the record is the server's `serverTimestamp()`, at day precision in the aggregate. |
| any free text | There is no field a question, a note or a name could travel in. Not "sanitised" — **absent**. |
| `sessionId` persisted anywhere | `view` is `crypto.randomUUID()` held in a module variable. It is never written to `localStorage`, `sessionStorage`, IndexedDB, a cookie, or the URL. A reload is a new visitor to this system, and the sentence says so. |

---

## 4 · The client runtime — exact behaviour

`lib/telemetry/runtime.ts` exports exactly `start(): () => void`. Everything below happens inside it.

### 4.1 Boot order

1. `if (dead || started) return noop;`
2. `if (!isMeasurable()) return noop;` — `lib/telemetry/consent.ts`, §10.
3. `view = crypto.randomUUID()`; `t0 = performance.now()`; `seq = 0`; `buffer = []`.
4. Read the two environment values, **once**: `bucket(window.innerWidth)` and
   `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.
5. `gl` is read from `document.querySelector('canvas[data-gl-scene]') ? 'on' : 'off'` — a DOM fact the page has
   already committed to, never a WebGL probe. Telemetry creates **zero** GL contexts (R-170's per-section budget
   is untouched, and `AUDIT-RECONCILIATION.md` C-2's single detached probe context stays single).
6. `push({ t: 'view_start', ms: 0, viewport, reducedMotion, gl })`.
7. Attach the four observers (§4.2–§4.5) and the two lifecycle listeners (§4.6).

`bucket(w)`: `w < 480 → 'xs'`, `w < 900 → 'sm'`, `w < 1280 → 'md'`, else `'lg'`. The 900 boundary is the same one
`HeroAtmosphere.tsx:50` already branches the shader on; the buckets are the layout's own, not new information.

### 4.2 Section dwell — one observer, six targets

```ts
const sections = ['hero','about','experience','skills','vitrine','contact'] as const;
const io = new IntersectionObserver(onSections, { threshold: [0, LIMITS.dwellRatio] });
```

Per section, module-scope state `{ visibleSince: number | null; accrued: number; qualified: boolean }`.

- ratio crosses **≥ 0.5** → `visibleSince = performance.now()`; after `LIMITS.dwellQualifyMs` of continuous
  visibility (checked on the next transition, not by a timer) the section is `qualified`.
- ratio falls **< 0.5** → `accrued += now - visibleSince` (only if `visibleSince !== null`), `visibleSince = null`.
- `visibilitychange → hidden` → the same close-out for every currently visible section; `→ visible` reopens them.
  Time spent on a background tab is **never** counted as dwell. This is the difference between a dwell figure
  that means something and one that means "the tab was left open overnight".
- At teardown, close out, and for each section with `qualified === true` emit **one**
  `{ t: 'section_dwell', section, dwellMs: Math.round(accrued) }`. Six events maximum per view, emitted once, at
  the end — not a stream.

`#contact` is the id the closing section ships; `#listen` is its zero-height back-compatibility anchor
(`SPEC-closing-section.md` §9) and is **not** observed, so one section is never counted twice.

### 4.3 Scroll depth and drop-off — sentinels, not a scroll handler

The runtime appends four `<div aria-hidden="true">` sentinels to `document.body`, absolutely positioned at
`top: 25% | 50% | 75% | 95%` of `document.documentElement.scrollHeight`, `height: 1px`, `width: 1px`,
`left: 0`, `pointer-events: none`, `contain: strict`. They are inert, unfocusable, and out of the accessibility
tree. A single `IntersectionObserver` with `threshold: 0` emits `{ t: 'scroll_depth', pct }` the first time each
is intersected; each fires at most once.

95, not 100: the last few pixels of a document are frequently unreachable behind a footer at some viewport
heights, and a depth metric that can never reach its own maximum is a broken axis (`encoding-grammar.md` §2.2).

**Drop-off** is a single event emitted at teardown: the section with the greatest `accrued` dwell among those
whose `visibleSince` was non-null at the moment of the final `visibilitychange`/`pagehide` — i.e. *the section
the visitor was in when they stopped*. If no section was visible (a scroll to a gap, an instant close), no
`drop_off` event is emitted. **Absent is not zero**: the aggregate treats a missing `drop_off` as an unattributed
view, never as a drop-off in `hero` (`encoding-grammar.md` §2.4).

On resize, the sentinels are repositioned from a `ResizeObserver` on `document.documentElement`, debounced to one
recomputation per 250 ms. Sentinels already fired stay fired.

### 4.4 Carousel depth — the vitrine rail

`IntersectionObserver` with `root: document.querySelector('#vitrine ol')`, `threshold: LIMITS.plateRatio`, over
`#vitrine ol > li` (six plates, `li[aria-roledescription="plate"]`, the same selector TS-03 already asserts).
Track `maxIndex`; emit **one** `{ t: 'carousel_depth', index: maxIndex }` at teardown. Not one per plate — a rail
scrubbed back and forth would otherwise produce a dozen events and a false picture of engagement.

If `#vitrine ol` is absent the observer is not created. No fallback, no `index: 0` event.

### 4.5 The explainer

`document.querySelector('video[data-explainer-video]')`. Listeners: `play` (once → `explainer_progress` at
`pct: 0`), `timeupdate` (crossing 25/50/75 → one event each, guarded by a `Set` of already-emitted quartiles),
`ended` (→ `pct: 100`). `timeupdate` fires ~4×/s; the handler is three comparisons and a `Set.has` — measured
budget `≤ 0.05 ms` per call (§11).

If the element is absent — because the explainer has not landed yet — no listeners are attached and no events are
emitted. The aggregate reports `insufficient-evidence` for the explainer, never `0% completion`.

### 4.6 Conversions and the chat session

One delegated `click` listener on `document`, `{ passive: true, capture: true }`, resolving `event.target.closest`
against six selectors in this order; first match wins, at most one event per click:

| `ConversionPathId` | Selector |
|---|---|
| `contact-canonical` | `[data-contact-route="canonical"]` |
| `cv-download` | `a[href$="/docs/Vik_Resume_Final.pdf"]` |
| `route-linkedin` | `[data-role="route"]` |
| `route-github` | `[data-role="identity-link"]` |
| `conversation-open` | `[data-conversation-open]` |

Plus one `window.addEventListener('fm:ask', …)` → `conversion` with `path: 'conversation-seed'`, and — the first
time either a `conversation-open` conversion or an `fm:ask` occurs in this view — one `chat_session_start`.

**The event handler reads nothing from the element except the match.** Not its text, not its `href`, not its
position. A conversion is a fact about the site's structure, not about the visitor.

### 4.7 The buffer, the cap, and the flush

```
push(e):
  if (dead) return
  if (count === LIMITS.maxEventsPerView)          // the 61st
      { buffer.push(capReached()); flush('cap'); stop(); return }
  buffer.push(e); count++
  if (buffer.length >= LIMITS.flushAtEvents) flush('size')
  else scheduleIdleFlush()                        // one timer, cleared and reset
```

`scheduleIdleFlush()` holds **one** `setTimeout(flush, LIMITS.flushIdleMs)`, cleared on every push. Flush is also
called from:

- `document.addEventListener('visibilitychange')` when `document.visibilityState === 'hidden'` — the only
  reliable "the visit ended" signal on iOS;
- `window.addEventListener('pagehide')` — belt to that brace;
- the teardown returned by `start()`.

**`beforeunload` is never used.** Registering it disables the back/forward cache in Chromium and Safari and would
cost the site real performance to buy a signal `pagehide` already gives.

Flush is idempotent per batch: it splices the buffer to a local array first, so a re-entrant flush sends nothing
twice. Teardown flushes at most once and then sets `dead = true`.

---

## 5 · The beacon

`lib/telemetry/beacon.ts`:

```ts
export function send(batch: TelemetryBatch): void {
  const body = JSON.stringify(batch);
  if (body.length > LIMITS.maxBodyBytes) return;          // never truncate: drop the batch whole
  const url = '/api/telemetry';
  const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
  if (navigator.sendBeacon?.(url, blob)) return;
  void fetch(url, {
    method: 'POST',
    body,
    keepalive: true,
    credentials: 'omit',                                   // no cookies, ever, in either direction
    cache: 'no-store',
    headers: { 'content-type': 'text/plain;charset=UTF-8' },
  }).catch(() => { /* dropped; telemetry is never retried and never surfaced */ });
}
```

Three deliberate choices:

- **`text/plain`, not `application/json`.** A JSON content-type would make the beacon a non-simple request and
  trigger a CORS preflight; `sendBeacon` cannot carry one. Same-origin makes this moot in practice, but the
  collector parses `req.rawBody` and never depends on the header, so the two transports are byte-identical.
- **`credentials: 'omit'`.** Structural, not stylistic: even if a cookie ever existed on this origin, the beacon
  could not carry it, and the sentence in Part 2 is therefore true of the code, not of the current absence of
  cookies.
- **A dropped beacon is a lost measurement, never a retry.** Retrying costs the visitor bandwidth to improve a
  number only the owner reads. There is no queue, no backoff and no `localStorage` spool.

---

## 6 · The collector Cloud Function

`functions/telemetry.js`, `exports.collectTelemetry`, wired at `/api/telemetry` (§1.2).

```js
exports.collectTelemetry = onRequest(
  { region: "us-central1", maxInstances: 3, timeoutSeconds: 10, memory: "256MiB", cors: false },
  async (req, res) => { /* … */ },
);
```

`applyCors` and `ALLOWED_ORIGINS` are the existing ones in `functions/index.js` — no second allow-list.

| Method | Behaviour |
|---|---|
| `OPTIONS` | `204`, empty body |
| `POST` | validate → write → **`204` with an empty body**. Never a payload: a beacon response nobody reads is bytes spent on nothing. `Cache-Control: no-store` |
| anything else | `405 { error: "method_not_allowed" }` |

### 6.1 Validation, in order, each failing loudly

| Check | Failure |
|---|---|
| `req.rawBody.length > 8192` | `413 { error: "payload_too_large" }` |
| `JSON.parse` throws | `400 { error: "body_invalid" }` |
| `body.v !== 1` | `400 { error: "schema_unsupported" }` |
| `typeof body.view !== 'string'` or `!/^[0-9a-f-]{36}$/.test(body.view)` | `400 { error: "view_invalid" }` |
| `!Number.isInteger(body.seq)` or `body.seq < 0` or `body.seq > 32` | `400 { error: "seq_invalid" }` |
| `!Array.isArray(body.events)` or `length === 0` or `length > 60` | `400 { error: "events_invalid" }` |
| any event fails `validateEvent` | `400 { error: "event_invalid", at: <index> }` — **the whole batch is refused** |

`validateEvent` is a hand-written switch over the nine `t` values with an exact allowed-key set per type and an
exact value domain per key (`pct ∈ {25,50,75,95}`, `index ∈ 0..5`, `section ∈` the six ids, `path ∈` the six
`ConversionPathId`s, `dwellMs` an integer in `0 … 3_600_000`). **An unknown key anywhere in an event refuses the
batch.** This is what makes the never-collected list enforceable at the boundary rather than trusted: a modified
client that adds `userAgent` to an event gets a `400`, not a silent write.

The switch is generated by nothing and duplicated from nothing; TM-30 asserts the collector's accepted key set
equals the TypeScript union's key set by reading both files, so the two cannot drift.

### 6.2 What the collector must never do — testable by reading it

- never read `req.ip`, `req.ips`, `req.headers['x-forwarded-for']`, `req.headers['x-real-ip']`,
  `req.headers['user-agent']`, `req.headers['accept-language']`, `req.headers.referer`, or `req.headers.cookie`;
- never call `res.set('Set-Cookie', …)`;
- never write a field to Firestore other than the ones named in §7;
- never persist `body.view` beyond the raw-event TTL (§8);
- exactly one `logger.error` call, on a Firestore failure, with `{ code }` only — no request data, no body, no
  view id.

*Enforced by* TM-31: read `functions/telemetry.js` as text; assert zero occurrences of each of the eleven strings
above. The same list is `NEVER_COLLECTED`'s machine half.

### 6.3 Cost and abuse

There is no identifier, so there is no per-identity rate limit, and this spec does not pretend otherwise — the
same honest trade `SPEC-closing-section.md` §3.4 records for the caliper endpoint. Cost is bounded structurally:
`maxInstances: 3`; `timeoutSeconds: 10`; 8 KB body cap; ≤ 60 events per batch; ≤ 33 batches per view (`seq` cap);
one `set` and one `update` per batch regardless of event count (§7.1). An attacker can inflate counters. They
cannot create documents outside two collections, cannot store text, and cannot cost more than three concurrent
256 MiB instances. **The aggregate's own honesty rule (§9.2) is what makes counter inflation harmless: a figure
below the evidence threshold is reported as `insufficient-evidence`, never as a result.**

---

## 7 · Firestore

Database `(default)`, Native mode, `us-central1` — **the same database `SPEC-closing-section.md` §3.2
provisions**. `firestore.rules` is that spec's rules file, unchanged: `allow read, write: if false` for every
path. The client SDK is not used anywhere on this site and must never be able to reach this data; only the Admin
SDK inside the functions does.

```
telemetry_events/{autoId}   { v, view, seq, events, at }         raw batch, TTL 30 days
telemetry_daily/{YYYY-MM-DD}                                      aggregate, no identifier, kept forever
telemetry_review/{YYYY-Www}                                       weekly verdict, kept forever
```

### 7.1 `telemetry_events/{autoId}`

One document per batch, written with `.set()`:

```js
{ v: 1, view: "<uuid>", seq: 0, events: [ …the validated array… ], at: FieldValue.serverTimestamp() }
```

`view` exists here and only here, for exactly one purpose: so the daily aggregate can be **recomputed** from raw
if the increment path is ever found wrong, without which a bug in aggregation would be unrecoverable. It is
deleted with the document at 30 days (§8).

### 7.2 `telemetry_daily/{YYYY-MM-DD}`

One `.set(…, { merge: true })` per batch with `FieldValue.increment` counters. The date is derived from the
**server's** clock (`new Date().toISOString().slice(0,10)`), never from the payload.

```js
{
  views: 0,                                  // incremented only by a batch containing view_start
  viewport: { xs: 0, sm: 0, md: 0, lg: 0 },
  reducedMotion: 0,
  gl: { on: 0, off: 0 },
  dwellMs:   { hero: 0, about: 0, experience: 0, skills: 0, vitrine: 0, contact: 0 },
  dwellN:    { hero: 0, … },                 // qualified sections, for a mean; the median comes from raw
  depth:     { p25: 0, p50: 0, p75: 0, p95: 0 },
  dropOff:   { hero: 0, … },
  carousel:  { i0: 0, i1: 0, i2: 0, i3: 0, i4: 0, i5: 0 },
  explainer: { p0: 0, p25: 0, p50: 0, p75: 0, p100: 0 },
  chatSessions: 0,
  chatTopics: { "<topicId>": 0 },            // written by recordChatTopic only (§7.3)
  chatTurns: 0,
  conversions: { "contact-canonical": 0, … },
  capReached: 0,
  batches: 0,
}
```

Every counter is a non-negative integer. **No field in this document can identify anyone**, which is why it has
no TTL and why it is the only telemetry the aggregation function reads.

### 7.3 Chat topics — derived on the server, never sent by the browser

The visitor's question never leaves the browser as telemetry. It already leaves as a chat completion — that is a
separate fact the sentence in Part 2 states plainly — but it is never *stored*, and it is never joined to a view.

`minivicChat` (`functions/index.js:111-185`) gains one call after a successful completion:

```js
await recordChatTopic(messages[messages.length - 1]?.content ?? "");
```

`recordChatTopic(text)` in `functions/telemetry.js`:

1. lowercase, strip non-`[a-z0-9 ]`, split on whitespace → a token `Set`;
2. for each entry of `functions/kb-topics.json`, count tokens present in `keywords`; the topic with the highest
   count ≥ 2 wins; ties break by the lower `topicId` lexicographically;
3. no winner → `topicId = 'unmatched'`;
4. `telemetry_daily/{today}` `.set({ chatTopics: { [topicId]: increment(1) }, chatTurns: increment(1) },
   { merge: true })`.

**`text` is never written anywhere.** It exists as a local string inside one function invocation. TM-32 asserts
`recordChatTopic` contains no `set`/`add`/`update` call whose payload references the parameter.

`functions/kb-topics.json` is generated by `scripts/build/kb_topics.mjs` from `app/data/miniVicKnowledge.ts`, so
the taxonomy is the knowledge base's own and cannot drift from it. The script **fails the build** if any topic
has fewer than two keywords (a one-keyword topic would match noise) or if two topics share a keyword set.

---

## 8 · Retention

```js
exports.purgeTelemetry = onSchedule(
  { schedule: "17 3 * * *", timeZone: "Etc/UTC", region: "us-central1", memory: "256MiB", timeoutSeconds: 300 },
  async () => { /* … */ },
);
```

Deletes every `telemetry_events` document with `at < Timestamp.fromMillis(Date.now() - 30*24*3600*1000)`, in
`writeBatch`es of 400, looping until a query page returns fewer than 400. Logs one `logger.info` with
`{ deleted: <n> }` — a count, never a document.

| Data | Retention | Why that number |
|---|---|---|
| `telemetry_events` (carries `view`) | **30 days**, deleted by the scheduled job | Long enough to recompute an aggregate after a bug; short enough that the grouping key has no archival life. |
| `telemetry_daily` (no identifier) | indefinite | It is a count of events, not of people. Deleting it would destroy the only long baseline R-88's loop can compare against. |
| `telemetry_review` | indefinite | The record of what the loop decided and when. |
| Firebase Hosting / Cloud Functions platform request logs | Google's default, not authored by this site | Stated in the sentence (§15.2) rather than pretended away. |

The 03:17 UTC minute is deliberate: an on-the-hour schedule collides with every other project's cron on the same
region.

---

## 9 · Aggregation, and R-88's auto-reopen loop

> **R-88 · Telemetry feeds the loop.** Under-performing sections auto-reopen.

"Auto-reopen" is implemented as **a real issue on the real repository**, opened by a scheduled function, carrying
the numbers and the commands to reproduce them. Not a dashboard, not a Slack message, not a TODO.

```js
exports.aggregateTelemetry = onSchedule(
  { schedule: "0 4 * * 1", timeZone: "Etc/UTC", region: "us-central1",
    secrets: [GH_ISSUE_TOKEN], memory: "256MiB", timeoutSeconds: 300 },
  async () => { /* … */ },
);
```

### 9.1 The window and the inputs

Reads the last **28** `telemetry_daily` documents (missing days are absent, not zero — a day with no document
contributes nothing to either numerator or denominator). Reads `app/data/generated/read-time.ts`' contents from a
committed copy at `functions/read-time.json` (written by the same build script) for the per-section read time.

`readTimeMs = round(words / 240 * 60_000)` — 240 wpm, the median adult silent-reading rate for expository prose,
recorded here so the threshold is a stated assumption rather than a magic number. `words` is counted at build
time over the section's rendered authored copy, headings included, code and mono provenance strings excluded.

### 9.2 The verdict, per section

Let `V` = `views` over the window, `Dₛ` = `dropOff[s] / V`, `dwellₛ` = `dwellMs[s] / dwellN[s]`,
`Iₛ` = interaction rate where the section owns an R-97 interactive (vitrine: `carousel[i≥1] / V`;
contact: `conversions / V`), else `null`.

```
if (V < 100)                                        → 'insufficient-evidence'
else if (D_s >= 0.20)                               → 'under-performing' (reason: 'drop-off')
else if (dwell_s < 0.40 * readTimeMs_s)             → 'under-performing' (reason: 'unread')
else if (I_s !== null && I_s < 0.10)                → 'under-performing' (reason: 'untouched')
else                                                → 'holding'
```

**`insufficient-evidence` is not `holding`.** This is the caliper's `open` state applied to the loop itself: a
section with 40 views has not been shown to be fine, it has been shown to be unmeasured, and the review says so.
A system whose whole argument is that it refuses to grade a claim above its evidence cannot make an exception for
its own instrumentation. The 100-view floor is stated in the review body every time it is applied.

The three thresholds — `0.20`, `0.40`, `0.10` — are recorded in `functions/telemetry.js` as a single exported
`THRESHOLDS` object with a comment naming this section, so changing one is a visible diff and not a tweak.

### 9.3 The output

1. `telemetry_review/{YYYY-Www}` — `{ window: {from, to}, views, sections: { [s]: { verdict, reason, dropOff,
   dwellMs, readTimeMs, interactionRate } }, thresholds, computedAt }`.
2. For each section whose verdict is `under-performing` **and** which has no open issue with the same title, one
   `POST /repos/Victordtesla24/forgotten-mistory/issues` with `Authorization: Bearer ${GH_ISSUE_TOKEN.value()}`:

```
title: telemetry: #skills under-performing (28d to 2026-09-29)

  28 days to 2026-09-29 · 412 views · threshold floor 100 views.

  | figure | value | threshold |
  |---|---|---|
  | drop-off share | 0.24 | >= 0.20 |
  | median dwell   | 9.1 s | < 0.40 x read time (31.5 s) |
  | interaction rate | 0.31 | >= 0.10 |

  Verdict: under-performing (drop-off).

  Reproduce:
    gcloud firestore documents list telemetry_daily --project forgotten-mistory
    node scripts/telemetry/replay.mjs --from 2026-09-02 --to 2026-09-29 --section skills

  Thresholds and their rationale: docs/delivery/evidence/v6-20260903T195241Z/SPEC-telemetry-and-data.md §9.2
  This issue was opened by aggregateTelemetry. It is a prompt to look, not a defect report.
```

labels: `["auto-reopen", "telemetry"]`. The de-duplication query is
`GET /search/issues?q=repo:…+state:open+in:title+"telemetry: #skills"` — one open issue per section at a time.

`GH_ISSUE_TOKEN` is a fine-grained PAT scoped to this one repository with `Issues: write` and nothing else, held
in Secret Manager as `GH_ISSUE_TOKEN`. If the secret is unset the function writes the review document, logs
`logger.warn({ code: 'issue_token_absent' })`, and **does not fail** — the record survives even when the loop's
last mile does not.

### 9.4 `scripts/telemetry/replay.mjs`

Recomputes a window's verdict from `telemetry_events` (not from the daily aggregate) using the same
`THRESHOLDS` object, and prints the same table. It exists so §9.2's arithmetic can be checked by hand against raw
data inside the 30-day window — the audit path for the audit machinery.

---

## 10 · Privacy signals

`lib/telemetry/consent.ts`:

```ts
/** No consent wall (R-87). What we honour instead is the signal the browser already sends. */
export function isMeasurable(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string };
  if (n.globalPrivacyControl === true) return false;
  if (n.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1') return false;
  if (typeof crypto?.randomUUID !== 'function') return false;   // no id source → no batching key → don't start
  return true;
}
```

When it returns `false`, `runtime.start()` returns a no-op immediately: **no observers, no sentinels, no listeners
and no network**. There is no partial mode and no "anonymous" fallback that measures anyway.

**There is no consent banner, no cookie dialog, and no dismissible notice** — R-87 forbids a consent wall, and
there is nothing to consent to: no cookie, no storage, no identifier that survives the tab. The disclosure is
authored copy in the footer, always visible, never behind an interaction (§15).

---

## 11 · Performance envelope (R-100)

| Budget | Value | How it is measured |
|---|---|---|
| Added transfer | **≤ 4.4 KB** gzipped total: `runtime` chunk ≤ 4.0 KB, `TelemetryBoot` ≤ 0.4 KB | `TC-TELEMETRY-03` reads `.next/` build output and fails above it |
| LCP contribution | **0 ms** | The runtime is imported from an idle callback with a 2,000 ms timeout; TM-10 asserts the chunk's `PerformanceResourceTiming.startTime` is greater than the `largest-contentful-paint` entry's `startTime` |
| CLS contribution | **0.000** | It renders `null`; the four sentinels are `position: absolute; width: 1px; height: 1px; contain: strict` and are appended to `body`, outside every layout container. TM-11 asserts the page's CLS is unchanged to three decimals with telemetry on versus a build with `TelemetryBoot` removed |
| Init cost | **≤ 3 ms** main thread | `performance.measure('fm:telemetry:init')`, asserted in TM-12 |
| Per-event cost | **≤ 0.05 ms** | the `timeupdate` path is the hot one; asserted over 200 synthetic ticks |
| Per-flush cost | **≤ 1.5 ms** | JSON.stringify of ≤ 20 events + one `sendBeacon` |
| Steady-state heap | **≤ 64 KB** | 60 events × ~200 B + six observer records + four sentinel nodes. TM-14 takes two heap snapshots 30 s apart under continuous scrolling and asserts growth < 32 KB |
| Long tasks added | **0** | asserted via `PerformanceObserver({ entryTypes: ['longtask'] })` in TM-12 |
| 60 fps with everything active | unchanged from baseline | the runtime has no rAF loop, no scroll handler and no per-frame work at all — its per-frame cost is structurally zero |

**Full disposal.** The teardown returned by `start()` disconnects four `IntersectionObserver`s and one
`ResizeObserver`, removes the four sentinel nodes, removes three document listeners and one window listener,
clears one timer, flushes once and sets `dead = true`. TM-14 mounts and unmounts the boot component 20 times and
asserts observer count and node count return to baseline.

**The low-power path.** Nothing is disabled under `prefers-reduced-motion` — there is no motion to reduce — but
`reducedMotion` is recorded so the reduced-motion composition can be judged on its own dwell rather than pooled
with the animated one. That is the impressive low-power path here: the site can find out whether its
reduced-motion score is actually working, instead of assuming.

---

## 12 · Accessibility (R-101)

Telemetry adds nothing to the accessibility tree and must not:

- the four sentinels carry `aria-hidden="true"`, are 1×1 px, `pointer-events: none`, not focusable, and contain
  no text — TM-04 asserts the axe tree is byte-identical with and without telemetry;
- keyboard traversal is untouched: zero focusable nodes added, zero focus handlers, zero `tabindex`;
- the delegated click listener is `capture: true, passive: true` and never calls `preventDefault` or
  `stopPropagation`, so no affordance's behaviour changes — TM-05 tabs to the canonical contact route, presses
  Enter, and asserts both the navigation and the `conversion` event occur;
- **the insight-equivalent text alternative for this feature is the disclosure itself** (§15.2). The thing a
  screen-reader user needs to know about telemetry is what it records; that text is in the footer, in the
  document, in reading order, not in a tooltip and not behind a toggle.

---

## 13 · Tests — every one can fail

### 13.1 Static audit checks (`scripts/validate/overhaul_static_audit.mjs`)

| id | Check | Fails when |
|---|---|---|
| `TC-TELEMETRY-01` | No React store anywhere | `useSyncExternalStore` appears anywhere under `app components lib`, **or** any file under `lib/telemetry/` imports `react` |
| `TC-TELEMETRY-02` | The never-collected list is enforced, not asserted | any of `x-forwarded-for`, `x-real-ip`, `req.ip`, `user-agent`, `accept-language`, `referer`, `document.cookie`, `localStorage`, `sessionStorage`, `navigator.language`, `navigator.userAgent`, `navigator.connection`, `screen.`, `Intl.DateTimeFormat`, `Set-Cookie` appears under `lib/telemetry/` or in `functions/telemetry.js` |
| `TC-TELEMETRY-03` | Bundle budget | runtime chunk > 4.0 KB gz or boot chunk > 0.4 KB gz |
| `TC-TELEMETRY-04` | Vocabulary closure | `Object.keys(EVENT_COPY)` ≠ the `TelemetryEventType` union members, parsed from the same file |

### 13.2 Unit (`node --test`)

| id | Asserts |
|---|---|
| TM-20 | `TelemetryBoot.tsx` contains exactly one `useEffect` and zero of `useState`/`useMemo`/`useLayoutEffect`/`useSyncExternalStore` |
| TM-21 | If `lib/telemetry/snapshot.ts` exists: 1,000 `getSnapshot()` calls are all `Object.is`-identical and equal to `getServerSnapshot()` — the direct regression guard for the July defect |
| TM-22 | `bucket()` boundaries: 479→xs, 480→sm, 899→sm, 900→md, 1279→md, 1280→lg |
| TM-23 | `send()` drops a batch above 8,192 bytes and never truncates it |
| TM-24 | `isMeasurable()` returns false for GPC true, DNT '1', and absent `crypto.randomUUID` |
| TM-25 | `NEVER_COLLECTED` has ≥ 8 entries and every entry appears verbatim in the generated sentence (§16) |
| TM-26 | `EVENT_COPY` phrases are lowercase, start with a lowercase letter, and contain no full stop — so the generated sentence is grammatical |
| TM-30 | The collector's accepted key set, parsed from `functions/telemetry.js`, equals the union's key set parsed from `lib/telemetry/events.ts` |
| TM-31 | `functions/telemetry.js` contains none of the eleven forbidden request reads (§6.2) |
| TM-32 | `recordChatTopic`'s parameter never appears inside a Firestore write payload |
| TM-33 | A batch with an unknown event key is refused `400`; a valid batch is accepted `204` |
| TM-34 | `seq > 32`, `events.length > 60`, `v !== 1`, malformed `view` each produce their named 4xx |
| TM-35 | `GET`, `PUT`, `DELETE` → `405` |
| TM-36 | On a Firestore throw: exactly one `logger.error`, its argument has exactly one key `code` |
| TM-37 | `aggregateTelemetry` with `views: 99` returns `insufficient-evidence` for every section and opens zero issues |
| TM-38 | `aggregateTelemetry` with `views: 100` and `dropOff.skills = 20` opens exactly one issue, titled as §9.3 |

### 13.3 Playwright (`tests/overhaul/telemetry-runtime.spec.ts`, plus two in the existing stability file)

| id | Asserts |
|---|---|
| TM-01 | A full scroll produces exactly one `POST /api/telemetry` per flush trigger and no other new host appears in the network log |
| TM-02 | The batch body parses, `v === 1`, and every event's `t` is in the union |
| TM-03 | After the visit: exactly six `section_dwell` events maximum, one `carousel_depth`, at most one `drop_off`, and depth events strictly increasing |
| TM-04 | axe tree identical with telemetry on and off; zero new violations |
| TM-05 | Keyboard-activating the canonical contact route emits `conversion: contact-canonical` and still navigates |
| TM-06 | `document.cookie` is empty, `localStorage.length === 0`, `sessionStorage.length === 0` after a full visit (the closing section's own one-vote key is the single permitted exception and is asserted by name) |
| TM-07 | No request carries a `Cookie` header; no response carries `Set-Cookie` |
| TM-08 | With GPC emulated true: **zero** requests to `/api/telemetry`, zero sentinels in the DOM |
| TM-09 | A 61st event produces one `cap_reached` and then silence |
| TM-10 | The runtime chunk's `startTime` > the LCP entry's `startTime` |
| TM-11 | CLS unchanged to three decimals versus a build without `TelemetryBoot` |
| TM-12 | `fm:telemetry:init` ≤ 3 ms; zero `longtask` entries attributable to the runtime |
| TM-13 | With a forced throw in the flush path, the page still renders six sections and raises zero `pageerror` |
| TM-14 | 20 mount/unmount cycles return observer and node counts to baseline; heap growth over 30 s of scrolling < 32 KB |
| **TS-07** *(added to `telemetry-stability.spec.ts`)* | The full-scroll drive of TS-05, repeated with telemetry active, still produces zero fatal React errors — the July signature list is reused verbatim |
| **TS-08** *(added to `telemetry-stability.spec.ts`)* | 200 rapid `visibilitychange` toggles produce zero `pageerror`, zero `Maximum update depth`, and a bounded number of flushes (≤ 200) |

TS-07 and TS-08 are appended; the file's six existing cases and its header comment are **not** edited. The comment
is the institutional memory of the outage and is itself a preserved artefact.

---
---

# PART 2 — THE SELF-CLAIM (R-183, T-40, SC-94.1, SC-01a, SC-02, SC-30)

> **R-183.** *"The site must never carry a statement about itself that its own code contradicts."*

## 14 · What the site says today, and its exact status

`T40-self-claim-register.md` establishes the baseline with a live network trace: **0 third-party hosts, 0
third-party requests, 22/22 to `forgotten-mistory.web.app`**, zero cookies, zero storage keys.

| # | Statement | Where | Status **today** |
|---|---|---|---|
| S-1 | *"…no analytics, no trackers, no cookies"* | `app/data/portfolio/listen.ts:47` (colophon) | **TRUE** |
| S-2 | *"The page you are reading: static export, one WebGL context per section, no analytics."* | `app/data/portfolio/vitrine.ts:92` (plate 06 description) | **TRUE** |
| S-3 | Three MiniVic answers describing the deployment as having no server | `app/data/miniVicKnowledge.ts` | **FALSE already** (SC-23) — two Cloud Functions ship |
| S-4 | *"38 public repositories · metrics harvested 2026-09-03 from the GitHub API, not live"* | `Vitrine.tsx:201-202` | **TRUE** today, false the moment Part 3 lands |
| S-5 | *"Every figure on it is quoted from a CV or a repository — none is computed live."* | `vitrine.ts:93` (plate 06 limits) | **TRUE** today, false the moment Part 3 lands |

**S-1 and S-2 are true, and they are protected by R-170/R-171.** They must not be weakened on their own, and they
must not survive a single deploy past the one that ships Part 1. The moment `TelemetryBoot` is mounted, S-1 and
S-2 become the most damaging sentences on the site — the exact failure mode R-183 says *"would destroy the
credibility the Preservation Register exists to protect."*

**Binding rule: Part 1 and Part 2 are one commit.** A CI check enforces it (§17.3).

## 15 · The exact replacements

### 15.0 · Supersession of `SPEC-closing-section.md` §8.3

That spec drafted a colophon on the assumption that the caliper counter would be the site's only measurement,
and it keeps *"no analytics, no trackers, no cookies"*. **Once Part 1 ships, that draft is false**, and this
section replaces it. Everything else in §8.3 survives: the caliper's one-vote-per-browser note, the
indicative-not-a-poll sentence, and the acknowledgement of Google's request logs are all correct and are folded
in below. Whichever spec's commit lands second carries the version below.

### 15.1 The colophon — `app/data/portfolio/listen.ts`

One line, replacing `colophon` verbatim:

```
© 2026 Vikram Deshpande · Melbourne · static export · at most one WebGL context per section ·
first-party measurement, no cookies, no trackers, no identifier that outlives the tab — what it
records, and what it never touches, is written out below.
```

The WebGL clause is deliberately the shorter *"at most one WebGL context per section"*, **dropping "and none on a
phone"** — `T40-self-claim-register.md` §1 proves that clause is contradicted by `Scene.tsx` (a canvas mounts at
390 px and at 393 px), and SC-01c's own remediation (b) is exactly this deletion. This spec takes remediation (b)
because a phone gate is a rendering decision that belongs to the Front Door swarm, not to a telemetry commit, and
a sentence must never wait on someone else's refactor to become true.

### 15.2 The measurement note — new export, rendered in the footer

`app/data/portfolio/listen.ts` gains:

```ts
import { EVENT_COPY, NEVER_COLLECTED } from '@/lib/telemetry/events';

/**
 * The disclosure. It is GENERATED from the event vocabulary, not typed, so a
 * new event type cannot ship undescribed and a described event cannot vanish
 * from the code without vanishing from the page. See SPEC §16.
 */
export const measurement = {
  heading: 'What this page measures',
  records: buildRecordsSentence(EVENT_COPY),
  never:   buildNeverSentence(NEVER_COLLECTED),
  retention:
    'The raw records are kept for thirty days and then deleted; what survives is a daily count of '
    + 'events with nothing in it that could be a person. I read it to find out which sections are '
    + 'not doing their job.',
  signals:
    'Send Global Privacy Control or Do Not Track and this page measures nothing at all — no '
    + 'observers, no beacon, no request.',
  outside:
    'Two things here are not mine to promise. Google’s hosting layer keeps its own request '
    + 'logs, as every host does; nothing on this page joins them to you, and I do not read them. '
    + 'And if you ask MiniVic a question, that question goes to OpenRouter, which is not me — I '
    + 'never store it, but I cannot claim it stayed on this page.',
} as const;
```

Rendered as it stands — the four sentences run to a full paragraph, and the two lines below reproduce exactly
what the generator emits for the vocabulary in §3:

> **What this page measures.** It records that a page was opened, at one of four screen widths; how long each of
> the six sections was on your screen; how far down the page you got; which section you were in when you stopped;
> how deep into the vitrine rail you went; whether the explainer was played, and how much of it you watched; that
> a conversation was opened; which of the six paths to a conversation you took; and that a visit hit the
> sixty-event ceiling and stopped recording.
>
> **It never collects** your IP address, your user agent, your language or timezone, your screen size, the page
> you came from, a cookie, or anything stored on your device, a fingerprint, or any identifier that survives the
> tab closing, or one word of anything you typed.

Placement, per `SPEC-closing-section.md` §6.1: inside `components/site/Footer.tsx`, after the build bracket and
its provenance line, before the colophon. `--fs-micro`, `--mist-400`, `--measure-read`, body face (not mono — it
is prose, and D-02 reserves mono for provenance). **Always visible.** No `<details>`, no toggle, no modal: a
disclosure the reader has to open is a consent wall with better manners, and R-87 forbids one.

It carries `data-measurement-note` and `id="measurement"`. The colophon's final phrase *"is written out below"*
is a plain in-page reference, not a link — the note is fifteen lines further down the same footer.

### 15.3 Plate 06 — `app/data/portfolio/vitrine.ts`

`description` (the `Plate` contract caps it at fourteen words; this is fourteen):

```
'The page you are reading: static export, one WebGL context per section, first-party measurement.'
```

`limits` — changed by Part 3, not by Part 2; see §22.2. Until Part 3 lands, the current line stays, because it is
still true: telemetry measures the *visit*, not the *figures*, and no figure on the page became live.

### 15.4 MiniVic — `app/data/miniVicKnowledge.ts`

One new topic, `telemetry-and-privacy`, whose answer is **`measurement`'s five strings joined**, imported rather
than retyped:

```ts
import { measurement } from '@/app/data/portfolio/listen';
// …
answer: [measurement.records, measurement.never, measurement.retention, measurement.signals,
         measurement.outside].join(' ')
```

The bot therefore cannot contradict the footer, because it is reading the footer. Keywords:
`['analytics','telemetry','tracking','privacy','cookies','measure','data','collect']`.

The three existing "no server" answers (SC-23) and the two stale comments at `MiniVicBot.tsx:832` and `:1061` are
`T40-self-claim-register.md`'s row 4 and are **not** owned by this spec; they must ship in or before this commit,
because `measurement.outside` asserts a third-party flow that those answers currently deny.

---

## 16 · The mechanism that makes drift impossible

Three generators, all pure, all unit-tested. This is the part that turns R-183 from a promise into a property.

```ts
// app/data/portfolio/listen.ts (or a colocated helper)
export function buildRecordsSentence(copy: Record<string, string>): string {
  const parts = Object.values(copy);                       // declaration order = reading order
  const last = parts[parts.length - 1];
  return `It records ${parts.slice(0, -1).join('; ')}; and ${last}.`;
}

export function buildNeverSentence(never: readonly string[]): string {
  const last = never[never.length - 1];
  return `It never collects ${never.slice(0, -1).join(', ')}, or ${last}.`;
}
```

The chain that cannot be broken silently:

```
TelemetryEventType  ──tsc──▶  EVENT_COPY (Record<TelemetryEventType, string>)
        │                            │
        │                     buildRecordsSentence
        ▼                            ▼
  runtime.ts emits            measurement.records ──▶ the footer ──▶ MiniVic's answer
        │                            ▲
   collector validates ──────────────┘  (TM-30: the two key sets are equal)
```

- add an event type → `EVENT_COPY` is missing a key → **`tsc --noEmit` fails** (the `quality` job's first step);
- describe an event you did not build → `TC-TELEMETRY-04` fails;
- change what the runtime sends without changing the union → **TM-30 fails** (collector key set ≠ union key set);
- change the sentence by hand → there is nothing to change by hand; the string is computed at module load.

`NEVER_COLLECTED` gets the same treatment from the other side: `TC-TELEMETRY-02` greps the runtime and the
collector for the machine name of every entry, so the promise and the code are checked against each other by the
build rather than by a reader's goodwill.

---

## 17 · Tests for Part 2 (T-40)

`tests/overhaul/self-claim.spec.ts` — new file, and the one `T40-self-claim-register.md` says *"runs last before
every certification, because it is the failure mode that would cost the most."*

| id | Asserts |
|---|---|
| SC-01 | The rendered footer's `[data-measurement-note]` text equals `measurement.records + ' ' + …` computed in the test from the imported constants — **the page and the code are compared, not two strings** |
| SC-02 | `grep` of the rendered DOM for `no analytics` returns zero hits anywhere on the page |
| SC-03 | Every phrase in `EVENT_COPY` appears verbatim in the rendered footer |
| SC-04 | Every entry of `NEVER_COLLECTED` appears verbatim in the rendered footer |
| SC-05 | A full visit's network log contains exactly the hosts `forgotten-mistory.web.app` and nothing else; the `/api/telemetry` request is same-origin |
| SC-06 | The MiniVic answer for `telemetry-and-privacy` contains all five `measurement` strings |
| SC-07 | Plate 06's description is ≤ 14 words and does not contain `analytics` |
| SC-08 | The colophon contains neither `no analytics` nor `and none on a phone` |
| SC-09 | Under GPC: the footer text is **unchanged** (the disclosure describes the system, not this visit) and zero beacons fire |

### 17.3 The same-commit gate

`scripts/validate/self_claim_commit_gate.mjs`, run in the `quality` job:

```
if (git diff --name-only origin/main...HEAD contains components/site/TelemetryBoot.tsx
                                          or lib/telemetry/**)
   and NOT (the same diff contains app/data/portfolio/listen.ts)
then exit 1 with:
   "Telemetry changed without the self-claim. R-183 admits no other shape.
    Change lib/telemetry/events.ts EVENT_COPY / NEVER_COLLECTED, or say why in the commit body."
```

It is a gate that can fail, and it fails on exactly the mistake a hurried author makes.

---
---

# PART 3 — DEPLOY-TIME DATA REFRESH (R-108, R-182, SC-04b)

## 18 · What this part adds to `dataset-layer-design.md`

That document owns the type system (§1), the five modules (§2), the orchestrator `build_dataset.mjs` (§3.3), the
retain/merge semantics (§3.3 step 3), the failure table (§3.4), CI wiring (§3.5) and diffability (§4). **None of
it is restated or forked here.** This part supplies the four things it left open, each of which is a place a
careless implementation would fabricate:

1. the **exact** GitHub calls, auth ladder, timeouts and retry policy (§19);
2. the **exact** YouTube adapter for a host with **no API key**, and what changes if one appears (§20);
3. the **exact** behaviour when an API is unreachable — the line between *stale-but-true* and *fabricated* (§21);
4. the **exact** currency copy, generated from the manifest, and the removal of the hand-run harvester (§22–§23).

**The defect, restated from evidence.** `scripts/build/harvest_repos.mjs:3` says *"Run by hand, not by the
build"*, and `AUDIT-RECONCILIATION.md` B-3 confirms it appears in **neither** a build script nor CI. The
consequence measured this run: five of six plates are accurate and the sixth — `forgotten-mistory` itself — is
**stale within its own date stamp** (page 205 commits, API 238 commits, same day). A date is too coarse a unit for
a page that redeploys several times a day. That is the whole of R-182 in one row.

## 19 · The GitHub adapter — `scripts/dataset/sources/repositories.mjs`

### 19.1 The auth ladder, in order, first success wins

| # | Transport | Precondition | `RefreshRecord.command` prints |
|---|---|---|---|
| 1 | `gh api <route>` | `gh auth status` exits 0 | `gh api repos/Victordtesla24/{repo}` |
| 2 | `fetch` + `Authorization: Bearer $GITHUB_TOKEN` | env var non-empty | `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/…` |
| 3 | `fetch` + `Authorization: Bearer $GH_TOKEN` | env var non-empty | …`$GH_TOKEN` |
| 4 | unauthenticated `fetch` | always available | `curl https://api.github.com/…` |

**A token value is never written to any file, any log line, or any provenance string.** The variable *name* is
printed; the value is not. `lib/http.mjs` scrubs any string matching `/gh[pousr]_[A-Za-z0-9]{20,}/`, `/sk-[A-Za-z0-9]{20,}/`
or `/AIza[0-9A-Za-z_-]{20,}/` from every recorded `detail`, and `build_dataset.mjs` re-scans the whole written
output for those three patterns and **exits 1** if one survives (`dataset-layer-design.md` §3.4's last row).

Transport 4 exists so a fresh clone with no credentials still gets *something* true rather than nothing: the
unauthenticated limit is 60 requests/hour/IP, enough for the six repositories on a cold build, and its
`Provenance.method` records that it was unauthenticated.

### 19.2 The routes, one `Provenance.method` per field group

| Fields | Route |
|---|---|
| `publicRepoCount`, owner totals | `GET /users/Victordtesla24` → `.public_repos`; corroborated by `GET /user/repos?per_page=100&affiliation=owner&sort=full_name` (paginated) when authenticated |
| `pushedAt`, `createdAt`, `sizeKb`, `primaryLanguage`, `openIssues`, `homepage`, `defaultBranch` | `GET /repos/Victordtesla24/{repo}` |
| `languageBreakdown` | `GET /repos/Victordtesla24/{repo}/languages` |
| `commitCount` | `GET /repos/Victordtesla24/{repo}/commits?per_page=1`, read from the `Link: …rel="last"` page number — the same technique `harvest_repos.mjs:44-58` already uses and the only cheap exact count GitHub offers |
| `ci` — `{ workflowName, conclusion, runId, runUrl, headSha, runStartedAt }` | `GET /repos/{owner}/{repo}/actions/workflows` then `GET /repos/{owner}/{repo}/actions/runs?branch=main&per_page=1` per workflow |

The `ci` group is new relative to `harvest_repos.mjs` and it is what makes **§29's flagship *Limits* test possible**
— the sentence about the flagship's pipeline is checked against the pipeline.

**Scope:** the six vitrine repositories plus the owner totals. The 41-repository sweep stays in
`corpus-repositories.json` as evidence; the shipped dataset carries only what the site renders plus the counts it
cites. Shipping more would be data the page cannot account for.

### 19.3 Timeouts, retries, and the module budget

| Setting | Value |
|---|---|
| Per-request timeout | **8,000 ms** (`AbortController`) |
| Retries per request | **2** (three attempts total) |
| Backoff | 400 ms, then 1,200 ms, each with ±20 % jitter |
| Retry on | network error, `408`, `429`, `500`, `502`, `503`, `504` |
| **Never retry on** | `401`, `403`, `404`, `422` — a permission or a missing resource is an answer, and retrying it burns rate limit to learn nothing |
| `429` special case | honour `Retry-After` when ≤ 20 s, else treat as a hard failure for this run |
| Module budget | **45 s** total (`dataset-layer-design.md` §3.3 step 2), enforced by the orchestrator's `AbortController`; a module that hits it returns `outcome: 'partial'` or `'retained'` with `failure.detail: 'module timeout at 45000ms'` |

Requests within the module run with a concurrency of **4** — six repositories × four routes is 24 calls; at
concurrency 4 that is well inside both the 45 s budget and the 5,000/hour authenticated limit.

## 20 · The YouTube adapter — `scripts/dataset/sources/channel.mjs`

**Verified fact, this run:** `grep -c -ai 'YOUTUBE' /root/.claude/.env.production` → `0`. **There is no YouTube
API key on this host.** The design must therefore work without one and must get *better*, not different, if one
appears.

### 20.1 Transport A — the Data API, preferred, used only if a key exists

Gate: `process.env.YOUTUBE_API_KEY` non-empty.

| Fields | Route |
|---|---|
| channel identity, `joinedAt`, `country` | `GET /youtube/v3/channels?part=snippet,contentDetails&id=UCJSYpoFkGKKzYTKzAr8vGzQ&key=…` |
| the uploads list | `GET /youtube/v3/playlistItems?part=contentDetails&playlistId={uploads}&maxResults=50` (paginated) |
| per video | `GET /youtube/v3/videos?part=snippet,contentDetails,status&id={comma-joined ≤50}` |

`Provenance.source` becomes a **new** `SourceSystem` member `'youtube-api'` — added to the union in
`app/data/canonical/provenance.ts`, which is a reviewable code change exactly as that file's comment requires
(*"Adding one is a contract change"*). `provenance.url` is the public watch or channel URL, never the API URL
with the key in it.

**R-119 is enforced by the schema, not by discipline.** `ChannelData` declares no `subscriberCount`,
`viewCount`, `likeCount` or `watchTime` field, so even though `part=statistics` would return them, there is
nowhere in the type for a vanity metric to land. The adapter does not request `part=statistics`.

### 20.2 Transport B — the method of record, used today

Exactly the path that produced `corpus-youtube.json` this run:

1. `${YTDLP_BIN} --flat-playlist --dump-single-json https://www.youtube.com/@vicd0ct/videos`, and the same for
   `/podcasts` and `/playlists`. `YTDLP_BIN` resolves to a **pinned standalone binary**; the system
   `/usr/local/bin/yt-dlp` is broken (`ModuleNotFoundError: No module named 'yt_dlp'`) and must not be used. If
   `YTDLP_BIN` is unset or not executable, the adapter records that fact and **retains** — it never falls back to
   the broken binary and never invents a list.
2. Per video, `curl` the watch page and parse `ytInitialData.videoPrimaryInfoRenderer` /
   `videoSecondaryInfoRenderer` for title, `dateText` and the **verbatim** description.
3. Channel About fields from `ytInitialData.metadata.channelMetadataRenderer`
   (`externalId = UCJSYpoFkGKKzYTKzAr8vGzQ`).

`Provenance.source` is `'youtube-ytdlp'` for step 1 and `'youtube-web'` for steps 2–3, with `method` carrying the
literal command.

### 20.3 The two things the channel adapter must never do

- **Transcripts.** Bot-gated: `playabilityStatus = LOGIN_REQUIRED`, confirmed with real Chrome. Every transcript
  field ships as `notObservable('YouTube requires a signed-in session for captions on this channel',
  'playabilityStatus=LOGIN_REQUIRED', …)`. That is also the honest reason the R-122 deep-linking corpus is empty
  rather than invented.
- **The unlisted video.** One unlisted item leaks through a public playlist. It is marked
  `listingStatus: 'unlisted'` and is **excluded from every rendered count**. The page says ten videos because ten
  are public; a count that included a video a visitor cannot find would be unverifiable by the reader, which is
  the one thing this site may never publish.

### 20.4 Budget

Module timeout **90 s**; per-request 8,000 ms; retries 1 (yt-dlp invocations are not retried at all — a second
invocation of a broken binary is a second identical failure); concurrency 3 for watch-page fetches.

## 21 · What happens when an API is unreachable — the exact line

> **Stale-but-true with an honest `retrievedAt` is correct. A fabricated value or a visible zero is forbidden
> (R-175).**

### 21.1 The three outcomes and what each does to a field

| Situation | `RefreshOutcome` | The field | The `retrievedAt` on that field |
|---|---|---|---|
| Re-observed this run | `fresh` | the new value | **this run's** timestamp |
| Not observed; present in the previous committed dataset | `partial` or `retained` | **the previous object, byte-identical** | **the previous, original** timestamp — never moved forward |
| Not observed; absent from the previous dataset | `partial` or `retained` | `notObservable(reason, provedBy, …)` | this run's timestamp, on the *attempt* |
| Observed as genuinely absent (a repository with no homepage) | `fresh` | `notObservable('the API returns null for this field', 'GET /repos/…  → .homepage == null', …)` | this run's |

**Advancing `retrievedAt` on a value that was not re-observed is the fabrication.** It is a claim of freshness
the build cannot support, and `diff_dataset.mjs` rule 5 (`dataset-layer-design.md` §4) fails the build on it.

### 21.2 The exact failure matrix

| Situation | Build | Page |
|---|---|---|
| GitHub `401`/`403`/`429`/timeout/DNS failure | **exit 0** — a degraded refresh is a normal build | the real previous numbers, and the real earlier date, said out loud in the currency line (§22) |
| One repository `404` (renamed, deleted, made private) | exit 0, module `partial` | that plate's figures retained, its own age shown |
| `yt-dlp` missing, or the bot gate closes | exit 0, channel `retained` | unchanged; open caliper where a transcript would be |
| LinkedIn auth wall (HTTP 999, five documented attempts) | exit 0, `retained` | *"checked; not publishable"*, with the reason and the status |
| **CV PDF missing or `pdftotext` absent** | **exit 1** | build stops |
| **Schema / `assertModule` failure** | **exit 1** | never renders |
| **A field observable in the previous dataset, now absent, with no retained value** | **exit 1** | build stops — this is the only way a field can silently disappear, and it is closed |
| **A secret-shaped string anywhere in the output** | **exit 1** | build stops |
| **A `retrievedAt` moving forward on an unchanged value in a non-`fresh` module** | **exit 1** (`diff_dataset.mjs`) | build stops |

### 21.3 Four things that are forbidden outright

1. **A fabricated value.** No default, no interpolation, no "last known + 1", no rounding a missing number to a
   plausible one. There is no code path in any adapter that can produce a `sourced()` field without a parsed
   response body — stated for LinkedIn in `dataset-layer-design.md` §2.2 and true of every adapter here.
2. **A visible zero.** R-175: *"A site whose whole argument is that it refuses to publish an unsourced number
   cannot afford to display '0+ years' or '$0M+' for even one frame."* A missing metric renders as the **open
   caliper** with its reason, never as `0`, never as `—`, never as an omitted row. `metricsFor()` already does
   this correctly for `null` (`vitrine.ts`, *"not harvested"*); the canonical layer replaces `null` with a
   `NotObservable` that carries the reason, which is strictly better and is the same mark.
3. **A silent omission.** A field that cannot be had is a *positive record*, not a gap. `Field<T>` has exactly
   two shapes and no third; `null` alone is not representable.
4. **A build that fails because a third party is down.** A green deploy must never depend on `api.github.com`
   being up. The site's job when GitHub is unreachable is to say so, accurately, and keep serving.

### 21.4 Staleness is rendered, never fatal

There is no maximum age that fails a build. Instead, age is **shown**: the currency line prints the observation
timestamp, and where a single plate's figures are older than the module's newest observation, that plate's
metrics carry a `data-retained-at` attribute and the caliper's gloss reads
`Measured 2026-09-01T04:22Z; GitHub was unreachable at this deploy.` A number with an honest age is evidence. A
build that refuses to deploy because someone else's API is down is an outage this site chose.

## 22 · The currency copy — generated, never typed

### 22.1 The generator

`app/data/canonical/selectors.ts`:

```ts
export function formatCurrency(m: DatasetManifest['modules']['repositories'],
                               publicRepoCount: number,
                               failure?: { name: string; detail: string }): string {
  const at = (iso: string) => iso.replace(/:\d{2}\.\d+Z$/, 'Z').replace('T', 'T');  // minute precision, still Z
  switch (m.outcome) {
    case 'fresh':
      return `${publicRepoCount} public repositories · metrics re-read at this deploy, `
           + `${at(m.newestRetrievedAt)}, from the GitHub REST API`;
    case 'partial':
      return `${publicRepoCount} public repositories · re-read at this deploy, ${at(m.newestRetrievedAt)}, `
           + `except ${failure!.name}, retained from ${at(m.oldestRetrievedAt)} (${failure!.detail})`;
    case 'retained':
      return `${publicRepoCount} public repositories · GitHub was unreachable at this deploy `
           + `(${failure!.detail}); every figure here is the one observed ${at(m.oldestRetrievedAt)}`;
    case 'static':
      return `${publicRepoCount} public repositories · read from the repository itself, `
           + `${at(m.newestRetrievedAt)}`;
  }
}
```

Rendered examples, all three shapes:

```
38 public repositories · metrics re-read at this deploy, 2026-09-29T04:11Z, from the GitHub REST API
38 public repositories · re-read at this deploy, 2026-09-29T04:11Z, except aether-job-career-agent,
   retained from 2026-09-27T19:03Z (HTTP 403)
38 public repositories · GitHub was unreachable at this deploy (HTTP 503); every figure here is the
   one observed 2026-09-27T19:03Z
```

`Vitrine.tsx:201-202` becomes `{formatCurrency(manifest.modules.repositories, publicRepoCount, failure)}` —
**one expression, zero literals.** `vitrineContent.harvestedAt` is deleted; the date on the page is the date in
the data and cannot drift from it.

### 22.2 Plate 06's `limits` line

Current: *"Every figure on it is quoted from a CV or a repository — none is computed live."*
That becomes false the moment §19 ships, because repository figures *are* recomputed — at deploy, not live.

Replacement (a *limit*, i.e. what it does **not** do — the `Plate` contract's own rule):

```
'Nothing here is read live in your browser: every figure was observed when this build was made, and carries that time.'
```

### 22.3 The other copy that tracks this implementation

| Where | Change |
|---|---|
| `app/data/portfolio/vitrine.ts` header comment (lines 8–10) | *"produced by `scripts/build/harvest_repos.mjs` … stamped with the date it was taken"* → names `scripts/dataset/sources/repositories.mjs` and says *"re-read on every deploy; each field carries the time it was observed"* |
| `SPEC-closing-section.md` §6.2's footer bracket | unchanged — it stamps the **build**, which is a different fact from the **observation**, and the two must not be conflated |
| MiniVic's answers about how the figures are produced | must name the deploy-time refresh; folded into the SC-23 rewrite |

## 23 · Removals (R-162)

| Path | Disposition |
|---|---|
| `scripts/build/harvest_repos.mjs` | **Deleted** once `scripts/dataset/sources/repositories.mjs` produces `repositories.v1.json` and `vitrine.ts` imports the canonical loader. Its "Run by hand, not by the build" comment is the defect; leaving the file behind a dead import would be the dead code §13 bans. |
| `app/data/generated/repo-harvest.json` | **Deleted** in the same commit |
| `scripts/build/cv_fingerprint.mjs`, `app/data/generated/cv-fingerprint.ts` | Deleted per `dataset-layer-design.md` §3.2, only after every importer moves |
| `scripts/build/feedback_log.mjs`, `app/data/generated/feedback-log.ts` | Same |

Each removal is verified the way `dataset-layer-design.md` requires: `grep -rn` for the module specifier across
`app components lib scripts tests` returning zero, plus a green `tsc --noEmit`.

## 24 · Tests for Part 3

| id | Asserts |
|---|---|
| CU-01 | With `GITHUB_TOKEN` unset and network stubbed to `503`, `build_dataset.mjs` **exits 0**, `outcome === 'retained'`, and every field's `retrievedAt` is byte-identical to the previous committed dataset |
| CU-02 | Same run: `formatCurrency` returns the `retained` sentence naming HTTP 503 and the previous timestamp |
| CU-03 | With one repository stubbed `404`: `outcome === 'partial'`, five repositories fresh, one retained, and the `partial` sentence names that repository |
| CU-04 | An adapter that produces a `sourced()` field without a response body is impossible: a stub returning an empty body yields `not-observable`, never `sourced` |
| CU-05 | `diff_dataset.mjs` **exits non-zero** on a hand-edited fixture that moves `retrievedAt` forward on an unchanged value in a `retained` module |
| CU-06 | `diff_dataset.mjs` exits non-zero when a field id present in the baseline is absent now |
| CU-07 | The rendered page contains no `0` metric and no `—` metric: every absent figure renders the open caliper with a non-empty reason (the direct R-175 assertion) |
| CU-08 | `grep -rn "harvestedAt" app components` returns zero after §23 |
| CU-09 | A token value never appears in `app/data/canonical/generated/**` or in `reports/dataset-diff.json` — seeded by running the refresh with `GITHUB_TOKEN=ghp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` and grepping the output |
| CU-10 | `ChannelData` has no key matching `/subscriber|view|like|watch/i` — R-119 asserted against the type, not the render |
| CU-11 | The rendered currency line equals `formatCurrency(manifest…)` computed in the test from the same manifest — the page and the data compared, not two strings |

---
---

# PART 4 — THE TWO RED PIPELINES

## 25 · Defect C-1(a) — Playwright hits `ERR_CONNECTION_REFUSED` at `localhost:8080`

### 25.1 The diagnosis, restated exactly

`playwright.config.ts` sets `baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080'` and ships **no
`webServer`**, with a comment explaining why: per-spec `npm run build:static` calls raced under `fullyParallel`
and corrupted each other's build directory (`ENOENT _error.js`, `ENOTEMPTY .next/export`), failing ~46 specs for
reasons unrelated to any of them. **That reasoning is correct and must be preserved.**

But `.github/workflows/deploy.yml`'s `test` job runs `npm run build:static` and then
`xvfb-run … npx playwright test` **without setting `PLAYWRIGHT_BASE_URL` and with nothing listening on 8080**.
Every spec that navigates gets `ERR_CONNECTION_REFUSED`. The job is `continue-on-error: true` and is not in
`build.needs`, so it does not block the deploy — which makes it worse, not better: a permanently red job that
gates nothing is the false signal §11 bans, and R-105 guarantees a reviewer opens the Actions tab first.

A second, real cause compounds it on GitHub-hosted runners: `localhost` resolves to `::1` before `127.0.0.1`, so
a server bound only to IPv4 refuses the connection even when it is running.

### 25.2 The repair — a server that serves and never builds

**Create `scripts/test/serve_static.mjs`** — a dependency-free static server over `node:http` + `node:fs`:

- **Fails loudly first:** if `out/index.html` does not exist, print
  `serve_static: out/index.html is missing. Run "npm run build:static" first — this server never builds.`
  and `process.exit(1)`. The anti-race property the config comment protects is preserved by construction: this
  process cannot build, so no spec can trigger a build.
- Binds `::` on `PORT ?? 8080` (dual-stack: satisfies both `localhost` resolutions).
- Resolves a request path with **Firebase Hosting parity**, because `firebase.json` sets `cleanUrls: true`:
  `p` → `out/p` if a file → `out/p.html` → `out/p/index.html` → `404` with the body of `out/404.html` if present,
  else `Not Found`.
- Content types: `.html text/html; charset=utf-8`, `.js text/javascript`, `.css text/css`, `.json application/json`,
  `.svg image/svg+xml`, `.png .webp .avif .jpg .woff2 .mp4` by extension, `application/octet-stream` otherwise.
- Rejects any path containing `..` after `decodeURIComponent` with `400`.
- Emits `serve_static: listening on http://127.0.0.1:${port} (out/)` on stdout and nothing else.

**Change `playwright.config.ts`:**

```ts
  use: {
    trace: 'on-first-retry',
    // 127.0.0.1, not localhost: on GitHub-hosted runners `localhost` resolves to
    // ::1 first, and a server that is running can still refuse the connection.
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8080',
    screenshot: 'only-on-failure',
  },
  // The suite serves the ALREADY-BUILT static export. This server cannot build —
  // it exits 1 if out/index.html is absent — so the parallel-build corruption
  // that removed the previous webServer cannot come back through it.
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node scripts/test/serve_static.mjs',
    url: 'http://127.0.0.1:8080/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { PORT: '8080' },
  },
```

and **delete** the two stale trailing comments (`// webServer removed — dev server is already running on :5599`
and `// Run npx next dev -p 5599 before running tests`), which name a port nothing uses. R-183's rule applies to
comments the same way it applies to copy: a file must not describe a machine that does not exist.

### 25.3 The repair — turn a false signal into a real gate

Two jobs where there was one:

```yaml
  # GATING. Only the specs that can pass on a GPU-less GitHub runner.
  e2e-gate:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build:static
        env: { GEMINI_API_KEY: "${{ secrets.GEMINI_API_KEY }}" }
      - run: sudo apt-get update && sudo apt-get install -y xvfb
      - run: xvfb-run -a --server-args="-screen 0 1920x1080x24" npx playwright test --grep "@gating"
```

Every spec that does **not** depend on hardware GL is tagged `@gating` in its `test.describe` title: the a11y
suite, `telemetry-stability.spec.ts`, `telemetry-runtime.spec.ts`, `self-claim.spec.ts`, the dataset-currency
specs, and the DOM/semantics suites. The frame-rate and `backdrop-filter` specs stay untagged and stay in the
existing `continue-on-error` `test` job, which keeps its honest comment.

`build.needs` becomes `[quality, lint, lighthouse, axe, e2e-gate]`.

**Why this is the right shape.** `AUDIT-RECONCILIATION.md` C-5 and D-05 establish that this repository's problem
is not too few gates but gates that cannot fail. `e2e-gate` can fail, fails for a reason a reader can act on, and
does not wait on a GPU runner that may be offline.

### 25.4 Verification

| id | Command | Expected |
|---|---|---|
| CI-01 | `rm -rf out && node scripts/test/serve_static.mjs` | exit 1, the named message |
| CI-02 | `npm run build:static && npx playwright test --grep "@gating"` on a clean checkout with no server running | all pass; the webServer starts and stops |
| CI-03 | `PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test --grep "@gating"` | no local server starts (the ternary), specs run against production |
| CI-04 | `curl -sI http://127.0.0.1:8080/about` while the server runs | `200`, `content-type: text/html; charset=utf-8` — clean-URL parity with Firebase Hosting |
| CI-05 | `curl -s -o /dev/null -w '%{http_code}' 'http://127.0.0.1:8080/../../etc/passwd'` | `400` |

## 26 · Defect C-1(b) — the Firebase deploy exits 127 on an IAM 403

### 26.1 The diagnosis

Exit **127** is *command not found*. The `deploy` job uses `FirebaseExtended/action-hosting-deploy@v0`, which
resolves and runs `firebase-tools` itself; when its credential step fails, the failure surfaces as a missing
binary rather than as the **403** underneath it. The 403 is the real fault: the service account in
`FIREBASE_SERVICE_ACCOUNT` lacks the Hosting write permission. Two faults compound — an authorization error
wearing a shell error's clothes — and the second is what has kept this unfixed.

(Memory of record for this host: the CLI lives at `/usr/bin/firebase`, not behind `npx`.)

### 26.2 The repair — an explicit, pinned, preflighted deploy

Replace the action with four steps whose failure modes are distinguishable:

```yaml
      - name: Install Firebase CLI (pinned)
        run: npm i -g firebase-tools@14.19.0
      - name: Prove the binary exists          # a 127 here can only mean 127
        run: firebase --version
      - name: Write the service account
        run: |
          umask 077
          printf '%s' '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > "$RUNNER_TEMP/sa.json"
          echo "GOOGLE_APPLICATION_CREDENTIALS=$RUNNER_TEMP/sa.json" >> "$GITHUB_ENV"
      - name: Preflight — prove the credential can see the project
        run: |
          set -euo pipefail
          if ! firebase projects:list --json > "$RUNNER_TEMP/projects.json" 2>"$RUNNER_TEMP/pf.err"; then
            echo "::error::Firebase preflight failed. This is an IAM problem, not a missing binary."
            echo "::error::Grant the service account roles/firebasehosting.admin and roles/firebase.viewer"
            echo "::error::on project forgotten-mistory, then re-run."
            sed -n '1,20p' "$RUNNER_TEMP/pf.err"
            exit 1
          fi
      - name: Deploy to Firebase Hosting (live)
        run: firebase deploy --only hosting --project forgotten-mistory --non-interactive
      - name: Shred the credential
        if: always()
        run: rm -f "$RUNNER_TEMP/sa.json"
```

The preview job takes the same shape with
`firebase hosting:channel:deploy preview-${{ github.event.number }} --expires 7d --project forgotten-mistory`.

### 26.3 The IAM grant — the exact commands

Run once by the project owner (`SA` = the `client_email` inside the secret):

```bash
PROJECT=forgotten-mistory
SA="$(jq -r .client_email <<<"$FIREBASE_SERVICE_ACCOUNT")"

gcloud services enable firebasehosting.googleapis.com firebase.googleapis.com --project "$PROJECT"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/firebasehosting.admin"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/firebase.viewer"

# Only if this workflow ever deploys the functions in Part 1 / SPEC-closing-section:
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/cloudfunctions.developer"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/datastore.user"

gcloud projects get-iam-policy "$PROJECT" --flatten="bindings[].members" \
  --filter="bindings.members:$SA" --format="table(bindings.role)"    # the proof
```

### 26.4 The orphan function (D-06, C-4), closed in the same commit

`ssrforgottenmistory` (v2, us-central1) is live, billable, and appears in neither `firebase.json` nor
`functions/index.js` — a leftover webframeworks SSR function.

```bash
firebase functions:list --project forgotten-mistory                       # before
firebase functions:delete ssrforgottenmistory --region us-central1 --force --project forgotten-mistory
firebase functions:list --project forgotten-mistory                       # after — the verification
```

Both listings are captured to the evidence directory. R-162: a removal is planned, deployed and **verified**.

### 26.5 Verification

| id | Asserts |
|---|---|
| CI-06 | A run with a deliberately unprivileged service account fails at **Preflight** with the IAM message, never at Deploy, and never with 127 |
| CI-07 | `firebase --version` step succeeds independently of credentials |
| CI-08 | After the deploy, the existing `verify` job's production `200` poll still passes unchanged |
| CI-09 | `firebase functions:list` after §26.4 does not contain `ssrforgottenmistory` |
| CI-10 | `$RUNNER_TEMP/sa.json` does not exist at job end (the `always()` shred ran) |

## 27 · Defect C-1(c) — `npm audit` gates on high-severity advisories

### 27.1 The live state, read this run

`npm audit --json` at HEAD, 2026-09-03: **12 advisories — 1 critical, 10 high, 1 moderate**, over 644
dependencies (111 prod, 524 dev, 76 optional). The diagnosis's three are a subset; the full set is:

| Package | Sev | Direct | Fix available | Group |
|---|---|---|---|---|
| `tar` | **critical** | no | non-major | **1 — mechanical** |
| `brace-expansion` | high | no | non-major | 1 |
| `browserslist` | high | no | non-major | 1 |
| `js-yaml` | high | no | non-major | 1 |
| `nanoid` | high | no | non-major | 1 |
| `fflate` | moderate | no | non-major | 1 |
| `glob` | high | no | via `eslint-config-next` **major** | **2 — dev-only, needs a major** |
| `@next/eslint-plugin-next` | high | no | via `eslint-config-next@16` | 2 |
| `eslint-config-next` | high | **yes** | `16.3.4` **major** | 2 |
| `next` | high | **yes** | `16.3.4` **major** | **3 — the framework uplift** |
| `postcss` | high | **yes** | via `next@16` | 3 |
| `sharp` | high | **yes** | `0.35.4` **major** | 3 |

### 27.2 The repair, in three moves

**Move 1 — mechanical, lands alone, today.**

```bash
npm audit fix                 # never `--force`: --force takes majors behind your back
npm ls tar brace-expansion browserslist js-yaml nanoid fflate
npm audit --audit-level=high  # expect: only Groups 2 and 3 remain
git add package.json package-lock.json
```

If a transitive fix does not surface (a dependency pinning an old range), pin it explicitly rather than
suppressing it:

```json
"overrides": {
  "tar": "^7.5.21",
  "brace-expansion": "^2.1.4",
  "browserslist": "^4.28.7",
  "js-yaml": "^4.3.1",
  "nanoid": "^3.3.18",
  "fflate": "^0.8.3"
}
```

then `npm install`, and **commit `package-lock.json` in the same commit** — a lockfile that lags its manifest is
its own defect.

**Move 2 — `eslint-config-next@16`.** Dev-only and touches no shipped byte. `npm i -D eslint-config-next@16.3.4`,
then `npm run lint` and fix whatever the new rule set surfaces in the same PR. `glob` and
`@next/eslint-plugin-next` clear with it.

**Move 3 — `next@16` + `sharp@0.35` — folded into D-03's controlled uplift, never smuggled into a CI fix.**
`BLOCKED-01-pr-hygiene.md` already rules that the ten dependabot PRs close and the dependency work becomes **one
controlled uplift verified through the full gate battery**, because R-84 mandates adding GSAP + ScrollTrigger,
Lenis, D3 and three.js `postprocessing` regardless. `next` 14 → 16 crosses two majors and moves the App Router,
the static export path and `next/font` — it belongs in that uplift with the full battery behind it, not in a
security patch.

### 27.3 The gate stays at `high`, and it stays honest

`security.yml`'s `npm audit --audit-level=high` is **not** weakened: not to `critical`, not with `--omit=dev`, not
with `--production`. Until Move 3 lands, the job stays red for a reason the repository can name — and naming it
is the whole point. The interim mechanism:

**`scripts/validate/audit_exceptions.mjs` + `security/audit-exceptions.json`:**

```json
[
  {
    "ghsa": "GHSA-...", "package": "next", "severity": "high",
    "reason": "Fix requires next@16 (two majors). Folded into the D-03 controlled uplift; see BLOCKED-01-pr-hygiene.md.",
    "openedAt": "2026-09-03", "expires": "2026-10-03", "owner": "vikram"
  }
]
```

The script runs `npm audit --json`, subtracts the non-expired exceptions, and **exits 1** if any high or critical
advisory remains unexcepted **or if any exception is past its `expires`**. `security.yml` calls it instead of the
bare `npm audit`. A gate that can be silenced forever is not a gate; this one expires in at most 30 days and then
fails on its own.

### 27.4 Verification

| id | Asserts |
|---|---|
| CI-11 | After Move 1: `npm audit --audit-level=high --json` contains zero advisories from Group 1 |
| CI-12 | `npm ls` reports a single resolved version for each overridden package (no duplicate trees) |
| CI-13 | `npm ci` from the committed lockfile installs the overridden versions on a clean machine |
| CI-14 | `audit_exceptions.mjs` exits 1 for an exception dated in the past — proven with a fixture |
| CI-15 | `npm run build:static` and `npx playwright test --grep "@gating"` pass after Moves 1 and 2 |

---

## 28 · R-184 — `aether-job-career-agent`

**This section changes nothing in this repository.** It is the repair plan for the flagship, and the site's
*Limits* line (§29) may not change until it is green.

Established by `R184-flagship-ci-diagnosis.md`: CI red on `main` continuously since **2026-08-18T01:36:45Z**;
last green run `32087090146`; latest run `33682579720` (head `bb5f5f01`) **failure**; **two independent,
deterministic causes**; the identical 20-test failure set reproduced across two commits two days apart, so it is
not flake.

### 28.1 Failure A — `ruff check app/ tests/`, 10 violations

Job `100422393390`, step 5 of 6, exit 1, 11 s. Step 6 (`mypy app/ --ignore-missing-imports`) was **skipped**, so
mypy's state on `main` has been unobserved since 2026-08-18.

```bash
cd apps/api
ruff check --fix app/ tests/     # clears the 5 fixable I001: interview_pack.py:425,485;
                                 # interview_pack_pdf.py:10; test_apply_receipt_gate.py:2;
                                 # test_apply_receipt_inbox.py:2
```

Then hand-wrap the five `E501` lines to ≤ 100 columns (`line-length = 100` is the repository's own
`apps/api/pyproject.toml`):

| File | Line | Current length |
|---|---|---|
| `app/agents/interview_prep_agent.py` | 662 | 125 |
| `app/services/apply_executor.py` | 502 | 102 |
| `app/services/apply_executor.py` | 565 | 101 |
| `app/services/interview_pack.py` | 138 | 116 |
| `app/services/interview_prep_briefing.py` | 198 | 106 |

Wrap by extracting an intermediate local or by parenthesised string continuation — never by adding
`# noqa: E501`, which would move the defect rather than fix it.

Then, in the **same** commit:

```bash
ruff check app/ tests/ && mypy app/ --ignore-missing-imports
```

**Treat mypy as an open unknown, not as a passing step.** Fixing ruff may expose a second red step that has been
masked for six weeks. If mypy fails, its failures are part of this repair, not a follow-up.

**Two hardening changes visible in the log, both required:**

1. `pip install ruff mypy` is unpinned — a new ruff minor can add a rule and re-break a commit that changed
   nothing. Add `ruff==0.16.5` and `mypy==2.3.1` to `apps/api/requirements-dev.txt` and change `ci.yml` to
   `pip install -r requirements-dev.txt`.
2. The run warns *"Node.js 20 is deprecated … forced to run on Node.js 24: actions/checkout@v4,
   actions/setup-python@v5."* Not a failure today; it becomes one. Bump both to their Node-24 majors.

### 28.2 Failure B — 20 deterministic pytest failures on the self-hosted runner

Job `100422393204`, 55 minutes, three alphabetical slices: **5,332 passed · 20 failed · 15 skipped**.

**Step 0 — make the suite runnable locally. This is the prerequisite for every step below.**
`apps/api/tests/conftest.py` fails closed because the dev checkout's root `.env` points `DATABASE_URL_TEST` at
`127.0.0.1:5433/aether_staging?schema=aether_test`, and 5433 stopped listening when `01a7eb91` retired the
persistent dev/test environments. The only Postgres now listening for this purpose is the CI one on
**`127.0.0.1:5436`**.

```bash
# repoint the DEVELOPER .env at the CI Postgres, with its own isolated schema — never aether_test_ci
DATABASE_URL_TEST='postgresql://…@127.0.0.1:5436/aether_ci?schema=aether_test_localdiag'
cd apps/api && bash ../../scripts/test-schema.sh provision localdiag
```

**Group 2 — 3 failures in `tests/test_sub008_answer_bank_seed_classes.py`. Cause established by reading the
diff; confirm by bisection, then decide.**

`d803629e` (*"fix(apply): map Yes/No Greenhouse comboboxes through choice matching"*, 2026-08-20T11:51:38Z)
inserted into `build_form_fill_plan`:

```python
mapping_options = list(field.get("options") or [])
if not mapping_options and _is_yes_no_phrased(question_text_for_field(field)):
    mapping_options = ["Yes", "No"]
if mapping_options and _match_choice_option(str(match.answer), mapping_options) is None:
    match = None
```

For SUB-008's synthetic referral `select`, which publishes an `"Other"` option, `_match_choice_option()` returns
`"Other"` for the banked essay instead of `None`. The banked answer is discarded in favour of the matched option,
the field stops being an unanswerable required question, and its audit row disappears. All three assertions fall
out of exactly that.

*Confirm:* run only that file at `d803629e^`, then at `d803629e`. Two runs; converts *established by reading the
diff* to *established by bisection*.

*Decide.* This is a genuine contradiction between two deliberate product rules, and §3.3 of the diagnosis is
right that it is a product call, not a lint fix:

- the answer bank's honesty rule — *the bank never invents an answer; an unmappable question is an honest manual
  step*;
- `d803629e`'s real problem — *unmappable bank essays were stuffing the plan and starving `form_llm`*.

**Ruling for this spec: the honesty rule wins, and the mapping check is narrowed rather than removed.** A
catch-all option is not an answer to a question; it is the form's way of saying it has no answer.

```python
CATCH_ALL = {"other", "prefer not to say", "n/a", "none of the above", "not listed"}

matched = _match_choice_option(str(match.answer), mapping_options)
if mapping_options and (
    matched is None
    or matched.strip().lower() in CATCH_ALL          # a catch-all is not an answer
    or len(str(match.answer)) > 2 * max(len(o) for o in mapping_options)   # an essay is not a choice
):
    match = None
```

Acceptance: the three SUB-008 tests pass; the three tests `d803629e`/`6c4f0ef2` added
(`…yesno_popup_commits_the_one_shared_token_yes_option`, the two `…hidden_iti_country_list` cases) **stay green**
— they pass today and must keep passing, or the narrowing has gone too far.

**Groups 1 and 3 — 17 failures. When they broke is established; which line broke them is not. Bisect, do not
guess.**

The split is the diagnosis's most important fact: of the 20 end-to-end `test_live_submitter_*` tests, the **4
happy paths pass** and **all 16 that assert the pre-submit guard must REFUSE fail**. The browser works, the fill
path works, the *refusal* path does not.

```bash
# a probe that needs no DB and runs in seconds; DID NOT RAISE is unambiguous
pytest tests/test_cli_sub005_fill_commit.py -k refuses_when_the_guards_own_installation_throws
```

`git bisect` across the seven apply commits between `ea7d0b30` and `d803629e` (`2ff3b041`, `97591d0d`,
`180229fe`, `6c4f0ef2`, `dfe1b2a3`, `a6542830`, `d803629e`) with that probe. The prior is `d803629e`'s rewrite of
the live combobox matcher inside `_fill_value` (adding `live_option_labels` and a Yes/No single-token path),
which *is* on the code path the 16 exercise — but the acceptance criterion is written against behaviour, not
against a line:

> All 16 `refuses_*` tests raise `ManualStepRequired` **with the reason string each test expects**
> (`unplanned_required_field`, not `no_confirmation`, `form_rejected`, `submit_click_failed` or
> `verification_code_email`), and the 4 happy paths still submit. Group 3's
> `test_verification_gate_never_bypasses_the_r7_submission_guard` passes with the same reason correction.

**Already ruled out — do not re-litigate:** flake (identical 20-test set on two runs, two commits, two days
apart); browser drift (Playwright `1.62.0` pins Chromium `1234`; `/opt/ms-playwright` holds exactly that); the
system-Chrome switch from `8e9ceb19` (every failing test passes a `data:text/html;base64,…` URL, so `live=False`
and `channel="chrome"` is never selected); a missing browser install (4 of the 20 browser-driven tests pass);
"the failures are the new tests" (all three new tests pass).

### 28.3 The two CI-design faults, fixed in the same PR

1. **26 consecutive `cancelled` runs of `api-tests` were treated as non-events**, and 46 commits landed through
   that window. A cancelled required job is not a passing job. Add `timeout-minutes: 120` to the self-hosted job
   **and** a preceding 5-minute queue guard that fails with
   `::error::self-hosted runner did not pick up api-tests within 5 minutes — the badge is not green, it is absent`.
2. **CI reuses the developer venv** (`ci.yml` puts `/root/dev/aether-job-career-agent/apps/api/.venv/bin` on
   `PATH` because fresh pip installs of the torch/ML wheels were OOM-killed on this host). Honest about the
   tradeoff, still a reproducibility hole: that checkout is currently at `d803629e` with an uncommitted
   modification to `app/services/llm_client.py`. Build a version-stamped venv image once, mount it read-only, and
   print `pip freeze | sha256sum` as the first step of every run so the dependency set is a recorded fact.

### 28.4 Definition of done for R-184

```bash
gh api "/repos/Victordtesla24/aether-job-career-agent/actions/runs?branch=main&per_page=1" \
  --jq '.workflow_runs[0] | {name, conclusion, head_sha, created_at}'
```

returns `conclusion: "success"` for the `CI` workflow on `main`, with **all three jobs completing** (`Web`,
`API — lint, types`, `API — full pytest suite`), and the mypy step **run, not skipped**.

## 29 · The rewritten *Limits* line — and the test that binds it to the data

Current, at `app/data/portfolio/vitrine.ts:46`:

```
'The public CI workflow is red on main; production deploys through a separate gated pipeline.'
```

`T40-self-claim-register.md` verifies both halves are exactly true today. R-184 is explicit that truthfulness is
not enough: *"honest disclosure of a broken thing is not a substitute for fixing a thing that can be fixed."*
R-167 preserves the instrument — the line does not disappear, only its content changes. A `Plate.limits` line
says what the repository does **not** do, *"never softened, never omitted"*.

**The replacement, once §28.4 is met:**

```
'The full backend suite runs on one self-hosted runner, so a green badge depends on a machine only I can restart.'
```

That is the limit that actually remains: the diagnosis records 26 consecutive cancellations because the
self-hosted runner never picked the job up, and **the pytest suite passed in CI on exactly one commit in the
repository's history**. It is specific, checkable, and it is the sentence the author of that pipeline would
write.

Rejected alternatives, recorded so the choice is not relitigated:

| Candidate | Rejected because |
|---|---|
| *"The submission guard is proven against synthetic `data:` forms, not live employer sites."* | True and interesting, but it is a limit of the **guard**, and the plate already spends its description on the guard. Two sentences about the same thing crowds out the pipeline fact a reviewer will check first. |
| *"CI is green."* | Not a limit. R-167 preserves the instrument; a plate whose *Limits* line boasts has lost the instrument. |
| Deleting the line | Forbidden by R-167 and by the `Plate` contract (*"the limits line is not optional"*). |

### 29.1 The test that makes this sentence unfalsifiable-by-drift

`tests/overhaul/self-claim.spec.ts`, case **SC-10** — the strongest single assertion in this spec:

```ts
// The sentence and the pipeline are compared, not the sentence and a memory of it.
const ci = repositories.data['aether-job-career-agent'].ci;          // canonical dataset, §19.2
const limits = plates.find((p) => p.repo === 'aether-job-career-agent')!.limits;

if (ci.kind === 'sourced' && ci.value.conclusion === 'success') {
  expect(limits).not.toMatch(/\bred\b/i);          // green pipeline, no "red" claim
} else if (ci.kind === 'sourced') {
  expect(limits).toMatch(/\bred\b/i);              // red pipeline, the disclosure must be there
}
// ci.kind === 'not-observable' → neither assertion; the caliper is open and the line says why
```

Both directions fail. Repairing CI without rewriting the line fails; rewriting the line without repairing CI
fails. R-183 becomes a property of the build rather than a discipline of the author — which is the same
mechanism §16 applies to the telemetry sentence, applied to the other end of the site.

---

## 30 · Build order and acceptance

| Step | Lands | Gate that proves it |
|---|---|---|
| 1 | `serve_static.mjs` + `playwright.config.ts` + `e2e-gate` job (§25) | CI-01 … CI-05; `e2e-gate` green |
| 2 | Firebase deploy repair + IAM grant + orphan-function removal (§26) | CI-06 … CI-10 |
| 3 | `npm audit` Moves 1–2 + `audit_exceptions.mjs` (§27) | CI-11 … CI-15 |
| 4 | Flagship repair (§28) — separate repository, no dependency on 1–3 | §28.4 |
| 5 | **Telemetry + the self-claim, one commit** (Parts 1 and 2) | TM-01 … TM-38, SC-01 … SC-09, `self_claim_commit_gate.mjs` |
| 6 | Deploy-time refresh + the currency copy, one commit (Part 3) | CU-01 … CU-11 |
| 7 | The flagship *Limits* line (§29) — **only after step 4 is green** | SC-10 |

**Gate J — Telemetry live** is met at step 5: a beacon reaches a collector, a collector writes an aggregate, an
aggregate produces a weekly verdict, and a verdict opens an issue.

**Gate R** is met for this spec's share when: SC-94.1's three clauses hold together — *repository and channel
metrics refresh on deploy and the currency copy says so truthfully* (step 6, CU-11); *the telemetry statement
matches the implementation exactly, naming what is measured and what is never collected* (step 5, SC-01…SC-04);
*the flagship repository's public CI is green on main and its Limits line states only what remains true*
(steps 4 and 7, SC-10).

**T-40 runs last, before every certification.** It is the failure mode that would cost the most.

---
---

## Adversarial critique

**Verdict: NEEDS-REVISION.** The spec is unusually well-sourced — §27.1's audit table
reproduces `npm audit --json` at HEAD *exactly* (12 advisories, 1 critical / 10 high /
1 moderate; every `isDirect` and `isSemVerMajor` flag correct), every file:line citation
checked out (`listen.ts:47`, `vitrine.ts:46/92/93`, `Vitrine.tsx:201-202`,
`HeroAtmosphere.tsx:50`, `functions/index.js:111`, `harvest_repos.mjs:3` and `:44-58`),
and §28 is faithful to `R184-flagship-ci-diagnosis.md`. SC-10 (§29.1) is the best idea in
the run. But the mechanism Part 2 rests its whole argument on has a hole, and Part 1's
aggregation arithmetic is not sound. These must close before a line is written.

### FAILURES — must fix before build

**F-1 · R-183 VIOLATION AT THE CENTRE OF §16. `EVENT_COPY` is keyed by event *type*, not
by *field*, so the generated disclosure does not describe what the beacon actually sends —
and it is already wrong as specified.** `view_start` carries three fields
(`viewport`, `reducedMotion`, `gl`); its copy discloses one (*"at one of four screen
widths"*). `reducedMotion` and `gl` are collected, written to `telemetry_daily`, and
**never disclosed anywhere on the page**. §16 claims *"a new event type that nobody
described fails `tsc`, not review"* — true, and irrelevant: adding a *field* to an existing
event fails nothing. `TC-TELEMETRY-04` compares key sets of the union's `t` values only.
The site would ship a generated sentence that is provably incomplete about its own code —
the exact failure R-183 names. **Fix: key the copy by field.** `EVENT_COPY:
Record<TelemetryEventType, { event: string; fields: Record<string, string> }>` with a
`tsc`-enforced exhaustive field map, and a `TC-TELEMETRY-05` that parses each union
member's property names and asserts equality with its `fields` keys.

**F-2 · §9.2 divides by zero and reads an object as a number; both produce a false verdict,
and one of them opens a public GitHub issue.**
- `dwellₛ = dwellMs[s] / dwellN[s]`. A section never `qualified` in the window has
  `dwellN[s] === 0` → `NaN`. `NaN < 0.40 * readTimeMs` is `false`, so the chain falls
  through to **`'holding'`**. An unmeasured section is reported as fine. That is the exact
  inversion of §9.2's own ruling that *"`insufficient-evidence` is not `holding`"*, and it
  is not hypothetical: `SectionId` includes `'contact'`, but the section ships today as
  `id="listen"` (`Listen.tsx:30`) and `#contact` arrives only from
  `SPEC-closing-section.md` — which §0.2 explicitly permits to land *after* Part 1.
- `Iₛ` for contact is defined as `conversions / V`, but `conversions` is an **object** in
  §7.2 (`{"contact-canonical": 0, …}`). `object / number` is `NaN`. Same fall-through.
  **Fix:** guard `dwellN[s] < 30` → `'insufficient-evidence'` per section (a per-section
  floor, not only the page-level `V < 100`); sum `Object.values(conversions)` explicitly.

**F-3 · §6.3's abuse argument is backwards.** *"An attacker can inflate counters"* is
dismissed because *"a figure below the evidence threshold is reported as
`insufficient-evidence`"*. Inflation pushes `V` **above** 100, not below. Cheap, unauthenticated,
identifier-free POSTs convert `insufficient-evidence` into confident `under-performing`
verdicts that **open public issues on the real repository** and permanently poison a
`telemetry_daily` document the spec says is *kept forever* with no identifier to filter by.
`maxInstances: 3` bounds *cost*, not *counts*. **Fix:** either (a) `aggregateTelemetry` reads
from `telemetry_events` and applies a per-`view` cap (one `view_start` per view id, ≥ N
distinct views per day), or (b) state plainly in §9.3 that the numbers are not
attack-resistant and have the issue body say so. Do not claim harmlessness it does not have.

**F-4 · §7.3's topic matcher cannot match the knowledge base it is generated from.**
Measured against `app/data/miniVicKnowledge.ts` this run: **34 entries, 440 keywords, 259
of them multi-word (59 %)**. The algorithm splits the question on whitespace into single
tokens and counts *"tokens present in `keywords`"*, requiring **≥ 2** to win. A multi-word
keyword (`"test automation"`, `"ATO role"`) can never equal a single token, so 59 % of the
taxonomy is dead on arrival and most questions fall to `'unmatched'`. `chatTopics` would be
a chart of nothing. Separately, `kb_topics.mjs` must read a **TypeScript** file from a
`node` build script and the spec never says how. **Fix:** tokenise keywords too and match
n-grams (or `String.includes` over the normalised question); state the parse strategy.

**F-5 · §15.2's `never` sentence is ungrammatical, and the spec reproduces the broken output
as shipped copy.** `buildNeverSentence` joins on `", "` but three `NEVER_COLLECTED` entries
contain internal commas, so the rendered line — quoted verbatim in §15.2 — reads *"…the page
you came from, **a cookie, or anything stored on your device, a fingerprint, or any
identifier that survives the tab closing,** or one word of anything you typed."* Four
clauses now read as seven, and *"a cookie"* and *"anything stored on your device"* become
separate list items joined by a stray *"or"*. `TM-26` enforces grammar on `EVENT_COPY` and
**nothing** on `NEVER_COLLECTED`. This is the page's single most load-bearing sentence.
**Fix:** forbid `,` in `NEVER_COLLECTED` entries (a `TM-27`), or join on `` ` · ` ``.

**F-6 · §0.1's "gold spend: zero marks" is contradicted by §21.4.** §21.4 specifies a caliper
gloss reading *"Measured 2026-09-01T04:22Z; GitHub was unreachable at this deploy."* —
`Measured` is the **`sourced`** state, which is gold. Part 3 gives six plates' metrics a
checkable API provenance, i.e. it is the first thing in this run to legitimately light the
`sourced` state (ground truth: `sourced` renders **nowhere** today; all 15 marks are
`self-reported` or `open`). That is a real and welcome gain in honesty, but it is an
**unbudgeted** one, and six sourced metric marks in one vitrine view breaks *at most one
gold mark per view*. **Fix:** §21.4 must either (a) declare the retained/unreachable gloss
an `open` caliper (it is a statement about a *failed* observation, so `open` is the honest
grade), and (b) hand the `sourced` budget for refreshed plate metrics to
`SPEC-dimensions-artefact.md` / the vitrine owner with an explicit one-mark-per-visible-plate
ruling. As written, Part 3 silently spends gold a sibling spec has already allocated.

**F-7 · Unowned DOM dependencies; `gl` is structurally always `'off'`.**
`grep -rn 'data-gl-scene\|data-contact-route\|data-role="route"\|data-role="identity-link"\|data-conversation-open\|data-explainer-video' app components lib` returns **zero hits today.**
§0.2's dependency table covers the conversion attributes and `data-explainer-video` but
**omits `data-gl-scene`** — it is promised by no spec. §4.1 step 5 would therefore record
`gl: 'off'` on every view forever, and `telemetry_daily.gl` becomes a fabricated field
nothing can falsify (TM-02 only checks that `t` is in the union). **Fix:** name the owner of
`data-gl-scene` in §0.2, or read `document.querySelectorAll('canvas').length > 0` — a fact
the page already commits to (`AUDIT-RECONCILIATION.md` §F: hero → 1 canvas, experience → 1
canvas, with `?gl=force`), and add a Playwright assertion that at least one view in a normal
run reports `gl: 'on'`.

**F-8 · Two tests require a second build that nothing provides.** `TM-04` (*"axe tree
byte-identical with telemetry on and off"*) and `TM-11` (*"CLS unchanged versus a build with
`TelemetryBoot` removed"*) both compare against an artefact that does not exist: Playwright
serves one prebuilt `out/`, and §25.2's `serve_static.mjs` **cannot build** by design.
Neither test can run as specified. Also `TM-04`'s "byte-identical axe tree" is not a thing
axe produces. **Fix:** gate the runtime behind `?telemetry=off` (read once, inside `start()`,
never rendered — R3-safe) so both comparisons are two navigations of one build; restate
`TM-04` as *identical violation list and identical accessible-node count*.

**F-9 · `TM-10` is a flaky proxy for a real property.** *"the runtime chunk's `startTime` >
the LCP entry's `startTime`"* is not implied by a correct implementation:
`requestIdleCallback` can fire at ~300 ms on a fast connection while LCP lands at 1.2 s, and
the test fails on code that is right. Conversely it passes on a runtime that blocks the main
thread for 200 ms at t=2.1 s. **Fix:** assert the two things actually claimed — LCP value is
within noise of a `?telemetry=off` navigation, and zero `longtask` entries overlap the
chunk's `[startTime, responseEnd]`.

**F-10 · Miscounts and off-by-ones that tests are written against.**
- §4.6: *"resolving `event.target.closest` against **six** selectors"* — the table has
  **five** rows. `conversation-seed` arrives via `fm:ask`, not a selector.
- §6.2 / `TM-31`: *"the **eleven** strings above"* — the list has **nine**
  (eight request reads + `Set-Cookie`). A test asserting eleven against nine cannot be
  written from this spec.
- §22.1 `formatCurrency`: `.replace('T', 'T')` is a **no-op** — dead code, in a spec whose
  §23 bans dead code; and the regex `/:\d{2}\.\d+Z$/` silently no-ops on a millisecond-free
  ISO string, leaving seconds in a line documented as minute-precision. `failure!` will throw
  at render if `outcome === 'partial'` arrives without a failure object.
- §5 compares `body.length` (UTF-16 code units) against a limit §3 documents as *"bytes of
  UTF-8"*, while the collector checks `req.rawBody.length` (bytes). `TM-23` asserts the wrong
  quantity. Harmless today (ASCII only) — but the spec's own §3.1 argues no free text can
  ever enter, so say `new TextEncoder().encode(body).length` and make it true by construction.

**F-11 · Test-id namespace collision.** §17 defines `SC-01 … SC-10` as Playwright cases while
§0, §14 and §30 use `SC-01a`, `SC-02`, `SC-04b`, `SC-05`, `SC-23`, `SC-94.1` as *contract
success criteria*. `SC-02` and `SC-05` therefore mean two unrelated things in one document
(§17's SC-05 is a network-host assertion; §0's SC-05 is the pipeline criterion). Rename the
tests `T40-01 … T40-10`.

**F-12 · Comment drift the spec creates and then forbids fixing.**
- §13.3 orders that `telemetry-stability.spec.ts`'s header comment is *"not edited"* because
  it is *"a preserved artefact"*. That comment currently asserts *"TS-03 was deleted with its
  subject"* while **`TS-03` exists at line 134** — the file already carries a false statement
  about itself. §25.2 rules that R-183 governs comments (*"a file must not describe a machine
  that does not exist"*). Preserve the outage paragraph; correct the TS-03 paragraph.
- §25.2 re-adds `webServer` but only deletes the two *trailing* comments. The **header**
  comment (`playwright.config.ts:5-15`) opens *"No globalSetup and no webServer"* and becomes
  false in the same commit. It must be rewritten, keeping its anti-race reasoning verbatim.

**F-13 · Part 3 leaves three hardcoded `38`s behind.** §22.1 claims *"one expression, zero
literals"*, but that covers only `Vitrine.tsx:201-202`. `vitrine.ts:4` (*"Thirty-eight public
repositories exist"*), `:116` (`title: 'Six of thirty-eight'`) and `:117` (the lede) all
hardcode the count that §19.2 makes live. `CU-08` greps only for `harvestedAt`. Verified
today: `/user`.public_repos **= 38** and `corpus-repositories.json` agrees (41 owned, 3
private) — so the number is right *now*, which is precisely why it will rot unnoticed.
**Fix:** derive all three, and add `CU-12`: no rendered string contains a repository count
literal.

**F-14 · Missing from the §1.1 manifest.** `functions/read-time.json` is required by §9.1 and
appears in no create/change table. `scripts/telemetry/replay.mjs` (§9.4) is referenced by a
public issue body and is likewise unlisted. §25.3's *"every spec that does not depend on
hardware GL is tagged `@gating`"* is an unbounded edit across a 167-test suite that no table
enumerates — name the files.

---

### Critique (≤ 500 words)

**Fabrication.** Almost none, and that is the spec's strongest quality. Every citation I
pulled was real. The one number driving an automated public issue with no provenance is
**240 wpm** (§9.1) — the spec is candid that it is *"a stated assumption rather than a magic
number"*, but a site whose thesis is *never grade a claim above its evidence* should carry
the source or mark the derived `readTimeMs` `self-reported` in the issue body. §9.3's worked
example is worse than unsourced, it is **internally inconsistent**: it labels
`dwellMs/dwellN` — a **mean** — as *"median dwell"* (§7.2's own comment says *"the median
comes from raw"*), and prints `interaction rate 0.31` for `#skills`, which §9.2 defines as
`null` for every section that owns no R-97 interactive. The issue template is the loop's
public face; it must not overstate its own statistic.

**Design law.** Monochrome and *every visual is data* are honoured trivially — §0.1's
zero-mark ruling is correct and well argued, and refusing to publish traffic (§0.1.2) is the
right call. The gold breach is F-6 only. The Preservation Register holds: dropping *"and
none on a phone"* is remediation (b) of `T40` SC-01c, justified by `AUDIT-RECONCILIATION.md`
§F (hero and experience each render one canvas at 390/393 px), and §29's *Limits* rewrite
preserves the instrument rather than deleting it.

**Buildability.** Parts 2 and 4 are executable today. Part 1 is not, for F-1/F-2/F-4/F-7/F-8.
Part 3 is executable only downstream of `dataset-layer-design.md` and correctly refuses to
fork it. §2.1's five structural rules are the right answer to the July outage — making the
bug class *unrepresentable* rather than *watched for* is exactly right, and R4 (writing the
frozen-snapshot contract for a file that does not ship, then testing it) is excellent.

**Would it survive its own tests?** Mostly yes — `TM-30` (collector key set == union key
set), `TM-32`, `TM-31`, `CU-04`, `CU-05` and `CU-09` are all genuinely falsifiable and would
each fail a mediocre implementation. The weak ones are `TM-04`, `TM-10`, `TM-11` (F-8, F-9),
`TM-25` (`≥ 8 entries` passes on any padding), and `SC-09`, which asserts the footer is
*unchanged* under GPC — true but toothless.

**Honesty, net.** More honest, clearly. It closes S-1/S-2 before they can go false, it makes
the disclosure a computed property of the code, and §29.1 binds a sentence to a live CI
conclusion in **both** directions. The one regression is F-1: a generated sentence that
looks mechanical while quietly under-reporting two collected fields is *worse* than a
hand-written one, because it borrows authority it has not earned. R-171 applies to the spec
itself.

---

### The single strongest improvement

**Move the disclosure contract from event *types* to event *fields*, and make the beacon
serialiser the only thing allowed to emit them.** Declare
`EVENT_SCHEMA: Record<TelemetryEventType, { event: string; fields: Record<FieldName, string> }>`,
have `runtime.ts` build every payload **through** `serialise(type, values)` — which copies
only keys present in `EVENT_SCHEMA[type].fields` and drops everything else — and generate
the footer sentence from the field phrases, not the event phrases. Then `tsc` fails on an
undescribed field, `TC-TELEMETRY-04` extends to field sets, the collector's allowed-key
switch (`TM-30`) is compared against the *same* map, and it becomes structurally impossible
for the runtime to transmit a datum the page does not disclose — closing F-1, hardening F-7
(an undisclosed `gl` cannot be sent at all), and turning §16's diagram from an argument into
a guarantee. That one change is what §16 already claims to be, and it costs about thirty
lines.
