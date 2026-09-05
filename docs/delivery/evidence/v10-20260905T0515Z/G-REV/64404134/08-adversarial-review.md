# Independent adversarial review — live `64404134`

- **Reviewer identity:** `rev-64404134-c22` (fresh, read-only, no implementation)
- **Task:** `t_rev_adv1556` · role `3rd_party_independent_adversarial_review` · effort **max**
- **Sole live SoT:** <https://forgotten-mistory.web.app/>
- **Live build-commit:** `64404134` — `curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'` → `build-commit" content="64404134"`
- **Probed:** 2026-09-05T19:2x Z · `last-modified: Sat, 05 Sep 2026 19:20:01 GMT` · `x-cache: MISS` (fresh origin fetch, not a CDN replay)
- **Browser:** system Chrome `/usr/bin/google-chrome` via Playwright, `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`, one process, viewports **1440×900** and **390×844**
- **Page errors:** 0 · **rAF frame rate:** 61 fps

**OVERALL: FAIL** — 3 of 8 probed gaps fail on live pixels/DOM.

Raw measurements: [`probe.json`](probe.json), [`probe2.json`](probe2.json) · screenshots: [`shots/`](shots/)

---

## Verdict matrix

| Gap | Verdict | One-line basis |
|-----|---------|----------------|
| **G-H1** | **PASS** | Full-bleed plane at `frac 1.000` of the first viewport; photograph inside it; single column; ledger below fold |
| **G-H5** | **PASS** | `my-hero-avatar.mp4` → 404; live PNG measures 1480×826 = declared; ladder states R5 FAIL honestly |
| **G-H6** | **PASS (hold confirmed)** | Colour photograph live + `docs/architecture/PALETTE-EXCEPTIONS.md` (8477 B) + `tests/palette_bundle.test.mjs` |
| **G-A3** | **FAIL** | `#about` canvases = **0** on default **and** on `?gl=force`; recall is the 384×384 radar dial |
| **G-E2** | **PASS** | Exactly 1 gold string in `#experience` — `Australian Taxation Office (ATO)` `rgb(201,168,76)`; **0** gold dates, **0** gold SVG fills/strokes |
| **G-S2** | **PASS** | `Bench_figure` 1248×775 is the dominant figure of `#skills`; 126 bench nodes; no proficiency bars |
| **G-L1 C5** | **FAIL** | Caliper reading renders `—`; no `[data-reading]` anywhere in the live DOM; expected `24.98 s` |
| **G-X2** | **FAIL** | Max **2** concurrent GL canvases, **3** distinct sections total, and **0** on the default path — not ≥7 |

Held, not reopened (no live regression observed): **G-NEW-1**, **G-C1**, **G-V3**, **G-M4**.

---

## Root defect behind two of the three failures

**The live capability gate refuses a WebGL-2-capable browser on the default path.**

The probe browser reports, from the live page:

```
glCap: "WebGL 2.0 (OpenGL ES 3.0 Chromium) | WebKit WebGL"
```

WebGL 2 is genuinely available. Yet in the **same browser, same session**:

| Path | Canvases at first paint | Canvases after scrolling all six sections |
|------|------------------------|-------------------------------------------|
| `/` (default) | **0** | **0** |
| `/?gl=force` | 1 (`#hero`, 1440×1460, `webgl2`) | 2 (`#vitrine` 1296×759, `#listen` 300×150) |
| `/` at 390×844 | **0** | — |

`probe2.json` → `default.canvasCount: 0`, `default_afterScroll.canvasCount: 0`, `glforce.canvasCount: 1`, `glforce_afterScroll.canvasCount: 2`.

This is **not a headless artifact**: the identical browser mounts `webgl2` contexts the moment `?gl=force` is appended. Every ordinary visitor with a working GPU is being served the no-WebGL fallback. This is the same class of defect as the memory note *"WebGL ✘ is never headless-only"* — inverted: the scene is silently absent for capable clients.

Consequence: the 61 fps figure is the fallback path's frame rate, **not** evidence of a cinematic scene at 60 fps.

---

## G-H1 — hero first viewport — **PASS**

Measured at 1440×900 (`probe.json → v1440.planes`, `v1440.heroInfo`; `shots/1440-fold.png`) and 390×844 (`shots/390-fold.png`).

| Criterion | Measurement | Verdict |
|---|---|---|
| One dominant visual plane ≥~75% weight | `Hero_stage` `1440×1460`, first-viewport intersection **`frac 1.000`** (`hero-atmosphere-poster.avif` + gradient). Next plane down is `frac 0.111`. | ✅ |
| Not a two-column résumé card | Only multi-column grid inside `#hero` is `Hero_ledger :: 259.203px 259.203px 259.219px`, at `top 1104` — **below** the 900 px fold. Fold content is a single left column. | ✅ |
| Photograph integrated into the plane | `img my_avatar.avif` `547×305` at `top 637 / bottom 942` — inside the first viewport, bleeding into the plane, no card chrome. | ✅ |
| Colour photograph retained (G-H6) | Colour portrait visible at both widths. | ✅ |
| ≤1 headline · ≤1 non-CV sentence · ≤1 CTA group | `h1` "Vikram Deshpande" (only heading); role line + one CV-sourced sentence (dates + ATO); one CTA pair "See the evidence" / "Download CV" at `top 535`. | ✅ |
| Ledger below the fold | `top 1104` > `vh 900`. | ✅ |
| MiniVic pill | `button[aria-label="Ask Mini Vic — Vikram's AI clone"]`, `display:flex`, `visibility:visible`, `184×64` @1440 / `158×44` @390. Rendered and legible in `shots/1440-skills.png` and `shots/1440-default-about.png`. | ✅ |

**Observation (not a FAIL):** the pill is computed-visible in the DOM at first paint but is **not painted** in `1440-fold.png` or `390-fold.png` — it is a scroll-revealed dock with an entrance transition. G-MV1's binary condition (pill + aria at all widths, no `display:none` below 834 px) is met, so this is recorded, not failed.

## G-H5 — asset ladder honesty — **PASS** (R5 stays an honest FAIL)

- `HEAD https://forgotten-mistory.web.app/assets/my-hero-avatar.mp4` → **404**; `/assets/hero/my-hero-avatar.mp4` → **404**. The 360p orphan is gone.
- Live PNG fetched and measured from its IHDR: **1480×826, 496 176 B** — exactly the declared `width: 1480, height: 826` (`app/data/portfolio/avatar.ts:28-29`). The "PNG 900×502 vs declared 1480×826" defect is **cleared on live**.
- Ladder is published and honest — `app/data/portfolio/avatar.ts:17-24`: *"no ≥1080p portrait source exists on the host, so R5 (≥4K@60 or resolution-independent) is a documented FAIL for the portrait"*; loop declared `1280×720, 24 fps` at `avatar.ts:44-45` with the same disclosure.
- No 4K / ≥1080p claim appears in the live HTML.

Per the acceptance as written: 360p gone + honest ladder = **G-H5 PASS**, with **R5 remaining FAIL, honestly declared**.

## G-H6 — palette exception — **PASS (hold confirmed)**

Colour photograph still live at both widths (`shots/1440-fold.png`, `shots/390-fold.png`); `docs/architecture/PALETTE-EXCEPTIONS.md` present (8477 B); the exception is pinned by `tests/palette_bundle.test.mjs`. Colour-with-memo. **Grayscale was not demanded.**

## G-A3 — about is the radar, not the field — **FAIL**

**Measured defect:** `#about` contains **0 `<canvas>` elements** — on the default path *and* on `?gl=force` (`probe2.json → default_afterScroll.aboutInfo.canvases: []`, `glforce_afterScroll.aboutInfo.canvases: []`). The only graphic in the section is a single **384×384 SVG**, `<title>` = *"Instrument face of ten dimensions. No scores: three of the t…"* — the radar/compass dial reading `01`–`10` around `NO SCORES` (`shots/1440-default-about.png`).

The acceptance requires recruiter recall of `#about` to be **the GL field**. There is no GL field in `#about` at any path. `?gl=force` does not rescue it — unlike `#hero`, `#vitrine` and `#listen`, which do mount `webgl2` under force, `#about` mounts nothing. Recall is the radar widget. **FAIL.**

## G-E2 — gold discipline in Experience — **PASS**

Full sweep of every text-bearing element under `#experience`, comparing computed `color` against `--gold: #c9a84c` (±26/±26/±30 tolerance), plus every `fill`/`stroke` in `#experience svg`:

- Gold text strings: **1** — `"Australian Taxation Office (ATO)"`, `rgb(201, 168, 76)`, date-pattern match **false**.
- Gold strings matching a date pattern (`19xx|20xx`, month names, `N yr/mo`): **0**.
- Gold SVG fills or strokes (the Gantt bars/axis): **0**.

Gold appears on a sourced employer string and nowhere else. **PASS** on the acceptance as written.

*Carried note (not part of this verdict):* the backlog's wider G-E2 directive also asks for "≥2 scroll-driven strata depth planes". `#experience` has **0 canvases** on the default path, so the WebGL strata field does not render for ordinary visitors — a downstream consequence of the capability-gate defect above, to be tracked with G-A3/G-X2.

## G-S2 — skills-bench is the narrative carrier — **PASS**

`#skills` (height 3175) is led by `Bench_figure` **1248×775** with `Bench_stage` **1248×580** and `Bench_caption` 652×54; **126** bench-classed nodes. `shots/1440-skills.png` shows the bench as the section's argument: PROGRAMMES (`ATO · Payday Super 2`, `ANZ Banking Group 3`, `Independent consulting 1`) and REPOSITORIES (`aether-job-career-agent 4`, `abentertainment 2`, `this site 1`, …) wired by hairlines to capabilities, gold marking evidence taken in production — exactly what the section copy promises. `canvases: 0`, so the carrier is SVG, not GL, and it carries. No proficiency bars. **PASS.**

## G-L1 C5 — caliper reading — **FAIL**

**Measured defect:** the live caliper renders the em-dash.

```
listenInfo.readingText       = "—"      (U+2014)
listenInfo.readingClass      = "Listen_reading___amBx"
listenInfo.dataReadingPresent = false
```

`[data-reading]` does not exist anywhere in the live DOM (`grep -c 'data-reading'` over the served HTML → **0**).

Source of the defect: `components/sections/Listen/Listen.tsx:265-272` renders a hard-coded literal `—` as the `<text>` child; `Listen.tsx:62` documents the intent — *"the reading between them stays '—': the section makes no claim"*.

Required: `${durationSeconds.toFixed(2)} s` from the generated envelope — `app/data/generated/greeting-envelope.ts:277` → `durationSeconds: 24.984671` → **`24.98 s`**. That value is already imported one file away (`components/sections/Listen/ListenField.tsx:103` feeds `uDuration`), so the measurement exists and is simply not printed. **FAIL.**

## G-X2 — ≥7 visible cinematic scenes at 60 fps — **FAIL**

**Measured defect:** the live page never presents 7 cinematic scenes.

- Default path, first paint and after scrolling all six sections, 1440 and 390: **0 canvases**.
- `?gl=force`: **1** canvas at first paint (`#hero` 1440×1460 `webgl2`), **2** concurrent after scrolling (`#vitrine` 1296×759, `#listen` 300×150) — **3 distinct sections** across the whole page.

3 < 7, and the visitor-facing count is 0. The 61 fps sample is the DOM/CSS fallback path, not a scene. Consistent with the backlog's own instruction, a MiniVic viseme census is **not** counted as a cinematic scene, and no such census was accepted here. **FAIL — stated honestly rather than deferred.**

---

## Held gaps (re-probed, no regression)

| Gap | Live evidence this commit |
|---|---|
| **G-NEW-1** | `button` "Ask Mini Vic" at 390×844: `display:flex`, `visibility:visible`, `opacity:1`, `158×44`. No `display:none` at any probed width. Hold stands. |
| **G-C1** | Listen CTA is `"Email a 20-minute-call agenda"` → `mailto:` — labelled as email, **not** "Book". Vitrine engage is `"Email a project brief"` → `mailto:`. One honest promise, consistently named. Hold stands. |
| **G-V3** | Six plates render at rest with visible primary strokes and labels (`shots/1440-vitrine.png`); all six repo rows present with live `Source` / host links. Hold stands. |
| **G-M4** | Not re-timed this cycle — TTFB was measured on `aa58395b` and no MiniVic/Hosting change landed between that commit and `64404134`. Not reopened; not re-claimed as fresh evidence. |

Listen gold audit (G-L1 C3 regression check): gold appears on **no** `#listen` anchor colour in the measured set — the two checkable-record channels (LinkedIn, GitHub) render `rgb(246,246,246)` text with their gold treatment carried on non-`color` properties; no gold leaked onto `mailto:` or `tel:`. No regression observed.

---

## Required follow-up (orchestrator — feedback_refactor_loop, never silent-close)

1. **Capability gate** — a WebGL-2-capable browser gets 0 canvases on `/` while `/?gl=force` mounts `webgl2` in the same session. Root-cause `components/gl/useGLCapability.ts`. This blocks G-A3, G-X2 and the G-E2 strata directive at once and is the highest-leverage fix on the board.
2. **G-A3** — `#about` has no GL field to gate at all; the radar dial is the whole section. Needs the field built, then the gate fixed, in that order.
3. **G-L1 C5** — print `greetingEnvelope.durationSeconds.toFixed(2) + ' s'` at `Listen.tsx:265-272` and expose `data-reading`; the value is already in scope one file away.
4. **G-X2** — 3 scenes exist under force, 0 ship. Either land the remaining scenes or record "zero-credit, not shipped" honestly; do not count visemes.

**Self-approval rejected:** no implementer's own report was accepted as evidence. Every verdict above cites a live measurement, a live HTTP status, or a `file:line`.
