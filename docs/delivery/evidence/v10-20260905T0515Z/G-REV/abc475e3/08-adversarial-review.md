# G-REV phase 3 — live regression sweep after the stability and skills follow-up lanes

**Reviewer** — independent adversarial QA (docs/prompt.md §5, `verification` +
`3rd_party_independent_adversarial_review`, effort max). Read-only; no production file was
changed by this review. Every number below was re-captured on the live site in this session.

| | |
|---|---|
| **Target** | `https://forgotten-mistory.web.app/` (live Firebase Hosting), cache-busted on every load |
| **`build-commit` at sweep start** | `abc475e3` (`<meta name="build-commit" content="abc475e3"/>`) |
| **`build-commit` drift during the sweep** | `abc475e3` → `f3fb02e6` → `e3f0206c` → `34755d6c` (the ten-minute Deploy metronome shipped three times while probes were running) |
| **Claims under test** | `87c9667` *fix(stability): contain GL context errors and reserve the boot box* (t_stab01) · `0861658` *fix(skills): hold the bench light inside the plate, thin the graticule* (t_g_s1) |
| **Ancestry — both lanes are genuinely live** | `git merge-base --is-ancestor 87c9667 abc475e3` → **YES**; `--is-ancestor 0861658 abc475e3` → **YES**; `--is-ancestor 0861658 f3fb02e` → **YES**. Every commit probed is a descendant of the `cfee6a6c` floor named in the tasking (`cfee6a6` is `abc475e3`'s parent). |
| **Probed at** | 2026-09-05, ~13:40–14:05Z |
| **Method** | Playwright + **system Chrome** `/usr/bin/google-chrome`, `--no-sandbox`; SwiftShader (`--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, lifted verbatim from `tests/overhaul/flagship-visibility.spec.ts:185`) for every `?gl=force` context; `--disable-lcd-text` on the pixel-sampling contexts (the FAIL-B artefact recorded in `G-REV/ceca1fa5`); **one browser context at a time** throughout |
| **Raw evidence** | `captures/cls.mjs` + `captures/cls.json` · `captures/named.mjs` + `captures/named.json` · the repo's own unmodified gate log below |

**Build skew, disclosed.** The tasking named `cfee6a6c or later`; the meta read `abc475e3`
at start and `34755d6c` by the end. All four are descendants of both lanes under test, so
every measurement is of a **later** build than the floor, never an earlier one. Where a
metric could in principle differ between them it is stamped with the build the probe read
(`captures/*.json` carries `build` per context).

---

## VERDICT

| # | Gate | Result | Evidence |
|---|---|---|---|
| 1 | **CLS — 1440×900**, 3 unskipped cold boots | **PASS** | `0.0000 / 0.0000 / 0.0000`, **zero `layout-shift` entries** · `captures/cls.json` |
| 2 | **CLS — 1280×720**, 3 unskipped cold boots | **PASS** | `0.0000 / 0.0000 / 0.0000`, zero entries · `captures/cls.json` |
| 3 | **CLS — 390×844**, 3 unskipped cold boots | **PASS** | `0.0000 / 0.0000 / 0.0000`, zero entries · `captures/cls.json` |
| 4 | **LCP** (gate < 2500 ms) | **PASS** | 1280: **1216 / 1444 / 1428 ms**; 1440: 1504 / 1864 / 1460 ms; 390: 2156 / 1468 / 1864 ms · all under gate |
| 5 | **AA walk — still path** (`/`), 1440 + 390 | **PASS** | repo gate `TC-CONTRAST-01 @ 1440` + `@ 390` — **0 nodes below AA** |
| 6 | **AA walk — GL path** (`/?gl=force`), 1440 + 390 | **PASS** | repo gate `TC-CONTRAST-02 @ 1440` + `@ 390` — **0 nodes below AA** |
| 7 | **`p.Experience_openNote` @ 390 `?gl=force`** | **PASS** | **6.201 : 1** (claim: 6.20:1) — reproduces to 3 dp |
| 8 | **`.Bench_bandLabel` × 3 @ 1440** | **PASS** | Programmes **6.165**, Repositories **6.165**, Credentials **6.165** (needs 4.5) |
| 9 | **InfoCentric role company** | **PASS** | **12.454 : 1** @ 1440, **12.381 : 1** @ 390 (was 1.06:1) |
| 10 | **`#skills` field @ `?gl=force` 1440** | **PASS** | canvas **1**; coverage **34.71 %** (≥15), peak **0.5149** (≥0.35), motion **0.01596** (≥0.004) |
| 11 | **`#skills` field @ `?gl=force` 390** | **PASS** | canvas **1**; coverage **35.72 %**, peak **0.4851**, motion **0.01026** |
| 12 | **pageerrors / console errors / failed requests** | **PASS** | **0 / 0 / 0** across **13 independent contexts** |
| 13 | **SW freshness — returning visitor** | **PASS** | persistent profile, 2nd load: build `34755d6c` == live `34755d6c`, SW `controlled`, 0 pageerrors |

**Every verdict PASSes.** No failure was found, so the *Failures first* section is empty —
recorded explicitly rather than omitted.

---

## Failures first

**None.** Thirteen gates, thirteen PASS. This is the first G-REV phase in the v10 run with
no red row. The two prior reviews' open reds (`577d45af` FAIL-1 CLS 0.176; `ceca1fa5`
FAIL-A four nodes below AA) are both **closed** — see *Regressions and repairs*.

---

## (a) CLS — the hardest attempt at the stability claim

`87c9667` claims *"CLS 0.0000 on unskipped boots at 1440/1280/390"*. This is the claim most
likely to have been measured on a friendly path, because the whole prior FAIL-1 turned on
method: `G-REV/577d45af` measured **CLS 0.176** at 1280×720 while **clicking the Preloader's
Skip control**, and disclosed that as a caveat that "collapses the boot timeline".

So this probe removes exactly that shortcut:

- **The Skip control is never clicked.** No `settleBoot`, no `.preloader-skip`, no DOM
  removal. The ~1.9 s boot wipe runs to completion on its own, which is the timeline a real
  first-time visitor gets and the one the prior FAIL flagged as untested.
- The `PerformanceObserver('layout-shift')` is installed through **`addInitScript`**, i.e.
  before any document script runs, with `buffered: true` — a shift during hydration cannot
  hide behind a late observer.
- Every entry's `value`, `startTime` and full **`sources[]` with `previousRect` /
  `currentRect`** is captured, so a non-zero result would name the travelling node.
- 3 loads per viewport, each in a **fresh browser + fresh context** (no warm SW, no warm
  HTTP cache), cache-busted query, 4 s of post-`page-ready` settle.

**Result — 9 of 9 loads: `CLS = 0.0000`, and `entries.length === 0`.**

| viewport | load 1 | load 2 | load 3 | shift entries | LCP element |
|---|---|---|---|---|---|
| 1440×900 | 0.0000 | 0.0000 | 0.0000 | **0 / 0 / 0** | `H1#hero-name.Hero_name__vovn8` |
| 1280×720 | 0.0000 | 0.0000 | 0.0000 | **0 / 0 / 0** | `H1#hero-name.Hero_name__vovn8` |
| 390×844 | 0.0000 | 0.0000 | 0.0000 | **0 / 0 / 0** | `IMG` |

There is nothing to tabulate under *"every entry's source/previousRect/currentRect"* because
**no layout-shift entry was emitted at all** on any of the nine boots. That is a stronger
result than "CLS below the gate": the observer fired zero times, so the ~11 600 px footer
travel described in `87c9667` has no residue at any width. The `docScrollHeight` recorded per
load (`captures/cls.json`) is stable within a viewport across all three loads, which is the
corroborating signal that the reserved boot box is now the right height rather than the 24 px
one the commit describes.

**LCP.** `1216 ms` best / `2156 ms` worst, every load under the 2500 ms gate. Note the LCP
element differs by width — `H1#hero-name` at 1440/1280, `IMG` at 390 — which is expected from
the responsive hero and is not a finding.

**What I could not break.** I tried the cold, unskipped, zero-cache path at three widths
three times each; the metric did not move off zero once. I have no counter-example.

---

## (b) AA walk — the full gate, unmodified, pointed at production

Method parity with `G-REV/ceca1fa5` is exact: the same command, the same spec, no edits.

```
PLAYWRIGHT_BASE_URL=https://forgotten-mistory.web.app \
  npx playwright test tests/a11y/text-contrast.spec.ts --workers=1
→ 4 passed (4.7m)
```

That spec is the honest one — it hides glyphs, screenshots the **composited** viewport, and
samples the ground from real pixels under each text node's own rects, so a shader or a
translucent plate cannot be assumed away. All four cases green:

| case | `ceca1fa5` (prior review) | live now | |
|---|---|---|---|
| `TC-CONTRAST-01 @ 1440` (still) | **4 below AA**, worst 1.06:1 | **0 below AA** | **fixed** |
| `TC-CONTRAST-01 @ 390` (still) | 0 below AA | **0 below AA** | held |
| `TC-CONTRAST-02 @ 1440` (`?gl=force`) | **4 below AA**, worst 1.06:1 | **0 below AA** | **fixed** |
| `TC-CONTRAST-02 @ 390` (`?gl=force`) | 0 below AA | **0 below AA** | held |

**Worst-ten.** The gate prints the worst ten only on failure; with zero failures at every
width and both paths there is no worst-ten list to print. Rather than assert a negative, the
four named nodes were re-measured directly with the same sampling algorithm
(`captures/named.mjs` — glyph mask, composited screenshot, 15 sample points per node, WCAG
relative luminance), which is the falsifiable form of the same claim.

### The four `FAIL-A` nodes, re-measured

| node | `ceca1fa5` | 1440 `/` | 1440 `?gl=force` | 390 `/` | 390 `?gl=force` | |
|---|---|---|---|---|---|---|
| InfoCentric role company | **1.06** | **12.454** | **12.454** | **12.381** | **12.381** | **fixed** |
| `.Bench_bandLabel` "Repositories" | **3.63** | **6.165** | **6.165** | 6.165 | 6.165 | **fixed** |
| `.Bench_bandLabel` "Credentials" | **4.00** | **6.165** | **6.165** | 6.201 | 6.201 | **fixed** |
| `.Bench_bandLabel` "Programmes" | **4.10** | **6.165** | **6.165** | 6.165 | 6.165 | **fixed** |

All four clear 4.5:1 with margin, on **both** paths, at **both** widths. The band labels sit
at 6.165 rather than scraping the line, which is what `0861658`'s "hold the bench light
inside the plate" should produce: the label's ground no longer depends on where the shader's
cone happens to fall, so the three bands now read within 0.036 of each other instead of
spanning 3.63–4.10.

### `p.Experience_openNote`

| context | measured | claim |
|---|---|---|
| 390 `?gl=force` | **6.201 : 1** | 6.20:1 |
| 390 `/` | 6.201 : 1 | 6.20:1 |
| 1440 `?gl=force` | 6.201 : 1 | 6.20:1 |
| 1440 `/` | 6.201 : 1 | 6.20:1 |

`87c9667`'s *"6.20:1 on both paths"* reproduces to three decimal places, and holds at 390 as
well as 1440. Identical still/GL values are the point of the fix — the `--ink-900` plate means
the note's ground is opaque, so the shader underneath cannot move it. This is also the number
`G-REV/577d45af` had at **4.496:1**; it is now 1.38× that.

---

## (c) `#skills` at `?gl=force`

Slot scrolled to centre, 2.5 s settle, then the flagship spec's own measurement: every
element that is not the scene slot is hidden, the slot's box is photographed twice 1.6 s
apart, and coverage / peak / motion are computed in WCAG relative luminance against the
slot's own 10th-percentile ground.

| | 1440×900 | 390×844 | gate |
|---|---|---|---|
| canvases under `[data-scene="skills-bench"]` | **1** | **1** | ≥ 1 |
| ground luminance | 0.0030 | 0.0232 | — |
| **coverage** (≥ ground + 0.06) | **34.71 %** | **35.72 %** | ≥ 15 % |
| **peak** | **0.5149** | **0.4851** | ≥ 0.35 |
| **motion** (mean \|ΔL\| over 1.6 s) | **0.01596** | **0.01026** | ≥ 0.004 |
| sampled pixels | 722 592 | 51 984 | — |

Comfortably over every threshold — coverage at 2.3×, peak at 1.4×, motion at 4.0× (1440) and
2.6× (390). The canvas is present after scroll-and-wait at both widths.

**Visual read against the `9b864752` screenshots.** Two things are visibly different and both
are the intended direction of `0861658`. First, the field's bright core is **contained within
the plate** — the 10th-percentile ground at 1440 is 0.0030, i.e. the darkest tenth of the slot
is essentially the `--ink-900` plate itself, while peak reaches 0.5149; a cone spilling past
the plate edge would lift that floor. Second, the **graticule reads as a finer rule**: with
coverage at 34.7 % but ground still at 0.003, the lit area is structured light rather than an
even wash, which is the signature of a thinned graticule over a held field rather than a
brightened background. Crucially this was achieved **without** buying contrast from the type —
the band labels went **up** 3.63→6.165 in the same change, so this is not the "brightening a
backdrop until the type on it fails AA" failure mode that `flagship-visibility.spec.ts`'s gate
5 exists to catch.

---

## (d) GL containment — stated as not observable, per the read-only constraint

`87c9667` claims: *"GLCanvas pre-flights a WebGL context so a forced context-creation failure
logs ONE console.error and never an uncaught pageerror."*

**This claim is NOT verifiable from the live site under a read-only mandate, and it is
recorded here as unverified rather than passed.** Forcing a context-creation failure requires
either (i) editing `components/gl/` to make the pre-flight fail, (ii) injecting a page-level
hook that throws inside a scene, or (iii) launching with GL disabled *and* `?gl=force` in a
way that reaches the failure branch rather than the capability guard. (i) and (ii) are
implementation, which this profile must not do. The tasking's own mid-sentence correction
("plus a run with a page-level hook that throws inside one scene? **NO** — read-only") is
adopted: no hook was injected.

What **is** observable, and was measured, is the *containment envelope* — that nothing escapes
on the paths a visitor actually takes:

| context | pageerrors | console errors | failed requests |
|---|---|---|---|
| 1440 `/` × 3 cold unskipped boots | 0 | 0 | 0 |
| 1280 `/` × 3 cold unskipped boots | 0 | 0 | 0 |
| 390 `/` × 3 cold unskipped boots | 0 | 0 | 0 |
| 1440 `/` (SwiftShader, full scroll + scene warm) | 0 | 0 | 0 |
| 1440 `/?gl=force` (SwiftShader, all 4 scenes warmed) | 0 | 0 | 0 |
| 390 `/` (SwiftShader, full scroll + scene warm) | 0 | 0 | 0 |
| 390 `/?gl=force` (SwiftShader, all 4 scenes warmed) | 0 | 0 | 0 |
| returning-visitor 2nd load (persistent profile) | 0 | — | — |
| **total** | **0 / 13 contexts** | **0** | **0** |

Zero `requestfailed` **and** zero HTTP ≥ 400 responses across all thirteen. So: the *"never an
uncaught pageerror"* half is corroborated on every reachable path including four SwiftShader
contexts with all four scenes compiled; the *"logs ONE console.error"* half — the behaviour
under an induced failure — **remains unproven on live** and needs a repository test
(`tests/` , GL-capability stub) rather than a production probe. That test's absence is the one
gap this sweep leaves open, and it belongs to whoever owns `t_stab01`.

---

## (e) Returning-visitor second load

The `sw-stale-shell` memory records that a cache-first `sw.js` once served returning visitors
their first visit for hours while fresh-context probes stayed green — so a fresh context is
not evidence about a returning visitor. Probed with a **persistent profile**: load, close the
browser, relaunch against the same profile directory, load again.

| | build read | SW state |
|---|---|---|
| first load (cold profile) | `34755d6c` | `controlled` |
| **second load (same profile, new browser)** | **`34755d6c`** | `controlled` |
| live HTML at that moment (`fetch`) | `34755d6c` | — |

`match: true`, 0 pageerrors on the second load. The service worker is registered and
controlling — so the network-first + build-stamped worker fix is holding: a controlled
returning visitor still got the current build, not a cached shell.

---

## Regressions vs the prior reviews

**No new regression was found.** Movement is repair in every row:

| metric | `577d45af` (flagship-C) | `ceca1fa5` (palette) | **live now** | |
|---|---|---|---|---|
| CLS @ 1280×720 | **0.176** (Skip-clicked) | — | **0.0000** (Skip **not** clicked) | **fixed, on a harder path** |
| CLS @ 1440 / 390 | — | — | **0.0000 / 0.0000** | new floor |
| LCP @ 1280 | 1488 ms | — | 1216–1444 ms | improved |
| AA @ 1440 still | 0 below AA | **4 below AA** | **0 below AA** | **fixed** |
| AA @ 1440 GL | 0 below AA | **4 below AA** | **0 below AA** | **fixed** |
| AA @ 390 GL | **1 below AA (4.496)** | 0 below AA | **0 below AA** | held fixed |
| InfoCentric | — | **1.06 : 1** | **12.454 : 1** | **fixed** |
| Bench band labels | *(component did not exist)* | **3.63 / 4.00 / 4.10** | **6.165 / 6.165 / 6.165** | **fixed** |
| `openNote` | 4.496 : 1 | — | **6.201 : 1** | improved |
| `#skills` field | *(not yet built)* | — | cov 34.7 %, peak 0.515, motion 0.016 | new, over gate |
| pageerrors | 0 | 0 | **0 / 13 contexts** | held |

The one methodological regression worth naming is **mine, not the code's**: `577d45af`'s CLS
number and this one are not directly comparable, because that probe clicked Skip and this one
did not. The comparison is stated as *"0.176 on the easier path → 0.0000 on the harder path"*,
which is the conservative reading; a strict like-for-like would require re-running the
Skip-clicked variant, which was not done and is not claimed.

---

## False-positive register

Claims in `87c9667` / `0861658` I could **not** reproduce, quoted verbatim.

| # | claim (verbatim) | status |
|---|---|---|
| 1 | `87c9667` — *"GLCanvas pre-flights a WebGL context so a forced context-creation failure logs ONE console.error and never an uncaught pageerror"* | **UNVERIFIABLE, not false.** The `never an uncaught pageerror` half is corroborated (0 pageerrors / 13 contexts, 4 of them SwiftShader with every scene compiled). The `logs ONE console.error` half requires inducing a context-creation failure, which needs a code or page-hook change this read-only profile must not make — see §(d). **No evidence contradicts it**; it is simply not observable from production. Needs a repo test, not a live probe. |
| 2 | `0861658` — *"after correcting the CSS still's cone radii"* | **NOT INDEPENDENTLY OBSERVABLE.** Whether the corrected radii are the *cause* of the band labels clearing AA cannot be separated from the plate change by black-box measurement; both land in the same commit. The **effect** claimed (three band-label ratios green at 1440) fully reproduces at **6.165 / 6.165 / 6.165**. Attribution accepted on the commit's word, not on this review's evidence. |
| 3 | `87c9667` — *"the footer painted inside the fold then travelled ~11,600 px"* | **PRE-STATE, cannot be re-observed.** The described defect is in the *pre-fix* build; live carries the fix. Corroborated only indirectly: 0 layout-shift entries and a stable `docScrollHeight` across all 9 boots. |

**Everything else in both commit messages reproduced**, most of it to three decimal places
(`CLS 0.0000` ×9; `openNote 6.20:1` → 6.201 on both paths; band labels green at 1440).
No claim in either commit was found to be **false**.

---

## Open P0s — one line each, no duplicated measurement

These are in flight with other profiles. Their own numbers are theirs to report; this sweep
only records what it happened to observe in passing and does **not** re-measure them.

| P0 | status from this sweep |
|---|---|
| **G-H1 correction** (hero action in the fold, portrait as figure) | Not measured here — no fold geometry probe was run. Incidentally: `H1#hero-name` is the LCP element at 1440 and 1280 at 1460–1864 ms, and hero rendered cleanly with 0 pageerrors in all 13 contexts. |
| **G-H2a** | Not measured here; nothing observed in the contrast, CLS or GL probes bears on it. |
| **G-M3b** (MiniVic cold-path / streaming) | Not measured here — no chat interaction was performed. Incidentally: 0 failed requests and 0 console errors on every load, so no dead endpoint surfaced on the cold path. |
| **G-S1c** | Not measured here as a lane. The `#skills` field and `.Bench_bandLabel` numbers above are this sweep's own re-capture of the *shipped* `0861658` state and should not be read as G-S1c's result. |

---

## Sign-off

Thirteen gates, **thirteen PASS, zero FAIL**. Both lanes' headline claims reproduce on the
live site at a build later than the tasking's floor, on the harder unskipped-boot path, with
one open item that is *unverifiable read-only* rather than failing — the induced
GL-context-failure console path, which needs a repository test.

`goal_complete: true`.
