# 09 — Independent verification, cycles 17 and 18

Third-party adversarial review (docs/prompt.md §5, role
`3rd_party_independent_adversarial_review`). The reviewer is not the author: nothing below
is taken from the author's report. Every number was re-measured in this session, on a build
this session made, against a server this session started.

- **Subject:** `t_3729f57e` (C-08 / CC-10 / Motion F-6 — `#skills` gold) and `t_2cc9a990`
  (C-07 / ADV-4 — one "Download CV" in the first screen).
- **Worktree:** `/root/forgotten-mistory/.claude/worktrees/wf_4c95b7c6-be5-1`,
  branch `worktree-wf_4c95b7c6-be5-1`, HEAD `ebb8ac0` at the time of review.
- **Build:** `npm run build:static` re-run here — exit 0,
  `RESULT: PASS — no credential material in the emitted bundle.`
- **Server:** `python3 -m http.server 5603 --directory out --bind 127.0.0.1` (this lane's
  port; 5599 / 8080 / 5601 / 5602 belong to other tenants and were not touched).
- **Browser:** system Chrome via Playwright, `--no-sandbox --use-gl=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

## 1. Gates re-run here

| gate | command | observed |
|---|---|---|
| build | `npm run build:static` | `BUILD_EXIT=0`; secret scan `RESULT: PASS` |
| types | `npx tsc --noEmit` | `TSC_EXIT=0` (no output) |
| lint | `npm run lint` | `LINT_EXIT=0`, `✔ No ESLint warnings or errors` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `AUDIT_EXIT=0`, `RESULT: ALL PASS (10/10)` |
| battery | `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5603 npx playwright test tests/monochrome tests/a11y tests/overhaul/cta-duplication.spec.ts tests/overhaul/cinematic.spec.ts tests/e2e/hero.spec.ts tests/e2e/navigation.spec.ts tests/e2e/skills.spec.ts` | `112 passed (3.4m)`, `PW_EXIT=0`, zero failed, zero flaky |
| visual | `… npx playwright test tests/visual` | `1 failed, 5 passed (24.2s)`, `PW_VISUAL_EXIT=1` — VIS-04, attributed below |

Battery composition (counted from the run's own list output): `hero.spec.ts` 23 ·
`skills.spec.ts` 13 · `a11y/accessibility` 13 · `monochrome/gold-semantics` 11 ·
`e2e/navigation` 9 · `overhaul/cta-duplication` 8 · `overhaul/cinematic` 8 ·
`a11y/reduced-motion-choreography` 8 · `monochrome/monochrome` 7 ·
`a11y/interaction-states` 5 · `a11y/minivic-launcher` 3 · `a11y/gold-contrast` 3 ·
`monochrome/minivic-launcher` 2 · `a11y/text-contrast` 2 · `a11y/minivic-occlusion` 2.

`TC-CINE-03: nav is transparent at top and frosts (data-scrolled) after scroll` — green, so
cycle 18's hide did not cost the frost. `TC-NAV-02` — green in its re-pointed form; reading
the diff, it was strengthened, not weakened: it now asserts the pill exists with the right
`href`, that it is `visibility: hidden` at the top, that the hero's own CV control is
visible there instead, and that the pill returns after a scroll. Nothing was deleted from
the assertion; `D-CV-01` is still held.

## 2. Cycle 17 — measured independently, not read from the author's logs

Gold-painting elements inside `#skills`, at 1440×900, at rest, scanned across `color`,
`background-color`, all four border colours, `outline-color`, `fill`, `stroke`,
`text-decoration-color`, plus `::before` / `::after` — a wider net than the shipped spec
casts (`/tmp` probe, chrome + swiftshader):

| tier | count | element | x |
|---|---|---|---|
| saturated `rgb(201,168,76)` | **1** | `span.Skills_legendGlyph.Skills_measuredMark` (the legend key) | 129 |
| recessed `rgb(176,146,63)` (`--gold-dark`) | **14** | `span.Bench_mark.Bench_production` | 1088 |
| **total rgb-gold** | **15** | — | — |
| on an unlicensed surface | **0** | — | — |

Vertical runs (≥2 marks sharing an x within 2 px): **1**, at x=1088. The second column the
finding names (14 status glyphs at x=1159.6) is gone. Re-measured a second time with the
bench centred in the viewport rather than the section top aligned — same result: 1 saturated,
15 any-gold, and the 20 strands painted (`opacity: 1`).

Strands, read off the rendered SVG:

- 17 stroked `url("#bench-wire-gold")` at `stroke-opacity: 0.28`, `stroke-width: 1px`;
  3 stroked `url("#bench-wire-grey")` at `0.35`. The task's line — *no gold path over 0.3 at
  rest* — holds with margin.
- Hover a capability node, sample at **300 ms**: `[1, 0.18 ×19]`. One lit, everything else
  recessed, inside the budget the rule gives it. The lit row's bench dot goes to
  `rgb(201,168,76)` while the other 13 stay `rgb(176,146,63)` — the accent has somewhere to
  go, which is the point of C-08.
- Reduced motion (`prefers-reduced-motion: reduce`): `document.getAnimations()` scoped to
  `#skills` → **0 running** (4 present, all `finished`); wire `transition-property:
  stroke-opacity` (no `stroke-width`), `animation-name: none`, `stroke-opacity: 0.28`.

## 3. Cycle 18 — measured independently

`a[href="/docs/Vik_Resume_Final.pdf"]` whose rect meets the viewport and which is actually
painted (`visibility !== hidden`, `display !== none`, `opacity > 0.01`):

| viewport | scrollY 0 | after 1200 px | `nav[data-scrolled]` |
|---|---|---|---|
| 390×844 | **1** — hero `Hero_secondaryAction` | 0 — see finding F-2 | true |
| 834×1112 | **1** — hero | 1 — `.nav-cv` (565,28) | true |
| 1280×800 | **1** — hero | 1 — `.nav-cv` (989,28) | true |
| 1440×900 | **1** — hero (297,756) | 1 — `.nav-cv` (1141,28) | true |
| 1920×1080 | **1** — hero | 1 — `.nav-cv` (1597,28) | true |

ADV-4's acceptance line is met at all five widths. The phantom control it names is gone at
the source: at 1440 the overlay's anchor still occupies (446, 6) 548×96, but computes
`visibility: hidden`, so it is out of the hit-test and accessibility trees; the nav pill is
`visibility: hidden; opacity: 0` at the top and returns painted after the scroll. Hiding the
overlay did not cost the menu — `CTA-03` opens it and finds `visibility: visible`.

## 4. Screens, read by eye

- `C17-skills-gold/08-screens/skills-rest-1440.jpg` — the STATUS column is neutral grey
  down all fourteen rows; the only saturated gold in the frame is the legend swatch at the
  top left, beside the words it keys. Gold reads as **a mark**, not a mass: one dot the eye
  finds, then a table it can read without being pulled.
- `skills-hover-1440.jpg` — the traced strand is the brightest thing on the board and the
  rest of the cabling has visibly stepped back; the dot column reads as a recessed rail of
  evidence with one lit dot at the top. This is the state the finding asked for.
- `C18-nav-cv/08-screens/nav-top-1440.jpg` — the first screen carries exactly **one** CV
  action (the hero's outline "Download CV" beside the filled "See the evidence"); the nav
  band holds only `VIKRAM.` and `MENU`. No second pill, nothing painted where the phantom
  anchor used to be.
- `nav-scrolled-1440.jpg` — past the hero the pill is back in the frosted bar, as its own
  pill (border intact), which is what CTA-02 asserts numerically.

## 5. Findings

**F-1 (minor, evidence accuracy).** `C17-skills-gold/07-decisions.md` §Gates says the green
gold-semantics run was "21 passed". The log it cites
(`04-tests-passing/gold-semantics-green.log`) ends `11 passed (25.3s)`, and this session's
own run of that file reports 11 tests. The figure in the decisions table is wrong by 10; the
tests themselves are real and green. Correct it or drop the number.

**F-2 (minor, pre-existing, worth a board note).** At 390 px, after scrolling past the hero
there is **no** CV control on screen at all: `app/globals.css:803-804`
(`@media (max-width: 640px) { .nav-cv { display: none } }`) predates this cycle and is
untouched by it, so on a phone the CV lives only behind the menu once the hero is gone. Not
a regression — the same rule was in force before ADV-4 — but ADV-4's framing ("keep exactly
one per viewport band") leaves the phone's lower bands empty, and the phone is the band where
opening a menu costs the most. Recommend a follow-up task rather than a change here.

**F-3 (observation, measurement scope).** Both the baseline probe and the new GS-10 / GS-11
gates count elements whose *computed colour* is gold. The 17 strands stroked
`url("#bench-wire-gold")` are gold-painting but never enter either count, because their
computed `stroke` is a paint-server reference. The comparison is therefore like-for-like
(the baseline's "29" excluded them too, and the decisions file lists them separately), but
the numbers should be read as "gold-painted **marks**", not "everything gold on screen". The
strands are governed instead by GS-13's `stroke-opacity` assertions, which this review
re-measured directly (0.28 / 0.35 / 0.18 / 1).

**F-4 (accepted deviation).** The task text specifies `var(--ink-500)` at 0.35 for unsourced
strands; the implementation keeps `var(--mist-400)` at 0.35 and records the reason in
`07-decisions.md` §5 (an `--ink-500` hairline at 0.35 over the section ground composites to
≈1.35:1 and would erase the three non-production links the bench exists to show). The
opacity half of the instruction is implemented exactly, the deviation is declared rather than
silent, and it protects the section's honesty rather than its convenience. Accepted.

**F-5 (outside these two cycles).** `tests/visual` VIS-04 (`#listen`) fails against its
baseline — 42782 px, ratio 0.04. Attribution, from the three images in
`test-results/visual-screenshots-Visual--70526--closing-section-screenshot-chromium/`: the
stored baseline shows `#listen` indented ~208 px from the spine, no launcher label and no
avatar in the MiniVic ring; the actual shows the one-spine layout, the "Ask Mini Vic" label
and the portrait. Those are `57a3232` (one spine) and `3720832` (labelled launcher) — both
after the last rebaseline `9321998`, and neither in this branch. Cycles 17 and 18 touch no
`#listen` file. The baseline is stale and needs re-approving by eye in a separate cycle; the
"suite green" half of the definition of done is not currently true repo-wide, and that is not
this branch's doing.

## 6. Verdict

**PASS for both cycles.** Every acceptance line was re-measured here and holds: `#skills`
carries 1 saturated gold mark (budget 6), 15 gold marks in total (CC-10 ceiling 16), all
licensed, in one vertical run; the strands rest at 0.28 and light to 1 within 300 ms with the
rest at 0.18; reduced motion runs no animation in the section and moves no geometry; and
exactly one CV control is painted in the first screen at 390 / 834 / 1280 / 1440 / 1920, with
the pill returning past the hero and the phantom 548×96 anchor out of the tree. `tsc`, lint,
static audit 10/10, build and a 112-test battery are green on a build made in this session.
The five findings above are recorded, none of them blocks the two tasks; F-1 is a
documentation correction, F-2 and F-5 belong on the board.
