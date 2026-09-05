# R-c13 — adversarial lens — run v10-20260905T0515Z

Target: **https://forgotten-mistory.web.app** (production only).
Reviewed build (`<meta name="build-commit">`), three values inside the review window:

| moment | value | contains cycle-11 `f86b125`? |
|---|---|---|
| precondition check, 06:36:30Z | `3adf126a` | yes (`git merge-base --is-ancestor`) |
| pass 1 / pass 2 / pass 3, 06:37–06:44Z | `d59621de` | yes (`d59621d Merge remote-tracking branch 'origin/main'`) |
| end of review, 06:44Z | `15fb165b` | yes |

Three deploys landed mid-review (the 10-minute pipeline). Every finding below was
reproduced on `d59621de` and re-confirmed against `15fb165b`.

## Verdict: **FAIL**

One blocker, three majors. The blocker is met by essentially every real visitor on
first paint, so no other consideration ranks above it.

Reviewer independence: this reviewer wrote no cycle-11 / cycle-13 code and made no
edit to any source file; all artefacts are under `R-c13/`.

---

## What holds (Verified, `adversarial-report.json`)

| gate | result |
|---|---|
| console errors / pageerrors / failed requests | **0 / 0 / 0** at 1440×900, 1920×1080, 834×1194, 390×844 (`pass1_viewports[].consoleErrorCount`) — on the **software-rasteriser path only**; see ADV-1 |
| axe-core wcag2a + wcag2aa + wcag21a + wcag21aa | **0 violations** at all four viewports (`pass1_viewports[].axe.violations`) |
| response headers | CSP (with `frame-ancestors 'none'`), `X-Frame-Options: DENY`, HSTS `max-age=31556926; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` — all present (`headers-root.txt`) |
| asset budget | 29 requests, **542 kB** total at 1440; largest transfer **156 kB** (`my-hero-avatar.mp4`); **zero assets over 500 kB** (`pass1_viewports[].over500kB` = `[]`) |
| six sections, in order, with headings | `#hero` H1 "Vikram Deshpande" → `#about` H2 "Ten dimensions, answered" → `#experience` H2 "Sixteen years, to scale" → `#skills` H2 "Calibration card" → `#vitrine` H2 "Six of thirty-eight" → `#listen` H2 "Feedback & coffee?" — identical at all four viewports |
| reduced motion | `document.getAnimations().filter(a => a.playState === 'running').length` === **0** after 3 s at both 1440 and 390; both `<video>` `paused: true`, `currentSrc: ""`; `#hero h1` opacity 1, transform none. **R-c8 ADV-F-1 is closed.** |
| no-GL (getContext → null) | hero fully readable: H1 `rgb(246,246,246)` at 118.08 px / 48 px, 721 chars of hero copy, all five CTAs visible, `.stage` carries a real radial+linear gradient (R-c8 MOT-F-3 closed) |
| horizontal overflow | `scrollWidth === innerWidth` at all four viewports |
| LCP / CLS (clean, no synthetic scroll) | **1440: LCP 668 ms, CLS 0.000** · **390: LCP 320 ms, CLS 0.000** — LCP element `H1#hero-name` (`pass2.cleanPerf`). Well inside the <2.5 s / <0.05 bar |
| focus visibility | 0 of 83 tab stops lack both an outline and a box-shadow (`pass1_keyboard.noFocusRingCount` = 0) |
| `POST /api/chat` | **200** in 6.40 s, `provider: "openai"`, `model: "gpt-4.1-mini"`; answer is **grounded** — every figure maps to `cv-text.txt` ($5M+ l.64/75, up to 40 practitioners l.76, P95 <200 ms l.62, >30%/>15% l.72-73, 40+ execs/>55% l.84-85) |
| `POST /api/tts` | **200**, `audio/mpeg`, 13 000 bytes (5 characters spent, the one allowance) |
| content parity | all three hero ledger figures trace to the CV: `≈92%` → l.32, `$5M+` → l.64/75, `10k+ … P95 < 200 ms` → l.60/62. Caliper state on all three is `self-reported`, and **zero gold in `#hero`** — CT-10 holds |
| gold discipline | 30 gold elements site-wide, all licensed: 29 in `#skills` are the "measured in production" mark (`tr[data-status="production"] .statusGlyph`, `.mark.production`, one legend glyph) and 1 in `#vitrine` is a live repository URL (`a.Vitrine_live`, `href=https://aether.srv1356245.hstgr.cloud`). **Zero gold in `#hero`, `#about`, `#experience`, `#listen`. R-c8 C-08 is closed** — no gold strands remain |

---

## Findings

### ADV-1 — **BLOCKER** — whole page (Verified)

**Finding.** **Every visitor whose browser reports a hardware GPU gets an error page instead
of the portfolio.** The site renders `app/error.tsx` — "SYSTEM INTERRUPT / Something went
wrong / An unexpected error occurred while rendering this page" — with **zero sections**,
no hero, no name, no CV link, no contact.

Reproduced with **no query string**, at both 1440×900 and 390×844
(`capture/1440x900-hardware-gpu.png`, `capture/390x844-hardware-gpu.png`,
`adversarial-report.json → pass3_hardwareGpu`):

```
{"h1":"Something went wrong","sectionCount":0,"canvasTotal":0,"errorBoundary":true,"ceCount":4}
```

Method (`adv3-gpu.mjs`): `components/gl/useGLCapability.ts:30-47` decides WebGL is usable
unless `UNMASKED_RENDERER_WEBGL` matches `/swiftshader|llvmpipe|software|basic render/i`.
An init script overrides `WebGLRenderingContext.prototype.getParameter` for `0x9246` to
return `ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)`. That is the
**only** input that differs between this VPS and a recruiter's laptop, so the executed code
path is identical.

Underlying error, 4× per load:

```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
  at e.exports (https://forgotten-mistory.web.app/_next/static/chunks/904.66d19854a4ab6d3a.js:1:10329)
[app/error.tsx] Unhandled error: TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
```

Root cause. `package.json` was moved to `next@15.5.25` (commit `18c6beb chore(deps): next
15.5.25 — audit clean, CI installs functions deps`) while `@react-three/fiber@8.18.0` was
left in place. r3f 8 reads `ReactCurrentBatchConfig` off
`React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`; React 19 — which Next 15
resolves — removed it. The deployed chunk still contains the symbol
(`curl .../904.66d19854a4ab6d3a.js | grep -c ReactCurrentBatchConfig` → present).
The repo checkout was never re-installed (`node_modules/next` is still **14.2.35** against a
`package.json` pinning **15.5.25**, `node_modules/react` still 18.2.0), so `tsc`, `lint`,
`build:static` and the whole Playwright suite pass locally against React 18 and never
execute the deployed combination.

Why every prior live check missed it. The VPS has no GPU, so `useGLCapability` returns
`unsupported`, the scene never mounts, and the site serves its (excellent) fallback. The
escape hatch built for exactly this — `?gl=force`, `useGLCapability.ts:36-42` — is itself
broken by the same bug, so it caught nothing: `https://forgotten-mistory.web.app/?gl=force`
returns the same error page (`pass2.probes`: `?gl=force` → `h1:"Something went wrong",
sections:0, ce:4`, while `?gl=auto`, `?utm_source=linkedin` and `#experience` all render
normally). The council's own review URL is a dead page.

**Direction.** Either (a) upgrade to `@react-three/fiber@^9` + `@react-three/drei@^10`
(the React-19 line) alongside `next@15.5.25`, or (b) revert `package.json` to
`next@14.2.35` / React 18 until (a) is done. Then, in the same commit, delete
`node_modules` and re-install so the checkout matches the lockfile, and re-run the full
four-command gate. Do **not** land a GL change again without executing the hardware path.

**Files.** `package.json`, `package-lock.json`, `components/gl/Scene.tsx`,
`components/gl/GLCanvas.tsx`, `components/gl/useGLCapability.ts`,
`tests/overhaul/render.spec.ts`

**Acceptance.**
1. A Playwright spec that spoofs `UNMASKED_RENDERER_WEBGL` to a hardware string (the
   `adv3-gpu.mjs` init script) loads `/` at 1440×900 and 390×844 and asserts
   `document.querySelectorAll('section[id]').length === 6`, `pageerrors === 0`,
   `console.error count === 0`, and that no element matches text `/SYSTEM INTERRUPT/`.
2. The same spec against `/?gl=force` asserts `#hero canvas` count `>= 1`.
3. `node -e "require('./node_modules/next/package.json').version"` equals the
   `package.json` pin before the build step runs, enforced in
   `scripts/validate/overhaul_static_audit.mjs`.

---

### ADV-2 — **MAJOR** — `#experience`, and §0.3 mandate 1 / R2 site-wide (Verified)

**Finding.** On the path every real visitor actually receives today (the fallback), there
are **zero `<canvas>` elements anywhere on the page**, and `#experience` contains **zero
`<svg>` as well** — i.e. the section CLAUDE.md describes as "every role drawn to its real
duration on one axis, **over a WebGL strata field**" ships with no visualisation element of
any kind. Measured after scrolling each section to centre and waiting 1.4 s
(`pass2.glDefault.perSection`):

```
hero: 0 canvas / 1 svg   about: 0 canvas / 1 svg   experience: 0 canvas / 0 svg
skills: 0 canvas / 1 svg  vitrine: 0 canvas / 6 svg  listen: 0 canvas / 1 svg
```

Against the brief: §0.3 mandate 1 requires **one flagship visualisation per section** —
`#experience` has none. R2 requires **≥7 GLSL/R3F signature scenes at 60 fps** — the live
count of mounted WebGL scenes is **0** for every visitor (fallback path) and the site is
unreachable for the rest (ADV-1). R2 currently scores 0/7 in production.

Distinguish two halves: the *fallback having no canvas* is correct and intended
(`useGLCapability` declining a software rasteriser is good engineering); the defect is that
(i) the hardware path that would mount them crashes, and (ii) `#experience`'s fallback has
no static visualisation at all, so on the fallback the section is text on a flat ground.

**Direction.** Close ADV-1 first, then give `#experience` a non-WebGL flagship: render the
existing bar/track geometry as inline SVG (it is already laid out in
`Experience.module.css` `.trackBar` / `.trackYears`) so the section reads as a chart with
WebGL absent, and let `CareerStrata` layer over it when GL is available. Re-count scenes
against R2 once the hardware path renders.

**Files.** `components/sections/Experience/Experience.tsx`,
`components/sections/Experience/CareerStrata.tsx`,
`components/sections/Experience/Experience.module.css`,
`tests/overhaul/experience-signature.spec.ts`

**Acceptance.** With `getContext` stubbed to `null`, `#experience svg` count `>= 1` and at
least 8 `.trackBar` elements have a rendered width > 0; with a spoofed hardware GPU,
`#experience canvas` count `>= 1` and total page `canvas` count `>= 7` across the six
sections (R2), each holding ≥55 fps sampled over 3 s at 1440 and 390.

---

### ADV-3 — **MAJOR** — global chrome (MiniVic launcher) (Verified) — *repeat of R-c8 ADV-F-2, not fixed*

**Finding.** The MiniVic launcher is **tab stop 83 of 83** — dead last. A keyboard user
traverses the entire page, including all of `#listen` and the footer, before reaching the
chatbot the brief names as the employer/client channel
(`pass1_keyboard`: `totalStops: 83`, `minivicTabStop: 83`,
`minivicName: "Open Mini Vic assistant"`). R-c8 ADV-F-2 specified an "Ask Mini Vic"
skip-link inside the first 3 stops; the first three stops are still
`1 Skip to the evidence · 2 Back to top · 3 Download CV`. The accessible name has improved
("Open Mini Vic assistant" — it was unnamed), which closes the naming half only.

**Direction.** As R-c8 specified: add a second visually-hidden-until-focused anchor beside
"Skip to the evidence" in `components/site/Navigation.tsx` reading "Ask Mini Vic", whose
handler focuses `toggleRef.current` (`components/MiniVicBot.tsx`) and calls
`setIsOpen(true)`; reuse the existing skip-link focus rule.

**Files.** `components/site/Navigation.tsx`, `components/MiniVicBot.tsx`, `tests/a11y/`

**Acceptance.** Tab from the top at 1440×900: within the first 3 tab stops one focused
element exposes the accessible name "Ask Mini Vic"; pressing Enter leaves
`document.activeElement` with `data-testid="minivic-toggle"` and the panel open.

---

### ADV-4 — **MAJOR** — `#hero` / nav (Verified) — *repeat of R-c8 C-07, not fixed*

**Finding.** Two identical "Download CV" controls sit in one viewport at 1440×900 — the nav
pill at top-right and the hero outline button — competing with the hero's own primary
"See the evidence" (`capture/1440x900-hero.png`; `pass1_keyboard` tab stops 3 and 7 both
carry the name "Download CV"). Duplicate primary actions in a single frame is the one
composition defect that also degrades the keyboard and screen-reader experience, which is
why it is repeated here.

**Direction.** As R-c8 C-07: demote the nav action to plain text until the hero has left
the viewport (restore the pill on `[data-scrolled]`), or relabel it "CV".

**Files.** `components/site/Navigation.tsx`, `app/globals.css`

**Acceptance.** At 1440 with `scrollY === 0`, exactly one element in the viewport has the
accessible name "Download CV".

---

### ADV-5 — **MINOR** — `/api/chat` (Verified)

**Finding.** The public chat endpoint returns its routing internals to any caller:
`{"provider":"openai","model":"gpt-4.1-mini"}` (`api-chat-body.txt`). Two problems, one
operational and one contractual. Operationally it is unnecessary vendor disclosure on an
unauthenticated endpoint. Contractually, §0.4 / C-3 route the agent brain to **OpenRouter,
failing over to Anthropic via OAuth** — a live response naming `openai` / `gpt-4.1-mini` is
evidence the deployed function is on neither. Response time 6.40 s also misses R3's
"perceived real-time (<~1.5 s first word)" bar; the endpoint is not streamed.

**Direction.** Drop `provider`/`model` from the client payload (keep them in the function's
server log). Confirm the deployed function's routing against §0.4 and record the decision.
Stream the response (SSE / chunked) so first word lands under 1.5 s.

**Files.** `services/` chat function + its Firebase rewrite, `components/MiniVicBot.tsx`

**Acceptance.** `POST /api/chat` body contains no `provider` or `model` key; time to first
byte of answer text < 1.5 s; the routing recorded in evidence matches §0.4.

---

### ADV-6 — **POLISH** — `#hero` / `#experience` / `#about` copy (Verified) — *repeat of R-c8 ADV-F-4*

**Finding.** Site headline tenure still runs one year above the CV's own headline: the page
says "Sixteen years" (`app/data/portfolio/hero.ts:29`, `experience.ts:106`, `about.ts:50`)
while `public/docs/Vik_Resume_Final.pdf` line 3 says "**15+ year** Senior Technical Leader"
(`cv-text.txt:3`). Under prime directive "never grade a claim higher than its evidence",
the page should not out-round its own source.

**Direction.** Either set the copy to "Fifteen years" / "15+ years", or add the derivation
(2010 → 2026) beside the claim so a reader can check the arithmetic. One decision, applied
to all three data files.

**Files.** `app/data/portfolio/hero.ts`, `app/data/portfolio/experience.ts`,
`app/data/portfolio/about.ts`, `tests/content/content-check.spec.ts`

**Acceptance.** A content test asserts the tenure string on the page is either present in
`cv-text.txt` or accompanied by its two anchor years in the same element.

---

## Method and artefacts

| artefact | what it is |
|---|---|
| `adv.mjs` | pass 1 — 4 viewports (console/pageerror/failed-request counters, axe-core wcag2a/2aa/21a/21aa, section order, gold audit, asset budget, overflow), reduced-motion ×2, no-GL ×2, `?gl=force`, 130-key tab walk |
| `adv2.mjs` | pass 2 — clean LCP/CLS with no synthetic scrolling, per-section canvas/svg audit, query-string probes |
| `adv3-gpu.mjs` | pass 3 — hardware-GPU reproduction via `UNMASKED_RENDERER_WEBGL` spoof, no query string |
| `adversarial-report.json` | merged machine-readable result of all three passes |
| `headers-root.txt` | `curl -I` of the live origin |
| `api-chat-body.txt`, `api-chat-headers.txt`, `api-chat-status.txt` | `/api/chat` probe |
| `api-tts-status.txt`, `api-tts-body.txt` | `/api/tts` probe (5 characters) |
| `cv-text.txt` | `pdftotext -layout public/docs/Vik_Resume_Final.pdf` — the parity source |
| `capture/` | 12 PNGs, each ≤ 400 kB, at 1440×900 / 1920×1080 / 834×1194 / 390×844 plus reduced-motion, no-GL and hardware-GPU states |

**Correction against my own pass 1.** Pass 1 reported LCP 10 180 ms at 834 and 9 680 ms at
390. That was an artefact of the harness: LCP keeps updating under programmatic scrolling,
and pass 1 read the value *after* scrolling the page. The authoritative unscrolled numbers
are LCP 668 ms / CLS 0.000 at 1440 and LCP 320 ms / CLS 0.000 at 390 (`pass2.cleanPerf`).
There is no LCP finding.

**Not tested, and why.** 60 fps sampling per scene (R2) could not be performed: no scene
mounts on this host's fallback path, and the hardware path crashes (ADV-1). That
measurement belongs to the motion lens once ADV-1 is closed.
