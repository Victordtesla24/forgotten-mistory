# Adversarial review — forgotten-mistory.web.app, commit 6dcb4f53, cycle c1

Run: v9-20260904T2312Z/R-c1 · Reviewer: independent, did not build this · 2026-09-05
Method: every claim in the capture context was re-run from scratch. Nothing below is inherited from the capture report.

**VERDICT: FAIL** — two blockers. Three of the six sections carry no visualisation of any kind,
and 79 text nodes fail WCAG AA contrast at 4.03:1 while the automated axe pass reports zero violations.

Evidence in this directory: `adv/attack.json`, `adv/attack2.json`, `adv/root-headers.txt`,
`adv/api-chat.json`, `adv/index.html`, `adv/rm-hero-1440.png`, `adv/nowebgl-hero-1440.png`,
scripts `adv/attack.mjs`, `adv/attack2.mjs` (Playwright 1.57.0, `channel: 'chrome'`, `--no-sandbox`).

---

## FAILURES

### F-1 (blocker) — Zero `<canvas>` on the live page; #hero, #experience and #listen own no visualisation at all

**Verified.** `adv/attack2.json → canvasGlobal`: `{"count": 0, "list": []}` after a full-page scroll
sweep at 1440×900. Per-section element census (`adv/attack.json → sections.v1440.detail`, identical at 390):

| section | canvas | svg | video |
|---|---|---|---|
| #hero | 0 | 0 | 0 |
| #about | 0 | 1 (384×384) | 0 |
| #experience | **0** | **0** | **0** |
| #skills | 0 | 1 (1248×580) | 0 |
| #vitrine | 0 | 6 (414×259 cards) | 0 |
| #listen | **0** | **0** | **0** |

The only element animating on the whole page under normal motion preference is one Tailwind
`animate-ping` status dot (`adv/attack2.json → runningAnimationsNormal`:
`[{"st":"running","name":"ping","tgt":"SPAN.absolute inline-flex h-full w-"}]`). No SVG carries
`<animate>`/`<animateTransform>` (`svgGlobal[*].animEls === 0`).

The Owner's bar requires each of the six sections to own ONE cinematic animation / visualisation /
interactive infographic. #hero, #experience and #listen own none. #about, #skills and #vitrine own
a static SVG each — a drawing, not an animation.

The capability-detection code that should mount a scene *is* shipped and *does* run: the live bundle
`/_next/static/chunks/app/page-b5f89e2a37987f5a.js` contains both `createElement("canvas")` and
`getContext("webgl` — it probes for WebGL and then mounts nothing. In the working tree,
`grep -rn "HeroAtmosphere" app components --include=*.tsx --include=*.ts -l` returns **no file**:
`components/sections/Hero/HeroAtmosphere.tsx` (listed as modified in git status) is imported by
nothing. This is the documented "committed but never wired" failure mode, not a rendering bug.

### F-2 (blocker) — 79 text nodes fail WCAG AA 1.4.3 at 4.03:1; the axe pass reports zero violations and hides it

**Verified.** `adv/attack2.json → contrast`: `{"failing": 79, ...}`. Every failure is the same token
pair — `rgb(110,113,120)` (#6E7178) on `rgb(10,11,13)` (#0A0B0D) at 12px and 14px, i.e. normal-size
text needing 4.5:1. Independently recomputed by hand from the WCAG relative-luminance formula:
L(fg)=0.1648, L(bg)=0.003318, ratio = (0.1648+0.05)/(0.003318+0.05) = **4.029**.

It is not a stray element — it is the site's secondary-text token, and it carries load-bearing
recruiter copy in every section:

- #hero: `"ATO Payday Super · 200+ SIT scenarios"`, `"ANZ · 5+ squads, 40+ practitioners"`,
  `"◐ self-reported, from my CV…"` (the caliper legend the reader is asked to learn)
- #about: `"Currently on site with the ATO, Melbourne"`, `"Open to permanent and contract engagements"`,
  `"38 public repositories · ATO evidence harness"`, `"ATO · ANZ · NAB · Microsoft · Telstra · InfoCent…"`
- #experience: every duration label — `"6 mo"`, `"8 mo"`, `"7.8 yr"`, `"10 mo"`, `"1.0 yr"`

**The automated gate does not catch this.** `@axe-core/playwright` with tags
`wcag2a, wcag2aa, wcag21a, wcag21aa` returned `violations: []` at *both* 1440 and 390
(`adv/attack.json → viewports.v1440.axeViolations`, `.v390.axeViolations` — both empty arrays).
axe's `color-contrast` rule cannot resolve the background through this page's layered/gradient
stack, so it downgrades to `incomplete` and never fails. A green axe run on this page is not
evidence of AA compliance, and must not be reported as such.

### F-3 (major) — Gold is used as a fill/background, which the palette contract forbids

**Verified.** `adv/attack2.json → gold.unique`: gold-family values appear as `backgroundColor`
**14×** inside `#skills` and **1×** inside `#listen`, plus `color`/`border*Color` on 15 `●` glyphs in
`#skills`. The full-page colour census (`adv/attack.json → viewports.v1440.nonMonochromeColors`)
returns exactly one gold-family value on the page, `rgb(201,168,76)` (#C9A84C), 69 hits.

The contract (`CLAUDE.md` prime directive 4) is: gold means *this figure has a source*; "It is never
a fill, a background, or a theme." Fifteen background fills are fifteen breaches. The legitimate
uses are also present and correct — the three live repository URLs in `#vitrine`
(`aether.srv1356245.hstgr.cloud`, `abentertainment.com.au`, `forgotten-mistory.web.app`) carry gold
as `color` — which is precisely why the fills dilute the signal: a reader taught that gold = sourced
now sees gold on chrome.

### F-4 (major) — An infinite animation keeps running under `prefers-reduced-motion: reduce`

**Verified.** `adv/attack.json → reducedMotion.runningAnimations`: `["ping@SPAN"]`, captured in a
context launched with `reducedMotion: 'reduce'`. Tailwind's `animate-ping` is an infinite
scale+fade loop; it is still in `playState: "running"` with the reduce preference set.
Everything else in the reduced-motion path is clean (see P-6).

### F-5 (minor) — The MiniVic launcher is the last of 100 focusable elements

**Verified.** `adv/attack2.json → tabSweep`: `{"totalFocusable": 100, "minivicIndex": 99,
"minivicTabindex": null}`, and a real key-press sweep reached it at **Tab 92**
(`minivicReachedAtTab: 92`). It is reachable, so this is not a WCAG failure — but a chrome control
pinned visually at bottom-right for the whole scroll is 92 keypresses away for a keyboard user.

### F-6 (minor) — Ten non-interactive `<li>` elements sit in the tab order

**Inferred.** `adv/attack.json → keyboard.tabSequence` positions 11–20 are `LI` elements
(`"01 Technical Skills…"` … `"10 North Star Align…"`), focusable ahead of the #experience buttons.
They receive focus and a visible outline. I did not verify whether they carry a `role` or a keydown
handler, so I cannot state they are inert — but ten stops between the About text and the first real
control is a cost that needs a reason.

---

## WHAT PASSED (re-verified, not inherited)

- **P-1 Deploy claim — true. Verified.** `curl -sSI https://forgotten-mistory.web.app/` →
  `HTTP/2 200`, and the served HTML contains exactly `<meta name="build-commit" content="6dcb4f53"/>`
  (`adv/index.html`, `adv/root-headers.txt`; `last-modified: Fri, 04 Sep 2026 23:59:35 GMT`).
- **P-2 Console — clean. Verified.** Own Playwright run, 390×844 and 1440×900, load + full scroll
  sweep + 5.5 s settle: `consoleErrors: []`, `pageErrors: []`, `failedRequests: []`, `badStatus: []`
  at both (`adv/attack.json → viewports.*`). Third run (`attack2.mjs`) also `errs: []`.
- **P-3 `/api/chat` — live and correct. Verified.** `POST` with the specified body → `HTTP 200`,
  `content-type: application/json`, 2.39 s. Body (`adv/api-chat.json`) contains the published email
  `sarkar.vikram@gmail.com`, plus phone, LinkedIn and GitHub.
  **provider: `openai`, model: `gpt-4.1-mini`.**
- **P-4 Security headers — present. Verified.** `content-security-policy` with
  `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`; `x-frame-options: DENY`;
  `x-content-type-options: nosniff`; `strict-transport-security: max-age=31556926; includeSubDomains; preload`;
  `referrer-policy: strict-origin-when-cross-origin`; `permissions-policy` locking camera/geolocation.
  *Note, not scored:* `script-src` allows `'unsafe-inline' 'unsafe-eval'`, which is most of what a
  CSP is for; it is present but not strict.
- **P-5 Asset budgets — inside the bar. Verified.** `curl -sSI` on every referenced asset:
  `my-avatar.mp4` 1.05 MB, `my-hero-avatar.mp4` 0.15 MB, `my_avatar.png` 0.17 MB,
  `og-image.png` 0.17 MB, `Vik_Resume_Final.pdf` 0.15 MB. Nothing autoloading over 2.5 MB; both
  images under 500 KB. On the actual page load only fonts (5 woff2, 10–48 KB) and `icon.png` (5.5 KB)
  are fetched — the videos have `preload="none"` and `paused: true` at load
  (`adv/attack.json → viewports.v1440.media`), so nothing heavy is on the critical path.
- **P-6 Reduced motion — no autoplay, hero readable. Verified.** `reducedMotion: 'reduce'` context:
  both media elements `paused: true` with `currentTime: 0` at load *and* after a further 2.5 s
  (`mediaAtLoad`, `mediaAfter2p5s`). Hero h1 `opacity: 1`, `transform: none`, full copy present
  ("Vikram Deshpande / Delivery leadership · AI solutions architecture / Sixteen years leading
  delivery…"). Screenshot `adv/rm-hero-1440.png`. The one exception is F-4.
- **P-7 No-WebGL — hero readable. Verified.** With `getContext('webgl*')` forced to `null` via an
  init script, the hero renders its full text and throws nothing
  (`adv/attack.json → noWebGL`, `consoleErrors: []`, `pageErrors: []`; `adv/nowebgl-hero-1440.png`).
  This passes trivially, because per F-1 there was never a scene to lose.
- **P-8 Six sections, in order, each with a visible heading. Verified.** DOM order at 1440 and 390:
  `hero, about, experience, skills, vitrine, listen`. Headings: `h1 "Vikram Deshpande"`,
  `h2 "Ten dimensions, answered"`, `h2 "Sixteen years, to scale"`, `h2 "Calibration card"`,
  `h2 "Six of thirty-eight"`, `h2 "Feedback & coffee?"` — all with non-zero box, `opacity: 1`,
  `visibility` and `display` painted.
- **P-9 Keyboard entry path. Verified.** Tab 1 = skip link `"Skip to the evidence" → #main`;
  Tabs 2–4 = nav (`VIKRAM.`, `Download CV`, `MENU`); Tabs 5–9 = hero actions
  (`See the evidence → #experience`, `Download CV`, `LinkedIn`, `GitHub`,
  `Email → mailto:sarkar.vikram@gmail.com`). Every stop carries a visible 2px solid outline.
  MiniVic launcher present at both viewports, `data-testid="minivic-toggle"`,
  `aria-label="Open Mini Vic assistant"`, 64×64, bottom-right at 1440 (x=1356, y=816) and
  390 (x=306, y=760). Ordering caveat in F-5.
- **P-10 Three factual claims — all traceable. Verified** against
  `public/docs/Vik_Resume_Final.pdf` (via `pdftotext -layout`) and `app/data/siteContent.ts`:
  1. *"≈92% reduction" in evidence effort* — CV: "cutting evidence effort from ~3 hours to ~15
     minutes per scenario (≈92% reduction)"; `siteContent.ts:83` identical. **Match.**
  2. *"200+ SIT scenarios"* — CV: "evidence automation covering 200+ SIT/E2E scenarios across all
     eight squads"; `siteContent.ts:83` identical. **Match.**
  3. *"7.8 yr" at ANZ / "sixteen years"* — CV: ANZ "Sept 2017 - June 2025" = 7.8 years, matching the
     #experience bar label exactly; `siteContent.ts:480` "nearly 8 sustained years at ANZ
     (2017–2025)". Earliest CV dates 2007/2010 support the sixteen-year span. **Match.**
  The hero figure is labelled `"◐ self-reported, from my CV."` — correctly graded, not passed off
  as sourced.

---

## WHAT I ATTACKED AND HOW

1. Deploy claim — `curl` the live origin, read `<meta name="build-commit">` out of the served bytes.
2. Console — own Playwright run at 390 and 1440: load, full scroll sweep, 5.5 s settle, listeners on
   `console`, `pageerror`, `requestfailed` and every response status. Did not read the capture report.
3. `/api/chat` — real `POST` to the live origin with the exact specified body; recorded provider/model.
4. Security headers — response headers on `/`.
5. Asset budgets — `HEAD` every mp4/png/pdf the page references, plus the full in-browser response
   log to see what actually loads versus what merely exists.
6. Accessibility — `@axe-core/playwright` at 1440 and 390 across four WCAG tag sets; then, because
   the result was implausibly clean, an independent per-node contrast computation.
7. Reduced motion — dedicated `reducedMotion: 'reduce'` context; media paused-state sampled twice
   2.5 s apart; `document.getAnimations()` inspected for survivors.
8. No-WebGL — `getContext('webgl*')` stubbed to `null` before any script ran.
9. Keyboard — 22 scripted Tabs recording tag/text/href/outline, then a 140-press sweep to find the
   MiniVic launcher, cross-checked against a DOM focusable-order census.
10. Sections — DOM-order census plus per-section heading visibility and canvas/svg/video counts.
11. Palette — full-page computed-colour census for non-monochrome values, then a targeted gold
    inventory by CSS property and owning section.
12. Content — `pdftotext -layout` on the shipped CV, grepped against `app/data/siteContent.ts`.

**Not attacked (out of budget, so unverified — do not read as passing):** LCP and CLS were not
independently re-measured; the capture's 456–792 ms LCP / 0 CLS figures are untested by me. The
MiniVic conversation quality for the business-client audience, the 834 and 1920 viewports, and
visual polish judgements from the 40 capture PNGs were not assessed.
