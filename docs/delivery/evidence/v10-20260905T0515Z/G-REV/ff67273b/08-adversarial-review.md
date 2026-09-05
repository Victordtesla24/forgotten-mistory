# 08 — Adversarial review, live `ff67273b`: S5 `vitrine-field` and S6 `listen-field`

**Reviewer** (docs/prompt.md §5 — verification + 3rd_party_independent_adversarial_review, effort max, read-only).
**Task** `t_rev_s56`. **Under test:** the orchestrator's CHECKPOINT push `192d743`
(*"feat(scenes): vitrine and listen fields carry sceneIds and are held to the flagship floors (S5, S6) — checkpoint"*),
merged as `ff67273b`. The lane's own flagship battery was still iterating when the checkpoint
landed, so this is the **first independent gate** on it.

| | |
|---|---|
| Live URL | <https://forgotten-mistory.web.app/> |
| `build-commit` meta, read here | `ff67273b` — `curl -fsS https://forgotten-mistory.web.app/ \| grep -o 'build-commit" content="[^"]*"'` |
| Served | `last-modified: Sat, 05 Sep 2026 14:41:17 GMT` (probe opened 14:42:36 Z) |
| Contexts | 6 — `/?gl=force` @1440 & @390, reduced-motion @1440 & @390, `/` @1440 & @390. One browser context at a time. |
| Engine | system Chrome `/usr/bin/google-chrome`, `--no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --disable-lcd-text` |
| Method parity | field measure = `tests/overhaul/flagship-visibility.spec.ts` (ground = the section's own computed `background-color` luminance; coverage at ground+0.06; peak = max L; motion = mean \|dL\| over a 1.6 s gap; slot isolated by the spec's own `visibility` rule). Canvas attribution = `G-REV/9b864752/captures/probeC-final.mjs` (six scroll-and-wait cycles). AA = `tests/a11y/text-contrast.spec.ts` (glyph-masked composite, pixels read under each node's own rects, every scene warmed first). Gold = exact palette from `tests/monochrome/gold-semantics.spec.ts`. |
| Captures | `captures/probe-s5s6.mjs` · `captures/probe-s5s6.json` · `captures/*.png` · `captures/repo-flagship-vitrine-listen-prod.log` · `captures/repo-text-contrast-prod.log` |

---

## FAILURES FIRST

### F-S5-390 — `vitrine-field` has no core at 390: peak **0.2918** < floor **0.35** — FAIL

The one floor the checkpoint's own comment says it clears at both widths is the one it misses.

```
[flagship-visibility] vitrine@390: ground=0.0030 coverage=66.00% peak=0.2918 motion=0.01459 box=342x746
  ✘ TC-FLAGSHIP-VIS-VITRINE @ 390 — vitrine cabinet light reads as light (7.5s)
    Error: vitrine cabinet light: brightest pixel is 0.292 — the scene has no core
```
— `captures/repo-flagship-vitrine-listen-prod.log`, the **repo's own gate run against production**
(`PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app npx playwright test tests/overhaul/flagship-visibility.spec.ts -g "VITRINE|LISTEN"` → **1 failed, 7 passed**, `EXIT=1`).

My independent probe, written before that run and with a different capture path, measured the
**same number to four decimals**: `peak 0.2918`, `coverage 0.6566`, `motion 0.03528`
(`captures/probe-s5s6.json` → `contexts["glforce-390"].fields["vitrine-field"]`;
capture `captures/glforce-390-vitrine-field.png`). Two independent measurements, one value —
this is not sampling noise.

The failure has a shape worth naming: at 390 the field is *broader* than at 1440
(coverage 65.7% vs 22.4%) but *flatter* — it lights two-thirds of the slot and never reaches a
core. The mobile branch of `vitrine.glsl.ts` / the module's intensity raise spread the light
instead of concentrating it. `coverage` and `motion` clear comfortably; only `peak` misses, by
0.058 (17%).

**Consequence:** `TC-FLAGSHIP-VIS-VITRINE @ 390` is red on `main` right now. The lane cannot
close `t_x1_05` on this build.

### F-CLAIM-01 — the checkpoint's in-code claim is not true at 390 — FAIL (documentation)

`tests/overhaul/flagship-visibility.spec.ts:152-163`, added by `192d743`, states of both new
scenes: *"They are held to the full default bar at both widths … Neither trades a floor for a
threshold."* They are held to it; the vitrine does not meet it at 390. The comment asserts an
outcome that was never measured — the commit message itself concedes the battery "continues and
lands as a follow-up". Nothing was weakened to hide this (see *tests-unweakened*), so the defect
is honest — but the assertion in the source should not outrun the evidence (§8/O2).

### Sub-threshold margins (not failures — recorded so the next pass does not read them as headroom)

| measure | value | floor | margin |
|---|---|---|---|
| `listen-field` motion @1440 (my probe) | **0.00428** | 0.004 | ×1.07 |
| `vitrine-field` peak @1440 | **0.3763** | 0.35 | ×1.08 |
| worst AA node in `#vitrine`, all four contexts | **4.69:1** | 4.5 | ×1.04 |

The repo gate's own @1440 listen motion on the same build was `0.00607` — the measure is
gap-sensitive, and both readings sit inside the same narrow band above the floor. Any further
dimming of either field, at either width, lands under a floor.

---

## Verdict table

| # | Clause | Verdict | Evidence (all re-captured on live `ff67273b`) |
|---|---|---|---|
| S5-a | `[data-scene=vitrine-field]` holds **one live webgl canvas**, 1440 & 390, `/?gl=force`, after six scroll-and-wait cycles | **PASS** | slot canvases `1>1>1>1>1>1` at both widths; section canvases `1>1>1>1>1>1`; context `webgl2-live`; drawing buffer 1296×759 @1440, 342×745 @390 — `probe-s5s6.json.contexts[glforce-*].traces["vitrine-field"]` |
| S5-b | Floors @1440 — coverage ≥0.15 / peak ≥0.35 / motion ≥0.004 | **PASS** | mine `0.2237 / 0.3763 / 0.01183`; repo gate `22.43% / 0.3813 / 0.00647` ✓ |
| S5-c | Floors @390 | **FAIL** | `0.6566 / **0.2918** / 0.03528` — peak under floor; repo gate ✘ with the identical `0.2918` (F-S5-390) |
| S5-d | Reduced motion: 0 canvases, still ≥8% at Δ0.04 | **PASS** | 1440: `canvasesInSection 0`, still `0.1990`; 390: `0` / `0.1998`; repo `TC-FLAGSHIP-VIS-STILL-VITRINE` ✓ both widths |
| S6-a | `[data-scene=listen-field]` holds one live webgl canvas, both widths | **PASS** | `1>1>1>1>1>1` both widths, `webgl2-live`, 1440×912 @1440, 390×1006 @390 |
| S6-b | Floors @1440 | **PASS** | mine `0.2241 / 0.5906 / 0.00428`; repo gate `21.86% / 0.4678 / 0.00607` ✓ (motion margin ×1.07 — noted above) |
| S6-c | Floors @390 | **PASS** | mine `0.3468 / 0.4072 / 0.00875`; repo gate `34.18% / 0.4020 / 0.01031` ✓ |
| S6-d | Reduced motion: 0 canvases, still ≥8% | **PASS** | 1440 `0` / `0.2543`; 390 `0` / `0.3025`; repo `TC-FLAGSHIP-VIS-STILL-LISTEN` ✓ |
| AA | `#vitrine` + `#listen` text clears AA at 1440/390 on `/` **and** `/?gl=force`, fields warmed | **PASS** | 0 fails of 87 (`#vitrine`) + 9 (`#listen`) nodes × 4 contexts. Worst: `4.69:1` (need 4.5) — the `--ink-500` plate prose; `#listen` worst `6.05:1`. Full worst-ten per context in `probe-s5s6.json.contexts[*].aa` |
| AA-repo | The repo's own `tests/a11y/text-contrast.spec.ts` against production | **PASS** | `4 passed (4.8m)`, `EXIT=0` — TC-CONTRAST-01 @1440/@390 and TC-CONTRAST-02 (WebGL path) @1440/@390 — `captures/repo-text-contrast-prod.log` |
| Gold-V | `#vitrine`: gold only on live repository URLs | **PASS** | 3 gold nodes, all `<a class="Vitrine_live">`: `aether.srv1356245.hstgr.cloud` (`rgb(201,168,76)`), `abentertainment.com.au`, `forgotten-mistory.web.app` (`rgb(232,213,163)`). No fill, no background, no decoration |
| Gold-L | `#listen`: **zero** gold | **PASS** | `listenAny.count = 0` in all four rendered contexts |
| Gold-P | Page-wide gold vs the 7 recorded earlier | **PASS** | saturated-gold nodes = **7**, unchanged; any-gold (incl. the two tints) = 23 |
| Tests | `192d743` weakened no floor, tolerance or node | **PASS** | see next section |
| Other-5 | hero / about / experience / skills still clear their floors @1440 | **PASS** | hero `0.4640 / 0.8308 / 0.02940`; about `0.4690 / 0.6584 / 0.03228`; experience `0.2577 / 0.8308 / 0.03850`; skills `0.3467 / 0.5029 / 0.01651` — each 1 canvas |
| Hero | AA + first paint unchanged on `/` | **PASS** | `#hero` h1 present, boot to `page-ready` 2106 ms @1440 / 2284 ms @390; repo TC-CONTRAST-01/02 green covers the hero's nodes |
| Errors | 0 pageerrors / 0 failed requests / 0 console errors, every context | **PASS** | all six contexts: `pageerrors 0, requestFailed 0, consoleErrors 0` |
| **Overall** | | **FAIL** | one floor breach: S5-c |

---

## Tests-unweakened audit (`git show 192d743 -- tests/…`)

**`tests/a11y/text-contrast.spec.ts`** — one hunk, `-1 / +12`, entirely additive: `SCENE_SLOTS`
gains `'vitrine-field'` and `'listen-field'`. No threshold changed, no tolerance widened, no node
excluded, no allowlist entry added. The change makes the walk *harder*, not easier: it warms the
two new shaders so the AA sample is taken over lit ground rather than the CSS still. Verified
green against production afterwards (4/4, above). **Not a weakening.**

**`tests/overhaul/flagship-visibility.spec.ts`** — one hunk, `+11`, two `SCENES` entries and a
comment. `COVERAGE_DELTA 0.06`, `COVERAGE_MIN 0.15`, `PEAK_MIN 0.35`, `MOTION_MIN 0.004`,
`FALLBACK_DELTA 0.04`, `FALLBACK_COVERAGE_MIN 0.08` and `VIEWPORTS` are untouched, and neither new
scene was given the `fallbackCoverageMin` escape hatch `#experience` carries. Both are held to the
full default bar at both widths. **Not a weakening** — and it is precisely because nothing was
relaxed that the gate caught F-S5-390 the moment it was run.

Full diff for both files is reproduced in `captures/` provenance via
`git show 192d743 -- tests/a11y/text-contrast.spec.ts tests/overhaul/flagship-visibility.spec.ts`.

---

## False-positive register (vs `192d743`'s message and diff)

| # | Candidate finding | Disposition |
|---|---|---|
| FP-1 | *"the a11y spec was edited in the same commit that raises shader intensity — a threshold was probably relaxed to fit"* | **False positive.** The edit only adds two scene ids to the warm list; every threshold is byte-identical, and the spec passes 4/4 against production. Reported as PASS, not as a finding. |
| FP-2 | *"gold in `#vitrine` sits on links that are not `github.com` URLs — a palette violation"* | **False positive of my own heuristic.** My census flagged `isRepoUrl:false` because it tested for `github.com/`. The site's rule (CLAUDE.md prime directive 4) licenses gold on *live repository URLs* — the live deployment of a vitrine repository — and all three nodes are exactly that, class `Vitrine_live`. No violation. |
| FP-3 | *"`listen-field`'s canvas is 1440×912 / 390×1006 — larger than the viewport, so it is over-drawing"* | **False positive.** The slot is a full-bleed band whose box legitimately exceeds the viewport height; the capture clips to the viewport as the repo spec does, and the measured field passes every floor. No defect. |
| FP-4 | *"only 6 of 7 signature scenes carry a `sceneId`, so the checkpoint under-delivered"* | **Not a finding against `192d743`.** S7 `minivic-viseme` (SIGNATURE-SCENES-v1:198) is out of this lane's scope — `t_x1_05`/`t_x1_06` are S5 and S6 only. Recorded in the R2 tally instead. |
| FP-5 | *"`listen-field` motion @1440 = 0.00428 is a fail"* | **Not a fail.** The floor is 0.004; the repo gate's own reading on the same build is 0.00607. Recorded as a thin margin, not a breach. |

---

## R2 tally — how many of the seven signature scenes are measurable and passing on live

`grep -rn 'sceneId=' components/ app/` → **6 of 7** now carry a handle
(`hero-atmosphere`, `about-field`, `career-strata`, `skills-bench`, `vitrine-field`, `listen-field`).
S7 `minivic-viseme` (SIGNATURE-SCENES-v1:198) still has none and remains structurally unmeasurable.

| Scene | sceneId | Measurable on live | Clears floors on live |
|---|---|---|---|
| S1 hero | `hero-atmosphere` | yes | **yes** (1440) |
| S2 about | `about-field` | yes | **yes** (1440) |
| S3 experience | `career-strata` | yes | **yes** (1440) |
| S4 skills | `skills-bench` | yes | **yes** (1440) |
| S5 vitrine | `vitrine-field` | yes | **1440 yes · 390 NO (peak 0.2918)** |
| S6 listen | `listen-field` | yes | **yes** (1440 and 390) |
| S7 MiniVic | — | **no** | n/a |

**6 / 7 measurable · 5 / 7 passing every measured floor.** `192d743` moved the tally from 4
measurable to 6 and delivered S6 clean at both widths — real progress, and one width of one scene
short of the claim it makes.

---

## What the next pass has to do

1. Raise `vitrine.glsl.ts`'s **peak** on the narrow branch — a core, not more spread. Coverage
   there is already 66%; concentrating the same energy is the fix, and it must land above 0.35
   without pushing the `#vitrine` plate prose below its present 4.69:1 (margin ×1.04 — the two
   are coupled, and the AA side has almost none to give).
2. Re-run **both** gates against production before claiming the lane: the flagship spec is the
   only thing that would have caught this, and it takes 1.1 minutes for these four cases.
3. Correct the comment at `flagship-visibility.spec.ts:152-163` when the number is true.

*Read-only review. No source file was modified by this pass; the only writes are this report and
its captures.*
