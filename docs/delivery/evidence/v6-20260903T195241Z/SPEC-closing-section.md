# SPEC · The Closing Section — "Always willing to listen — feedback & Coffee?"

Run `v6-20260903T195241Z` · **R-177, R-18, R-60, R-96, R-185, R-181, R-179, R-63, R-64** ·
SC-91.1, SC-92.1, SC-39.1, SC-41.1 · Gate H, Gate K, Gate R

**Authority.** `AUDIT-RECONCILIATION.md` (ground truth), `DECISIONS.md` D-01/D-04,
`design-system-lock.md`, `encoding-grammar.md`, `hero-visualisation-register.md` §6,
`peak-end-record.md` §2/§5, `statement-trait-map.md` rows 5/13/14, `dataset-layer-design.md`.
This document is the build order for the sixth section and the site's footer. An implementer
executes it without making a further design decision.

---

## 0 · The first question: rebuild Listen, or build a new section?

**Ruling: rebuild `components/sections/Listen/` in place. Do not create a new directory, and do
not rename the existing one.**

**Why not a new section.** §13 forbids a duplicate implementation where one already exists. The
closing section exists in substance: `components/sections/Listen/Listen.tsx` (103 lines) already
carries four of the six things R-177 asks for — the mandated title, the site's only italic
sentence, four real contact anchors with an argued refusal of a contact form, and the corrections
ledger. `peak-end-record.md` §2 lists exactly two structural defects (no participatory
interactive; contact and CTAs scattered) and two content defects (boilerplate colophon standing in
for a footer; a self-presentational avatar). Those are repairs, not a greenfield.

**Why not a rename to `Closing/`.** `SPEC-explainer.md` rows 8–10 and `TC-RM-01`/`TC-RM-05` address
`components/sections/Listen/Listen.tsx` **by path and by line number**, and an implementer is
working that tree concurrently. A directory rename would break a live spec for no design gain. The
directory name is an implementation detail; the **section id** is the contract, and that changes.

**Why not "keep Listen and add a seventh section".** SC-91.1 requires **exactly six sections in the
mandated order**. A seventh fails Gate R outright.

**The corrections ledger is preserved without alteration to its mechanism.** It is a genuine
integrity asset and the strongest thing in the section today: rows are harvested from `git log` at
build time by `scripts/build/feedback_log.mjs`, never hand-written, with the harvest's own
limitation printed on the page. Its build-time contract is unchanged. It gains exactly two things
(§10): a facet captured from the conventional-commit scope the script currently discards, and a
filter over that facet. It changes position — from a trailing block to the **left half of the Open
Caliper composition**, because the ledger is the evidence and the interactive is the invitation,
and they argue better side by side than stacked.

**What the section becomes, in one line.** The site spends five screens grading its own claims with
a caliper. In the sixth it hands the caliper to the reader and asks which claim they would measure
first — and prints, for the claim they pick, exactly what it would take to settle it.

---

## 1 · File manifest

### 1.1 Create

| Path | Purpose |
|---|---|
| `components/sections/Listen/OpenCaliper.tsx` | The participatory interactive. `'use client'`. |
| `components/sections/Listen/OpenCaliper.module.css` | Its only stylesheet. |
| `components/sections/Listen/CaliperRow.tsx` | One register row: claim, SVG aperture caliper, control. `'use client'`. |
| `components/sections/Listen/Ledger.tsx` | The corrections ledger, extracted from `Listen.tsx`, plus the facet filter. `'use client'`. |
| `components/sections/Listen/Ledger.module.css` | Its only stylesheet. |
| `components/sections/Listen/useCaliperCounts.ts` | Deferred fetch + submit hook. No dependencies beyond React. |
| `components/site/Footer.tsx` | The authored footer (R-181). Server component; no `'use client'`. |
| `components/site/Footer.module.css` | Its only stylesheet. |
| `app/data/portfolio/claims.ts` | The open-claim register — editorial copy + `sourceId` pointers only. |
| `app/data/generated/deploy-stamp.ts` | GENERATED. Build-time git facts. |
| `app/data/generated/perf-stamp.ts` | GENERATED. Measured LCP/CLS, or an explicit "not measured". |
| `app/data/generated/claim-ids.json` | GENERATED. The register's ids, copied into the function bundle. |
| `scripts/build/deploy_stamp.mjs` | Writes `deploy-stamp.ts`. |
| `scripts/build/perf_stamp.mjs` | Writes `perf-stamp.ts`. |
| `scripts/build/claim_ids.mjs` | Writes `claim-ids.json` + `functions/claim-ids.json`. |
| `scripts/validate/claim_register.mjs` | Static gate `TC-NFR-CLAIMS`. |
| `firestore.rules` | Deny-all client access. |
| `firestore.indexes.json` | Empty index set (single-doc reads only). |
| `tests/e2e/open-caliper.spec.ts` | TC-CALIPER-01…12. |
| `tests/e2e/footer.spec.ts` | TC-FOOTER-01…03. |
| `tests/e2e/contact-route.spec.ts` | TC-CONTACT-01…02, TC-CTA-01…02. |
| `tests/api/open_caliper.test.mjs` | TC-API-CAL-01…05 (`node --test`). |

### 1.2 Change

| Path | Change |
|---|---|
| `components/sections/Listen/Listen.tsx` | `id="listen"` → `id="contact"`; alias anchor; compose `<Ledger />` + `<OpenCaliper />`; remove `<Avatar />` (R-147, owned by `SPEC-explainer.md` rows 8–10); remove the tel/LinkedIn/GitHub channels. |
| `components/sections/Listen/Listen.module.css` | Quiet-plate + composition grid; hairline recoloured off gold; measures onto `--measure-read` / `--measure-display`. |
| `app/data/portfolio/listen.ts` | Channels reduced to one; new copy block for the interactive; colophon rewritten (R-183). |
| `app/data/portfolio/hero.ts` | Delete `actions.secondary` (Download CV) and the `Email` link; keep GitHub; drop LinkedIn. |
| `components/sections/Hero/Hero.tsx` | Remove the secondary `<a download>` (lines 89–95); `.actions` becomes a single primary path. |
| `components/site/Navigation.tsx` | `#listen` → `#contact`, label → `Always willing to listen`; delete the `Download CV` entry from `NAV_LINKS` (line 26); keep the persistent `.nav-cv` chip and the LinkedIn route. |
| `app/page.tsx` | Mount `<Footer />` after `</main>`. |
| `scripts/build/feedback_log.mjs` | Capture `type` and `scope`; emit `facet`; keep every other rule byte-identical. |
| `functions/index.js` | Add `openCaliper`. No change to `elevenLabsTts` or `minivicChat`. |
| `functions/package.json` | Add `firebase-admin` (Firestore only). |
| `firebase.json` | Add the `/api/caliper` rewrite and the `firestore` block. |
| `package.json` | `build` and `build:static` gain `deploy_stamp.mjs`, `perf_stamp.mjs`, `claim_ids.mjs`. |
| `scripts/validate/overhaul_static_audit.mjs` | Register `TC-NFR-CLAIMS`. |
| `tests/e2e/listen.spec.ts` | Amend TC-LISTEN-02/03/04/06 per §11.6. |

### 1.3 Delete

`components/sections/Listen/Avatar.tsx`, `Avatar.module.css`, `app/data/portfolio/avatar.ts` and
the 4,078,491 bytes of avatar assets — **owned by `SPEC-explainer.md` §1**, listed here only so the
closing section's composition is not written around a component that is being removed. This spec
assumes `.inner`'s last child is the ledger before it starts.

---

## 2 · The participatory interactive — **The Open Caliper**

### 2.1 What a visitor actually does

Fifteen figures on this site are drawn with a caliper that says *not measured*: eleven
`self-reported` and four `open` (`AUDIT-RECONCILIATION.md`: 15 marks live, none `sourced`). The
site has spent five screens admitting this. The closing section lists all fifteen, side by side
with the corrections ledger, and asks one question:

> **Which of these would you check first?**

The visitor picks exactly one row. Three things happen, in this order, inside 440 ms:

1. **Their mark is drawn.** A 1 px `--white` tick appears inside that row's caliper aperture,
   direct-labelled `yours`. It is the only mark on the site that belongs to the reader.
2. **The aperture opens.** Every row's caliper is an **open** bracket — dashed arms that do not
   meet — whose *aperture* is set by how many readers picked that claim. The visitor's own
   increment widens the one they picked. The instrument visibly moves.
3. **The row unfolds.** It reveals two authored lines the visitor could not have seen before
   participating: `settledBy` — the exact measurement that would move that claim from *not
   measured* to *measured, source given* — and, when it exists, `blockedBy` — why that measurement
   does not exist yet.

Optionally, and never required, the visitor may type a correction (≤ 240 characters). It is never
published anywhere. If it is acted on, it appears in the ledger to its left as a commit. The panel
says exactly that.

### 2.2 What it returns, and why it is the second-strongest moment

It returns **the site's own audit plan, one row at a time, and only to people who participate.**

That is the memorable beat, and it is memorable for a reason that no animation can buy: a portfolio
site asks the visitor which of its claims they trust least, and then answers *"here is precisely
what I would have to do to prove it, and I have not done it."* The peak (the Lattice, §1) is a
demonstration of capability. The ending is a demonstration of **character**, and it works by
subtraction in exactly the way `peak-end-record.md` §2 requires: the first viewport of the section
is still almost empty — kicker, title, one italic sentence, one hairline, one address — and the
instrument is handed over below it, without a gate, without a click, by scrolling.

The reward is never gamified. Nothing is promised. The only thing that happens is that the
instrument moved, and the reader can see it move.

### 2.3 The named skill it demonstrates (R-64)

> **Evidence engineering, and privacy-preserving server design on a static export.**
>
> Building the receipts for a claim instead of repeating the claim — a build-time harvest of this
> repository's own history with its limitation printed on the page — and then adding a
> participatory server surface to a statically exported site without acquiring a single
> identifier: no cookie, no session, no address, no fingerprint, no IP retained.

Rendered on the page, verbatim, in the dossier line beneath the composition. R-64 requires the
"WoW" moment to name the skill; this is that sentence.

### 2.4 The data, and its provenance (R-95, R-111)

Three data sources feed the composition. **No model produces any quantitative mark anywhere in this
feature** (R-111); there is no LLM call on this path at all.

| Mark | Value | Source | Caliper state |
|---|---|---|---|
| The claim text on each row | the claim as the site already states it | `app/data/portfolio/claims.ts` (editorial copy, per `dataset-layer-design.md` §5.1) | — (prose) |
| The claim's own figure and grading | resolved through `sourceId` | canonical dataset → `selectors.ts` → `provenance-index.v1.json` | `self-reported` or `open`, **derived**, never authored |
| The aperture on each row | reader count for that claim | `GET /api/caliper` → Firestore `caliper/{claimId}.n`, with `observedAt` from the response | the row's caliper stays **`open`**; the aperture is `sourced` |
| Ledger rows | commit hash, date, subject, facet | `scripts/build/feedback_log.mjs` ← `git log` | — (verbatim record) |

**The state ruling, and it is load-bearing.** A row's caliper is drawn `open` — *sought, and not
yet measured* — because the thing the row names is genuinely not measured, and a click counter does
not measure it. The **aperture** of that open bracket is a real, sourced quantity: how many readers
asked for it, with the endpoint, the count and the retrieval time all printed. So the reader widens
a gap the site has already admitted to. **The claim is never graded higher than its evidence**, and
the interactive cannot promote anything: there is no code path in this section that emits a
`sourced` caliper on a claim row.

**Provenance is on the page, not in this document.** Beneath the rail, in mono at `--fs-micro`:

```
counts observed 2026-09-03T21:04:11Z · GET /api/caliper · 214 marks set by readers
one vote per browser, enforced in your browser · no identifier is sent or stored
```

`observedAt` is the function's response field, not the client's clock. When the fetch has not
resolved, or failed, that line reads the authored empty state of §2.9 — never `0`, never a
placeholder (R-175, `encoding-grammar.md` §2.4).

### 2.5 Exact types

`app/data/portfolio/claims.ts`:

```ts
/**
 * The open-claim register — editorial copy and drawing ids only.
 *
 * One row per figure on this site that is NOT graded `sourced`. Every figure lives
 * in the canonical dataset; this file carries only the sentence a reader sees, the
 * pointer that resolves it, and the authored line saying what would settle it.
 * No numbers live here (dataset-layer-design.md §5.1).
 */
export type SectionAnchor = '#hero' | '#about' | '#experience' | '#skills' | '#vitrine';

export interface OpenClaim {
  /** Stable, kebab-case, never reused. Sent to the endpoint; also the Firestore doc id. */
  readonly id: string;
  /** Dot-notated key that MUST resolve in provenance-index.v1.json. */
  readonly sourceId: string;
  /** Where the mark actually renders, for the drill-down. */
  readonly section: SectionAnchor;
  /** The `data-mark-id` of the rendered mark, for the scroll-and-highlight. */
  readonly markId: string;
  /** The claim, as the site states it. <= 92 characters, no figure repeated. */
  readonly claim: string;
  /** The exact measurement that would make it `sourced`. <= 140 characters. */
  readonly settledBy: string;
  /** Why that measurement does not exist yet. `null` when nothing blocks it but time. */
  readonly blockedBy: string | null;
}

export const openClaims: readonly OpenClaim[] = [ /* exactly 15 rows, see §2.6 */ ];
```

`components/sections/Listen/useCaliperCounts.ts`:

```ts
export type CaliperPhase = 'idle' | 'observing' | 'observed' | 'unobserved' | 'submitting';

export interface CaliperCounts {
  /** claimId -> count. A claim absent from the map has never been picked; render `open`, not 0. */
  readonly counts: Readonly<Record<string, number>>;
  readonly total: number;
  /** Server clock, ISO-8601 with `Z`. Never the client's clock. */
  readonly observedAt: string;
}

export interface CaliperState {
  readonly phase: CaliperPhase;
  readonly data: CaliperCounts | null;
  /** The claim this browser has already set, from localStorage `fm.caliper.v1`. */
  readonly mine: string | null;
  /** Authored, never an exception message. */
  readonly failure: string | null;
}

export function useCaliperCounts(rootRef: React.RefObject<HTMLElement>): CaliperState & {
  set(claimId: string, note?: string): Promise<void>;
};
```

**Contract on the hook.** One `GET` per page view, issued only after `rootRef` intersects the
viewport at `rootMargin: '200px 0px'`, threshold `0`. `AbortController` on unmount. 4000 ms
timeout. `cache: 'no-store'`. On any failure the phase is `'unobserved'`, `data` stays `null`, and
`failure` carries the authored line from §2.9. It never retries automatically and never polls.

### 2.6 The register — exactly fifteen rows, and how they are validated

The register contains **one row per live non-`sourced` mark**, currently fifteen. It is authored,
because the claim sentence and the `settledBy` line are prose; it is not free, because
`scripts/validate/claim_register.mjs` (`TC-NFR-CLAIMS`) fails the build unless all of the
following hold:

1. `openClaims.length` equals the count of `[data-caliper]` marks whose state is not `sourced`, as
   emitted by the dataset-integrity pass. Parity, both directions.
2. Every `id` is unique, kebab-case, `^[a-z0-9-]{3,48}$`.
3. Every `sourceId` resolves in `public/dataset-provenance.json`. Until the canonical dataset lands
   (`dataset-layer-design.md` §7), it resolves against the checked-in allow-list
   `app/data/canonical/source-ids.allow.json`, and the gate prints which mode it ran in.
4. `claim.length <= 92`, `settledBy.length <= 140`, no row's `settledBy` is empty or a rephrasing
   of `claim` (Levenshtein ratio > 0.75 fails).
5. `app/data/generated/claim-ids.json` and `functions/claim-ids.json` are byte-identical to the
   ids derived from the register. A drifted function allow-list is a build failure, not a 400 at
   runtime.

**Two rows, written out in full, as the pattern every other row follows:**

```ts
{
  id: 'ato-evidence-effort',
  sourceId: 'cv.roles.ato.metrics.evidenceEffortRemoved',
  section: '#hero',
  markId: 'hero-ledger-1',
  claim: '≈92% of evidence effort removed on ATO Payday Super, across 200+ SIT scenarios.',
  settledBy: 'The before/after effort log for those 200+ scenarios, published with the counting rule used.',
  blockedBy: 'The log is inside the ATO programme and is not mine to publish.',
},
{
  id: 'anz-portfolio-value',
  sourceId: 'cv.roles.anz.metrics.portfolioValue',
  section: '#experience',
  markId: 'exp-anz-portfolio',
  claim: '$5M+ programme portfolio led across 5+ squads and 40+ practitioners.',
  settledBy: 'The approved programme budget line, or a reference from the accountable executive.',
  blockedBy: null,
},
```

The remaining thirteen rows are authored by the implementer from the fifteen live marks recorded in
`T40-self-claim-register.json`, one row per entry, in that file's order. The register file carries
the doc comment above verbatim.

### 2.7 Exact geometry

**Composition.** Inside `<section id="contact">`:

```
.plate            88svh, unchanged from today   — kicker · title · italic sentence · hairline · canonical route
.composition      grid                          — [ Ledger ] [ OpenCaliper ]
.dossier          one paragraph                 — the named skill (§2.3) + the takeaway line
```

```css
.composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-8);            /* 4rem */
  max-width: 72rem;
  margin: 0 auto;
  padding-block: var(--space-14); /* 7rem */
}
@media (min-width: 64rem) {
  .composition {
    grid-template-columns: minmax(0, 26rem) minmax(0, 1fr);
    gap: var(--space-10);         /* 5rem */
    align-items: start;
  }
}
```

**The rail.** One `<svg>` per row, never one SVG for the rail — a row must survive being reordered
without re-laying-out its neighbours.

```
row height          44px  (>= WCAG 2.5.8 target size; no exception)
row gap             var(--space-1)  = 8px
svg                 width:100%; height:28px
viewBox             "0 0 400 28"
preserveAspectRatio "xMinYMid meet"
every stroke        vector-effect="non-scaling-stroke"
baseline            y = 14
track               x = 0 .. 400
aperture            a = 20 + 380 * (count / maxCount)      maxCount = max over the register, min 1
                    domain anchored at 0; never truncated (encoding-grammar §2.2)
```

Jaw glyph, drawn twice — at `x = 0` (fixed) and at `x = a` (animated):

```
arm     M {x} 8  L {x} 20                       stroke-width 1  stroke-dasharray "3 3"
serif   M {x} 8  L {x + s} 8                    stroke-width 1  s = +4 on the left jaw, -4 on the right
serif   M {x} 20 L {x + s} 20                   stroke-width 1
gap     M 0 14 L {a} 14                         stroke-width 1  stroke-dasharray "2 6"  opacity .5
```

Colours — **no gold anywhere in the rail** (§2.10):

| Element | Token |
|---|---|
| arms, serifs | `--mist-400` |
| gap rule | `--ink-500` |
| track (unfilled remainder) | `--ink-700` |
| the reader's own tick `M {a} 4 L {a} 24` | `--white`, 1 px |
| row label | `--mist-200` at `--fs-small` |
| count readout, mono, `tabular-nums` | `--mist-400` at `--fs-caption` |
| `settledBy` on unfold | `--mist-200` at `--fs-small`, measure `--measure-read` |
| `blockedBy` on unfold | `--mist-400` at `--fs-caption`, mono |

**Motion.** Only `transform` and `opacity` animate. The right jaw and the reader's tick live in one
`<g data-aperture>` translated on the x axis; `d` attributes never animate.

| Beat | Duration | Easing |
|---|---|---|
| aperture opens after a set | `var(--motion-emphatic)` **440 ms** | `var(--motion-ease-emphasized)` `cubic-bezier(0.16, 1, 0.3, 1)` |
| counts arrive (first paint of apertures) | `var(--motion-cine-in)` **720 ms**, staggered `var(--stagger-tight)` **60 ms** by row | `var(--motion-ease-emphasized)` |
| row unfold (`settledBy`) | `var(--motion-base)` **320 ms** height + opacity | `var(--motion-ease-standard)` `cubic-bezier(0.22, 1, 0.36, 1)` |
| hover / focus colour change | `var(--motion-fast)` **200 ms** | `var(--motion-ease-standard)` |
| the reader's tick appears | `var(--motion-fast)` **200 ms** opacity only, 120 ms after the aperture starts | linear |

`will-change: transform` is set on `[data-aperture]` only while a transition is in flight and
removed on `transitionend`. No element in this section carries a permanent `will-change`.

**Breakpoints.** `< 40rem`: rail rows stack label above caliper, svg height 24, aperture domain
`16 .. 380`. `40rem–64rem`: single column, rail full width. `>= 64rem`: two columns per the grid
above. `>= 90rem`: no further change — the composition is capped at `72rem` and centres.

### 2.8 The four required interactions (R-97)

1. **Hover reveal.** Hovering a row reveals, in mono at `--fs-micro` on the row's second line, the
   `sourceId` and the caliper's state gloss (`Not measurable; reason given.` / `Self-reported
   figure.`). Text colour `--mist-200` → `--white`, edge `--card-border` → `--card-border-hover`,
   `--motion-fast`. Two signals change, never colour alone.
2. **Focus and zoom.** The rail is a `radiogroup` with roving tabindex (§2.11). Each row carries a
   section chip — `#experience` — which is a real in-page link: activating it scrolls to that
   section and applies `[data-marked="true"]` to the element whose `data-mark-id` matches the row's
   `markId` for 1200 ms (a 2 px `--white` inset rule, `--motion-base` in and out). That is the
   drill-down from the summary straight to the mark in situ.
3. **Filtering.** The **ledger** filters by facet — `copy · data · motion · accessibility ·
   unclassified` — with the visible/total counts announced in `aria-live="polite"`. The
   `unclassified` facet is always rendered and never hidden: an unlabelled correction is a real
   record, and suppressing it would make the ledger look tidier than the history is (R-175).
4. **The curiosity-rewarding state.** Setting a claim unfolds `settledBy` and `blockedBy`. Nothing
   else on the site says what it would take to prove itself, and the only way to see it is to
   participate.

### 2.9 States — all seven, per `design-system-lock.md` §5.3

| State | Rendering |
|---|---|
| rest | row `--mist-200`, edge `--card-border` |
| hover | `--white` text, `--card-border-hover`, `--elev-1`; no transform on the label |
| focus-visible | `outline: 2px solid var(--white); outline-offset: 3px` — never removed, never colour-only |
| active | `transform: translateY(1px) scale(0.995)` on the row control, `--motion-fast` `--motion-ease-exit` |
| disabled | after this browser has set a claim, other rows are **not** disabled — they are re-settable; the control is only disabled while `phase === 'submitting'`, with `aria-disabled`, `--ink-300` label, `--ink-500` edge, `opacity: 1` |
| loading | `aria-busy="true"`; the label stays; a 1 px indeterminate rule in `--mist-400` traverses the row's bottom edge at `var(--motion-cine)` 900 ms. **No spinner. No label swap.** Under reduced motion the rule is static at 40 % width with `aria-busy` still set |
| empty / unobserved | never blank, never `0`. The apertures render at their **minimum** (`a = 20`, i.e. the open bracket at rest) and the provenance line reads the authored copy in §8.4 |

**Failure copy is authored, never an exception string.** Three cases, three lines, all in §8.4:
counts unavailable; submission refused; the note field rejected.

### 2.10 The gold rule in this section (R-110, `design-system-lock.md` §1.3–§1.4)

- **The rail carries no gold.** Nothing in it is `sourced`; painting it gold would be the exact
  failure the token file warns about.
- **The closing hairline `Listen.module.css:69` loses its gold.** It is item #8 in the lock's audit
  — "borderline, decorative, not a figure with a source". It becomes `background: var(--ink-500);
  opacity: 1`, a true hairline. The section's one gold mark is spent on something that has earned
  it.
- **The section's single saturated gold mark is the footer build bracket** (§6.3) — the one figure
  on this site that is measured with its source printed, and therefore the first `sourced` caliper
  the site actually renders. `AUDIT-RECONCILIATION.md` records that the `sourced` state is defined
  and rendered nowhere; the closing section is where it finally appears, on the only claim the site
  can prove absolutely: what this build is and when it was made.
- Mechanically: exactly one `[data-gold="true"]` element exists between `#contact` and the end of
  the document (`TC-CALIPER-08`).

### 2.11 Accessibility (R-101) — the full contract

**Keyboard traversal.** The rail is `role="radiogroup"` with `aria-labelledby` pointing at the
rail's `<h3>`. Roving tabindex: exactly one row has `tabindex="0"`, the rest `-1`. `ArrowDown` /
`ArrowRight` → next; `ArrowUp` / `ArrowLeft` → previous; `Home` / `End` → first / last, all
wrapping; `Space` and `Enter` set. Each row is `role="radio"` with `aria-checked`. The section chip
is a separate tab stop *inside* the row, reachable with `Tab` from the focused row, and does not
change the radio selection.

**ARIA structure.**

```
<section id="contact" aria-labelledby="contact-title">
  <div data-closing-plate> … </div>
  <div class="composition">
    <section aria-labelledby="ledger-title">        <!-- Ledger -->
      <div role="toolbar" aria-label="Filter corrections by what was corrected"> … </div>
      <ol> … </ol>
      <p aria-live="polite" aria-atomic="true">Showing 6 of 8 corrections · data</p>
    </section>
    <section aria-labelledby="caliper-title" data-caliper-rail>
      <div role="radiogroup" aria-labelledby="caliper-title" aria-describedby="caliper-help"> … </div>
      <p id="caliper-help"> … </p>
      <p aria-live="polite" aria-atomic="true" data-caliper-status> … </p>
      <table class="visually-hidden" data-caliper-alt> … </table>
    </section>
  </div>
  <p data-dossier> … </p>
</section>
<footer> … </footer>
```

Every `<svg>` inside a row carries `role="img"` and an `aria-label` reading
`"{claim} — {n} readers would check this first"`, or `"{claim} — not yet observed"`.

**Insight-equivalent text alternative.** `[data-caliper-alt]` is a visually-hidden `<table>` with
`<caption>`, one row per register entry, in the same order as the rail, columns: *Claim* · *Where
it appears* · *Readers who would check this first* · *What would settle it*. Each `<tr>` carries
the same `data-source-id` as its visual row. A screen-reader user gets the `settledBy` lines
without having to participate — the reward is a visual flourish, never a gate on information.

**The reduced-motion composition — a re-score, not silence.** Under
`prefers-reduced-motion: reduce`:

- apertures render at their **final** width on first paint; nothing travels;
- rows still arrive in order, by opacity alone, at `--stagger-tight` 60 ms — the ordered fade
  generalised from `Hero.module.css:389-398`;
- colour and border transitions survive at `--motion-fast`, because killing them makes the
  interface feel broken rather than calm;
- the loading rule is static at 40 % width with `aria-busy` intact;
- the reader's own tick appears instantly and is *thickened to 2 px* — the emphasis motion would
  have carried is moved into weight. The composition is still beautiful and is still legible as an
  instrument.

### 2.12 Dual-read (R-99)

| Read | Delivered by |
|---|---|
| **3 s headline** | The rail's `<h3>`: *"Fifteen figures on this site are not measured. Which would you check first?"* — the count is rendered from `openClaims.length`, never typed. |
| **30 s detail** | The apertures ordered by demand, each direct-labelled with its count and the section it lives in, beside the corrections ledger showing what has already been fixed. |
| **One-line takeaway, site's voice** | *"I have been wrong often enough to want to hear it early — here is the list, and here is where you add to it."* |

### 2.13 Performance envelope (R-100)

| Budget | Value | How it is met |
|---|---|---|
| Render class | **SVG** — precision graphics (R-109, `encoding-grammar.md` §6). No WebGL. No canvas. | — |
| Declared memory ceiling | **≤ 3.5 MB** JS heap attributable to this section | 15 rows × ~40 DOM nodes; no image, no font, no texture, no worker |
| New dependencies | **zero** | React + the platform |
| Section JS | **≤ 9 KB** gzipped | `OpenCaliper` + `CaliperRow` + `Ledger` + the hook |
| Section transfer | **≤ 48 KB** gzipped total, including CSS | no new asset of any kind |
| Network | **one** `GET` per page view; one `POST` per submission | deferred by IntersectionObserver, aborted on unmount |
| LCP | **no contribution** | the section is below the fold; its DOM is server-rendered and static until intersection |
| CLS | **0.000** from this section | the aperture track is laid out at full width at SSR; only a `<g transform>` moves when counts arrive. Asserted, not assumed (`TC-CALIPER-10`) |
| Frame rate | **60 fps** with everything active | transform/opacity only; 15 concurrent transitions on 15 compositor layers; `will-change` added and removed per transition |
| Lazy init | the hook mounts inert; no fetch, no listener, no observer callback work until intersection | |
| Disposal | `AbortController.abort()`, `IntersectionObserver.disconnect()`, every `transitionend` listener removed, `will-change` cleared, on unmount | |
| Low-power path | with JavaScript failed or slow, the rail renders every row, every claim, every section chip and the whole hidden table from the static register, with apertures at rest and the authored *not yet observed* line. **The section is fully readable and fully navigable with no script at all** | |

**Measurements to record in the dossier (R-112).** Taken on the Playwright perf project, mid-tier
mobile emulation, 4G throttle: section JS transfer (gz), section CSS transfer (gz), heap delta
across mount→settle→unmount, worst frame time during a 15-row aperture animation, CLS contribution,
`GET /api/caliper` p50/p95 latency. Written into `app/data/canonical/dossiers.ts` under id
`open-caliper`, with the run URL.

---

## 3 · The server layer (D-04)

**Ruling.** Built on the already-working Firebase Cloud Functions path that serves
`minivicChat` — not on the uninstalled `services/` stack, not on a new VPS vhost.

### 3.1 The endpoint

`functions/index.js`, appended, sharing the existing `applyCors` and `ALLOWED_ORIGINS`:

```js
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const CLAIM_IDS = new Set(require("./claim-ids.json"));   // generated; drift fails the build
const NOTE_MAX = 240;
const BODY_MAX = 1024;

exports.openCaliper = onRequest(
  { region: "us-central1", maxInstances: 3, timeoutSeconds: 10, memory: "256MiB" },
  async (req, res) => { /* … */ },
);
```

| Method | Behaviour |
|---|---|
| `OPTIONS` | 204, CORS preflight, same allow-list as the existing functions |
| `GET` | Reads all docs in `caliper`. Returns `{ counts, total, observedAt }`. `observedAt` is `new Date().toISOString()` **on the server**. `Cache-Control: public, max-age=60` |
| `POST` | Body `{ claimId, note? }`. Rejects: body > `BODY_MAX` → **413** `payload_too_large`; `claimId` not in `CLAIM_IDS` → **400** `unknown_claim`; `note` not a string or > `NOTE_MAX` → **400** `note_invalid`. On success: `caliper/{claimId}.n` via `FieldValue.increment(1)`; if `note` is non-empty, one document in `caliper_notes` with **exactly** `{ claimId, note, at: FieldValue.serverTimestamp() }`. Returns the same shape as `GET`. `Cache-Control: no-store` |
| anything else | **405** `method_not_allowed` |

**What the function must never do**, and this is testable by reading it:

- never read `req.ip`, `req.headers['x-forwarded-for']`, `req.headers['user-agent']`, or any cookie;
- never write any field to Firestore other than the four named above;
- never set a `Set-Cookie` header;
- make exactly one `logger.error` call, on Firestore failure, with `{ code }` only — no request data.

### 3.2 Firestore

Database `(default)`, Native mode, location `us-central1` (co-located with the functions).

```
caliper/{claimId}        { n: number }                       — one doc per register id, created on first write
caliper_notes/{autoId}   { claimId, note, at }               — never read by the site, never rendered
```

`firestore.rules` — the client SDK is not used anywhere on this site, and must never be able to
reach this data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
  }
}
```

Only the Admin SDK inside the function reaches it. `firestore.indexes.json` is an empty index set:
every access is a full-collection read of at most 15 documents, or a single-doc increment.

### 3.3 Wiring

`firebase.json` — one rewrite added and one block added; the CSP is **unchanged**, because
`connect-src 'self'` already permits the same-origin `/api/caliper`:

```json
{ "source": "/api/caliper", "function": { "functionId": "openCaliper", "region": "us-central1" } }
```

```json
"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }
```

`functions/package.json` gains `firebase-admin` and nothing else.

### 3.4 Abuse and cost

There is no identifier, so there is no per-identity rate limit, and the spec does not pretend
otherwise. Cost is bounded structurally: `maxInstances: 3`, `timeoutSeconds: 10`, `BODY_MAX` 1024
bytes, one increment per request, an allow-list of 15 document ids so no attacker can create
documents. The page states plainly that one-vote-per-browser is enforced **in the browser**, so the
counts are indicative and not a poll (§8.3). That sentence is the honest version of this trade, and
R-183 requires it to be there.

---

## 4 · R-185 · One canonical contact route

**The canonical route is the email address `sarkar.vikram@gmail.com`**, recorded in
`corpus-cv.json → contact[0]` with provenance `{ source: 'CV', page: 1, section: 'CONTACT INFO' }`.
It is presented **once**, in the quiet plate of `#contact`, in the site's own register: mono, plain
anchor, no button, no icon, with the one-sixth-scale hairline that appears identically on hover and
on focus (`Listen.module.css`, unchanged mechanism), followed by a provenance line in
`--fs-micro`: *"One address. It is the one on page 1 of the CV below."*

It carries `data-contact-route="canonical"`. Exactly one element on the site carries that
attribute (`TC-CONTACT-01`). It carries **no gold** — an invitation is not evidence, and gold on a
call to action is precisely the brass the token file warns against.

**The nine scattered affordances, each named, each with its disposition:**

| # | Where it is today | What it is | Disposition |
|---|---|---|---|
| 1 | `app/data/portfolio/hero.ts:53` → `Hero.tsx:101-108` | `mailto:` in the hero availability row | **DELETED.** A second invitation above the fold is the dilution R-185 names. |
| 2 | `app/data/portfolio/hero.ts:51` → `Hero.tsx:101-108` | LinkedIn in the hero | **DELETED from the hero.** LinkedIn is auth-walled and returns HTTP 999 (`corpus-linkedin.json`); the hero is the site's argument, and it may not cite a source a reader cannot open. It survives once, as a route, at #4. |
| 3 | `app/data/portfolio/hero.ts:52` → `Hero.tsx:101-108` | GitHub in the hero | **RETAINED, RECLASSIFIED.** The row is relabelled as the hero's provenance line and the anchor carries `data-role="identity-link"`, not a contact attribute. It is where the work is, not where the person is. |
| 4 | `components/site/Navigation.tsx:25` (`NAV_LINKS`) | LinkedIn in the overlay menu | **RETAINED as the sole non-closing route.** Nav is chrome; it carries `data-role="route"`. Label unchanged. |
| 5 | `app/data/portfolio/listen.ts:24` | `mailto:` in the closing section | **PROMOTED to canonical.** This is the one invitation on the site. |
| 6 | `app/data/portfolio/listen.ts:25` | `tel:+61433224556` | **DELETED.** It is the only affordance on the site inviting an unscheduled interruption, it publishes a personal mobile number for no evidential purpose, and R-185 permits one route. The number remains in the CV, where a recruiter expects it. |
| 7 | `app/data/portfolio/listen.ts:27` | LinkedIn in the closing section | **DELETED.** Duplicate of #4. |
| 8 | `app/data/portfolio/listen.ts:31` | GitHub in the closing section | **MOVED, not deleted.** It stops being a "channel" and becomes the corrections ledger's own source citation: *"harvested from github.com/Victordtesla24/forgotten-mistory"*, `data-role="provenance"`. The link that was an affordance becomes evidence. |
| 9 | `components/MiniVicBot.tsx` mounted at `app/layout.tsx:142` | A floating conversational widget, site-wide | **DE-FLOATED.** R-75 and R-135 forbid a floating bubble pinned over the design, and `AUDIT-RECONCILIATION.md` confirms it ships as one. **This spec does not re-specify the bot**; it defines the contract the bot must satisfy here (§4.1). |

### 4.1 The interface contract for the conversational layer (cross-spec)

Binding on whichever spec owns `MiniVicBot`:

- The bot's **composed home is a mount point inside `#contact`**, immediately after `.composition`
  and before `[data-dossier]`: `<div id="conversation-home" data-conversation-home />`. Composed,
  in flow, no `position: fixed`, no overlay, no pinned window, no primary real estate at rest
  (R-135).
- It opens on the existing `fm:ask` `CustomEvent` (`{ detail: { seed: string } }`), the sibling of
  the `fm:page-ready` event `app/page.tsx:29-35` already raises.
- The closing section's own seed, dispatched by its one conversation path (R-57):
  `"Ask what I would want measured next"`.
- The bot is **not** a contact route and must never carry `data-contact-route`.

---

## 5 · R-179 · CTA consolidation

**The rule, stated once:** one primary path per section, phrased distinctly; the CV is the
follow-up, never the opening bid; zero stacked CV affordances in the first viewport.

**The three Download CV affordances the audit named, and what happens to each:**

| Where | Disposition |
|---|---|
| `Hero.tsx:89` (`hero.ts:49`, `actions.secondary`) | **DELETED.** The hero's `.actions` keeps exactly one control — the primary path *"See the evidence"* → `#experience`. The CV is not the opening bid. |
| `Navigation.tsx:26` (`NAV_LINKS`) | **DELETED.** A duplicate of the chip, inside a menu the chip sits beside. |
| `Navigation.tsx:154-157` (`.nav-cv`) | **RETAINED, and it is the only CV route.** It is chrome — a recruiter's utility, always reachable, never argued with. `data-role="route"`. |

**Plus one addition, which is the point of R-179:** the closing section offers the CV as the
**follow-up**, phrased distinctly and located after the reader has seen the evidence and set the
caliper:

> *The document these figures were graded against — 157,615 bytes, MD5 `16b856c0`. Run `md5sum` on
> it; it should match the digest printed on the calibration card in Skills.*

One `<a download>`, `href="/docs/Vik_Resume_Final.pdf"`, `data-role="takeaway"`.

**Net site-wide:** two anchors, one href, exactly one of them in the first viewport (the chip).
`TC-CTA-01` asserts all three facts.

**The six primary paths, phrased distinctly (R-57, R-179):**

| Section | Primary path |
|---|---|
| `#hero` | See the evidence |
| `#about` | Score me against your role |
| `#experience` | Read what the 92 % actually measures |
| `#skills` | See what is not on this card |
| `#vitrine` | Read the one I would start with |
| `#contact` | **Set the caliper** |

Rows 2–5 are owned by their own sections (`statement-trait-map.md` row 13); they are listed so the
distinctness requirement is checkable in one place. `#contact`'s path is an in-page anchor to
`#set-the-caliper`, not a modal and not a gate: the interactive is reachable by scrolling whether or
not the link is used.

---

## 6 · R-181 · The authored footer

**The site has no `<footer>` element at all** (`AUDIT-RECONCILIATION.md` A-7). The defect is
absence, not boilerplate. `components/site/Footer.tsx` is created and mounted in `app/page.tsx`
after `</main>`. It is a server component: it renders generated constants and nothing interactive.

### 6.1 What it carries, in order

1. **The statement** (R-53, R-54), one authored line, `--fs-lede`, `--measure-read`:
   *"This site is built the way I would like to be judged: every figure carries the state of its own
   evidence, and the ones I cannot prove are marked as such rather than left out."*
2. **The build bracket** — one `sourced` caliper, the section's single saturated gold mark (§6.3).
3. **The provenance line** for that bracket, in mono at `--fs-micro`, naming the exact commands.
4. **The rewritten colophon** (§8.3), which R-183 requires to change in the same commit that ships
   the endpoint.

No navigation, no repeated links, no social icons, no "all rights reserved". The footer is one
statement and one measurement.

### 6.2 Where the build metadata comes from — exactly

**`scripts/build/deploy_stamp.mjs`**, run from `build` and `build:static` before `next build`, in
the same generated-file discipline as `cv_fingerprint.mjs` and `feedback_log.mjs`. It executes,
via `execFileSync('git', …)` in the repository root:

| Field | Command | Notes |
|---|---|---|
| `commit` | `git rev-parse --short=7 HEAD` | |
| `committedAt` | `git log -1 --format=%cI` | ISO-8601 with offset, normalised to `Z` |
| `branch` | `git rev-parse --abbrev-ref HEAD` | |
| `dirty` | `git status --porcelain` non-empty | |
| `builtAt` | `new Date().toISOString()` | the build's own clock |
| `commitUrl` | `https://github.com/Victordtesla24/forgotten-mistory/commit/${full sha}` | full sha from `git rev-parse HEAD` |

Failure policy, identical to `feedback_log.mjs`: if `git` is unavailable (a tarball build, a
shallow checkout), the script writes `{ observed: false }` and the footer renders an **`open`**
caliper reading *"This build carries no commit — it was made outside the repository."* It never
writes a placeholder hash and there is **no hardcoded string anywhere in this path**.

**The honest wording, and the deviation it records.** The footer says **"built from"**, not "last
deployed". A build cannot know when it was released — the release happens after the bytes are
made — and a stamp that asserted a deploy time would be exactly the fabrication this section
exists to refuse. When `dirty` is true the bracket appends `+ local changes`, refusing to imply the
commit is the whole truth. A second line handles the service worker honestly, because
`TC-DURABLE-05` proves a stale document can be served offline:

> *You may be reading a cached copy; this is the build it came from.*

**`scripts/build/perf_stamp.mjs`** reads, in order, `.lighthouseci/lhr-*.json` then the Playwright
perf JSON report, and emits `{ observed: true, lcpMs, cls, measuredAt, runUrl }`. **If neither
exists it emits `{ observed: false }`** and the footer renders a second, separate `open` caliper:
*"LCP and CLS — not measured in this build."* It never estimates and never carries a figure forward
from a previous run.

### 6.3 The build bracket — geometry and the one gold mark

**One caliper, one bracket, one gloss**, enclosing every measured build fact on one line, so the
section spends exactly one gold mark (`design-system-lock.md` §1.4 rule 3 is therefore not needed
here — there is no second sourced mark to step down):

```
⌐ 7a3f9c1 · committed 2026-09-03T20:41:07Z · built 2026-09-03T21:02:11Z · LCP 1.42 s · CLS 0.019 ¬
  (Measured; source given.)
```

- rendered by the existing `components/marks/Caliper.tsx` with `state="sourced"`, which is the
  first `sourced` caliper the site actually renders;
- the element carries `data-gold="true"`, `data-deploy-stamp`, and the inner `<time datetime>` and
  `[data-commit]` hooks `TC-DURABLE-08` already expects;
- `7a3f9c1` is an anchor to `commitUrl` — the same pattern the corrections ledger already uses;
- all figures mono, `font-variant-numeric: tabular-nums`;
- when `perf-stamp` is unobserved, `LCP` and `CLS` are **absent from the bracket** (never `—`,
  never `0`) and the separate `open` caliper states why;
- the provenance line beneath, `--fs-micro` mono, `--mist-400`:
  `git rev-parse --short=7 HEAD · git log -1 --format=%cI · tests/perf/performance.spec.ts PERF-02, PERF-03`.

---

## 7 · R-63 · The one ungated post-visit takeaway

**It is the CV: `public/docs/Vik_Resume_Final.pdf`** — MD5 `16b856c0f3f4ec0d801fdde6d084452c`,
157,615 bytes, dated 2026-07-09, named as the *CV of record* in §1 of the master prompt and as one
of the four permitted R-8 sources.

- **Exactly one.** There is no second downloadable artefact anywhere on the site, and this spec
  adds none. `TC-TAKEAWAY-01` asserts the set of downloadable hrefs is the single-element set
  `['/docs/Vik_Resume_Final.pdf']`.
- **Ungated.** A direct `<a download>`. No form, no email wall, no interstitial, no analytics ping.
  The participatory interactive is explicitly **not** a gate on it: the CV offer sits beside the
  rail and does not read, respond to, or care about whether a claim was set.
- **It survives the visit.** Cached by the service worker (`TC-DURABLE-05`).
- **It is checkable.** Offered in the closing section with its byte count and digest printed and an
  invitation to run `md5sum` — the takeaway proves it is the same document the site was calibrated
  against.
- **Elegance obligation** (`peak-end-record.md` §5): the remedy is to typeset *this* document in
  the site's own language, never to add a second artefact. Owned by the takeaway workstream; the
  path, the single-artefact rule and the fingerprint are unchanged by this spec.

---

## 8 · Every authored string (R-81, R-82, R-183)

### 8.1 The quiet plate — unchanged where it is already right

`kicker`, `title`, `sentence` and the colophon's architectural clauses are Preservation-Register
assets and are carried verbatim. `sentence` remains the only italic on the site, twenty words, the
one line with no source printed under it.

### 8.2 New copy, `app/data/portfolio/listen.ts`

```ts
contact: {
  label: contact.email,
  href: `mailto:${contact.email}`,
  provenance: 'One address. It is the one on page 1 of the CV below.',
},
caliper: {
  eyebrow: 'Set the caliper',
  title: 'figures on this site are not measured. Which would you check first?', // prefixed with openClaims.length
  help:
    'Every one of these is drawn with an open bracket, because I could not measure it and said so. '
    + 'Pick the one you would want measured, and I will show you exactly what it would take to settle it.',
  yours: 'yours',
  settledLabel: 'What would settle it',
  blockedLabel: 'What is in the way',
  noteLabel: 'Or tell me what I got wrong (optional)',
  noteHelp:
    'This is not published anywhere and there is no address attached to it, so I cannot reply. '
    + 'If I act on it, it turns up in the list on the left as a commit. For a reply, write to the address above.',
  noteRefused:
    'That looks like an address or a phone number. Nothing here can reply to you — '
    + 'use the email above instead, and leave this for the correction itself.',
  submit: 'Set it',
  submitting: 'Setting',
  done: 'Set. The bracket beside it just opened by one.',
},
ledger: { /* title, lede, commitBase — unchanged */
  facets: ['copy', 'data', 'motion', 'accessibility', 'unclassified'],
  facetLabel: 'What was corrected',
  source: 'harvested from github.com/Victordtesla24/forgotten-mistory',
},
takeaway: {
  label: 'Download the CV',
  href: '/docs/Vik_Resume_Final.pdf',
  note: 'The document these figures were graded against — 157,615 bytes, MD5 16b856c0. '
      + 'Run md5sum on it; it should match the digest on the calibration card in Skills.',
},
```

The byte count and digest are rendered from `app/data/generated/cv-fingerprint.ts`, **never typed**.

### 8.3 The colophon, rewritten (R-183 — mandatory, same commit as the endpoint)

The current line ends *"no analytics, no trackers, no cookies"*. Shipping a counter without
rewriting it, or rewriting it without meeting the standard, both fail Gate R.

```
© 2026 Vikram Deshpande · Melbourne · static export · at most one WebGL context per section,
and none on a phone · no analytics, no trackers, no cookies · one counter, described where it
is used: it records which claim was picked and nothing else — no address, no identifier, no
session, no IP kept. Your own pick is remembered in your browser and never sent twice.
```

And, beside the interactive itself where the decision is actually made, in `--fs-micro`:

> *One vote per browser, enforced in your browser rather than on my server — so these counts are
> indicative, not a poll. Google's hosting layer keeps its own request logs, as every host does;
> nothing on this page joins them to you, and I do not read them.*

That second clause is not decoration. Claiming absolute purity while sitting on someone else's
infrastructure would be the same species of unfalsifiable claim the site exists to refuse.

### 8.4 Failure and empty copy — authored, never an exception string

| Case | Line |
|---|---|
| counts unavailable | *"The counts are not loading. The list is all here; only the tally is missing."* |
| submission refused | *"That did not go through. Nothing was recorded — try again, or write to the address above."* |
| note refused (address-shaped) | `caliper.noteRefused`, above |
| a claim nobody has picked | the bracket sits at rest with *"not yet picked"* in mono — never `0` |

---

## 9 · Section composition, ids and navigation

```tsx
{/* Back-compatibility: #listen was the id from the previous rebuild and is linked from
    tests, the nav history and external bookmarks. It is a zero-height anchor, not a wrapper. */}
<span id="listen" aria-hidden="true" className={styles.anchorAlias} />

<section id="contact" className={styles.listen} aria-labelledby="contact-title" data-section="closing">
  <div className={styles.plate} data-closing-plate>
    kicker · h2#contact-title · italic sentence · hairline · canonical contact route + provenance
    · the primary path "Set the caliper" → #set-the-caliper
  </div>

  <div className={styles.composition} id="set-the-caliper">
    <Ledger />
    <OpenCaliper />
  </div>

  <div id="conversation-home" data-conversation-home />

  <div className={styles.takeaway}> the CV, as the follow-up </div>

  <p data-dossier> the named skill (§2.3) · the takeaway line (§2.12) </p>
</section>
```

`<Footer />` follows, outside `<main>`.

**Navigation** (`components/site/Navigation.tsx`): `{ href: '#listen', label: 'Feedback & coffee' }`
→ `{ href: '#contact', label: 'Always willing to listen' }` (R-178: nav labels carry the mandated
section titles). The `Download CV` entry at line 26 is deleted. The LinkedIn route and the `.nav-cv`
chip are unchanged.

**Order** is unchanged and remains exactly six: `#hero · #about · #experience · #skills · #vitrine ·
#contact` (SC-91.1).

---

## 10 · The corrections ledger — the two changes

**Mechanism unchanged.** `scripts/build/feedback_log.mjs` keeps its qualification rules
(`CORRECTION` / `REVIEW_WORDS`), its `SHOWN = 8`, its `-400` window, its no-repository fallback, and
its printed limitation. The page keeps printing how many of the total it shows and the harvest date.

**Change 1 — capture the facet the script currently throws away.** The regex
`/^[a-z]+(\([^)]*\))?:\s*/i` strips the conventional-commit prefix and discards the scope. Capture
it, and map scope → facet through a table declared in the script:

```js
const FACETS = {
  copy: ['copy', 'content', 'listen', 'hero', 'about', 'vitrine', 'text'],
  data: ['data', 'dataset', 'skills', 'experience', 'chart', 'ledger'],
  motion: ['motion', 'anim', 'render', 'scene', 'webgl'],
  accessibility: ['a11y', 'aria', 'access', 'contrast', 'keyboard'],
};
// anything else -> 'unclassified'. Never dropped, never guessed.
```

`Correction` gains `readonly type: string` and `readonly facet: 'copy'|'data'|'motion'|'accessibility'|'unclassified'`.
Guessing a facet from the subject text is **prohibited**: the scope is data, the subject is prose.

**Change 2 — the filter.** A `role="toolbar"` of five toggle buttons above the list. Selecting one
filters the rows and announces `Showing 6 of 8 corrections · data` in the polite live region. The
`unclassified` facet is always present in the toolbar even when its count is zero, rendered in the
**disabled** state from `design-system-lock.md` §5.3 — an empty facet is information, and hiding it
would make the history look tidier than it is.

The GitHub link demoted from the channel list (§4, row 8) becomes this block's source citation.

---

## 11 · Tests

All Playwright specs run against the static export at `PLAYWRIGHT_BASE_URL`, using the repo's
existing no-webServer harness.

### 11.1 `tests/e2e/open-caliper.spec.ts`

| Id | Assertion |
|---|---|
| `TC-CALIPER-01` | `#contact [role="radio"]` count equals `openClaims.length`, and the `<h3>` prints that same number. |
| `TC-CALIPER-02` | Every row's `data-source-id` resolves in `/dataset-provenance.json` (or the allow-list, matching the gate's mode). Zero unresolved. |
| `TC-CALIPER-03` | With `javaScriptEnabled: false`, every claim, every section chip, the whole ledger and the whole hidden table are present; the rail carries `data-observed="false"`; no `0` appears as a count. |
| `TC-CALIPER-04` | Setting a row issues exactly one `POST /api/caliper`; the aperture group's `transform` x increases; a `[data-yours]` tick appears; `settledBy` becomes visible. A second page load reads `localStorage['fm.caliper.v1']` and re-marks the same row without posting. |
| `TC-CALIPER-05` | Roving tabindex: exactly one row has `tabindex="0"`; `ArrowDown`/`ArrowUp`/`Home`/`End` move focus and wrap; `Space` sets; the section chip is a separate tab stop that does not change `aria-checked`; focus ring computes to `2px solid rgb(244,246,250)` at `outline-offset: 3px`. |
| `TC-CALIPER-06` | `role="radiogroup"` with `aria-labelledby`; every row `aria-checked`; `[data-caliper-alt]` row count equals the rail row count and the `data-source-id` sets are identical; the live region text changes exactly once per set. |
| `TC-CALIPER-07` | For every element under `[data-caliper-rail]`, computed `color`, `background-color`, `stroke` and `fill` have saturation ≤ 0.28 — **no gold in the rail**. |
| `TC-CALIPER-08` | `document.querySelectorAll('#contact [data-gold="true"], footer [data-gold="true"]').length === 1`. |
| `TC-CALIPER-09` | Under `prefers-reduced-motion: reduce`: apertures are at final width at first paint; no element's `transform` changes during entrance; an ordered, staggered opacity sequence **is** observable; the reader's tick is 2 px. |
| `TC-CALIPER-10` | Layout-shift score attributable to `#contact` between SSR paint and counts-settled is `0.000`. |
| `TC-CALIPER-11` | Typing `me@example.com` into the note field surfaces `caliper.noteRefused`, and no request is issued. Typing a 241st character is prevented, not truncated silently. |
| `TC-CALIPER-12` | With `/api/caliper` routed to abort: phase `unobserved`, the authored line from §8.4 renders, apertures sit at rest, **no spinner exists anywhere**, and no `0` is rendered. |

### 11.2 `tests/api/open_caliper.test.mjs` (`node --test`, against the deployed function)

`TC-API-CAL-01` GET returns `{counts,total,observedAt}` with `observedAt` a parseable ISO-8601 `Z`.
`TC-API-CAL-02` POST with an unknown `claimId` → 400 `unknown_claim`, and no document is created.
`TC-API-CAL-03` POST with a 1,025-byte body → 413. `TC-API-CAL-04` POST with a 241-character note →
400 `note_invalid`. `TC-API-CAL-05` no response ever carries `Set-Cookie`.

### 11.3 `tests/e2e/contact-route.spec.ts`

`TC-CONTACT-01` exactly one `[data-contact-route="canonical"]` on the page; it is inside `#contact`;
its `href` is `mailto:sarkar.vikram@gmail.com`, matching `corpus-cv.json → contact[0].value`.
`TC-CONTACT-02` zero `a[href^="mailto:"]` and zero `a[href^="tel:"]` outside `#contact`.
`TC-CTA-01` zero CV affordances inside `#hero`; the set of `a[download], a[href$=".pdf"]` hrefs is
exactly `['/docs/Vik_Resume_Final.pdf']`; exactly one such anchor is within the first viewport.
`TC-CTA-02` the six primary paths return six distinct trimmed label strings.

### 11.4 `tests/e2e/footer.spec.ts`

`TC-FOOTER-01` exactly one `<footer>`; it contains the statement, `[data-deploy-stamp]` and the
colophon; it contains no navigation list and no `<a>` other than the commit link.
`TC-FOOTER-02` **the R-183 mechanical check** — if `[data-caliper-rail]` exists in the DOM, the
colophon text must contain the counter sentence; if it does not exist, the colophon must not
mention a counter. The claim and the code cannot drift apart.
`TC-FOOTER-03` when `perf-stamp` is unobserved, the bracket omits LCP/CLS entirely and a separate
`[data-state="open"]` caliper states why; when observed, the printed LCP is within 35 % of the
value measured in that run.

### 11.5 Amended existing tests

`TC-DURABLE-08` (`tests/overhaul/durability.spec.ts`) — as written in `statement-trait-map.md`
row 14, now satisfiable.
`TC-LISTEN-02` — the ≤ 65-word cap is rescoped from `#listen` to `[data-closing-plate]`. The quiet
plate keeps the constraint that made the section good; the composition below it is not prose.
`TC-LISTEN-03` — *"no form, no input, no third-party embed"* becomes: **no third-party embed, no
personal-data field, and exactly one `<input>`/`<textarea>` on the page — the optional, unpublished
correction note.** The doc comment in `Listen.tsx:18-21` that argues for no form is rewritten in the
same commit, because it is a statement about the code (R-183).
`TC-LISTEN-04` — *"all four channels"* becomes *"the one canonical channel"*, asserted against the
corpus value.
`TC-LISTEN-06` — the colophon assertion updates to the §8.3 text.
`SPEC-explainer.md` `TC-RM-05` — its `#listen`-scoped selector must become `#contact`, or it will
scope to the zero-height alias anchor and pass vacuously. **Flagged as a cross-spec amendment.**

### 11.6 New static gate

`TC-NFR-CLAIMS`, registered in `scripts/validate/overhaul_static_audit.mjs`, running
`scripts/validate/claim_register.mjs` — the five checks in §2.6. The audit goes from 10/10 to 11/11
(12/12 once `TC-NFR-GRID` lands).

---

## 12 · Build order

1. **Register and gate.** `claims.ts`, `claim_ids.mjs`, `claim_register.mjs`, `TC-NFR-CLAIMS`. No UI
   yet; the gate proves the register matches the marks before anything is drawn.
2. **Ledger extraction + facets.** `feedback_log.mjs` scope capture, `Ledger.tsx`, the filter,
   `TC-LEDGER-03`. Ships green on its own.
3. **The rail, static.** `OpenCaliper.tsx`, `CaliperRow.tsx`, SSR only, apertures at rest,
   `data-observed="false"`, the hidden table, full keyboard. `TC-CALIPER-01/02/03/05/06/07/09/12`
   pass **before any server exists**. This is the low-power path, and it is built first so it can
   never be an afterthought.
4. **The endpoint.** `openCaliper`, Firestore, rules, rewrite, `functions/claim-ids.json`,
   `tests/api`. Deployed and verified before the client calls it.
5. **The hook.** `useCaliperCounts`, deferred fetch, submit, localStorage, all failure states.
   `TC-CALIPER-04/08/10/11`.
6. **Contact and CTA consolidation.** The nine dispositions, the three CV dispositions, the nav
   change, the id change plus the alias. `TC-CONTACT-*`, `TC-CTA-*`.
7. **Footer and stamps.** `deploy_stamp.mjs`, `perf_stamp.mjs`, `Footer.tsx`, the build bracket.
   `TC-FOOTER-*`, `TC-DURABLE-08`.
8. **The colophon rewrite ships in the same commit as step 4's endpoint** — not step 7. R-183 is
   not satisfied by eventual consistency.

**Definition of done, per step:** `tsc` clean · `lint` clean · static audit 11/11 · full Playwright
suite green.

---

## 13 · Decisions taken in this spec, recorded for R-164

| # | Decision | Alternative rejected | Reversal cost |
|---|---|---|---|
| C-1 | Rebuild `Listen/` in place; id → `#contact` with a `#listen` alias | A `Closing/` rename — collides with `SPEC-explainer.md`'s line-addressed edits, live in another agent's tree | Nil |
| C-2 | Claim rows stay `open`; only the **aperture** is sourced | Grading a claim by popularity — would grade a claim above its evidence, failing the site's own standard | Nil |
| C-3 | No gold in the rail; the section's one gold mark is the footer build bracket, and the closing hairline loses its gold | Keeping the decorative hairline gold — item #8 in the lock's own audit, "borderline, not a figure with a source" | Low (one CSS line) |
| C-4 | The footer says **"built from"**, not "last deployed" | Asserting a release time a build cannot know — a fabrication | Low: add `releasedAt` later if `firebase_static_deploy.sh` is changed to write it back |
| C-5 | `tel:` deleted from the site | Keeping a second route — R-185 permits one; the number stays in the CV | Nil |
| C-6 | LinkedIn removed from the hero, retained in the nav | Citing an auth-walled source (HTTP 999) in the site's argument | Nil |
| C-7 | The optional note field exists, despite the section's historic "no form" posture | No participation at all — R-96 and R-177 require a participatory interactive; the posture's copy is rewritten with it, per R-183 | Moderate (removes the interactive) |
| C-8 | A sixth canonical module, `participation`, is added to the dataset's `SourceSystem` union | Rendering counts with no provenance — would fail R-95 | Low |
| C-9 | One-vote-per-browser is stated on the page as browser-enforced and indicative | Server-side dedup — requires an identifier, which §9 forbids | Nil |

---

## 14 · Requirement closure

| Requirement | Closed by | Evidence |
|---|---|---|
| R-177 | §0, §2, §9 — the sixth section at `#contact`, participatory, engineered to R-60 | `TC-CALIPER-01…12`, SC-91.1 |
| R-18 | §2, §10 — the ask is the rail; the willingness is the ledger, harvested not authored | `TC-LEDGER-01…03` |
| R-60 | §2.2 — the ending's strength is subtraction plus the handover of the instrument | T-24 panel → SC-39.1 |
| R-96 | §2 — the participatory interactive, SVG, second-strongest | `hero-visualisation-register.md` §6 |
| R-185 | §4 — one canonical route, nine dispositions | `TC-CONTACT-01/02` → SC-92.1 |
| R-181 | §6 — authored footer, honest build signal from git, no hardcoded string | `TC-FOOTER-01…03`, `TC-DURABLE-08` |
| R-179 | §5 — one primary path per section; CV as follow-up | `TC-CTA-01/02` → SC-92.1 |
| R-63 | §7 — the CV, named, ungated, singular, fingerprinted | `TC-TAKEAWAY-01` → SC-41.1 |
| R-64 | §2.3 — the named skill, printed on the page | `TC-CALIPER-01` (dossier present) |
| R-95, R-111 | §2.4 — every mark resolves to a dataset with named provenance; no model on this path | `TC-CALIPER-02`, `TC-NFR-CLAIMS` |
| R-97 | §2.8 — all four depths, all keyboard-reachable | `TC-CALIPER-04/05` |
| R-99 | §2.12 — three-second, thirty-second, one-line | Gate K |
| R-101 | §2.11 — traversal, ARIA, text equivalent, a re-scored reduced-motion composition | `TC-CALIPER-05/06/09` |
| R-100, R-112 | §2.13 — declared ceiling, lazy init, disposal, low-power path, measured dossier | `TC-CALIPER-10`, perf project |
| R-110 | §2.10, §6.3 — exactly one gold mark, and it means what gold means | `TC-CALIPER-07/08` |
| R-183 | §8.3 — the colophon changes in the endpoint's own commit | `TC-FOOTER-02` |
| R-75, R-135 | §4.1 — the bot's composed home, no floating widget | owned by the chatbot spec, contract fixed here |
