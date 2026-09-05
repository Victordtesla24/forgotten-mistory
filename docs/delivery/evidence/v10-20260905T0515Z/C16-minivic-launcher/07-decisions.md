# C16 — the MiniVic launcher: decisions

Task `t_cc03ed93` (cycle 16), closing R-c8 items 7 (C-04), 12 (ADV-F-3) and 13 (ADV-F-2),
plus the V-C11 F-1 correction (TC-CONTRAST-01 @390) and the CI-red TC-BOT-12.

**Tools used:** Read, Edit, Write, Bash (npm ci · npm run build:static · npx tsc --noEmit ·
npm run lint · node scripts/validate/overhaul_static_audit.mjs · npx playwright test ·
node /tmp/shots.mjs · magick), Playwright (chromium, channel `chrome`, 2 workers,
`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602`).

---

## 1. Tests first

Three spec files were written and run against a build of the **unpatched** tree
(`02-tests-failing.log`, 7 failed / 0 passed):

| spec | id | what it fixes on the unpatched tree |
|------|----|-------------------------------------|
| `tests/monochrome/minivic-launcher.spec.ts` | MONO-MV-01 @1440, @390 | `HUE button.group.relative boxShadow=rgb(201,205,214)` — the glow. Tailwind zinc passes the static audit's 0.28 spread test, so nothing had caught it. |
| `tests/a11y/minivic-launcher.spec.ts` | TC-MV-ARIA-01 @1440, @390 | `at scrollY 0 the launcher sits inside 1 aria-hidden="true" ancestor(s): [{"tag":"DIV","cls":"fixed bottom-6 right-6 …"}]` — ADV-F-3 resolved as a real defect, not a false signal. |
| `tests/a11y/minivic-launcher.spec.ts` | TC-MV-SKIP-01 | `first three tab stops were 1: "Skip to the evidence", 2: "Back to top", 3: "Download CV"` — ADV-F-2. |
| `tests/a11y/minivic-occlusion.spec.ts` | TC-MV-OCCLUDE-01 | `9 of 21 text node(s) under the launcher fall below AA` at 390. |
| `tests/a11y/minivic-occlusion.spec.ts` | TC-MV-OCCLUDE-02 | `the brightest pixel the closed launcher paints at 390 is rgb(163,173,176) (relative luminance 0.4081); the ceiling … is 0.0968`. |

## 2. Why a dark plate rather than a re-docked launcher

The V-C11 correction states the required fix disjunctively: *"put the grayscale portrait on a
dark in-palette plate … **or** dock the launcher clear of the reading column on phones (e.g.
bottom-right inset inside the page gutter with the prose column ending before x=302)"*.

The second option was measured and rejected. At 390 the reading column runs 24 → 366 px. A
`position: fixed` control can only be clear of it if the column itself ends before the
launcher starts, i.e. a measure of 278 px instead of 342 — an 19 % cut to every line of body
copy on every phone, to move one button, days after cycle 11 landed the 390 hero fold. The
dark plate keeps the full measure and removes the actual harm, which is luminance and not
overlap: the failing node was 1.79:1 because the ground under it was **light**
(rgb(153,153,157)), not because something was on top of it.

The occlusion spec therefore states the rule in the form the chosen fix has to keep, and it
is stricter than the gate that caught the regression:

- **TC-MV-OCCLUDE-01** walks 390×844 and, wherever the launcher's box (inflated by its own
  shadow blur, capped at 16 px) overlaps a visible text box in `<main>`, samples **every**
  pixel of the overlap on a 2 px lattice out of the composited screenshot and requires AA.
  `TC-CONTRAST-01` samples three points per text rect, so a launcher two pixels narrower
  would have slipped past it; this cannot.
- **TC-MV-OCCLUDE-02** removes the dependence on which paragraph happens to be underneath:
  no pixel the closed launcher paints at 390 may exceed the brightest ground that still
  carries `--mist-200` body ink at 4.5:1. The ceiling is derived from the token
  (`GROUND_CEILING = (L(205,205,205) + 0.05) / 4.5 − 0.05 = 0.0968`), not chosen, so it
  tracks the ink instead of going stale.

Consequence, accepted deliberately: below 87.5 rem the portrait is dimmed
(`brightness(0.32)`) to a silhouette and the ping ring is not drawn. 87.5 rem is where the
page's own gutter — `(1400 − 1248) / 2 = 76 px`, rising to 96 px at 1440 — first holds the
disc clear of the measure, so from there up the face is shown at full value. The 1440
closed-state capture (`08-screens/closed-launcher-1440.png`) is the state the acceptance
criterion names; `closed-launcher-390.png` and `experience-column-390.png` are the phone
state, dark and clear of the prose.

## 3. ADV-F-3 was a real defect, not a false signal

The review left this open between two instruments. The ancestor-chain eval settles it: the
dock carried `aria-hidden={!pastHero && !isOpen}`, so at scroll top a focusable button sat
inside an `aria-hidden="true"` subtree — WCAG 4.1.2, however briefly. `aria-hidden` is gone
from the dock. The dock still fades out above the hero, so `.minivic-dock:focus-within` in
`app/globals.css` brings it back when a keyboard reader reaches it; `opacity: 0` alone never
removed it from the tab order, which is precisely why hiding it from the accessibility tree
was the wrong half of the pair to fix.

## 4. ADV-F-2 — the skip control, and where focus lands

A second bypass block ("Ask Mini Vic") is the first child of `<nav>`, so it is tab stop 2 of
the document (stop 1 remains "Skip to the evidence" in `app/layout.tsx`). It raises
`MINIVIC_OPEN_EVENT` on `window`; `MiniVicBot` opens the panel and focuses the **launcher**,
not the panel — a `skipEntryRef` guard suppresses the open-focus effect for exactly that one
cycle, so TC-BOT-06's contract (clicking the launcher moves focus into the dialog) is
untouched. Reordering the DOM was rejected: it would put a floating widget ahead of the
page's own content for every reader, sighted or not.

## 5. TC-BOT-12

The geometry assertions were already green; the red one was
`toHaveCSS('scroll-snap-type', /x proximity/)`. `proximity` is the initial strictness, so
Chromium's *computed* value serialises as the axis alone, `"x"` — the assertion as written
could never pass in this browser (CI run 33936783382). It now accepts either serialisation
(`/^x( proximity)?$/`), which is the property the test is entitled to require. No other
assertion in that test was touched, and none was relaxed.

## 6. The battery: 291 passed, 9 failed, none of them this change

`05-battery.log` — `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test`, 2 workers,
chromium channel `chrome`: **291 passed, 9 failed (9.3m), exit=1**. Every one of the nine was
classified rather than assumed.

Seven are red on the **unpatched** tree as well. `06-preexisting-on-unpatched.log` is that
proof: the three touched sources were checked out at `HEAD~1`, rebuilt, and the same specs
re-run against the same server.

| spec | on unpatched HEAD~1 | reading |
|------|--------------------|---------|
| TC-EXP-11 (longest bar brightest) | failed | pre-existing |
| TC-STATE-HOVER (2 of 21: About item, Vitrine live URL) | failed | pre-existing |
| TC-STATE-ACTIVE (1 of 21: About item) | failed | pre-existing |
| TC-RENDER-01 / -02 / -06 (WebGL) | failed (`scrollIntoViewIfNeeded` timeout) | pre-existing; no GPU on this host |
| VIS-04 (Listen section baseline) | failed | pre-existing |
| TC-LISTEN-05 | **passed** | battery flake (`Element is not attached to the DOM`) |
| PERF-03 (CLS) | **passed** | battery flake under two-worker contention |

The two flakes were re-run on the **patched** build (`05-battery-reruns.log`, and PERF-03
again with `--workers=1`): TC-LISTEN-05 passes; PERF-03 reports `CLS: 0.0000` and passes.
A fixed-position control cannot contribute to layout shift, which is consistent with both.

VIS-04 is **not** rebaselined. Its diff
(`test-results/visual-screenshots-…/listen-section-diff.png`) is two things at once: a
horizontal shift of the entire Listen copy, which predates this change and is somebody's
regression to own, and the launcher, which now legitimately appears in that section's clip.
Accepting a new baseline would bury the first inside the second. It is left red and named
here instead.

## 7. What the launcher is now

`components/MiniVicBot.tsx` carries no paint; the classes are the contract and every rule
lives in the MiniVic block of `app/globals.css`:

- `.minivic-launcher__disc` — 4 rem (2.75 rem, the 44 px minimum, at ≤ 30 rem),
  `1px solid var(--card-border)`, `background: var(--ink-900)`, dark shadow.
- `.minivic-launcher__portrait` — the same grayscale face the panel header uses
  (`/assets/my_avatar.webp`, 66 kB), inset 2 px, `grayscale(1) contrast(1.05)`.
- `.minivic-launcher__pill` — "Ask Mini Vic" from 52.125 rem (834 px) up, `--fs-caption`,
  `--ls-caption`, `--mist-200` on `rgb(10 10 10 / 0.72)`, radius 999px. Icon-only below.
- `.minivic-launcher__pip` — `var(--ink-500)` dot; the `var(--mist-400)` ping ring only
  where the launcher never covers prose. `bg-zinc-400` / `bg-zinc-500` are gone.
- `data-testid="minivic-toggle"` and the 44 px hit area are unchanged; no `--gold` anywhere.
