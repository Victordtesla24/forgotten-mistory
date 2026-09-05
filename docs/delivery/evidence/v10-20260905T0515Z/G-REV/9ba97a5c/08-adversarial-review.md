# 08 — Independent adversarial re-probe (PHASE 1 · live FAIL baseline)

**Task:** `t_g_rev` · **Profile:** reviewer — verification / 3rd_party_independent_adversarial_review (level 1, effort max)
**Live URL:** https://forgotten-mistory.web.app/
**Live `build-commit`:** `9ba97a5c` — read from the page meta, not from the repo
**Probed:** 2026-09-05 12:13Z – 12:38Z · **Verdict: FAIL (11 / 11 P0 gaps FAIL)**
**Read-only run.** No production code was touched. Only files under this evidence directory were written.

```
$ curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
build-commit" content="9ba97a5c"
$ git log --oneline -1 9ba97a5c
9ba97a5 docs(adv): independent production FAIL review + parallel gap backlog
```

`9ba97a5c` is the commit that *authored* `ADV-REVIEW-20260905.md`. No G-\* remediation
commit exists at or before the deployed HEAD, so this is a true pre-remediation baseline.
HTTP 200 · `cache-control: public, max-age=0, must-revalidate` · `etag: c10e5c09…8865b8`
· `last-modified: Sat, 05 Sep 2026 12:05:23 GMT` (`captures/live-headers.txt`).

---

## 1. Verdict table — failures first (all 11 are failures)

| Gap | Section | Verdict | Measured on live `9ba97a5c` | Evidence |
|-----|---------|---------|------------------------------|----------|
| **G-H2** | hero | **FAIL** | **Zero `<canvas>` in the entire document** on a normal load at 1440×900 *and* 390×844 (`canvases.total = 0`). GL appears only under `/?gl=force` (1 canvas, `data-scene="hero-atmosphere"`, 1440×955, `webgl2-live`). Stage scrim still dominant: `.Hero_stage` = `linear-gradient(90deg, rgba(10,10,10,0.68), rgba(10,10,10,0.66) 46%, rgba(10,10,10,0.3) 60%, transparent 70%)` — 68 % black over the left of the frame. `HyperFrames` string count in the 14 served chunks: **0**. | `captures/probe-a.json` → `1440-normal.measure.canvases`, `1440-glforce.measure.canvasDetail`, `1440-normal.measure.hero.scrims`; `captures/served-js-scan.txt` |
| **G-H1** | hero | **FAIL** | First fold at 1440×900 carries **21 text-bearing leaf nodes**, **4 paragraphs over 12 words** (longest 29 words), **6 in-fold CTAs** across 3 groups (`See the evidence` + `Download CV`; `Play the portrait`; `LinkedIn`/`GitHub`/`Email`), the **3-stat ledger still in fold** (`≈92%`, `$5M+`, `10k+` at `top: 535`, each with `(Self-reported figure.)`), **15 caliper marks**, and the availability line `Open to delivery-leadership and AI engagements` at `top: 840` < `innerHeight 900`. Dominant visual covers **11.4 %** of the fold (largest media 516×287 px) — not full-bleed. Only `h1Count: 1` passes. | `captures/probe-a.json` → `1440-normal.measure.hero`; `captures/1440-normal-fold.png` |
| **G-H3** | global | **FAIL** | Served CSS bundle (3 files, 133 002 B) still ships Tailwind chroma utilities: `.bg-red-500` ×2, `.border-red-500` ×2, `.text-red-500`, `.border-orange-400`, `.stroke-amber-400`, `.bg-blue-600`, `.text-blue-500`, `.bg-green-400`, `.bg-green-500`. Body blue-steel washes live: `background-image: radial-gradient(… rgba(40,42,50,0.26) …), radial-gradient(… rgba(40,42,50,0.22) …), radial-gradient(… rgba(36,36,42,0.18) …)` (chroma 10–14, blue-biased). | `captures/css-chroma-scan.txt`; `probe-a.json` → `tokens.bodyBgImage` |
| **G-A1** | about | **FAIL** | All 10 `.About_evidence__WwIMJ` nodes compute to **`rgb(144,144,144)`** — neutral grey. `--gold` is `#c9a84c` = `rgb(201,168,76)`; `--gold-light` `#d4b65c`. Sourced evidence strings are therefore **not** on the gold token. | `captures/probe-a.json` → `1440-normal.measure.about.evidenceColors`, `.tokens.gold` |
| **G-A2** | about | **FAIL** | `dt.About_keySwatch__vwCr1` still paints the cool-steel hatch: `background-image` contains **`rgba(138, 143, 154, 0.34)`** (chroma 16) — the exact value the adversarial review flagged. The served CSS confirms the source rule: `rgb(138 143 154/.34)` ×1. | `probe-a.json` → `about.offTokenChroma`; `captures/css-chroma-scan.txt` |
| **G-S1** | skills | **FAIL** | `#skills` contains **0 `<canvas>`** and 1 `<svg>` at 1440 normal **and under `/?gl=force`** (`skills.canvasCount: 0`, `dataScenes: []`). The only GL on the page at `?gl=force` is the hero atmosphere. Section is 3086 px tall with no WebGL. | `probe-a.json` → `1440-glforce.measure.skills` and `.canvases.bySection` |
| **G-V1** | vitrine | **FAIL** | Resting plates render at reduced opacity with a 1 px dash pattern rather than a solid drawing: measured strokes carry `stroke-dasharray: 1px` with `stroke-dashoffset: 1px` and element `opacity` 0.3–0.5 on two of the three sampled neighbour plates (`stroke: rgb(205,205,205)`). Only the lit plate reaches 0.7–0.8. Neighbours read as ghosted, not "default visible stroke or pre-draw". | `probe-a.json` → `1440-normal.measure.vitrine.plates`; `captures/1440-normal-vitrine.png` |
| **G-V2** | vitrine | **FAIL** | `#vitrine` exposes **9 links, 0 engagement CTAs**. Every link is a repository or demo URL (`github.com/Victordtesla24/…`, `aether.srv1356245.hstgr.cloud`, `abentertainment.com.au`, `forgotten-mistory.web.app`). `engagementCta` (mailto / "start a project" / "hire" / "brief" / "consult") = **`[]`**. | `probe-a.json` → `1440-normal.measure.vitrine.ctas`, `.engagementCta` |
| **G-M1** | minivic | **FAIL** | `/api/chat-with-vic` **still ships in the served client bundle** on a `setInterval` poller: `…setInterval(async()=>{…await fetch("/api/chat-with-vic?taskId=".concat(o.polloTaskId))…}` . `/api/realtime` string count is 0 across the 14 chunks referenced from the served HTML (lazy chunks not enumerated — scoped claim). The send path itself is **not observable** in this run: the panel would not open under headless Chrome (see §4). Recorded FAIL — no reproducible evidence of remediation, and no remediation commit exists at `9ba97a5c`. | `captures/served-js-scan.txt`; `captures/minivic-probe.json` |
| **G-M2** | minivic | **FAIL** | Served greeting is **byte-identical to the stale asset**. `sha256(https://…/assets/minivic-greeting.mp3)` = `369e1eb2e0e072a8b07a56976cc5479f2187a06066f0ab696b540d8f8f9dddb3`, 198 156 B — identical to `git cat-file -p 9ba97a5c:public/assets/minivic-greeting.mp3 \| sha256sum`. That blob last changed in `f944d97`; the MiniVic intro text changed later (`45eb252`, `3720832`). Audio therefore predates the rewritten text intro. | `captures/mp3-hash.txt` |
| **G-M3** | minivic | **FAIL** | No streaming on the wire: `text/event-stream` occurrences in the served bundle = **0**. First-answer TTFT **not measurable** — the panel did not open headless, so no `/api/*` request was ever issued (`apiPaths: []`). `provider:"…"` literal count in the served bundle = 0 for that exact form; the client payload shape could not be observed without a live send. Recorded FAIL — unstreamed, unwarmed, unproven. | `captures/served-js-scan.txt`; `captures/minivic-probe.json` |

**PASS: none.** 11 P0 gaps measured, **11 FAIL**, 0 PASS. `goal_complete = false`.

---

## 2. Console / pageerror / network captures (gate 2)

| Context | Status | pageerrors | console err/warn | canvases | `build-commit` |
|---|---|---|---|---|---|
| 1440×900 normal | 200 (1443 ms) | **0** | 1 (unused CSS preload warning) | **0** | 9ba97a5c |
| 1440×900 `/?gl=force` | 200 | **0** | 4 (SwiftShader `GPU stall due to ReadPixels`, perf only) | 1 (`webgl2-live`) | 9ba97a5c |
| 390×844 normal | 200 | **0** | — | **0** | 9ba97a5c |
| 390×844 `/?gl=force` | 200 | **0** | — | 1 | 9ba97a5c |
| Persistent profile, 2nd load | 200 | **0** | — | see `probe-c.json` | 9ba97a5c |

Service worker on the returning-visitor load: `navigator.serviceWorker.controller.scriptURL =
https://forgotten-mistory.web.app/sw.js`; the second load served **`9ba97a5c`**, matching the
first — **no stale-shell regression** (the `sw-stale-shell` failure mode is not reproducing).
`failedRequests: []` in every context. Raw: `captures/probe-a.json`, `probe-b.json`, `probe-c.json`.

Screenshots per section per context: `captures/{1440-normal,1440-glforce,390-normal}-{hero,about,experience,skills,vitrine,listen}.png`,
`captures/*-fold.png`, `captures/persistent-second-load.png`, `captures/minivic2-open.png`.

---

## 3. Creative council (O2) — 3 directions per section, each file-anchored

Standard: a Marvel main-title art director. Composition · light · type · motion.

### `#hero` — `components/sections/Hero/Hero.tsx`, `Hero.module.css`, `HeroAtmosphere.tsx`, `app/data/portfolio/hero.ts`
1. **Composition — one frame, one subject.** Give the atmosphere the whole 100 vw × 100 vh and let type sit *inside* it, not beside it. In `Hero.module.css` collapse the two-column stage into a single full-bleed layer; move the 3-stat ledger, the "self-reported" note and the availability line out of the fold into a thin second beat at `100vh + 0`. Target: ≤ 8 text leaves in fold (measured 21), dominant visual coverage ≥ 0.75 (measured 0.114).
2. **Light — kill the 68 % scrim, use a key.** `.Hero_stage`'s `rgba(10,10,10,0.68)` wash is what makes the atmosphere read as wallpaper. Replace it in `Hero.module.css` with a *directional* falloff — a single soft key from upper-right at ≤ 0.35 alpha plus a local text-protection gradient no larger than the headline's own bounding box. Contrast is bought locally, not by dimming the whole stage.
3. **Motion — one continuous move, no idle deferral.** `HeroAtmosphere.tsx` currently yields zero canvases on a normal load; the first paint is a still. Mount the scene on the critical path with a 900 ms ease-out settle (a slow parallax drift, not a loop), and keep the reduced-motion path a graded still frame of the same composition — the same picture, stopped, never a different one.

### `#about` — `components/sections/About/About.module.css`, `Compass.tsx`, `AboutField.tsx`, `field.glsl.ts`
1. **Type — gold is the grammar, use it.** `.About_evidence` at `rgb(144,144,144)` throws away the site's one semantic colour. Bind it to `var(--gold)` in `About.module.css`, and give the un-sourced answers a plain `--ink-2` so the eye can sort sourced from self-reported in one pass without reading a word.
2. **Light — one hatch, one grey.** Replace `rgba(138,143,154,.34)` in `.About_keySwatch` with a neutral from the token ramp (`rgba(205,205,205,.28)`). Ten dimensions on a cool-steel hatch reads as a spreadsheet; on neutral it reads as an instrument face.
3. **Composition — the dial is the hero, the list is the caption.** In `Compass.tsx`, take the dial to ≥ 60 % of the section's optical weight and set the ten answers as a running caption column beneath it. Right now the dial is a diagram *next to* text; it should be the thing the section is about.

### `#experience` — `components/sections/Experience/*`, strata GLSL
1. **Composition — the axis is the drama.** Sixteen years drawn to scale is the strongest true idea on the page. Let the time axis run edge-to-edge with real bleed and let the strata field be *read* through the bars rather than sit behind them.
2. **Light — depth by parallax, not by fog.** Give the strata two or three depth planes moving at different rates on scroll instead of a single ambient sediment; the section is 2995 px tall and currently spends that height on one flat texture.
3. **Motion + conversion — a dossier beat.** The section has zero in-section CTAs. Land a single "Read the full dossier" affordance at the axis's end, in the same graded type as the roles, so the scroll resolves into an action rather than stopping.

### `#skills` — `components/sections/Skills/Skills.tsx`, new `SkillsField.*`
1. **The flagship, finally.** 3086 px of section with **zero** GL. Build a real R3F/GLSL field behind the Bench — a depth-sorted lattice whose nodes are the tested capabilities — so that "calibration card" has an instrument behind it.
2. **Light — gold means sourced, not "on".** Production dots currently use gold as status chrome. Reserve gold for the "measured in production" mark only; give status a luminance step in the grey ramp instead.
3. **Motion — settle, don't idle.** On enter, let the lattice resolve from scatter to alignment once (~1.2 s), then hold. No loop. Reduced-motion gets the aligned end state directly.

### `#vitrine` — `components/sections/Vitrine/Drawings.tsx`, `Drawings.module.css`, `Vitrine.tsx`, `app/data/portfolio/vitrine.ts`
1. **Composition — six plates, all drawn.** Neighbours at `opacity 0.3–0.5` with a 1 px dash read as loading states. Ship every plate fully drawn at `opacity ≥ 0.55`; let the *lit* plate gain gold and weight, not existence.
2. **Type — the limits are the selling point.** Set each plate's "what it does" and "what it does not" as a matched pair at the same size, one in `--ink-1`, one in `--ink-3`. That contrast is the section's whole argument.
3. **Conversion — end the carousel with a door.** Zero engagement CTAs after six pieces of client work. Add one — "Start a project" `mailto:` — in `Vitrine.tsx`, styled as a plate so it reads as the seventh drawing.

### `#listen` + MiniVic — `components/MiniVicBot.tsx`, `lib/miniVicBrain.ts`, `functions/index.js`
1. **Motion — first token under 1.5 s or say so.** No `text/event-stream` on the wire today. Stream the reply, and while the first token is in flight show a caliper opening, not a spinner — the site's own mark, doing work.
2. **Light — the panel is a lit instrument.** Give the chat surface one warm key and let the gold appear only on a cited claim inside an answer, matching the caliper contract everywhere else.
3. **Composition — voice and text agree.** Regenerate `public/assets/minivic-greeting.mp3` from the current intro string in the same commit that changes the string, and assert the pair in a test; a greeting whose audio contradicts its transcript is a credibility leak, not a polish item.

---

## 4. False-positive register

Claims I could not reproduce on live `9ba97a5c`, verbatim with source:

1. **`docs/prompt.md` R2 / §0.3-1 — "one Marvel-grade flagship visualisation per section", ≥ 7 GL scenes.**
   Contradicted: a normal load of the live site renders **0 canvases**; `/?gl=force` renders **1**.
   `probe-a.json` → `1440-normal.measure.canvases.total = 0`, `1440-glforce.measure.canvasDetail` (single hero canvas).

2. **`artifacts/kanban/board.json` / commit `bdf4edc` — "hero photo delivered; stability and flagship B lanes"** and
   commit `48393f8` — **"v10 cycle 08 — hero photo and deploy-skew resilience live"**.
   The hero photo is live (`my_avatar.avif`, 516×287 CSS px), so the narrow claim reproduces; the
   surrounding **"flagship"** framing does not — that image occupies 11.4 % of the fold and there is no
   GL flagship on a normal load. `probe-a.json` → `hero.media`, `hero.dominantMediaCoverage = 0.114`.

3. **Commit `b45b456` — "C21 independent verification — 09-verification.md".**
   Not re-verified here: it names a different task's gates, and nothing in it asserts a G-\* gap.
   Recorded as out of scope rather than reproduced or refuted.

**What I tried and could not measure (declared, not inferred):**
- **MiniVic send path (G-M1) and TTFT (G-M3).** Two attempts, one context each. Selectors tried:
  `button[aria-label*="Mini Vic" i]`, `button:has-text("Ask Mini Vic")`, `[class*="launcher" i]`,
  `text=Ask Mini Vic`, `[class*="MiniVic"]`, `[class*="minivic" i]`, then `textarea`,
  `input[type=text]`, `[contenteditable=true]`. The launcher element was found
  (`button.minivic-launcher`, `aria-label="Ask Mini Vic — Vikram's AI clone"`) and clicked, but no
  visible input appeared and **zero `/api/*` requests were issued** (`minivic-probe.json` →
  `apiPaths: []`, `inputVisible: false`). Whether that is a headless-only gate or a live defect is
  **not established by this run** and must not be reported either way. G-M1/G-M3 are recorded FAIL on
  the *bundle* evidence plus absence of any remediation commit, not on a simulated send.
- **60 fps / 2160p claims (R2/R5).** Not measured — SwiftShader on a 4-core shared host cannot produce a
  trustworthy frame-rate number. Not observable in this environment.
- **Lazy JS chunks.** The `served-js-scan.txt` counts cover the **14 chunks referenced from the served
  HTML** only. A `/api/realtime` reference inside a lazily-imported chunk would not appear; the
  "0 occurrences" figure is scoped accordingly.

---

## 5. Reproduce

```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
curl -fsS https://forgotten-mistory.web.app/assets/minivic-greeting.mp3 | sha256sum
git cat-file -p 9ba97a5c:public/assets/minivic-greeting.mp3 | sha256sum
node /root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures/probe.mjs all
```

`probe.mjs`, `minivic2.mjs`, `css-scan.sh` and `jsscan.sh` are kept beside the captures so a third
party can re-run every number in this document.

**PHASE 2** re-runs this same acceptance on whatever `build-commit` the orchestrator names after the
next Deploy. `goal_complete` becomes true only when all 11 P0 gaps read PASS on live.
