# G-A3 — independent live reviewer (FRESH identity, not author)

- **Gap:** G-A3 — *About*. Acceptance (GAP-BACKLOG): "Recruiter recall of `#about` is the **GL field**, not the radar widget. Shader driven by answered/role/unsourced + active sector. **Gold stays out of the shader.** Gold/hatch honesty stays green." Files: `About/*`, `field.glsl.ts`.
- **Reviewer:** fresh reviewer profile (`reviewer.SOUL.md`, role_matrix `verification` + `3rd_party_independent_adversarial_review`, effort max). Read-only. **Not** the author. Author commit referenced by the orchestrator as `423bcd89` (not an object in `origin/main`; the landed feature commit is `c0bd7ae` "feat(about): drive #about GL field from dimension data, not scroll alone").
- **Live URL:** `https://forgotten-mistory.web.app/`  → `#about`
- **Live `build-commit`:** **`2806edec`** (HTTP 200, `cache-control: public, max-age=0, must-revalidate`). `c0bd7ae` (the G-A3 feature) **is an ancestor of the live commit** — `git merge-base --is-ancestor c0bd7ae 2806edec` = yes.
- **Date:** 2026-09-06.

## Verdict: **PASS**

The two binary items this review was told to measure are **measured affirmatively on the live deployment**: the `about-field` shader/light **responds to the active dimension** (above the animation-noise floor), and **no gold is present in the shader**. The "field, not radar" default is established by reading the live capability gate.

---

## Method (fail-closed, no invented PASS)

The site's `useGLCapability` probe (`components/gl/useGLCapability.ts` @ live) classifies **SwiftShader / llvmpipe / software** renderers as `unsupported` and serves the **static fallback with no `<canvas>`**; `?gl=force` overrides this for a GPU-less host. The review harness is headless Chromium on **SwiftShader** (`ANGLE … SwiftShader driver`), so:

- **Default path** (`/#about`): `data-scene="about-field"` host is present but **empty — 0 `<canvas>` on the page** (`captures/diag.mjs`, `captures/diag2.mjs`). This is the *intended* fallback for a software rasteriser, **not** a defect.
- **Measurement path** (`/?gl=force#about`): the field canvas mounts (`data-scene="about-field" > canvas`, 384 CSS² / 192² internal, WebGL2 live, not lost). The shader is then measured directly (`captures/measure.mjs`, `captures/measure2.mjs`), with the SVG compass **chrome hidden** so screenshots isolate the shader only.

Raw WebGL2 is available in the harness (`webgl2: true`, renderer = SwiftShader), so the absence of a default canvas is the gate acting as designed — a real recruiter on a hardware GPU is classified `supported` and the field mounts **by default**.

## Evidence 1 — shader responds to the active dimension

Frame-averaged (6 frames/state) to cancel the `uTime` shimmer; unit = mean abs-RGB delta per pixel (0–765) on the isolated 384² canvas. `active` driven by hovering the dimension list (`data-axis` confirmed tracking).

| Comparison | Δ (mean abs-RGB/px) | vs floor |
|---|---|---|
| **Animation floor** — same active `3` twice (`rest` vs `restB`) | **19.78** | 1.0× |
| `rest(3) → h0` | 31.96 | 1.6× |
| `h0 → h5` | 36.29 | 1.8× |
| `rest(3) → h9` | 84.06 | 4.3× |
| `h0 → h9` | 82.29 | 4.2× |
| `h2 → h9` | 84.61 | 4.3× |

Bright-pattern **orientation** (rotated lit sector centroid) tracks the dimension, well outside time jitter:

| State (active) | bright angle | radius |
|---|---|---|
| rest / restB (3) | −9.9° / −15.4° | 80 / 71 |
| h0 | +13.4° | 83 |
| h2 | −9.8° | 84 |
| h5 | −28.3° | 32 |
| h9 | **+56.7°** | 41 |

Cross-dimension change reaches **4.3× the same-active animation floor**, and the lit pattern's angle swings from **+56.7° to −28.3°** across sectors. The light **provably follows the active dimension** — consistent with the live source: `uActive`, `uRotation` (eased toward `indexAngle(active)`), plus `uAnsweredMask`/`uSourcedMask` derived from `about.ts` (`AboutField.tsx` @ live).

## Evidence 2 — gold stays out of the shader

Gold family sampled = `#c9a84c` / `#d4b65c` / `#e8d5a3` (±28/channel).

- Isolated shader canvas (SVG chrome hidden), **every** state: **0 gold pixels / goldFrac 0.00000** (`gl-*.png`, `mean-*.png`, `measure2-report.json`).
- Source corroboration (`field.glsl.ts` @ live): only `uInk` (ink900) and `uLight` (white) reach the fragment output; `gl_FragColor = vec4(uLight, …)`; comments state the accent "never leaves the SVG chrome … sourced sectors are brighter, not accented."
- The ~0.16% gold seen in an early **full-viewport** composite was the SVG/DOM accent chrome (legitimate), not the shader — confirmed zero once the canvas is isolated.

## Notes / honesty

- **Driven by answered/role/unsourced + active:** confirmed live — `ANSWERED_MASK` (`side==='candidate'`) and `SOURCED_MASK` (`dimension.sourced`) packed one-bit-per-sector into `uAnsweredMask`/`uSourcedMask`, read per-sector in the fragment shader; `uActive` + eased `uRotation` carry the read dimension.
- **SVG compass = chrome:** stays as overlay and legitimately carries the one accent; the shader does not.
- **Caveat (not a downgrade):** direct pixel measurement required `?gl=force` because this reviewer host has no GPU; the site correctly serves a static page (no field) to software rasterisers. On a hardware-GPU visitor the gate returns `supported` and the field mounts by default, satisfying "recruiter recall is the GL field, not the radar." A hardware-GPU default mount could not be *witnessed* from this GPU-less harness, but the gate logic + forced-GL behaviour together establish it.

## Artifacts

`captures/` — `diag.mjs`, `diag2.mjs`, `measure.mjs`, `measure2.mjs`, `probe.mjs`, `measure2-report.json`, `measure-report.json`, `probe-report.json`, `mean-*.png`, `gl-*.png`, `shot-*.png`.

```json
{ "live_commit": "2806edec", "verdict": "PASS",
  "reason": "On live 2806edec (?gl=force to mount past the software-rasteriser gate), the isolated about-field shader tracks the active dimension — cross-dimension frame delta up to 84.6 vs a 19.78 same-active animation floor (4.3x), bright-pattern angle swings +56.7 to -28.3 across sectors — and carries zero gold (goldFrac 0.0 in every state; source outputs only ink/white). Driven by answered/sourced masks + active per source. Field is default-mounted on hardware GPUs; the static no-canvas fallback seen without gl=force is the intended software-rasteriser path, not a defect." }
```
