# Adversarial review — R-c8

- **Target:** https://forgotten-mistory.web.app/?gl=force
- **Claimed commit:** 9321998b · **Cycle:** c8 · **Run:** v9-20260904T2312Z
- **Reviewer stance:** third-party, did not build this, every claim reproduced in-session
- **Date:** 2026-09-05 (UTC), local time of run 01:11–01:20Z
- **Verdict: FAIL** — one reproducible violation of an explicit acceptance criterion (reduced-motion). Everything else attacked came back clean.

Evidence tags: **Verified** = observed in this session with the command/artifact cited · **Inferred** = derived from an observation but not directly reproduced · **Assumed** = not tested.

---

## FAILURES FIRST

### F-1 (major, Verified) — an infinite animation runs under `prefers-reduced-motion: reduce`

Under `reducedMotion: 'reduce'` the page still has exactly one animation in `playState === 'running'`, and it never stops.

```
RM_ANIM [{"tag":"SPAN",
  "cls":"absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity",
  "anim":"ping","dur":"1s",
  "parent":"SPAN.absolute right-1 top-1 flex h-3 w-3",
  "section":"(none)","aria":null}]
```

- Command: `node docs/delivery/evidence/v9-20260904T2312Z/R-c8/adv2.mjs`
- First run also caught it: `adversarial-report.json` → `rm1440.autoplay.runningCount = 1`, `iter: "Infinity"`.
- Source: `components/MiniVicBot.tsx:1568` —
  `<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-75"></span>`
- This is the notification pip on the MiniVic launcher. Tailwind's `animate-ping` carries no
  reduced-motion guard, so the keyframes keep running at 1 s, iteration count `Infinity`.
- Why it matters: the Owner's bar names "reduced-motion and no-WebGL paths" as a gate, and
  `CLAUDE.md` states `prefers-reduced-motion` is not optional. An unbounded looping animation is
  also the exact pattern WCAG 2.2.2 targets. The rest of the reduced-motion path is correct
  (see P-7), which makes this the single hole in it.

### F-2 (minor, Verified) — the MiniVic launcher is the 93rd tab stop

- `MV_TAB_STOPS 93` — 93 `Tab` presses from page load before `document.activeElement` carries
  `data-testid="minivic-toggle"`.
- `MV_DOM {"total":100,"idx":99,...}` — it is the last of 100 focusable elements in DOM order.
- The launcher *is* reachable, so the brief's keyboard requirement is met literally. But a keyboard
  user who wants the chatbot — the site's stated channel for employers and business clients — must
  traverse the entire page to get to it. Every other persistent chrome element (skip link, nav,
  Download CV) is in the first four stops.

### F-3 (minor, **Inferred**) — conflicting signal on the launcher's AT visibility

- Observed: `el.closest('[aria-hidden="true"]')` returns a match for the launcher button
  (`MV_DOM.ariaHidden: "yes"`), while `el.closest('[inert]')` does not.
- Conflicting observation: `@axe-core/playwright` with `wcag2a/wcag2aa/wcag21a/wcag21aa` reported
  **0 total violations** at both 1440 and 390 (`adversarial-report.json` → `d1440.axe.total = 0`,
  `m390.axe.total = 0`). axe's `aria-hidden-focus` rule is in that tag set and did not fire.
- The button element itself carries no `aria-hidden` (`components/MiniVicBot.tsx:1536-1544`), so any
  match is on an ancestor I did not identify before the time cap.
- I am **not** asserting the launcher is hidden from assistive technology. I am recording that two
  instruments disagree and the disagreement was not resolved in this session.

### F-4 (polish, Verified) — the site's tenure figure is one year above the CV's own headline

- Page/section heading: `Sixteen years, to scale` (`app/data/portfolio/vitrine.ts:116`;
  rendered heading confirmed live, see P-9).
- `app/data/siteContent.ts:69`: "Over sixteen years across government, finance, and telecommunications".
- `public/docs/Vik_Resume_Final.pdf` line 3 (via `pdftotext -layout`): **"15+ year** Senior Technical
  Leader and Certified Scrum Master (CSM)".
- The role timeline in the same PDF *does* support sixteen — earliest listed role is
  `May 2010 - Aug 2011`, which to Sept 2026 is ~16.3 years — so the number is defensible on the
  dates. The discrepancy is that the CV's own self-description says 15+ while the site says sixteen.
  Under the project's rule "never grade a claim higher than its evidence", the two documents should
  agree on the headline figure. No caliper `state:` field is attached to this heading
  (`grep -nE "state:|caliper" app/data/portfolio/experience.ts` → no match), so no gold mark is
  being over-claimed here.

---

## WHAT WAS ATTACKED, AND HOW

### P-1 Deploy claim — **Verified, holds**
```
curl -s -D headers-root.txt "https://forgotten-mistory.web.app/?gl=force"
→ HTTP/2 200, 115258 bytes
grep -o '<meta name="build-commit"[^>]*>' index.html
→ <meta name="build-commit" content="9321998b"/>
```
Matches the claimed commit exactly. Note (context, not a fault): the local checkout is one commit
*ahead* at `6f02332 fix(chat): pin the ANZ headcount wording in the grounding`; that commit is not
deployed and was not part of the claim.

### P-2 Console errors — **Verified, holds** (re-run independently, capture not trusted)
Fresh Playwright run at both required viewports, listening on `console`, `pageerror` and
`requestfailed`:

| viewport | console errors | pageerrors | failed requests |
|---|---|---|---|
| 1440×900 | 0 | 0 | 0 |
| 390×844 | 0 | 0 | 0 |

Warnings only, all from headless Chrome's software-WebGL path
("Automatic fallback to software WebGL has been deprecated", "GPU stall due to ReadPixels").
These are harness artefacts, not site defects. Artifact: `adversarial-report.json`.

### P-3 `/api/chat` — **Verified, holds**
```
POST https://forgotten-mistory.web.app/api/chat
body {"messages":[{"role":"user","content":"How can I contact you?"}],"mode":"hiring"}
→ HTTP/2 200, application/json, 2.04 s
{"text":"You can contact me by email at sarkar.vikram@gmail.com, by phone at +61 433 224 556,
 via LinkedIn at linkedin.com/in/vikramd-profile, or on GitHub at github.com/Victordtesla24.
 Email is the fastest channel for a response.",
 "provider":"openai","model":"gpt-4.1-mini"}
```
Published email present. **Provider: openai · Model: gpt-4.1-mini.** `cache-control: no-store` set.
Artifacts: `api-chat.json`, `api-chat-headers.txt`.

### P-4 Security headers on `/` — **Verified, holds**
Present on the document response: `content-security-policy` (with `frame-ancestors 'none'`,
`object-src 'none'`, `base-uri 'self'`), `x-frame-options: DENY`, `x-content-type-options: nosniff`,
`referrer-policy: strict-origin-when-cross-origin`,
`strict-transport-security: max-age=31556926; includeSubDomains; preload`,
`permissions-policy: camera=(), microphone=(self), geolocation=(), browsing-topics=()`.
The same CSP is echoed on the `/api/chat` response. Artifact: `headers-root.txt`.
Observation, not a finding: the CSP allows `script-src 'unsafe-inline' 'unsafe-eval'` — normal for a
Next.js static export without nonces, but it is the weakest line in an otherwise strict policy.

### P-5 Asset budgets on the live origin — **Verified, holds**
`curl -sI` against the live origin:

| asset | bytes | autoloads? | verdict |
|---|---|---|---|
| `/assets/my-hero-avatar.mp4` | 160,156 (156 KB) | yes (hero, observed in `mediaRequests`) | pass |
| `/assets/my-avatar.mp4` | 1,096,301 (1.05 MB) | no — MiniVic panel only | pass (< 2.5 MB) |
| `/assets/my_avatar.webp` | 66,470 (65 KB) | referenced | pass |
| `/assets/my_avatar.png` | 178,777 (175 KB) | referenced | pass |
| `/assets/og-image.png` | 182,547 (178 KB) | metadata | pass |
| `/icon.png` | 6,744 | yes | pass |
| `/docs/Vik_Resume_Final.pdf` | 157,615 | on click | pass |

Nothing autoloading is over 2.5 MB; no image exceeds 500 KB. Only two media URLs were requested on
load at 1440 (`icon.png`, `my-hero-avatar.mp4`) — the 1.05 MB MiniVic video is correctly deferred.

### P-6 Accessibility (`@axe-core/playwright`) — **Verified, holds**
Tags `wcag2a, wcag2aa, wcag21a, wcag21aa`, run against the fully loaded page:
**0 serious, 0 critical, 0 moderate, 0 minor — 0 total violations at 1440×900 and at 390×844.**
I attacked this result rather than accepting it (see F-3); it survived except for the unresolved
`closest()` conflict. Artifact: `adversarial-report.json` → `d1440.axe`, `m390.axe`.

### P-7 Reduced motion — **partially holds** (the one hole is F-1)
Under `reducedMotion: 'reduce'` at 1440×900:
- **Video:** two `<video>` elements, both `paused: true`, both `currentTime: 0`, and both with an
  **empty `currentSrc`** — the sources are not even attached, so nothing downloads or plays.
- **Hero readable:** `#hero h1` → text `"Vikram Deshpande"`, `opacity: "1"`, `transform: "none"`,
  `1088×124` px, `color: rgb(246, 246, 246)`. Fully rendered with no entrance transform pending.
  Screenshot: `adv-rm1440.png`.
- **Hole:** the `animate-ping` pip keeps looping — F-1.

### P-8 Keyboard — **Verified, holds** (with F-2 as the caveat)
Tab from the top at 1440×900, first 16 stops, every one visible with a real `2px solid` focus
outline:

1. `A` "Skip to the evidence" → `#main` ← **skip link is stop 1**
2. `A` "VIKRAM." → `#hero` (nav)
3. `A` "Download CV" → `/docs/Vik_Resume_Final.pdf` (nav)
4. `BUTTON` "MENU" (nav)
5. `BUTTON` "Pause the portrait" (hero motion control)
6. `A` "See the evidence" → `#experience` (hero primary action)
7. `A` "Download CV" (hero secondary action)
8–10. `A` LinkedIn / GitHub / Email (`mailto:sarkar.vikram@gmail.com`)
11. `A` repository link → `…/aether-job-career-agent/blob/main/apps/api/app/routers/jobs.py`
12–16. `LI` elements 01–05 of the About dimensions (focusable list items)

Skip link, nav, hero actions all reached. MiniVic launcher reached at stop 93 (F-2).
Observation: the About dimension `<li>` elements are focusable but are list items with no
interactive role; axe did not flag them, and I did not test whether Enter/Space activates them.

### P-9 Six sections, in order, each with a visible heading — **Verified, holds**
DOM order returned by the page: `["hero","about","experience","skills","vitrine","listen"]`.

| # | id | tag | heading text | visible |
|---|---|---|---|---|
| 1 | `#hero` | H1 | Vikram Deshpande | yes |
| 2 | `#about` | H2 | Ten dimensions, answered | yes |
| 3 | `#experience` | H2 | Sixteen years, to scale | yes |
| 4 | `#skills` | H2 | Calibration card | yes |
| 5 | `#vitrine` | H2 | Six of thirty-eight | yes |
| 6 | `#listen` | H2 | Feedback & coffee? | yes |

Visibility computed from `getBoundingClientRect()` plus `visibility`, `display` and `opacity`.
One `h1` on the page, in the hero. MiniVic launcher present at both viewports, bottom-right
(1440: x=1356 y=816; 390: x=306 y=760), 64×64, `aria-label="Open Mini Vic assistant"`.

### P-10 Three factual claims against source — **2 Verified clean, 1 discrepancy (F-4)**

| claim on the page | source check | result |
|---|---|---|
| "Six of thirty-eight" (vitrine heading) | `curl -s https://api.github.com/users/Victordtesla24` → `"public_repos": 38` | **Verified true against a live, checkable source** |
| "$5M+ program portfolio across 5+ squads and up to 40 practitioners" (`siteContent.ts:474`, `:114`) | CV PDF: "Directed a program portfolio valued at over $5M, leading 5+ cross-functional squads (up to 40 resources, including offshore teams)" | **Verified — exact match** |
| ATO Payday Super, Scrum Master / Project Manager, current role | CV PDF: "Australian Taxation Office (ATO) … March 2026 - Present … squad — one of eight squads on the Payday Super reform program" | **Verified — exact match** |
| "Sixteen years" | CV headline says "15+ year"; role dates from May 2010 support ~16.3 y | **F-4 — headline figures disagree** |

CV extracted with `pdftotext -layout public/docs/Vik_Resume_Final.pdf`.

---

## SUMMARY

| gate | result |
|---|---|
| deploy commit = 9321998b | pass (Verified) |
| zero console errors @ 390 and 1440 | pass (Verified) |
| `/api/chat` returns published email | pass (Verified — openai / gpt-4.1-mini) |
| CSP + X-Frame-Options on `/` | pass (Verified) |
| asset budgets on live origin | pass (Verified) |
| axe serious/critical @ 1440 and 390 | pass (Verified — 0 total) |
| reduced motion: nothing autoplays, hero readable | **fail (F-1)** — video path clean, one infinite CSS animation survives |
| keyboard: skip link, nav, hero actions, launcher | pass, launcher at stop 93 (F-2) |
| six sections in order with visible headings | pass (Verified) |
| factual claims vs source | 3 of 4 exact; tenure headline disagrees (F-4) |

**Not tested (Assumed):** LCP and CLS on this run (the capture reports 1596 ms / 0 but I did not
re-measure); colour-contrast beyond axe's automated pass; the no-WebGL path (`?gl=force` forces GL
*on*, so the fallback was never exercised); whether each section's animation is genuinely "one
cinematic visualisation that tells that section's story" — that is a judgement call I did not make
from screenshots; MiniVic answer quality for the business-client audience; black/white/gold palette
compliance by pixel sampling.

## Artifacts

- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/adversarial-review.md` (this file)
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/adversarial-report.json`
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/adv.mjs`, `adv2.mjs`
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/headers-root.txt`
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/api-chat.json`, `api-chat-headers.txt`
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/index.html`
- `/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/adv-rm1440.png`
