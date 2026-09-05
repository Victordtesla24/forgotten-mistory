# C20 — #listen business end, #about baseline, tenure parity

Cycle 20 lane (tasks `t_a88c6767` + `t_652f383d`), worktree
`.claude/worktrees/wf_d9fbfbaa-53a-1`, branch `worktree-wf_d9fbfbaa-53a-1`,
static export served on `127.0.0.1:5601`.

Backlog items closed: R-c8 **C-09** (#listen weight), R-c8 **C-11** (#about
baseline), R-c8 **ADV-F-4** / R-c13 **ADV-6** (tenure vs CV), R-c13 **CC-02**
(client engagement action), R-c13 **CC-05** (route weight), R-c13 **CC-09**
(closing section rhythm).

---

## 1. The tenure decision — keep "Sixteen years", print the derivation

`pdftotext -layout public/docs/Vik_Resume_Final.pdf -` line 3 reads:

```
15+ year Senior Technical Leader and Certified Scrum Master (CSM) specializing in
```

The role spans in `app/data/portfolio/experience.ts` (`SPANS`, month precision,
read off the CV's own `dates` strings) sum as follows, with `NOW = 2026 + 8/12`:

| role | start | end | years |
|---|---|---|---|
| ATO | Mar 2026 | current | 0.500 |
| Independent | Jun 2025 | Feb 2026 | 0.667 |
| ANZ | Sep 2017 | Jun 2025 | 7.750 |
| NAB | Nov 2016 | Sep 2017 | 0.833 |
| Microsoft | Oct 2015 | Sep 2016 | 1.000 |
| Telstra | Nov 2014 | Sep 2015 | 0.917 |
| InfoCentric | Aug 2011 | Nov 2014 | 3.250 |
| MYOB | May 2010 | Aug 2011 | 1.250 |
| **sum** | | | **16.167** |

Elapsed, first role to now: 2026.667 − 2010.333 = **16.333 years**.

Both measures clear sixteen on the CV's own dates, so the branch the task named
applies: **keep "Sixteen years" and print the derivation inside the same
element**. The alternative — rounding the page *down* to "15+" — would have made
the site disagree with the dates it draws to scale two sections later.

Applied in the three data files, never in a component string:

- `app/data/portfolio/experience.ts` — new `derivation: 'May 2010 → September 2026'`,
  rendered as a caption inside the `#experience` `<h2>` (`Experience.tsx`,
  `.titleDerivation`). The claim now carries its own arithmetic.
- `app/data/portfolio/hero.ts` — the statement reads "…telecommunications, May 2010
  to September 2026 — currently Scrum Master…".
- `app/data/portfolio/about.ts` — the Experience Level answer ends
  "…from May 2010 — sixteen years and four months to September 2026".

`app/data/generated/cv-fingerprint.ts` was **not** touched; it is written by
`scripts/build/cv_fingerprint.mjs` on every build.

**CT-11** (`tests/content/content-check.spec.ts`) walks the rendered DOM, takes
the deepest element stating any tenure figure, and requires that figure to be
either verbatim in the CV text (via `pdftotext`, when poppler is installed) or
accompanied by both anchor years — 2010 and 2026 — in the same element. Where
`pdftotext` is absent the verbatim escape hatch is simply unavailable and every
claim must carry its anchors: the test gets stricter, never skipped.

## 2. The client's action — a mailto, deliberately

R-c13 CC-02 is a blocker: #listen had four plain-text anchors and no way for a
business client to finish anything. There is no booking tool on this account,
and a Calendly-shaped URL that 404s would be worse than none — so the sanctioned
route is a pre-addressed enquiry the visitor's own mail client can send:

```
mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry%20%E2%80%94%20Vikram%20Deshpande
```

Copy lives in `app/data/portfolio/listen.ts` (`listenContent.engage`). The
subject is what makes it an engagement rather than a blank compose window, and
`AP-05` fails if it is ever emptied. **If the Owner names a booking tool, the
only change is the `href` in that data file** — the plate, its tests and its
styling are already in place.

## 3. Deviation from the C-09 direction: the route grid floor

R-c8 C-09 specified `repeat(auto-fit, minmax(16rem, 1fr))` for the routes. Two
measurements moved the floor off that number, and both are in
`06-measurements.log`:

1. Built literally with all four routes in tracks, 16 rem gives four 288 px
   tracks at 1440 — and the email plate, which the same direction asks for as a
   filled pill with `var(--space-4)` inline padding, measures **412 px**. The
   address overlapped the phone route beside it.
2. Moving the email onto its own full-width row (`.pillRow`, directly under the
   engagement plate) fixes the overlap and lets 16 rem stand — but then only
   three short addresses are left for four tracks, the fourth track sits empty,
   and the rightmost route ends at **1011 px of 1440 = 0.702**. That is the
   emptiness C-09 was written to close, one column narrower, and it clears the
   0.7 acceptance by three pixels: a gate that would flake on any host whose
   mono metrics differ.

The shipped floor is therefore **20 rem**, which lays exactly three tracks at
1440 for the three remaining addresses:

| width | tracks | rightmost route right edge | ÷ innerWidth |
|---|---|---|---|
| 1440 | 3 × 394.7 px | 1224 | **0.850** |
| 1280 | 3 × 362.7 px | 1128 | **0.881** |
| 834 | 2 × 359.3 px | 768 | **0.921** |
| 390 | 1 × 342 px | 327 | **0.838** |

Everything else in the direction is literal — `--fs-lede` mono at `--white`, the
pill's `var(--space-2) var(--space-4)` / 999 px, the `var(--space-4)` gap, and
the `auto-fit` collapse to one column on a phone with no second declaration.

## 4. C-11: the acceptance already held; the residual is inside the viewBox

The stated acceptance — "at 1440 the dial svg's bounding top equals the first
list item's top within 4 px" — passes at layout position **before** any CSS
change: `.body` is already `align-items: start` and nothing adds leading. Two
notes:

- The first measurement attempt read viewport rects mid-section and compared a
  *pinned* sticky instrument (top 160) against a scrolled list (top −185). The
  test now scrolls back to the document start and reads document-space tops,
  which is the only way to ask where the grid row begins.
- The 15 px the review measured (list rule y=600, dial's outer ring y≈615) is
  the bezel's inset **inside the compass viewBox**, not the wrapper's position.
  Closing that would mean redrawing the engraving, which is outside this task.

`align-self: start; margin-top: 0` is declared on `.instrumentStage` anyway, so
the invariant TC-ABOUT-13 guards is stated in the CSS rather than inherited by
accident.

## 5. Two existing tests re-pointed (neither weakened)

- **TC-LISTEN-05** hovered `#listen a:first`. The engagement plate now leads the
  routes and carries no `::after` underline, so `a:first` would have gone on
  passing while testing nothing. Pinned to the `tel:` channel, which is a real
  `.channel`.
- **CT-09** asserted a single `a[href^="mailto:"]`. Two anchors carry the address
  now — the plate (with subject) and the route (verbatim) — so the check names
  each explicitly: the route must be exactly `mailto:sarkar.vikram@gmail.com`,
  and the plate's href must carry a non-empty subject.

## 6. No second motion beat

MOT-F-4 confirmed the caliper-close as the section's one beat. Nothing added
here animates: the plate and the pill change **opacity on hover/focus only**,
which is a state, not a beat, and the reduced-motion block is unchanged.
TC-LISTEN-06/07/08 stayed green throughout.

## 7. Two housekeeping notes from the resumed run

- **Port.** 5601 was already held by a live sibling worktree
  (`wf_31b6f314-9ff-1`, `python3 -m http.server 5601`, running 19 minutes when
  this run reached the serve step). Killing it would have taken that agent's
  suite down mid-run, so this lane served its own `out/` on **127.0.0.1:5611**
  and left 5601 alone. Every log in this directory names 5611 as the base URL.
- **`tests/overhaul/scene-listen.spec.ts`.** `origin/main` (scene 6) asserts
  `#listen a` count `4`, the four routes. The section now carries five anchors —
  the four routes plus the engagement plate CC-02 asked for — so the two
  assertions read `ANCHORS = listenContent.channels.length + 1` and additionally
  require exactly one `[data-cta="engage"]`. The intent the spec states, that
  the closing screen is whole without WebGL, is unchanged and strictly stronger.

## Tools used

`pdftotext` (poppler) · `git` · `npm ci` · `npx tsc --noEmit` · `npm run lint` ·
`npm run build:static` · `node scripts/validate/overhaul_static_audit.mjs` ·
`python3 -m http.server 5611` · `npx playwright test` · Playwright `chromium`
(system Chrome channel) for the screenshots · `Read`/`Edit`/`Write`/`Bash`.
