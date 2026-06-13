# Edge-case catalogue

Comprehensive failure/boundary scenarios for the portfolio. Each is a contract: a future
agent must preserve the **Expected** behaviour and has a **Test** hook to prove it. IDs are
stable; add new ones, never renumber. Format: `ID | Scenario | Expected | Test`.

Legend — Test: E2E=Playwright, V=visual, P=perf, A=axe, U=unit/audit, M=manual.

---

## EC-RENDER — WebGL / rendering

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-RENDER-01 | WebGL unsupported (old browser, blocked) | Static monochrome starfield poster; no crash; content fully usable | E2E |
| EC-RENDER-02 | WebGL context lost (GPU reset, tab backgrounded long) | Scene re-inits or falls back to poster; no white screen | M |
| EC-RENDER-03 | Low-power device (deviceMemory ≤4 / cores ≤4) | Post-FX disabled (already wired); FPS holds | P |
| EC-RENDER-04 | `prefers-reduced-motion: reduce` | All scene motion off; static frame | E2E+A |
| EC-RENDER-05 | Very high-DPR display (retina/4K) | DPR capped; no FPS collapse; crisp UI text | P |
| EC-RENDER-06 | Tab hidden then refocused | Scene pauses on hide, resumes cleanly; no time jump | M |
| EC-RENDER-07 | Multiple scenes on screen at once | Off-screen scenes paused; only visible animate | P |
| EC-RENDER-08 | `mix-blend-mode: screen` with bright nebula | Scene colours stay dark; no blowout | V |
| EC-RENDER-09 | Resize / orientation change mid-animation | Canvas resizes, no stretch, no layout shift | E2E |
| EC-RENDER-10 | Long session (memory) | No leak after 10 min; instanced buffers reused | P |
| EC-RENDER-11 | Browser zoom 50%–200% | Layout + scene scale correctly | M |
| EC-RENDER-12 | Print / print-preview | Scenes hidden; readable monochrome print stylesheet | M |

## EC-NET — network / loading

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-NET-01 | Offline after first visit | Cached shell + CV render (NN-2 durability) | E2E |
| EC-NET-02 | Slow 3G | Skeletons/posters first; LCP element prioritised; no jank | P |
| EC-NET-03 | CDN asset 404 (avatar/img) | Graceful fallback (PNG→initials); no broken-image icon | E2E |
| EC-NET-04 | YouTube embed blocked (privacy/region) | Placeholder + link to channel; layout intact | E2E |
| EC-NET-05 | CV PDF unreachable | Button disabled with message; no dead download | E2E |
| EC-NET-06 | Flaky connection (intermittent) | Retries bounded; no infinite spinner | M |
| EC-NET-07 | Request timeout to LLM | Falls to next brain tier within timeout; user sees answer | E2E |
| EC-NET-08 | Mixed-content (http asset on https) | None present; CSP blocks; build check | U |

## EC-CLONE — MiniVic chat / voice / avatar

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-CLONE-01 | Static deploy (no API routes) | Tiers 2–3 answer; honest "offline mode" if no key | E2E |
| EC-CLONE-02 | Gemini key missing | Local KB answers; no console secret leak | E2E+U |
| EC-CLONE-03 | Gemini key referrer-blocked / 403 | Falls to local KB; UI states limitation plainly | E2E |
| EC-CLONE-04 | Empty / whitespace question | Prompt to rephrase; no API call | E2E |
| EC-CLONE-05 | Very long input (>2k chars) | Truncated/limited; no overflow; no crash | E2E |
| EC-CLONE-06 | Prompt injection ("ignore your instructions") | Stays in persona; no system-prompt leak; no unsafe action | M |
| EC-CLONE-07 | Off-topic / adversarial question | Polite boundary, redirects to relevant info | M |
| EC-CLONE-08 | Rapid repeated sends (spam) | Debounced/queued; rate-limit on dynamic path (429) | E2E |
| EC-CLONE-09 | Question about salary/visa/personal | Restrained, professional, factual per KB | M |
| EC-CLONE-10 | Recruiter preset ("why interview him") | Evidence-led answer, no boasting | M |
| EC-CLONE-11 | Client preset ("can he help with X") | Scoped, honest answer; CTA to contact | M |
| EC-CLONE-12 | History overflow (>MAX_HISTORY_TURNS) | Oldest turns dropped; context stays coherent | U |
| EC-CLONE-13 | ElevenLabs plan-restricted | Pre-rendered cloned-voice MP3; never a generic voice | E2E+M |
| EC-CLONE-14 | Voice id wrong/changed | Test asserts greeting matches the cloned voice id | E2E |
| EC-CLONE-15 | Autoplay blocked | Voice plays on first user gesture; visible play control | E2E |
| EC-CLONE-16 | Avatar video fails to load | Still image shown; no broken control | E2E |
| EC-CLONE-17 | Lip-sync drift on static MP4 | Pre-render verified ≤120 ms; sampled in V&V | M |
| EC-CLONE-18 | Realtime WS drops mid-stream | Reconnect or fall to fallback; partial answer preserved | M |
| EC-CLONE-19 | Concurrent users on dynamic backend | Stateless gateway scales; sessions isolated (Redis) | M |
| EC-CLONE-20 | Mute/unmute mid-speech | Audio stops/resumes; avatar state matches | E2E |
| EC-CLONE-21 | Non-English question | Answers in kind or states English preference; no crash | M |

## EC-CONTENT — data / parity

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-CONTENT-01 | Resume PDF updated, site not | Parity audit fails CI (TC-FR-PARITY) | U |
| EC-CONTENT-02 | New role added to siteContent | Renders in Experience without layout break | E2E |
| EC-CONTENT-03 | Empty bullet / missing field | Section omits gracefully; no `undefined` rendered | E2E |
| EC-CONTENT-04 | Very long role title | Wraps/ellipsis; no overflow | V |
| EC-CONTENT-05 | Project repo deleted/renamed on GitHub | Link check flags non-200 | E2E |
| EC-CONTENT-06 | Special chars (apostrophes, em-dash) | Correct typography; no mojibake | V |
| EC-CONTENT-07 | Numbers/metrics change | Count-up + proof bar update from data only | E2E |
| EC-CONTENT-08 | Boastful word introduced in copy | Tone linter fails (TC-NFR-TONE) | U |

## EC-INPUT — interaction / keyboard / pointer / touch

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-INPUT-01 | Keyboard-only navigation | All CTAs, accordions, menu, chat reachable; visible focus | A+E2E |
| EC-INPUT-02 | Esc on open menu/modal/chat | Closes; focus returns to trigger | E2E |
| EC-INPUT-03 | Tab order | Logical, no traps, no off-screen focus | A |
| EC-INPUT-04 | Touch: carousel swipe | Smooth; snaps; no accidental page scroll lock | M |
| EC-INPUT-05 | Touch: tap targets ≥44px | All interactive targets meet size | A |
| EC-INPUT-06 | Double-tap / fast taps | No double-trigger; debounced | E2E |
| EC-INPUT-07 | Pointer leaves during drag/hover | State resets cleanly | M |
| EC-INPUT-08 | Screen reader (VoiceOver/NVDA) | Landmarks, labels, alt text; chat announced | M |
| EC-INPUT-09 | Right-to-left / unusual locale | No layout break (LTR site; safe defaults) | M |
| EC-INPUT-10 | Reduced-motion + keyboard | Focus reveals work without animation | A |

## EC-VIEW — responsive / viewport

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-VIEW-01 | 320px width (small phone) | No horizontal scroll; readable | E2E+V |
| EC-VIEW-02 | 375/390/414 (common phones) | Layout intact; hero stacks | V |
| EC-VIEW-03 | 768 (tablet portrait) | Grid reflows; nav adapts | V |
| EC-VIEW-04 | 1280/1440 (laptop) | Intended composition | V |
| EC-VIEW-05 | 2560/4K (large desktop) | Max-width container; no over-stretch | V |
| EC-VIEW-06 | Landscape phone (short height) | Hero/menu usable; no clipped CTAs | M |
| EC-VIEW-07 | Notch / safe-area insets | Content respects safe areas | M |
| EC-VIEW-08 | Dynamic viewport (mobile URL bar) | Use `dvh`/`svh`; no jump | M |
| EC-VIEW-09 | Very tall content / long scroll | Scroll perf holds; reveals fire once | P |

## EC-A11Y — accessibility

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-A11Y-01 | Contrast on monochrome | Body/UI ≥ WCAG AA (4.5:1) | A |
| EC-A11Y-02 | Images/scenes decorative | `aria-hidden`/empty alt; informative imgs labelled | A |
| EC-A11Y-03 | Headings order | Single h1; logical h2/h3 | A |
| EC-A11Y-04 | Focus visible | Always a visible monochrome focus ring | A |
| EC-A11Y-05 | Motion vestibular safety | reduced-motion honoured everywhere | A+E2E |
| EC-A11Y-06 | Form/chat labels | Inputs labelled; errors announced | A |
| EC-A11Y-07 | Live region for chat | New messages announced politely | M |
| EC-A11Y-08 | Zoomed text (200%) | No clipping/overlap | M |

## EC-PERF — performance / assets

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-PERF-01 | Any asset >500KB | Audit fails (TC-NFR-PERF) | U |
| EC-PERF-02 | 6MB JPEG contact icons | Replaced by inline SVG | U |
| EC-PERF-03 | Avatar MP4 oversized | Re-encoded; poster + lazy load | U+P |
| EC-PERF-04 | LCP element | <2.5s mobile throttled | P |
| EC-PERF-05 | CLS from media/iframe | <0.05; space reserved | P |
| EC-PERF-06 | TBT from hydration/JS | <200ms; heavy scenes code-split | P |
| EC-PERF-07 | First-view payload | ≤2.5MB | P |
| EC-PERF-08 | Font loading (FOUT/FOIT) | `font-display: swap`; no invisible text | M |
| EC-PERF-09 | Many project effects mounted | Lazy/virtualised; only visible run | P |

## EC-COMPAT — browser / device

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-COMPAT-01 | Latest Chrome/Edge | Full experience | E2E |
| EC-COMPAT-02 | Safari (macOS/iOS) | WebGL, backdrop-filter, video autoplay quirks handled | E2E |
| EC-COMPAT-03 | Firefox | Full experience; postprocessing OK | E2E |
| EC-COMPAT-04 | Old/unsupported browser | Graceful baseline; banner optional | M |
| EC-COMPAT-05 | iOS low-power mode | Reduced FPS handled; video may not autoplay → poster | M |
| EC-COMPAT-06 | Android low-end | Post-FX off; usable | P |
| EC-COMPAT-07 | In-app browsers (LinkedIn/IG) | Renders; embeds/links open externally | M |

## EC-CFG — configuration / env

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-CFG-01 | D-ID key name drift (`DI_D_API_KEY` vs `DID_API_KEY` vs `D_ID_API_KEY`) | One canonical name (`DID_API_KEY`); code+env agree | U |
| EC-CFG-02 | Required key missing at build | Build fails clearly (fail loud — non-zero, names the key), not silent | U |
| EC-CFG-03 | `NEXT_PUBLIC_*` key present | Referrer-restricted; documented as public | M |
| EC-CFG-04 | `.env.local` absent in dev | Sensible defaults / mock provider; clear message | M |
| EC-CFG-05 | Wrong `NEXT_PUBLIC_SITE_URL` | Canonical/OG URLs correct per environment | E2E |

## EC-DEPLOY — build / deploy / CI

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-DEPLOY-01 | `build:static` with API routes present | Routes excluded from export; build succeeds | U |
| EC-DEPLOY-02 | CI red (lint/test/build) | No deploy | E2E(CI) |
| EC-DEPLOY-03 | Firebase deploy fails midway | Previous release stays live; rollback documented | M |
| EC-DEPLOY-04 | Cache busting | Hashed assets; index not over-cached | M |
| EC-DEPLOY-05 | Post-deploy V&V fails | `firebase hosting:rollback`; revert to baseline tag | M |
| EC-DEPLOY-06 | Service account secret missing | CI fails clearly | M |

## EC-SEC — security

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-SEC-01 | Secret in client bundle | Audit/scan fails (TC-NFR-SEC) | U |
| EC-SEC-02 | `.env.production` content | Never printed/committed; gitignored | U |
| EC-SEC-03 | XSS via chat echo | Output sanitised; no HTML injection | E2E |
| EC-SEC-04 | Security headers | CSP, HSTS, X-Content-Type-Options present | E2E |
| EC-SEC-05 | Dependency CVE | `npm audit` gate; no high/critical in prod deps | U |
| EC-SEC-06 | Open redirect / external links | `rel="noreferrer noopener"` on all external | U |

## EC-STATE — empty / error / loading

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-STATE-01 | First paint before hydration | Meaningful static shell; no flash of unstyled | V |
| EC-STATE-02 | Section data empty | Section hidden or empty-state, never broken | E2E |
| EC-STATE-03 | Error boundary trip | Localised fallback; rest of page works | E2E |
| EC-STATE-04 | 404 route | `not-found.tsx` monochrome page + nav home | E2E |
| EC-STATE-05 | Chat error | Inline error message; input stays usable | E2E |

## EC-SEO — metadata / sharing

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-SEO-01 | JSON-LD | Valid Person + WebSite | E2E |
| EC-SEO-02 | OG/Twitter card | Title, desc, monochrome preview image | E2E |
| EC-SEO-03 | Sitemap/robots | Present and correct | E2E |
| EC-SEO-04 | Canonical URL | Correct per environment | E2E |
| EC-SEO-05 | Favicon/app icons | All sizes served | E2E |

## EC-TIME — time / locale

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-TIME-01 | "March 2026 – Present" tense | "Present" stays current; dates from data only | U |
| EC-TIME-02 | Visitor timezone | Any date display is locale-safe; no off-by-one | M |
| EC-TIME-03 | Number/locale formatting | Tabular numerals; consistent separators | V |

## EC-SHADER — custom GLSL & volumetric lighting

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-SHADER-01 | Shader fails to compile (driver/precision) | Caught; falls back to non-shader material/poster; no black screen | E2E |
| EC-SHADER-02 | Uniform unset / NaN value | Guarded defaults; no flicker or blowout | M |
| EC-SHADER-03 | GLSL differences Chrome/WebKit/Firefox | Compiles + renders on all three (TC-NFR-RENDER) | V |
| EC-SHADER-04 | Volumetric pass on low-power device | Disabled; base lighting only; FPS holds | P |
| EC-SHADER-05 | Volumetric sample count too high | Half-res buffer + capped samples; budget met | P |
| EC-SHADER-06 | Chromatic value hardcoded in GLSL | Fails monochrome review; colours via palette uniforms | U+M |
| EC-SHADER-07 | Shader hot-reload in dev | Recompiles without leaking programs | M |

## EC-SCROLL — GSAP ScrollTrigger

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-SCROLL-01 | Resize / orientation while pinned | `invalidateOnRefresh`; no overlap or gap | E2E |
| EC-SCROLL-02 | Fast scroll / fling | No cue or timeline stacking; settles cleanly | E2E |
| EC-SCROLL-03 | Reduced-motion | `matchMedia` branch sets final states, no scrub | E2E+A |
| EC-SCROLL-04 | Unmount mid-timeline | `ctx.revert()`; no orphan triggers / leaks | U |
| EC-SCROLL-05 | Anchor jump into a pinned section | Lands correctly; pin not broken | E2E |
| EC-SCROLL-06 | Short viewport (landscape phone) | Pins have fallback height; content reachable | M |
| EC-SCROLL-07 | ScrollTrigger registered twice (HMR/SSR) | Registered once, client-only; no duplicate triggers | U |

## EC-AVLIVE — live streaming lip-sync (dynamic path)

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-AVLIVE-01 | Lip-sync drift > ~40 ms / 1 frame | Fails TC-FR-CLONE-LIVE; resyncs | INT |
| EC-AVLIVE-02 | ElevenLabs WS closes mid speech-array | Reconnects; buffered audio drains; avatar idles | INT |
| EC-AVLIVE-03 | D-ID session not disposed | No leaked sockets/listeners (TC-INT-CLONE) | INT |
| EC-AVLIVE-04 | Audio packets jittered / out of order | `viseme/smoother.ts` reorders/interpolates | INT |
| EC-AVLIVE-05 | Backpressure (slow client) | Drop-to-keyframe; audio stays primary | M |
| EC-AVLIVE-06 | Two visitors start live clone at once | Stateless gateway; sessions isolated (Redis) | INT |

## EC-SYNTH — data synthesis (prompt §4)

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-SYNTH-01 | YouTube description unavailable/blocked | Synthesis proceeds from other sources; no hard dependency | M |
| EC-SYNTH-02 | Repo README missing | Falls back to repo metadata/commits | M |
| EC-SYNTH-03 | Source fact conflicts with resume | CV/resume wins; conflict logged | U+M |
| EC-SYNTH-04 | Non-resume fact surfaced | ≥1 fact traces to a non-resume source (TC-FR-SYNTH) | U |
| EC-SYNTH-05 | Private/sensitive detail in a source | Excluded from public copy | M |

## EC-BUILD — completeness, strict TS, fail-loud (prompt §6/§7)

| ID | Scenario | Expected | Test |
|---|---|---|---|
| EC-BUILD-01 | TODO / `...` / stub in app/components/lib | Completeness scan fails (TC-NFR-COMPLETE) | U |
| EC-BUILD-02 | Implicit any / null-unsafe access | `tsc` strict fails (TC-NFR-TS) | U |
| EC-BUILD-03 | Console/runtime error anywhere in MVP | Zero-error gate fails (prompt §6) | E2E |
| EC-BUILD-04 | Required key (`DID_API_KEY`/`ELEVENLABS_API_KEY`) unset at build | `build:static` exits non-zero naming the key; no mock path; no secret in `out/` (TC-NFR-SEC) | U+E2E |

---

### How to use this file
- Before changing a surface, find its EC rows and keep their contracts.
- When you fix a bug, check whether it needs a **new** EC row + test.
- Promote high-value rows into runnable Playwright specs under `tests/`.
