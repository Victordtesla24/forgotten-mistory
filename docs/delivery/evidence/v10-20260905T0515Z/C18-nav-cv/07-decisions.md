# Cycle 18 — ADV-4 / C-07: one "Download CV" in the first screen

Task `t_2cc9a990`. Same worktree and server as cycle 17 (`127.0.0.1:5603`).

## What the baseline actually measured

`../C17-skills-gold/01-baseline/probe.log`, `scrollY === 0`, counting every
`a[href="/docs/Vik_Resume_Final.pdf"]` whose rect meets the viewport and whose
computed `visibility !== 'hidden'`:

| width | counting | which |
|---|---|---|
| 390 | 1 | hero button |
| 834 | 1 | nav pill (hero button below a 900 px fold) |
| 1280 | 3 | nav pill · **phantom 548×96 at (365.9, 6)** · hero button |
| 1440 | 3 | nav pill · **phantom 548×96 at (445.9, 6)** · hero button |
| 1920 | 3 | nav pill · **phantom 548×96 at (685.9, 6)** · hero button |

The phantom is the **closed overlay's own "Download CV"** (`Navigation.tsx:27`).
framer-motion animates the overlay to `opacity: 0`, but it kept
`visibility: visible`, so a 548×96 anchor lay across the nav band, in the
hit-test tree, unseeable.

## Decisions

1. **The phantom is removed by taking the closed overlay out of the tree, not by
   deleting the link.** `app/globals.css`: `.nav-overlay { visibility: hidden }`
   with `.nav-overlay.open { visibility: visible }`. The hide is delayed by
   `var(--motion-emphatic)` — the exit spring's own length — so the close
   animation is still watched, and `visibility` is the only property CSS touches
   there, so nothing fights framer-motion's transform/opacity (the warning
   already in that block). The menu still opens: CTA-03 asserts it.

2. **The nav CV action defers to the hero until `[data-scrolled]`** — chosen over
   the alternative "demote it to text". The direction offered either, but ADV-4's
   acceptance line is *exactly one* CV control on screen at `scrollY === 0`, and a
   demoted-but-painted text link is still a second control; it would have changed
   how the duplicate looks without removing it. So the pill is `visibility: hidden;
   opacity: 0` at the top and `visible` under `nav[data-scrolled="true"]`. It keeps
   its space in the bar while hidden, so nothing shifts when it arrives (no CLS),
   and `visibility: hidden` — rather than `opacity: 0` — is what actually takes it
   out of the hit-test and accessibility trees.

   The hero keeps the CV button because the hero is where the case is made, and
   because at 390 the pill is `display: none` anyway (`max-width: 640`): the hero
   is the only CV offer a phone ever gets at the top.

3. **`TC-NAV-02` was re-pointed, not weakened.** It asserted `.nav-cv` is visible
   at the top, which is the behaviour this cycle deliberately changes. It now
   asserts more than it did: the pill exists with the right href, is *hidden* at
   the top, the hero's own CV button is visible there instead, and the pill
   becomes visible after a scroll. D-CV-01's guarantee — the strongest recruiter
   action is reachable without opening the menu — is intact.

4. **Viewport heights in the spec are the real ones** (390×844, 834×1112,
   1280×800, 1440×900, 1920×1080). "Is the hero's own CTA in the first screen" is
   a question about the screen, not the width; a constant 900 px height would have
   invented a tablet that does not exist.

## Gates

| gate | command | result |
|---|---|---|
| spec red first | `npx playwright test tests/overhaul/cta-duplication.spec.ts` | 6 failed / 1 passed (`02-tests-failing/cta-duplication-red.log`) |
| spec green | same, after the change | 8 passed (`04-tests-passing/new-suites-green.log`, joint run 27 passed) |
| TC-CINE-03 + hero + nav + a11y | `tests/e2e/hero.spec.ts tests/e2e/navigation.spec.ts tests/overhaul/cinematic.spec.ts tests/a11y` | 85 passed with `tests/e2e/skills.spec.ts` |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `ALL PASS (10/10)`, exit 0 |
| tsc / lint / build | `npx tsc --noEmit` · `npm run lint` · `npm run build:static` | exit 0 · `✔ No ESLint warnings or errors` · exit 0 |

Measured after the change: counting CV controls at `scrollY === 0` is **1** at
every one of 390 / 834 / 1280 / 1440 / 1920 (CTA-01 console output); the restored
pill reads `{"visibility":"visible","opacity":"1","borderStyle":"solid"}` (CTA-02).

## Tools used

Read, Edit, Write, Bash (build:static / tsc / lint / static audit / playwright /
python3 http.server on :5603), Playwright (Chrome channel, `--no-sandbox
--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`).

## Files

- `app/globals.css` (nav block: `.nav-cv`, `.nav-overlay`)
- `tests/overhaul/cta-duplication.spec.ts` (new)
- `tests/e2e/navigation.spec.ts` (TC-NAV-02 re-pointed)
