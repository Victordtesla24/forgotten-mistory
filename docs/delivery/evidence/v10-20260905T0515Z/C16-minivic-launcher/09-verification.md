# 09 — independent adversarial verification of t_cc03ed93 (cycle 16, MiniVic launcher)

**Reviewer:** council reviewer, `3rd_party_independent_adversarial_review` (docs/prompt.md §5),
independent of the author.
**Under review:** `worktree-wf_75ffef1b-684-1` @ `10f09c5` (feature commit `3720832`,
evidence commit `10f09c5`).
**Method:** rebuilt the tree from scratch (`rm -rf out && npm run build:static`), served
`out/` on `127.0.0.1:5602`, re-ran every gate myself, and measured the acceptance lines
with my own instrument (`/tmp/v_probe.mjs`, `/tmp/v_probe2.mjs`) rather than reading the
author's logs back.
**Verdict: FAIL** — every gate the author claims is real and green, and eleven of thirteen
acceptance lines hold. Two do not, and both are geometric, reproducible, and named below.

---

## 1. Gates — re-run, not re-read

| gate | command | observed | exit |
|---|---|---|---|
| build | `rm -rf out && npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.` | 0 |
| types | `npx tsc --noEmit` | no output | 0 |
| lint | `npm run lint` | `✔ No ESLint warnings or errors` | 0 |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` (incl. `TC-NFR-DEADCSS`, `TC-NFR-MONO`) | 0 |
| contrast | `…test tests/a11y/text-contrast.spec.ts --workers=2` | `2 passed (24.3s)` — `TC-CONTRAST-01 @ 390` **and** `@ 1440` | 0 |
| assigned battery | `…test tests/e2e/chatbot.spec.ts tests/monochrome tests/a11y tests/overhaul/cinematic.spec.ts --workers=2` | `69 passed (2.3m)`, zero failures | 0 |

Every spec the task introduces ran inside that 69 and passed by name:
`TC-MV-ARIA-01 @1440` / `@390`, `TC-MV-SKIP-01`, `TC-MV-OCCLUDE-01`, `TC-MV-OCCLUDE-02`,
`MONO-MV-01 @1440` / `@390`, plus `TC-BOT-12` and both `TC-CONTRAST-01` viewports.

No assertion in the diff was weakened to reach green. The one assertion that was changed —
`tests/e2e/chatbot.spec.ts` `scroll-snap-type` — went from `/x proximity/` to
`/^x( proximity)?$/`. `proximity` is the initial strictness, so Chromium serialises the
computed value as `x`; the old spelling was unsatisfiable, not merely failing. The four
geometric assertions in that test (no h1 intersection, panel right == launcher right,
launcher 24 px from the edge, panel bottom ≤ launcher top) are untouched and still enforce.

## 2. Acceptance lines measured with my own instrument

| # | line | measured | verdict |
|---|---|---|---|
| 1 | every computed colour inside `[data-testid=minivic-toggle]` is `R==G==B` | 89 colour values walked at 390, 65 at 1440 (self + all descendants, across `color`/`background-color`/4× border/`outline`/`fill`/`stroke`/`box-shadow`/`background-image`/`filter`) — **0 non-achromatic** | PASS |
| 2 | none is `rgb(201,168,76)` | 0 occurrences of `--gold` at either viewport | PASS |
| 3 | no `aria-hidden="true"` in the launcher's ancestor chain | chain depth 4 to `<html>`; hidden ancestors **0**, inert ancestors **0**, at 390 and 1440 | PASS |
| 4 | Tab from the top reaches an element named "Ask Mini Vic" within 3 stops | stop 1 `A` "Skip to the evidence"; **stop 2** `BUTTON[data-testid=minivic-skip]` "Ask Mini Vic" | PASS |
| 5 | Enter opens the panel with focus on the toggle | `document.activeElement` → `data-testid="minivic-toggle"`; `[data-testid=minivic-panel]` present and visible | PASS |
| 6 | 44 px hit area at 390 | launcher box measured `44 × 44` at every scroll step | PASS |
| 7 | closed launcher reads as a chat affordance at 1440 | `08-screens/closed-launcher-1440.png`: grayscale portrait disc at full value with a dark pill reading "Ask Mini Vic" to its left. Unambiguously a person you can talk to. | PASS |
| 8 | plate in palette | dark plate (`--ink-900`) + 1 px `--card-border` hairline + `--mist-200` pill ink on `rgb(10 10 10 / .72)`. Achromatic, no gold, no fill colour. | PASS |
| 9 | open panel never overlaps `#hero h1` at **1440×900** | panel `{l:984,t:332,r:1416,b:812}` vs h1 box `{l:96,t:183,r:1344,b:307}` — no intersection (panel top 332 clears h1 bottom 307) | PASS |
| 10 | launcher box vs every `<p>`/`<li>` in `#experience`/`#about`/`#skills` at 390, across the contrast walk's scroll steps — **no overlap** | 21 steps, 91 visible text boxes, launcher visible at 20 of them. **9 steps overlap, 15 element-box intersections**, all in `#about`. e.g. scrollY 1688: launcher `{l:322,t:776,r:366,b:820}` ∩ `p` "ATO · ANZ · NAB · Microsoft · Telstra…" `{l:68,t:766,r:366,b:799}` | **FAIL** |
| 11 | open panel never overlaps `#hero h1` at **1280×800** | panel `{l:824,t:232,r:1256,b:712}` vs h1 box `{l:64,t:174,r:1216,b:284}` — **intersects**. Not a block-box artefact: the h1's own glyph rects run to `x=959, y=301`, so the panel covers ≈135 × 69 px of the rendered words. Screenshot confirms the tail of "Deshpande" is behind the panel. Same failure at 1366×768 (panel `{l:910,t:200,…}`, glyphs to `x=1024,y=290`). | **FAIL** |

## 3. The two failures, stated precisely

### F-V16-1 — the launcher still floats over the reading column at 390 (acceptance line 10)

The binding correction on `t_cc03ed93` offered the fix disjunctively: *"put the grayscale
portrait on a dark in-palette plate … **or** dock the launcher clear of the reading column
on phones"*. The author took the first branch and recorded why in `07-decisions.md` §2
(the second branch would cut the 390 measure from 342 px to 278 px, undoing cycle 11's
390 fold). That reasoning is sound and the substitute invariant it implies is real and
enforced: `TC-MV-OCCLUDE-02` caps the launcher's brightest pixel at a luminance derived
from `--mist-200` (0.0968), `TC-MV-OCCLUDE-01` walks every launcher/text overlap on a 2 px
lattice, and `TC-CONTRAST-01 @390` is green.

But the same correction also wrote the acceptance line as *"or equivalently the launcher's
box never overlaps a `<p>`/`<li>` box in `#experience`/`#about`/`#skills` at 390"*, and
that line, measured literally, does not hold: **15 overlaps across 9 of 21 scroll steps.**
The two halves of the correction are not equivalent and cannot both be satisfied by the
plate branch. This is recorded as a failure of the acceptance line as written, not as a
defect in the code: no text is harmed, and nothing here is a regression. It needs the
correction's author to say which half binds.

### F-V16-2 — the open panel covers the H1 at 1280 and 1366 (acceptance line 11)

`TC-BOT-12` asserts "the open panel … never covers the h1" but measures one viewport,
1440. At 1280×800 and 1366×768 — two of the most common laptop widths — the panel
intersects both the h1's block box **and** its glyph rects, and the tail of
"Vikram Deshpande" is visibly behind it. This is exactly R-c8 item 8 (C-05, MAJOR,
Verified: *"The open panel covers the H1 (the LCP element)"*), which the author correctly
scoped out of this task. It is not caused by this commit. What this commit does do is
leave a test whose stated invariant is broader than the single viewport it checks, so the
gate reads greener than the behaviour is. Whoever takes C-05 should widen `TC-BOT-12` to a
viewport list, not just move the panel.

## 4. Other observations (not blocking)

- **Label in Name (WCAG 2.5.3, Level A).** The launcher now carries a visible label,
  "Ask Mini Vic" (`components/MiniVicBot.tsx:1605-1606`, `aria-hidden="true"`), while its
  accessible name stays `"Open Mini Vic assistant"`
  (`components/MiniVicBot.tsx:1600`). The visible label text is not contained in the
  accessible name, so a speech-input user saying "Ask Mini Vic" will not reach the
  control. axe does not flag this — `label-content-name-mismatch` is an experimental rule
  and is not in the `wcag2a/2aa/21a/21aa` tag set the a11y suite runs — so the green
  `TC-MV-ARIA-01` is not evidence against it. Cheapest fix: make the button's label
  `"Ask Mini Vic"` / `"Close Mini Vic"`.
- **At 390 the affordance is thin.** `08-screens/closed-launcher-390.png` and
  `experience-column-390.png` show a near-black disc with the portrait dimmed to
  `brightness(0.32)` and no pill (icon-only below 834). It is honest to the luminance
  ceiling, and it is no longer an empty ring, but the face is barely legible and there is
  no word anywhere near it. C-04's complaint — *"no glyph, no avatar, no label"* — is
  fully answered at 1440 and only partly answered at 390.
- **`VIS-04` was left red rather than rebaselined.** I did not run `tests/visual`
  (outside the assigned battery), but the decision recorded in `07-decisions.md` — do not
  bury another owner's copy shift inside a new baseline PNG — is the right call and is
  the reason no baseline PNG appears in the diff.
- The claim that seven of the nine battery failures are pre-existing is supported by
  `06-preexisting-on-unpatched.log`; I did not re-run the unpatched tree, and none of
  those seven are in the assigned battery, all 69 of which passed here.

## 5. Reproduction

```bash
cd /root/forgotten-mistory/.claude/worktrees/wf_75ffef1b-684-1
rm -rf out && npm run build:static
python3 -m http.server 5602 --directory out --bind 127.0.0.1 &
npx tsc --noEmit
npm run lint
node scripts/validate/overhaul_static_audit.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test tests/a11y/text-contrast.spec.ts --workers=2
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test \
  tests/e2e/chatbot.spec.ts tests/monochrome tests/a11y tests/overhaul/cinematic.spec.ts --workers=2
fuser -k 5602/tcp
```

The two probe scripts ran outside the repository (`/tmp/v_probe.mjs`, `/tmp/v_probe2.mjs`)
so no scratch file lands in the tree; both are plain Playwright walks over the same
`out/` bundle and everything they measure is restated numerically above.
