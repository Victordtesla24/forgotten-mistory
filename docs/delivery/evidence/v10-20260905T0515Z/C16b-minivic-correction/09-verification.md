# 09 — independent adversarial verification of t_c16b0001 (cycle 16b, MiniVic correction)

**Reviewer:** council reviewer, `3rd_party_independent_adversarial_review` (docs/prompt.md §5),
independent of the author.
**Under review:** `worktree-wf_f79c8e1b-a89-1` @ `e6971ad` (feature commit `45eb252`,
evidence commit `e6971ad`).
**Method:** rebuilt the tree from scratch (`rm -rf out && npm run build:static`), served
`out/` on `127.0.0.1:5602`, re-ran every gate myself, and measured every acceptance line
with my own instrument (`/tmp/vrfyprobe/probe.mjs`, `probe2.mjs`, `shot.mjs` — run outside
the repository) rather than reading the author's logs back.
**Verdict: PASS** — both V-c16 failures are closed, R-c13 CC-03a is closed, no assertion
was weakened to get there, and the two probes I added beyond the assignment found no new
defect. Three observations are recorded in §5; none of them blocks.

---

## 1. Gates — re-run, not re-read

| gate | command | observed | exit |
|---|---|---|---|
| build | `rm -rf out && npm run build:static` | `RESULT: PASS — no credential material in the emitted bundle.` | 0 |
| types | `npx tsc --noEmit` | no output | 0 |
| lint | `npm run lint` | `✔ No ESLint warnings or errors` | 0 |
| static audit | `node scripts/validate/overhaul_static_audit.mjs` | `RESULT: ALL PASS (10/10)` (incl. `TC-NFR-DEADCSS`, `TC-NFR-MONO`, `TC-NFR-COMPLETE`) | 0 |
| assigned battery | `…test tests/e2e/chatbot.spec.ts tests/a11y tests/monochrome --workers=2` | `66 passed (2.4m)` — 66 `✓`, **0** failures | 0 |
| contrast | `…test tests/a11y/text-contrast.spec.ts --workers=2` | `2 passed (23.9s)` — `TC-CONTRAST-01 @ 390` **and** `@ 1440` | 0 |

Every spec the task introduces or re-points ran inside that 66 and passed by name:
`TC-BOT-14`, `TC-BOT-07`, `TC-BOT-12`, `TC-MV-LABEL-01`, `TC-MV-MARK-01 @ 1440` / `@ 390`,
`TC-MV-ARIA-01 @ 1440` / `@ 390`, `TC-MV-SKIP-01`, `TC-MV-OCCLUDE-01`, `TC-MV-OCCLUDE-02`,
`MONO-MV-01 @ 1440` / `@ 390`.

## 2. Acceptance lines measured with my own instrument

| # | line | measured | verdict |
|---|---|---|---|
| 1 | open panel intersects **no** `#hero h1` glyph rect (`Range.getClientRects`) at 1280×800 | panel `{l:824,t:352,r:1256,b:712,h:360}`, glyph floor y=301, glyph right x=959 — **0 hits**, clearance **+51 px** | PASS |
| 2 | …at 1366×768 | panel `{l:910,t:352,r:1342,b:680,h:328}`, glyph floor y=290 — **0 hits**, clearance **+62 px** | PASS |
| 3 | …at 1440×900 | panel `{l:984,t:352,r:1416,b:812,h:460}`, glyph floor y=326 — **0 hits**, clearance **+26 px** | PASS |
| 4 | toggle accessible name found by `getByRole('button', {name: /ask mini vic/i})` | matches `[data-testid=minivic-toggle]` (`aria-label` `"Ask Mini Vic — Vikram's AI clone"`) **and** `[data-testid=minivic-skip]`; the same query still matches the toggle with the panel **open** (2 → 2) | PASS |
| 5 | closed toggle contains an `svg` or text at 390 and 1440 | 390: **1 svg**, 24×24, `rgb(246,246,246)`, opacity 0.22, `checkVisibility()` true, `innerText` `""`. 1440: **1 svg**, 24×24, `rgb(246,246,246)`, opacity 0.92, `innerText` `"Ask Mini Vic"` | PASS |
| 6 | every `<video>` inside the toggle has `currentSrc` or `poster` | resting: `videos: []` at both viewports — the element is not rendered at all, which is strictly stronger than the line asks. After focus+hover: `currentSrc "…/assets/my-avatar.mp4"`, `src "/assets/my-avatar.mp4"`, `poster "/assets/my_avatar.webp"`, `readyState 4`, and the svg mark still present | PASS |
| 7 | every computed colour inside the toggle is `R==G==B` | **111** colour values walked at 390 and 111 at 1440 (self + all descendants, across `color`/`background-color`/4× border/`outline`/`fill`/`stroke`/`box-shadow`/`background-image`/`text-decoration-color`/`caret-color`/`column-rule-color`) — **0 non-achromatic, 0 gold** at either viewport | PASS |
| 8 | Tab reaches "Ask Mini Vic" within 3 stops | stop 1 `A` "Skip to the evidence"; **stop 2** `BUTTON[data-testid=minivic-skip]` "Ask Mini Vic" | PASS |
| 9 | the 5 screens exist, are inspectable, and the hero name is complete in the open captures | 5 PNGs, 14–154 kB, all opened and read; "Vikram Deshpande" is **complete and unobstructed** in `open-panel-1280x800.png`, `-1366x768.png`, `-1440x900.png` | PASS |

Both assets the launcher references resolve on the served bundle:
`/assets/my_avatar.webp` → `200, 66470 b`, `/assets/my-avatar.mp4` → `200, 1096301 b`.
The poster is not a dangling reference.

## 3. Two probes beyond the assignment

**The stated limit of the guarantee.** `07-decisions.md` §2 declares that below ~46.5 rem
of viewport height the `19rem` floor takes over and the clearance holds only "down to
about 700 px of viewport height". I measured the two viewports where that floor binds:

- **1280×720** — panel `{l:824,t:328,r:1256,b:632,h:304}`, glyph floor y=273 → **0 hits, +55 px**
- **1440×700** — panel `{l:984,t:308,r:1416,b:612,h:304}`, glyph floor y=287 → **0 hits, +21 px**

The floor branch holds at both, with clearance above the 16 px the test requires. The
author's caveat is conservative rather than optimistic; nothing was hidden behind it.

**Panel internals at the cap.** The composer is inside the panel's own box
(`bottom ≤ panel.bottom`) at all five viewports measured, including 1366×768 and 1280×720
where the cap bites hardest — the shortened panel clips its transcript, not its controls.

**What paints above the shortened panel.** The three open captures show a grayscale
rectangle above the panel's top edge; I checked it rather than assume.
`document.elementsFromPoint` 16 px above the panel resolves to
`figure[data-testid="hero-portrait"]` → `Hero_portraitMedia` → `Hero_portraitVideo`
(`{l:1115,t:330,r:1343,b:616}` at 1440; `{l:1080,t:292,r:1297,b:563}` at 1366). That is the
hero's own portrait, pre-existing, previously covered by the taller panel and now partly
revealed. Its left edge clears the h1's rightmost glyph at both widths. Not introduced here.

## 4. Was anything weakened to reach green?

One existing assertion changed. `TC-BOT-07` went from string equality on a flipping
accessible name (`"Open Mini Vic assistant"` / `"Close Mini Vic assistant"`) to
`/^Ask Mini Vic\b/` plus `aria-expanded` `false`/`true`/`false` across the same three state
transitions. I read the diff line by line: **this is a strengthening, not a relaxation.**

- The old name violated WCAG 2.5.3 (Label in Name, Level A) the moment the pill shipped —
  V-c16 §4 named it. It could not be kept.
- The state the old assertion guarded is not lost: it moved to `aria-expanded`, which is
  the ARIA disclosure contract, and the test still checks it at all three transitions.
- `TC-MV-LABEL-01` adds a constraint the old test did not have: the accessible name must
  *start with whatever the pill actually renders*, read out of the DOM at run time. The two
  can no longer drift apart silently.

No other assertion in the diff was touched. `TC-BOT-12`'s four geometric assertions are
intact and `TC-BOT-14` is additive — it does not replace `TC-BOT-12`, it measures glyph
rects at three viewports where `TC-BOT-12` measured one block box at one.

**The red-before claim is corroborated, not merely asserted.** `02-tests-failing.log`
carries five named failures with their measured values, and its 1440 numbers — panel top
**332**, glyph floor **325**, clearance **7** — match the panel top of **332** that the
*previous, independent* V-c16 review measured at 1440 on the unpatched tree
(`C16-minivic-launcher/09-verification.md` §2 line 9). Two instruments, run by two
reviewers a cycle apart, agree on the pre-fix geometry.

## 5. Observations (recorded, not blocking)

- **The mark at 390 is legible but faint.** I took my own capture from my own build
  (`/tmp/vrfyprobe/verifier-closed-390.png`) rather than trusting the author's: the disc
  carries a discernible speech balloon with three dots. **It does read as a chat
  affordance now** — the answer to R-c13 CC-03a's "no glyph, no avatar, no label" is yes at
  390, where cycle 16 could only answer yes at 1440. It is quiet: the mark is composited at
  α=0.22 over a `brightness(0.12)` portrait, which the author bounds at `rgb(72,72,72)`.
  That number is not free choice — `TC-MV-OCCLUDE-02` caps every pixel the closed launcher
  paints at 390 at luminance 0.0968, and it passed here. Two site rules genuinely pull
  against each other at this one control and the contrast ceiling wins; that is the correct
  precedence, and it is written down in `07-decisions.md` §4 rather than glossed.
- **The transcript is 32 px at 1366×768 and 16 px at 1280×720.** I confirmed the composer
  and controls stay inside the panel at both, so nothing is unusable — but on a 768-tall
  laptop the conversation log is one clipped line, visible in
  `08-screens/open-panel-1366x768.png`. The author records this as the deliberate price of
  never covering the headline (`07-decisions.md` §3) and names where a future cycle could
  buy it back. Correct call, correctly disclosed; a follow-up item, not a defect.
- **`tests/visual` was not run and nothing was rebaselined.** `VIS-04` was already red
  before cycle 16 and the panel is in no baseline's clip. Declining to bury a geometry
  change inside another owner's open regression is the same call cycle 16 made, and it is
  the right one.

## 6. Reproduction

```bash
cd /root/forgotten-mistory/.claude/worktrees/wf_f79c8e1b-a89-1
rm -rf out && npm run build:static
python3 -m http.server 5602 --directory out --bind 127.0.0.1 &
npx tsc --noEmit
npm run lint
node scripts/validate/overhaul_static_audit.mjs
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test \
  tests/e2e/chatbot.spec.ts tests/a11y tests/monochrome --workers=2
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5602 npx playwright test \
  tests/a11y/text-contrast.spec.ts --workers=2
fuser -k 5602/tcp
```

The three probe scripts ran outside the repository (`/tmp/vrfyprobe/`) so no scratch file
lands in the tree; all three are plain Playwright walks over the same `out/` bundle and
every number they produced is restated above.
