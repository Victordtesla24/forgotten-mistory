# Adversarial review — R-c5

- **Target:** https://forgotten-mistory.web.app/?gl=force
- **Claimed commit:** e64566e3 · **cycle:** c5 · **run:** v9-20260904T2312Z
- **Reviewer:** third-party adversarial (did not build this; every claim reproduced independently)
- **Date:** 2026-09-05T00:34Z–00:44Z
- **Verdict: FAIL** — two defects breach the Owner's stated bar (evidence-grading on a gold mark; reduced-motion path).
- **Raw evidence:** `adversarial-browser.json`, `adversarial-browser2.json`, `adv-reduced-motion-1440.png`, `adv-minivic-open-1440.png` (this directory).

---

## FAILURES FIRST

### F1 — BLOCKER — "40+ practitioners" overstates the CV's "up to 40", and it is printed under a gold "measured in production" mark

**Verified.** `pdftotext public/docs/Vik_Resume_Final.pdf` line 136–138 reads verbatim:

> "Directed a program portfolio valued at over $5M, leading 5+ cross-functional squads (**up to 40 resources**, including offshore teams)"

The word "practitioner" appears **0 times** in the CV (`grep -ci practitioner /tmp/cv.txt` → `0`). The live page prints **"40+ practitioners"** in five places (`grep` over the fetched `/?gl=force` HTML):

1. Hero ledger source — `ANZ · 5+ squads, 40+ practitioners`
2. About evidence — `5+ squads, 40+ practitioners onshore and offshore`
3. Experience role bullet — `(40+ onsite and offshore practitioners)`
4. Skills bench node `aria-label` — `$5M+ portfolio · 5+ squads · 40+ practitioners onshore and offshore. **measured in production.**`
5. Skills table evidence cell — same string

`up to 40` is an upper bound. `40+` is a lower bound. They are opposite claims. Item 4 attaches the site's gold "measured in production" mark to the inverted figure — CLAUDE.md prime directive 3 ("never grade a claim higher than its evidence") and directive 4 (gold means "this figure has a source") are both breached by the same string. The CV's only genuine `40+` is a *different population*: line 143, "workshops for 40+ GMs and executives" — which `siteContent.ts:115` already uses correctly and separately.

The other two claims I checked hold up:
- **"Payday Super / eight squads"** — Verified. CV line 62: "one of eight squads on the Payday Super reform program (NTP & Distribution UI)"; `siteContent.ts:82` matches.
- **"$5M+ portfolio"** — Verified. CV lines 110 and 136 both state `$5M+` / "over $5M".
- **"Sixteen years"** — Inferred, defensible. The string "sixteen"/"16 year" is absent from the CV, but CV line 199 dates the earliest role (MYOB) to May 2010; 2010→2026 = 16. Derived from printed dates, not asserted beyond them.

### F2 — MAJOR — an infinite CSS animation keeps running under `prefers-reduced-motion: reduce`

**Verified**, twice, in two independent contexts (`adversarial-browser.json` → `reducedMotion.runningAnimations`; `adversarial-browser2.json` → `rmAnims`, and again after a full-page scroll in `rmAfterScroll`):

```
tag: SPAN
class: "absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"
animationName: ping · animationDuration: 1s · animationIterationCount: infinite
aria-hidden: null
```

Everything else in the reduced-motion path is clean: 0 media playing, 0 console errors, hero H1 `opacity: 1` and 716 characters of hero text readable ("MELBOURNE, AUSTRALIA / Vikram Deshpande / Delivery leadership · AI solutions architecture / Sixteen years…"). This one Tailwind `animate-ping` is the sole survivor and it never stops. CLAUDE.md: "`prefers-reduced-motion` is not optional."

### F3 — MAJOR — the MiniVic launcher is the **92nd** tab stop, the last focusable element on the page

**Verified** (`adversarial-browser2.json` → `minivicTabIndex: 92`, `tabSeqLen: 92`, `tabSeqTail`). Tabbing from the top, the launcher is reached only after the entire document including the footer:

```
…87 A|linkedin.com/in/vikramd-profile
 88 A|github.com/Victordtesla24
 89 A|Privacy Policy
 90 A|Terms
 91 A|Contact support
 92 BUTTON|minivic-toggle|Open Mini Vic assistant   ← last
```

The launcher is a persistently-visible fixed element (20 px from the right and bottom edges at both 1440 and 390 — `minivic.right: 20, bottom: 20, 64×64`). A keyboard visitor sees it from the first paint and cannot reach it for 91 stops. The brief's requirement "Tab reaches the MiniVic launcher" is technically satisfied; the intent is not.

### F4 — MINOR — ten About list items are `tabindex="0"` with no interactive role or accessible name

**Verified.** Live HTML: `<li class="About_item__fSusw" data-side="role" tabindex="0">`. The tab walk (`adversarial-browser.json` → `keyboardWalk`, stops 11–14) shows them receiving focus as bare `LI` with content-derived text ("01Technical SkillsPython and TypeScript to…"). axe-core does not flag this (it is not a WCAG-mappable failure on its own), but ten role-less focus stops on non-actionable content is a direct contributor to F3's 92-stop path.

### F5 — MINOR — reported LCP is the nav wordmark, not the hero headline

**Verified** measurement, **Inferred** cause. `PerformanceObserver` reports LCP element `A "VIKRAM."` — the small nav wordmark link — at 1036 ms (1440×900) and 580 ms (390×844). Both are comfortably inside the 2.5 s budget and CLS is exactly `0` at both viewports, so the stated gate passes. But the *largest* text on screen is the hero `h1` "Vikram Deshpande"; its absence from LCP candidacy is consistent with an opacity-0 entrance animation excluding it. Inference — I did not instrument the hero entrance. The consequence: the green LCP number is not measuring the moment the hero becomes readable.

### F6 — POLISH — two untracked MiniVic video files exist locally but 404 on the live origin

**Verified.** `HEAD https://forgotten-mistory.web.app/assets/minivic-greeting.mp4` → **404**; `/assets/minivic-greeting-2160p.mp4` → **404**. Both files are present in the working tree as untracked artefacts (git status). The deployed page references neither (the panel plays `my-avatar.mp4` + `minivic-greeting.mp3`), so this is not a live defect today — it is a trap for the next commit that references them.

---

## WHAT I ATTACKED, AND HOW — including everything that PASSED

| # | Attack | Method | Result |
|---|--------|--------|--------|
| 1 | Deploy claim is false | `curl -sS -D - https://forgotten-mistory.web.app/?gl=force` | **PASS — Verified.** `<meta name="build-commit" content="e64566e3"/>` present in served HTML; matches local `git rev-parse HEAD` = `e64566e3c86ec…`. `last-modified: Sat, 05 Sep 2026 00:28:41 GMT`. |
| 2 | Console errors are being hidden | Own Playwright run, chrome channel, 1440×900 and 390×844, `networkidle` + 2.5 s settle | **PASS — Verified.** `consoleErrors: []`, `pageErrors: []`, `failedRequests: []`, `badResponses: []` at **both** viewports. Warnings only: 5 at 1440, 1 at 390, all SwiftShader/GL-driver origin (headless VPS, no GPU) — none from application code. |
| 3 | `/api/chat` is a stub / does not return the email | `curl -X POST … {"messages":[…],"mode":"hiring"}` | **PASS — Verified.** HTTP 200 in 2.47 s. Body: `{"text":"You can contact me by email at sarkar.vikram@gmail.com, by phone at +61 433 224 556, via LinkedIn at linkedin.com/in/vikramd-profile, or through GitHub at github.com/Victordtesla24. Email is the fastest channel for a response.","provider":"openai","model":"gpt-4.1-mini"}`. Published email present. **Provider `openai`, model `gpt-4.1-mini`**, `server: Google Frontend`, `cache-control: no-store`. |
| 4 | Security headers are absent on `/` | Response headers, `/` and `/api/chat` | **PASS — Verified.** `content-security-policy` (with `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`), `x-frame-options: DENY`, `x-content-type-options: nosniff`, `strict-transport-security: max-age=31556926; includeSubDomains; preload`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy`. Identical set on the API route. Note `script-src` retains `'unsafe-inline' 'unsafe-eval'` — a Next.js-static reality, recorded not scored. |
| 5 | Assets blow the budget | `HEAD` on live origin + captured response `content-length` during a real page load and MiniVic open | **PASS — Verified.** Nothing autoloading: initial load pulls only 5 woff2 (10–48 KB) + `icon.png` 6.7 KB — `mediaRefs` contained **no mp4 at all**. On MiniVic open: `my-avatar.mp4` **1.05 MB** (1 096 301 B, 206 range) and `minivic-greeting.mp3` **198 KB** — both under 2.5 MB and both user-initiated. Images: `og-image.png` 182 KB, `my_avatar.png` 178 KB, `icon.png` 6.7 KB — all ≤ 500 KB. `my-hero-avatar.mp4` 160 KB. Page-level `<video>` elements carry `preload="none"` / `"metadata"` and were `paused, readyState 0` at rest. |
| 6 | Accessibility violations are being suppressed | `@axe-core/playwright`, tags `wcag2a wcag2aa wcag21a wcag21aa`, on the fully loaded page | **PASS — Verified.** **0 violations** at 1440×900 and **0** at 390×844 — serious, critical, moderate and minor all empty. (Scope caveat: axe covers roughly a third of WCAG; F4 is an example it does not catch.) |
| 7 | Reduced motion is decorative only | `newContext({reducedMotion:'reduce'})`, full-page scroll, `document.getAnimations()` + media state | **FAIL — see F2.** Media: 0 playing (2 elements, both paused). Hero readable: H1 `opacity 1`, 716 chars of text. But 1 infinite `animate-ping` keeps running. |
| 8 | Keyboard path is broken | Tab from top, 120 stops max, recording tag/testid/name/visibility/outline | **PARTIAL.** Skip link **first** (`A "Skip to the evidence"`), then wordmark, Download CV, Menu, "See the evidence", Download CV, LinkedIn, GitHub, Email — every stop `vis=true` with a visible `2px solid` outline. MiniVic launcher reachable but at stop 92 (**F3**); role-less `LI` stops (**F4**). |
| 9 | Sections missing or out of order | DOM query for the six ids + first heading, computed visibility/opacity | **PASS — Verified.** All six present, in order, at both viewports: `#hero` H1 "Vikram Deshpande" · `#about` H2 "Ten dimensions, answered" · `#experience` H2 "Sixteen years, to scale" · `#skills` H2 "Calibration card" · `#vitrine` H2 "Six of thirty-eight" · `#listen` H2 "Feedback & coffee?". Every heading `headingVisible: true`, `opacity: 1`. Document order confirms no interleaving. |
| 10 | Factual claims are unsourced | `pdftotext public/docs/Vik_Resume_Final.pdf` + `app/data/siteContent.ts` + served HTML | **FAIL on 1 of 3 — see F1.** Payday Super/eight squads ✓ · $5M+ ✓ · 40+ practitioners ✗. |

## Not tested — stated rather than implied

- **Verified-by-absence only:** whether the MiniVic greeting audio auto-plays when the panel is opened *under* `prefers-reduced-motion: reduce`. In the normal context the panel opens with `minivic-greeting.mp3` already playing (`paused: false` despite `autoplay: false` — a scripted `.play()`); I did not repeat the panel-open flow in the reduced-motion context. Unresolved.
- Real-GPU rendering. All WebGL observations here come from SwiftShader on a headless VPS.
- Colour-contrast beyond what axe measures; no per-node black/white/gold audit was performed.
- The "thirty-eight repositories" figure in the `#vitrine` heading was not verified against GitHub.

## What would flip this to PASS

F1 and F2 are the two gates. F1: change "40+ practitioners" to the CV's own "up to 40 resources" in all five locations, or move the figure off the gold "measured in production" mark. F2: gate the `animate-ping` span behind the existing reduced-motion guard. F3 and F4 are the same fix — give the launcher a low positive `tabindex` or a skip-to-assistant affordance, and drop `tabindex="0"` from the ten About `li`s.
