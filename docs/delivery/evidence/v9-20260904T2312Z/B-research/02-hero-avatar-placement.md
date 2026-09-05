# 02 — Hero avatar placement (run v9-20260904T2312Z, B-research)

Read-only research. Tags: **Verified** = fetched/read/probed this session · **Inferred** = derived, or second-hand citation · **Assumed** = standard not fetched. Machine copy: `02-hero-avatar-placement.json`. Reference frames extracted beside this file: `hero-avatar-frame-0s.png`, `hero-avatar-frame-2s.png`, `minivic-avatar-frame-3s.png`.

## 1. Facts on the ground

| Item | Fact | Tag |
|---|---|---|
| `public/assets/my-hero-avatar.mp4` | h264 High@L3.0 · 640×360 · 24 fps · 5.875 s · 160 156 B · 218 kbit/s · **no audio stream** · `moov` at byte 32 (faststart) | Verified (ffprobe/xxd) |
| Frame composition | head centred x≈50 % / y≈32 %, shoulders + shearling collar in the lower third, **warm colour** sunset city bokeh | Verified (extracted frame) |
| Still | PNG 900×502 (179 kB) · WebP **1480×826** (66 kB) · AVIF **1480×826** yuv444p (41 kB) — brief said 900×502 for all three; only the PNG is | Verified |
| `public/assets/my-avatar.mp4` | 1280×720 · 12.29 s · 1.10 MB · used only by `components/MiniVicBot.tsx:225`, lazy-loaded when the panel opens | Verified |
| Hero today | `Hero.tsx`: `.inner` single column, max-width 68 rem; DOM order eyebrow → **h1** → role → statement → ledgerRow(ul×3 li + grading) → actions → availability; CSS-only `heroRise` entrance; `@media (max-height:860px)` drops h1 from 7.5 rem to 4 rem | Verified |
| `components/site/HeroAvatar.tsx` | unmounted (no importer); needs framer-motion, `useAvatarSpeaking`, and classes `.avatar-placeholder/.avatar-circle/.avatar-frame/.avatar-tag/.avatar-tilt/.avatar-glass/.avatar-pulse-ring/.hud-frame__corner` — none exist in `app/globals.css`; its load gate (preload=none, src set by IntersectionObserver after page-ready, crossfade only when `!paused && currentTime>0.04 && videoWidth>0`) is sound and is reused below; its HUD chrome and "SUBJECT · LIVE" tag are not | Verified |
| CSP | `media-src 'self' blob:` — same-origin mp4 allowed | Verified (firebase.json) |
| Audit budget | img ≤ 0.5 MB, video ≤ 2.5 MB | Verified (audit line 187) |

### Tests that constrain the change (all Verified)
- **TC-HERO-03** reads `#hero p` nth(2) as the statement → no `<p>` may be inserted before the statement; use `<figure>/<figcaption>`.
- **TC-HERO-04** counts exactly 3 `#hero ul li` → no list in the portrait.
- **TC-HERO-08/09** at the single project (Desktop Chrome **1280×720**): section 0.9–1.1× viewport; h1, first li, both actions above the fold → the portrait must not push the ledger/actions down.
- **PERF-02/03/06/07**: LCP ≤ 2.5 s, CLS < 0.05, LCP tag ≠ CANVAS, LCP element paints from static HTML.
- **MONO-04** reads *computed CSS colours, not pixels* → a colour video passes the test while breaking prime directive 4 (gold = "sourced"). A new pixel-independent guard on `filter` is needed.
- **VIS-01** hero baseline must be regenerated once and inspected.

## 2. External evidence

| Topic | Finding | Source | Tag |
|---|---|---|---|
| Chrome autoplay | Muted autoplay is always allowed; sound needs prior interaction / MEI; `play()` without permission rejects `NotAllowedError` | developer.chrome.com/blog/autoplay | Verified |
| WebKit iOS | Since iOS 10 `autoplay`/`play()` allowed without gesture when no audio track **or** `muted`; autoplaying video only starts when visible and pauses out of view; `playsinline` required or iPhone goes fullscreen; `play()` returns a rejecting Promise | webkit.org/blog/6784 | Verified |
| LCP + `<video>` | `<video>` counts using poster load time or first-frame time, whichever is earlier; opacity-0, full-viewport and low-entropy elements excluded; only the visible (unclipped) size counts; the LCP element can change to a later, larger element | web.dev/articles/lcp (2025-09-04) | Verified |
| Real-people photos | NN/g eyetracking: users scrutinise real people, ignore decorative stock; 10 % more time on portraits than bios that used 316 % more space; "on personal websites, users want to see the person behind the site" | nngroup.com/articles/photos-as-web-content | Verified |
| Face bias | Cerf, Frady & Koch 2009: faces attract gaze 16.6× expected, text 11.1×, task-independent; Djamasbi et al. 2010: a face is fixated within the first two fixations on homepages | jov.arvojournals.org (403 on direct fetch) · users.wpi.edu/~djamasbi | Inferred |
| Video face vs still | No fetched source quantifies a moving face beating a still; motion competes with the headline → keep the loop small, silent, grey, slower than the type | Perplexity synthesis | Inferred |
| Award-listed monochrome portfolios with a filmed self-portrait | Not verifiable within budget. Surfaced-but-unverified: awwwards.com/sites/personal-design-portfolio, awwwards.com/sites/portfolio-2025, awwwards.com/inspiration/video-portfolio-michele-verze-portfolio, the Awwwards black-and-white collection. Do not cite them in copy. | awwwards.com | Inferred |
| WCAG 2.2.2 | Auto-starting motion > 5 s beside other content needs pause/stop/hide → a 5.875 s infinite loop needs a keyboard-operable pause | WCAG 2.1 SC 2.2.2 | Assumed |
| React `muted` | React may not serialise the `muted` boolean into SSR HTML (issue #10389) → set `video.muted = true` imperatively before `play()` | training knowledge | Assumed |

## 3. Three placements, scored (1–5; risk and effort scored so 5 = safest / least)

| # | Placement | Impact | LCP/CLS safety | Mobile | Effort | Total |
|---|---|---|---|---|---|---|
| **P1** | **Right column beside role · statement · ledger** — `.inner` becomes a 2-col grid at ≥720 px; eyebrow, h1, actions, availability span both columns; figure in col 2, rows 3–6; 88 px stamp top-right below 720 px | 4 | 4 | 4 | 3 | **15** |
| P2 | Full-bleed grayscale backdrop behind the type | 3 | 3 | 2 | 3 | 11 |
| P3 | Stamp only (112–128 px square at the eyebrow row's right, every breakpoint) | 2 | 5 | 5 | 5 | 17 |

P3 scores highest only because it risks nothing and achieves little (the face is ~40 px tall on a 1440 screen — below the credibility signal NN/g documents). P2 is ruled out by the source file: 640×360 at 1920 is a 3× upscale, a face behind type fights the type, and it breaks "the scene is never the content". **Recommendation: P1.**

## 4. Recommendation — P1, exact spec

**One line.** A silent, grayscale 4:5 portrait of the same face that speaks in the MiniVic panel, standing in the hero's empty right half beside the sentence that is the pitch — poster first, loop later, never moving for a reader who asked it not to.

### DOM (placed after `p.statement`, before `div.ledgerRow`)
```
<figure class={styles.portrait} data-testid="hero-portrait">
  <div class={styles.portraitMedia}>
    <picture>
      <source srcSet="/assets/my_avatar.avif" type="image/avif" />
      <source srcSet="/assets/my_avatar.webp" type="image/webp" />
      <img src="/assets/my_avatar.png" width={1480} height={826}
           alt="Portrait of Vikram Deshpande" loading="eager" decoding="async" fetchPriority="high" />
    </picture>
    <video ref muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}
           disablePictureInPicture disableRemotePlayback />   <!-- no autoplay, no src, no controls -->
  </div>
  <button type="button" aria-pressed={paused} aria-label="Pause the portrait">…</button>
  <figcaption>Silent loop · he speaks in the panel</figcaption>   <!-- optional; never a <p> -->
</figure>
```

### Grid (Hero.module.css)
- **≥720 px:** `.inner{display:grid;grid-template-columns:minmax(0,1fr) var(--portrait-w);column-gap:clamp(var(--space-4),4vw,var(--space-8));align-items:start}` · `.eyebrow,.name,.actions,.availability{grid-column:1/-1}` · `.role,.statement,.ledgerRow{grid-column:1}` · `.portrait{grid-column:2;grid-row:3/6;align-self:start;margin-top:clamp(var(--space-2),2.4vh,var(--space-3))}` (= `.role`'s top margin so the top edges align) · `.ledgerRow{grid-template-columns:1fr;gap:var(--space-2);align-items:start}` at every width (the portrait now owns the right side; the grading note sits under the ledger, its existing ≤1100 px form).
- **<720 px:** `.inner{position:relative}` · `.portrait{position:absolute;top:0;right:0;width:88px;aspect-ratio:1}` · `.eyebrow{padding-right:calc(88px + var(--space-2))}` · video, button and caption `display:none`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce){.portrait video,.portraitToggle{display:none}}` — and the JS gate never assigns a `src`.

### Size (`--portrait-w: clamp(11rem, 16vw, 20rem)`, aspect 4/5 at ≥720 px)
| Viewport | Box (CSS px) | Note |
|---|---|---|
| 390 | 88 × 88 stamp, top-right of eyebrow row | poster only, 1:1 crop `object-position:50% 22%`; h1 at 3 rem already wraps to two lines so nothing collides |
| 834 | 176 × 220 | ledger is single-column at ≤860 so rows 3–5 ≈ 400 px; portrait sits at their top |
| 1280 (×720) | 205 × 256 | rows 3–5 under the 860-max-height rhythm ≈ 290 px → no push-down, TC-HERO-09 holds |
| 1440 | 230 × 288 | h1 at 118 px stays one line because it spans both columns |
| 1920 | 307 × 384 (cap 320 × 400 from 2000 px) | text column ≈ 1088 − 320 − 64 ≈ 700 px ≥ the statement's measure |

Crop: `object-fit:cover; object-position:50% 50%` on img **and** video — the 4:5 window on a 16:9 frame is full-height and 288 px wide, centred on the head. (Arithmetic is Inferred from Verified tokens; confirm with the 390/834/1280/1440 screenshots the workflow requires.)

### Poster
`my_avatar.avif` (41 kB) via `<picture>` → WebP → PNG. The `<img>` is the LCP candidate at 1280×720 (≈52 k px² vs the h1's ≈33 k) and **never takes the heroRise opacity entrance** (LCP excludes opacity-0 elements). Eager weight: 41 kB; the 160 kB mp4 is never eager. `<video poster>` is not used — it takes one URL and cannot negotiate AVIF/WebP; the `<picture>` layered under the video is the poster.

### Video attributes and gate
Markup: `muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}`; no `autoplay`, no `src`, no `controls`. Imperative: `video.muted = true; video.defaultMuted = true` before `play()`; `play().catch(() => keep poster)`.
Gate: (1) `matchMedia('(min-width:720px)')` **and** not `prefers-reduced-motion: reduce` **and** not `navigator.connection?.saveData` — else poster only; (2) after `window.load` → `requestIdleCallback` (1200 ms fallback); (3) IntersectionObserver threshold 0.25: enter → set `src`, `load()`, `play()` on `canplay`; leave → `pause()`; (4) `visibilitychange` hidden → pause; (5) media-query `change` listeners → pause and drop `src` if a condition turns false. Chrome allows muted autoplay unconditionally; WebKit allows muted `play()` and only when visible — the observer satisfies both (Verified policies, Inferred sequence).

### Crossfade still → video
The poster never animates. The video sits above it at opacity 0 and fades to 1 over 600 ms `var(--motion-ease-standard)` only when **all** hold: `playing` fired, `!paused`, `currentTime > 0.04`, `videoWidth > 0` (the old component's guard, kept verbatim). Pause / error / stalled / hidden / out-of-view → back to 0 over 300 ms. Both layers share one `filter: grayscale(1) contrast(1.04)` on `.portraitMedia`, identical `object-fit`/`object-position`, so the still and the first frame are the same crop of the same shoot. Loop seam (first ≠ last frame): at `currentTime > duration − 0.25` dip to 0.55 opacity for 250 ms and restore on `playing` — the poster beneath makes the seam a soft blink. A palindrome/720p re-render fixes it properly (cost gate — ask first).

### Monochrome
`.portraitMedia{filter:grayscale(1) contrast(1.04)}` is **mandatory**: the frames are warm sunset colour, and gold on this site means "this figure has a source". MONO-04 will not catch a colour video (computed CSS only) → TC-HERO-18 below. No gold border/ring/caption. Border `1px var(--card-border)`, background `var(--ink-800)` while loading, radius 4 px (a print, not a chip).

### Keyboard and a11y
- Pause button bottom-right of the figure, ≥40×40 hit area, glyph in `--white`, `focus-visible` = `outline:2px solid var(--white); outline-offset:3px` (matches `.primaryAction`). A user pause wins over observer re-entry. Rendered only when the video is eligible (≥720 px, motion allowed) so a reader with no motion has nothing to stop. Tab order follows DOM: after the statement, before the ledger.
- `alt="Portrait of Vikram Deshpande"` — do not name the city (the backdrop is not verifiably Melbourne).
- Video `aria-hidden`, `tabIndex=-1`. Reduced motion: poster only; TC-CINE-06/07 unaffected because the poster is not in the heroRise/heroFade set.

### Relation to the MiniVic avatar
Same face, same shoot. The hero loop (640×360, silent, 5.9 s) is the quiet presence; the panel loop (1280×720, 12.3 s) is the one that speaks. The hero never plays audio and never carries a "LIVE" label. `lib/avatarContext.tsx` already exposes `useAvatarSpeaking()` (Verified): while the panel is open or `speaking === true`, the hero loop pauses to the poster — one face does not talk in two places and a phone does not run two decoders. Caption (optional, `<figcaption>`, `.grading` style): "Silent loop · he speaks in the panel" — literally true, and points at the introduction the Listen section already labels synthetic. Do not reuse `my-avatar.mp4` (1.1 MB) in the hero.

### Playwright guards (tests/e2e/hero.spec.ts)
| ID | Assertion |
|---|---|
| TC-HERO-12 | portrait `img` visible, `naturalWidth>0`, alt exact, `currentSrc` ends `.avif` (Chromium), computed opacity ≥ 0.99 within 200 ms of `#hero` visible |
| TC-HERO-13 | `video` has muted/loop/playsinline/preload=none/aria-hidden, no autoplay/controls; `src` empty at DOMContentLoaded; after `load`+2.5 s: src ends `my-hero-avatar.mp4`, `paused===false`, `currentTime>0.04`, opacity > 0.9 (if CI's software renderer refuses, launch this spec with `--autoplay-policy=no-user-gesture-required`) |
| TC-HERO-14 | `emulateMedia({reducedMotion:'reduce'})`: no request for the mp4 within 4 s, `video` has no src, button count 0, poster opacity ≥ 0.99 |
| TC-HERO-15 | figure boundingBox before/after `playing` differs ≤ 1 px; PERF-03 CLS < 0.05 |
| TC-HERO-16 | `route('**/my-hero-avatar.mp4', abort)`: poster stays, video opacity ≤ 0.05, no `pageerror` |
| TC-HERO-17 | Tab reaches `button[aria-pressed]`; Enter → `aria-pressed=true`, `video.paused===true`, label "Play the portrait"; Space toggles back; focus outline achromatic |
| TC-HERO-18 | computed `filter` of `.portraitMedia` includes `grayscale(1)`; `chromaticOffenders` (reuse from tests/monochrome) inside the figure is empty |
| TC-HERO-19 | image transfer under `/assets/` before `load` ≤ 500 000 B; mp4 `requestStart` > `loadEventEnd` |
| TC-HERO-20 | final LCP entry tag ∈ {IMG, H1}, `startTime ≤ 2500` at 1280×720 |
| TC-HERO-21 | at 390×844 the figure ≤ 96×96 with top ≤ eyebrow bottom; `#hero video` count 0 after 3 s |
| unchanged | TC-HERO-01…11; TC-HERO-03 still reads `#hero p` nth(2); TC-HERO-04 still 3 li; VIS-01 rebaselined once, PNG inspected |

### Effort and open limits
≈ one cycle: `Hero.tsx` +~90 lines (figure, gate hook, toggle), `Hero.module.css` +~110 lines, 10 new tests, VIS-01 rebaseline, screenshots at 390/834/1280/1440. Delete `components/site/HeroAvatar.tsx` in the same commit — it is dead and references vanished classes.
Limits: (1) 640×360 cropped 4:5 is 288×360 → ≈1.6× upscale at 230 CSS px on 2×; a 720p re-render (cost gate) would fix it, the spec does not depend on it. (2) The 5.875 s seam is visible without the dip. (3) No award-listed monochrome portfolio with a filmed self-portrait was verified within the search budget; the placement rests on the eye-tracking evidence and this site's own constraints, not precedent.
