# G-V3 — Independent live review (§5 reviewer, max)

- **Task:** `t_rev_gv3`
- **Reviewer identity:** fresh reviewer profile (`reviewer.SOUL.md` + `reviewer.system-prompt.md` + `council/qa-verifier.md`). **Not** the G-V3 author `ea9e589b`. Read-only; no implementation.
- **Gap acceptance (GAP-BACKLOG.md, G-V3):** *All six plates **at rest**, primary strokes ≥4.5:1 composited; labels ≥4.5:1; guides ≥3:1. Lit plate heavier.*
- **Verdict: PASS**

---

## Live build-commit (recorded)

| When | Server `build-commit` | `last-modified` |
|------|----------------------|-----------------|
| Task intake (~17:13Z) | `b0513692` (expected per brief) | 2026-09-05 17:13:14 GMT |
| **At review time** | **`8d772fb9`** | 2026-09-05 17:23:43 GMT |

- URL: `https://forgotten-mistory.web.app/`, HTTP/2 200, `cache-control: public, max-age=0, must-revalidate`.
- The `fm-deploy-cadence` metronome rolled the live head `b0513692 → 8d772fb9` mid-review. **The G-V3 surface is byte-identical between the two commits** — plate rest `opacity: 0.82`, `.stroke { stroke-opacity: 0.9 }`, `.label { color: var(--white); opacity: 0.85 }` over `--ink-900 #0A0A0A`; the intervening merges (`gnew1t`, `gh6`, `gh5r`, `gx2`) do not touch `Vitrine.module.css` / `Drawings.module.css`. This review therefore stands for the `b0513692` plate work; evidence is filed under the commit actually served, `8d772fb9`. (`origin/main` has since advanced to `545df77`.)

Composited stack on live: `--white #F6F6F6` (L≈0.965) × `stroke-opacity 0.9` × per-element `opacity` × plate `opacity` over `--ink-900` ground.

---

## Method — composited pixels measured in the browser (not CSS comments)

1. Real Chromium tab on the live URL, `Emulation.setDeviceMetricsOverride` at **1440×900** (dpr 1) and **390×844**.
2. Per feature, `Page.captureScreenshot` with `captureBeyondViewport` and a tight `clip` at **scale 4** (a 0.75px non-scaling stroke → 3 device px, so the centreline saturates), in **document** coordinates derived from each element's live `getScreenCTM()` + `scrollX/Y`.
3. Each PNG is decoded **in-page** onto a `<canvas>` and read with `getImageData` — i.e. the browser's own composited output, including the plate group-opacity and the CRT-grain/vignette ground.
4. Per crop (coordinate-free): **feature luminance = brightest pixel**, **ground luminance = 8th-percentile pixel**, WCAG relative luminance, `CR = (Lhi+0.05)/(Llo+0.05)`.

Rest state = rail at `scrollLeft 0`, no hover, no scroll-trace trigger: one plate holds the raking light (`data-lit`, `opacity 1`), the other five rest at `opacity 0.82` (`data-drawn:false`). The unlit plate is the worst case for the ≥4.5 / ≥3 floors; the lit plate answers "heavier".

---

## Measured composited ratios

### Resting (unlit) plate — plate 02 `rebuild-loop`, computed `opacity 0.82`, `data-lit:false data-drawn:false`

| Tier | Element | element `opacity` | Composited L | Ground L | **Contrast** | Floor | Pass |
|------|---------|------------------:|-------------:|---------:|-------------:|-------|:----:|
| Primary stroke | LIVE box edge (`rect`, sw 0.75) | 0.978 | 0.4793 | 0.0044 | **9.73:1** | ≥4.5 | ✅ |
| Guide | PUSH→BUILD connector (`line`, sw 0.75) | 0.763 | 0.5271 | 0.0052 | **10.46:1** | ≥3.0 | ✅ |
| Label | `LIVE` (`--white`, 0.85) | — | 0.4564 | 0.0044 | **9.31:1** | ≥4.5 | ✅ |

### Lit plate — plate 01 `pipeline-gate`, computed `opacity 1`, `data-lit:true`

| Tier | Element | element `opacity` | Composited L | Ground L | **Contrast** | Note |
|------|---------|------------------:|-------------:|---------:|-------------:|------|
| Primary stroke | GUARD gate (`line`, sw 1) | 0.978 | 0.9131 | 0.0030 | **18.16:1** | **heavier than resting (18.16 > 9.73)** ✅ |

### All-six coverage

- At **1440** and **390** the rail enumerates 6 plates with drawings present at rest: index 0 `data-lit` `opacity 1`; indices 1–5 `opacity 0.82` (verified via `getComputedStyle`).
- Plates 1–5 share one composite stack (identical `--white` stroke/label tokens, `stroke-opacity 0.9`, plate `0.82`); they differ only in drawing geometry. The **faintest stroke opacity anywhere on the rail is 0.686** (plate 04 `reconstruction-bands`). On the measured near-black ground (L≈0.005) that composites to `L ≈ 0.965 × (0.686·0.9·0.82) ≈ 0.49 → CR ≈ 9.5:1`, i.e. every stroke on every plate clears both the 4.5 primary floor and the 3.0 guide floor with ≈2× margin. The live rail exposes horizontal plate travel via keyboard/transform (not `scrollLeft`), so per-plate offscreen capture of 2–5 was not force-scrolled; the shared stack + faintest-op bound covers them.

---

## Regression context

Prior adversarial baselines (ADV-1556Z) measured live **rest-plate strokes 3.60–4.24:1** with plate rest `opacity 0.62`. Raising the plate rest composite to **0.82** and driving strokes/labels off `--white` lifts the resting composite to **>9:1** measured — the gap's binary criteria are now met on pixels, not on CSS comments.

## Screenshots (rest rail, captured live at review time)

- `gv3-rest-rail-1440.png` — 1440 rest rail; hairline strokes and `PROBE FAILS` label render clearly on the near-black plates.
- `gv3-rest-rail-390.png` — 390 rest rail; all six plate drawings + labels (GUARD/REVERTED, PUSH/BUILD/PROBE/LIVE, GENERATE/JUDGE/REMEDIATE/SIGNED, COMMITS/ACTIVE/STACK) legible; lit **Aether** plate visibly heavier than unlit neighbours.

(Screenshots captured on the review host; the hard evidence is the measured-pixel table above.)

## Verdict

**PASS** — on live `8d772fb9` (== G-V3 surface of `b0513692`): all six Vitrine plates carry their mechanism drawings at rest; resting primary strokes **9.73:1**, labels **9.31:1**, guides **10.46:1** (worst-case stroke ≈9.5:1) — all above the ≥4.5 / ≥3 floors; the lit plate primary is **18.16:1**, strictly heavier than resting.
