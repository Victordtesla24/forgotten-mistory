# R-c13 merged review — run v10-20260905T0515Z

**Target:** https://forgotten-mistory.web.app — production only.

**Reviewed builds.** Five deploys landed during this council; every finding names the build it was
measured on. Precondition (live build is a descendant of the cycle-11 merge `f86b125`) holds for all
of them — `git merge-base --is-ancestor f86b125 <build>` returned OK for each.

| build | window | lens |
|---|---|---|
| `3adf126a` | 06:36Z | precondition (task brief) |
| `d59621de` → `15fb165b` | 06:37–06:47Z | adversarial |
| `15fb165b` | 06:51–06:58Z | composition |
| `6dbb7992` | 07:02–07:06Z | motion |
| `01cd8bc5` → `f103462f` → `3dae601a` | 07:11–07:26Z | **merge (this file)** |

The merge lens re-measured the whole blocker set on the current build because the P100 hotfix
(`feb12ef` → merge `5c0e01d`) landed between the motion lens and this file. Evidence:
`merge-probe.mjs` / `merge-probe.json`, `merge-probe2.mjs` / `merge-probe2.json`,
`capture/merge-*.png`.

## Verdict: FAIL

All three lenses returned FAIL. The blocker all three raised — the WebGL crash into `app/error.tsx`
— **closed mid-review** on `f103462f` and is re-verified closed here (see Contradictions §1); it is
recorded in Keep, not in the backlog, and its two residuals are carried as majors. One blocker
survives on the live build: **CC-02, the site has no engagement action for the business-client
audience** (§2, R4, CLAUDE.md prime directive 1) — independently re-confirmed at 1440 and 1280 on
`f103462f` (`merge-probe.json.listen`, `merge-probe2.json.cap1280.listenCTAs = 0`).

Gates that hold are listed in Keep. The §0.3 / R2 grade, re-measured after the hotfix: **three of
seven signature GL scenes** mount (#hero, #about, #experience), and at most one canvas is live at a
time; #skills, #vitrine and #listen mount none (`merge-probe2.json.glForceWalk`).

## Blockers (fix before anything else)

1. **CC-02** (composition, Verified, re-confirmed by merge): #listen contains exactly four plain text
   anchors and zero filled actions. A business client who has read six sections and decided to buy is
   handed a 14 px grey `mailto:`. R4 ("client reaches booking/engagement CTA — click-through
   complete") is unmet.

## Contradictions between reviewers, and how they were resolved

### 1. The WebGL crash (adversarial ADV-1 / composition CC-01 / motion MOT-C13-01) vs the current live build

Sided with: **the live build, re-measured.** All three lenses were right on the builds they saw —
`ReactCurrentBatchConfig` is absent from the React 19 runtime Next 15 vendors, and R3F 8.18.0 reads
it, so `?gl=force` and a spoofed hardware GPU both rendered `app/error.tsx`. The P100 hotfix
`feb12ef` ("pin next 14.2.35 — R3F 8 crashes under next 15's React 19") landed at ~07:1xZ. On
`f103462f` and `3dae601a` the crash does not reproduce: with a spoofed `UNMASKED_RENDERER_WEBGL`
(`ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)`) at 1440×900 and at `/?gl=force`, h1 is `Vikram
Deshpande`, `section[id]` count is 6, `errorBoundary` false, console errors 0, pageerrors 0, and one
`<canvas>` mounts in #hero (`merge-probe.json.gpuSpoof1440`, `.glForce1440`;
`merge-probe2.json.consoleErrorCount = 0`). Closed — with two residuals carried as majors: **M-1**
(the hotfix reverted cycle 13's `next 15.5.25` security upgrade to `14.2.35`; the durable React-19 /
R3F-9 fix is still open) and **MOT-C13-01d** (a scene fault still replaces the document).

### 2. "The MiniVic panel does not open" (composition CC-03) vs "the avatar stage moves while it speaks" (motion)

Sided with: **motion, plus source and an independent probe.** Composition reported no panel node
under `[role="dialog"]`, `[class*="panel" i]` or `[data-testid*="minivic-panel"]` after click. That is
a probe miss: `components/MiniVicBot.tsx:1248-1249` carries `data-testid="minivic-panel"` and
`role="dialog"` verbatim, and after clicking the toggle on `f103462f` the DOM gains 133 nodes,
`[role="dialog"]` count is 1, `[data-testid*="minivic"]` count is 8, a 200×100 viseme canvas is
present, `/assets/my-avatar.mp4` is `paused: false readyState: 4`, and the transcript renders
(`merge-probe.json.minivicOpen`, `capture/merge-1440-minivic-open.png`). The panel half of CC-03 is
**closed**; its acceptance lines were already met in source. The **launcher** half stands and is
re-confirmed independently (item 8).

### 3. "#experience ships with no visualisation element of any kind" (adversarial ADV-2) vs composition's chart measurements

Sided with: **composition + measurement.** ADV-2 is over-stated. The chart renders as CSS boxes:
8 `.trackBar` elements, all with rendered width > 0, and composition measured `.trackYears` geometry
inside the card when it closed R-c8 C-03 (`merge-probe2.json.experienceGL.barCount = 8`,
`barsWithWidth = 8`). What is true, and is carried, is narrower and sharper: on the fallback path
#experience holds **0 canvas and 0 svg**, and its scene slot paints nothing
(`getComputedStyle('.chartScene').backgroundImage === 'none'`) → item 7; and the bars have no entry
beat → item 2.

### 4. "R2 scores 0/7 in production" (adversarial ADV-2) vs the post-hotfix measurement

Sided with: **the newer measurement.** With GL restored and each section scrolled to centre,
canvases mount for #hero, #about and #experience and **unmount when the section leaves view**, so the
page-wide total is 1 at any moment; #skills, #vitrine and #listen mount none
(`merge-probe2.json.glForceWalk`). R2 is **3 of 7**, not 0 of 7 and not 7 of 7 → item 6.

### 5. Gold on the "measured in production" mark (adversarial "all 30 gold elements licensed" vs composition CC-10 "a status column adds a second meaning")

Sided with: **CLAUDE.md, which splits the difference.** Prime directive 4 enumerates the licensed
gold surfaces as "closed caliper jaws, the *measured in production* mark, and live repository URLs" —
so the production glyph is licensed and composition's premise that it smuggles in a second meaning is
wrong; adversarial's hold stands on doctrine. What survives from CC-10 is compositional, not
doctrinal: **two** parallel gold columns 71 px apart (x=1088 and x=1159.6) inside one table asks a
reader to learn two marks in a section headed "Calibration card". Carried at polish (item 19).

### 6. Monochrome instruments disagreeing with themselves (composition CC-07)

Not a cross-lens contradiction but a shared instrument gap worth recording: composition's own
`rgb()`-based scan returned zero chromatic elements while its `oklch()` inspection found
`oklch(0.705 0.015 286.067)` / `oklch(0.552 0.016 285.938)` on the launcher pips; adversarial's
monochrome checks are `rgb()`-based too. Re-confirmed in source and live DOM:
`components/MiniVicBot.tsx:1625-1626` still ships `bg-zinc-400` / `bg-zinc-500`
(`merge-probe.json.minivicClosed.html`). Both the defect and the blind parser are carried (item 13).

## Prioritised backlog (failures first, 1 = build first)

| # | id | section | severity | tag | source | one line |
|---|---|---|---|---|---|---|
| 1 | CC-02 | #listen | blocker | Verified | composition + merge | No engagement CTA for business clients anywhere on the page: #listen holds four plain anchors, 14 px rgb(205,205,205), 0 filled actions at 1440 and 1280 |
| 2 | MOT-C13-02 | #experience | major | Verified | motion | "Sixteen years, to scale" is the one heading that describes an animation and the section has none — `getAnimations()` scoped to #experience is `[]` on arrival and after 1600 ms; the only `animation:` in the module is inside the reduced-motion block |
| 3 | M-1 | build / dependencies | major | Verified | merge | The P100 hotfix reverted cycle 13's security upgrade — package.json:56 is back to `next 14.2.35` against `react 18.2.0` + `@react-three/fiber 8.18.0`; the durable React-19 / R3F-9 alignment is still open |
| 4 | MOT-C13-01d | components/gl | major | Verified | motion | A fault inside a scene replaces the whole document: `GLCanvas` mounts with no scene-local error boundary, so a component-level throw reaches `app/error.tsx` — "the scene is never the content" is not enforced in code |
| 5 | B-3 | pipeline | major | Verified | merge | Deploy verification is blind to the path that broke: `scripts/deploy.mjs:116-126` reads only the `build-commit` meta on the plain URL, so a total GPU-path outage shipped and sat unseen |
| 6 | M-2 | R2 / all sections | major | Verified | merge (supersedes ADV-2) | Three of seven signature GL scenes: #hero, #about, #experience mount a canvas; #skills, #vitrine, #listen mount none; scenes unmount on scroll so at most one canvas is live |
| 7 | MOT-C13-04 | #hero, #experience | major | Verified | motion + adversarial | The two shader sections have no still of that light when the shader is absent — both scene slots compute `background-image: none`, so the fallback and reduced-motion paths are flat near-black |
| 8 | CC-03a | global chrome (MiniVic launcher) | major | Verified | composition + merge | The launcher is a 64×64 ring around emptiness: `innerText` empty, 0 svg, 0 img, and its only child is a `<video>` with no `src`, no `<source>` and no `poster` (`readyState: 0`) |
| 9 | ADV-3 | global chrome (MiniVic launcher) | major | Verified | adversarial | Repeat of R-c8 ADV-F-2: the launcher is tab stop 83 of 83 — a keyboard user traverses the entire page before reaching the channel the brief names for employers and clients |
| 10 | ADV-4 / CC-04 | #hero / nav | major | Verified | adversarial + composition | Repeat of R-c8 C-07: two identical "Download CV" controls in the 1440 first screen (nav pill at x=1140.5, hero button at x=296.6), plus a third 548×96 anchor with the same text and href overlapping the nav band |
| 11 | CC-05 | #listen | major | Verified | composition | The page's business end is its quietest type: every contact line is 14 px rgb(205,205,205) with a 21 px box, under a 54.4 px pull-quote — a 3.9× ratio pointing the wrong way |
| 12 | CC-06 | #skills, #hero, #experience, #about | major | Verified | composition | Five running-text blocks blow past the 55–75ch measure — #skills provenance at 173ch (1246 px at 12 px), four more at 124ch — while the site already owns `--measure-read` |
| 13 | CC-07 | global chrome (MiniVic launcher pip) | major | Verified | composition + merge | Monochrome breached in a colour space the gate cannot see: the two pip spans are `bg-zinc-400` / `bg-zinc-500` → `oklch(… 0.015 286°)` / `oklch(… 0.016 286°)`, and the audit's colour parser reads `rgb()` only |
| 14 | MOT-C13-03 | #vitrine | major | Verified | motion | The trace-on is real but not legible as a trace: 6.67 ms between consecutive strokes against a 720 ms stroke, so a 25-stroke plate finishes its whole stagger in ~160 ms and reads as one fade |
| 15 | CC-08 | #vitrine | minor | Verified | composition | The rail scrolls 3192 px inside 1440 px — 55% of the content off-screen — with no thumb, no counter and no arrow; the only affordance is a 64 px mask fade |
| 16 | CC-09 | page (vertical rhythm) | minor | Verified | composition | Section padding is not on one scale and the page closes tighter than it opens: #listen is 126 top / 45 bottom at 1440 against a symmetric 108/108 for the middle four |
| 17 | ADV-5 | /api/chat | minor | Verified | adversarial | The public chat endpoint returns its routing internals to any caller (`"provider":"openai","model":"gpt-4.1-mini"`) and answers in 6.40 s unstreamed, against R3's <~1.5 s first word |
| 18 | MOT-C13-05 | #about | minor | Inferred | motion | At the one sampled pointer position the compass readout did not change; one sample is not a proof of absence, and this state has now been reported twice |
| 19 | CC-10 | #skills | polish | Verified | composition | Two parallel gold columns 71 px apart (14 bench dots at x=1088, 14 status glyphs at x=1159.6) ask the reader to learn two marks in one table |
| 20 | ADV-6 | #hero / #experience / #about copy | polish | Verified | adversarial | Repeat of R-c8 ADV-F-4: the page says "Sixteen years" while the CV's own headline says "15+ year" |
| 21 | MOT-C13-06 | #vitrine | polish | Verified | motion | The rail is a real snap carousel at 390 but `scroll-behavior: auto`, so plate-to-plate moves jump rather than travel |
| 22 | MOT-C13-07 | #hero | polish | Verified | motion | `HeroAtmosphere` carries a full reduced-motion implementation that can never run — `Scene.tsx:91` gates the mount first — leaving two competing policies with no note |

### 1. CC-02 — BLOCKER — #listen (Verified, from composition, re-confirmed by merge)

**Finding.** There is no engagement CTA for business clients anywhere on the page. #listen contains
exactly four interactive elements, all plain text anchors: `sarkar.vikram@gmail.com`,
`+61 433 224 556`, `linkedin.com/in/vikramd-profile`, `github.com/Victordtesla24` — each 14 px IBM
Plex Mono, `rgb(205, 205, 205)`, `background-color: rgba(0, 0, 0, 0)`, `border-width: 0px`,
`height: 21px` (`merge-probe.json.listen`, all four rows). The count of #listen elements with a
non-transparent background is **0** at 1440 and at 1280 (`merge-probe2.json.cap1280.listenCTAs = 0`,
`capture/merge-1280x800-listen.png`). The only two buttons on the entire site are "See the evidence"
→ #experience and "Download CV" → `/docs/Vik_Resume_Final.pdf`, both employer-path. §2 names BUSINESS
CLIENTS a first-class audience and R4 requires "client reaches booking/engagement CTA — click-through
complete"; CLAUDE.md prime directive 1 is not met on the client half.

**Direction.** Add one engagement action to #listen with equal weight to the hero's primary: filled
`var(--white)` plate, `color: var(--ink-900)`, `padding: var(--space-2) var(--space-4)`,
`font-size: var(--fs-small)`, min height 48 px, placed as the FIRST item in `.channels` above the
four channels, on the 96 px spine. Label it for the client, not the recruiter ("Start a project" /
"Book a 30-minute call") and point it at a destination the visitor can complete — a scheduling URL,
or a `mailto:` with a pre-filled subject only if the copy says so. Keep the four channels as the
quiet secondary row beneath, retaining the `.channel::after` underline
(`Listen.module.css:223`) on them only. No gold — this is chrome, not a sourced claim.

**Files.** `app/data/portfolio/listen.ts`, `components/sections/Listen/Listen.tsx:184-196`,
`components/sections/Listen/Listen.module.css:195-260`, `tests/content/`

**Acceptance.** At 390/834/1280/1440/1920: #listen contains exactly one element matching `a,button`
whose computed `background-color` is not `rgba(0, 0, 0, 0)`; its `getBoundingClientRect().height >=
48`; its left edge equals the #listen heading's left edge within 1 px; its `href` is non-empty and
resolves (HTTP < 400, or a `mailto:` / `https:` scheme); and it precedes the four `.channel` anchors
in DOM order. Add as `tests/content/client-cta.spec.ts`.

### 2. MOT-C13-02 — MAJOR — #experience (Verified, from motion)

**Finding.** "Sixteen years, to scale" is the one heading that literally describes an animation, and
the section has none. `document.getAnimations()` scoped to #experience returns `[]` on arrival and
`[]` after 1600 ms (`motion-probe2.json → p1440.entry.experience`); bars are painted at full length
in the first frame (`merge-probe2.json.experienceGL`: 8 `.trackBar`, all width > 0, on arrival). The
only `animation:` declaration in `Experience.module.css` is line 479, **inside**
`@media (prefers-reduced-motion: reduce)` — the reduced-motion reader gets a 320 ms `experienceFade`
and the full-motion reader gets nothing. The section's GL flagship `CareerStrata` is by its own
comment "the field behind the experience chart… draws texture rather than the roles themselves"
(`CareerStrata.tsx:12-14`) — decoration, not narration. This is R-c8 MOT-F-1 still open.
*Severity note: motion filed this as a blocker; merged at major, matching R-c8's own grading of the
same defect (MOT-F-1) — it degrades the narrative rather than the function, neither other lens rated
#experience a blocker, and it has an open board task.*

**Direction.** Give the chart the beat its heading promises — bars grow to their real duration on
entry. (1) IntersectionObserver at threshold 0.2 in `Experience.tsx` setting `data-drawn` on the
chart, mirroring `Bench.tsx:189-206` (already solves once-only + reduced-motion). (2) Animate
`.trackBar::before` (`Experience.module.css:175`) `transform: scaleX(0)` → `scaleX(1)`,
`transform-origin: left center`, 900 ms (`--motion-cine`), `cubic-bezier(0.16,1,0.3,1)`,
`animation-delay: calc(var(--i) * 70ms)` — eight roles land the last bar at 1390 ms. (3) Roll
`.trackYears` (line 211) `opacity: 0 → 1` over 320 ms at `calc(var(--i) * 70ms + 620ms)` so each
number lands as its bar stops. (4) In the existing RM block (line 473) add
`.trackBar::before { animation: none; transform: none }` and keep `experienceFade`. (5) Drive
`CareerStrata`'s `uIntensity` (`CareerStrata.tsx:45-47`) from the same `data-drawn` flag instead of
ramping unconditionally at `delta*0.5`, so the strata rise with the bars.

**Files.** `components/sections/Experience/Experience.tsx:100,156`,
`components/sections/Experience/Experience.module.css:169,175,211,473-486`,
`components/sections/Experience/CareerStrata.tsx:45-47`,
`components/sections/Skills/Bench.tsx:189-206`, `tests/overhaul/experience-signature.spec.ts`

**Acceptance.** With normal motion at 1440×900, scrolling #experience into view yields >= 8 entries
in `document.getAnimations()` scoped to #experience, each `duration === 900` and
`easing === 'cubic-bezier(0.16, 1, 0.3, 1)'`, the last starting at >= 490 ms; `.trackBar::before`
computed transform is not `matrix(1,0,0,1,0,0)` at t=100 ms and is at t=1600 ms. Under
`reducedMotion: 'reduce'`, #experience still reports zero running animations after 2200 ms.

### 3. M-1 — MAJOR — build / dependencies (Verified, from merge)

**Finding.** The P100 hotfix bought availability by giving back cycle 13. `package.json:56` on the
live build is `"next": "14.2.35"` against `"react": "18.2.0"` (`:57`),
`"@react-three/fiber": "8.18.0"` (`:49`) and `"@react-three/drei": "9.122.0"` (`:48`) — commit
`feb12ef` "fix(deps): pin next 14.2.35 — R3F 8 crashes under next 15's React 19", merged as
`5c0e01d`. That trio is internally consistent and the crash is gone (Contradictions §1), but cycle 13
(board `t_62c9ee4d`, "Next 15.5.25 security upgrade") is no longer in the live build, so whatever it
addressed is un-addressed again *(the specific advisories were not enumerated this run — Inferred)*,
and the durable alignment named in the P100 record (React 19 + R3F 9) is still open as `t_r19r3f9`.
The repo checkout is also still out of step with its own pin — the adversarial lens found
`node_modules/next` at 14.2.35 and `node_modules/react` at 18.2.0 while package.json pinned 15.5.25;
after the revert those agree again by accident, not by process.

**Direction.** Land the durable fix rather than living on the revert: `@react-three/fiber` `^9.0.0`
and `@react-three/drei` `^10.0.0` (the React-19 line) together with `react`/`react-dom` `^19` and
`next` back to `15.5.25`, in one commit, re-locking `package-lock.json` in the same commit. Before
shipping, `npm ls react react-dom react-reconciler @react-three/fiber` must show one React major
matching R3F's generation. Add the guard the motion lens specified to
`scripts/validate/overhaul_static_audit.mjs`: fail the build when an emitted chunk contains
`ReactCurrentBatchConfig` while the React runtime chunk contains
`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`, and fail when
`require('./node_modules/next/package.json').version` does not equal the package.json pin.

**Files.** `package.json:48-49,56-58`, `package-lock.json`,
`scripts/validate/overhaul_static_audit.mjs`, `components/gl/GLCanvas.tsx`

**Acceptance.** `next` is back at the cycle-13 pin with React 19 and R3F 9 resolved together;
`npm ls react react-dom react-reconciler @react-three/fiber` reports a single React major; the audit
fails a deliberately mismatched tree; and `/?gl=force` plus a spoofed-hardware-GPU load at 1440×900
and 390×844 both return 6 sections, 0 pageerrors, 0 console errors and >= 1 canvas in #hero.

### 4. MOT-C13-01d — MAJOR — components/gl (Verified, from motion)

**Finding.** The outage was a component fault that became a site outage because nothing contains a
scene fault. `Scene.tsx:91` gates the mount and `Scene.tsx:94-98` renders `GLCanvas`, but neither is
wrapped in an error boundary, so a throw inside the R3F tree propagates to `app/error.tsx:28-46` and
replaces the entire document — six sections, the name, the CV link and the contact routes included.
`Scene.tsx:36-37` states the opposite intent ("the slot keeps its own CSS treatment"), and CLAUDE.md
makes it doctrine: "the scene is never the content". The version skew is fixed; the amplifier is not,
and it will amplify the next scene fault the same way.

**Direction.** Wrap the `GLCanvas` mount at `Scene.tsx:94-98` in a scene-local error boundary whose
`componentDidCatch` sets `capability = 'unsupported'` and renders the slot empty, so any scene
failure degrades to the no-GL path already built and tested. Log once to the console with the scene's
name; do not re-throw. Keep `app/error.tsx` for genuine page-level faults.

**Files.** `components/gl/Scene.tsx:91,94-98`, `components/gl/GLCanvas.tsx:3,22-44`,
`app/error.tsx:28-46`, `tests/e2e/`

**Acceptance.** A spec that forces a throw inside the GL subtree (stub `GLCanvas`'s default export to
throw, or dispatch a `webglcontextlost` the renderer cannot recover) asserts:
`document.querySelectorAll('section[id]').length === 6`, `#hero h1` text `Vikram Deshpande`, zero
elements matching `/SYSTEM INTERRUPT|Something went wrong/`, and `#hero canvas` count 0 (the slot
fell back). Add as `tests/e2e/scene-failure-contained.spec.ts`.

### 5. B-3 — MAJOR — pipeline (Verified, from merge)

**Finding.** The verification that runs on every deploy cannot see the failure mode that just took the
site down for every GPU visitor. `scripts/deploy.mjs:116-126` fetches the site root once and matches
`<meta name="build-commit">` — nothing more: no section count, no console-error check, no `?gl=force`
load, no GPU path. That is why a total outage on the hardware path shipped, passed its own
post-deploy verification, and survived until an adversarial reviewer spoofed a renderer string; it is
also why the hotfix's own board row reads "P100 hotfix merged, **awaiting live verification**"
(`f103462f`). The board already carries the right idea as `t_prodmon01`; it is unbuilt.

**Direction.** Extend the post-deploy verification in `scripts/deploy.mjs` beyond the meta tag: after
the build-commit assertion, drive one headless load of `/`, one of `/?gl=force`, and one of `/` with
`UNMASKED_RENDERER_WEBGL` spoofed to a hardware string, at 1440×900 and 390×844, asserting six
`section[id]`, `#hero h1 === 'Vikram Deshpande'`, zero pageerrors, zero console errors and no
`/SYSTEM INTERRUPT/` in `body.innerText`. Fail the deploy script (not the deploy workflow's merge
step) on any of those, and print the failing probe. Then stand up `t_prodmon01` on the same probe on
its ten-minute cadence so a regression is caught without a reviewer in the loop.

**Files.** `scripts/deploy.mjs:116-126`, `.github/workflows/deploy.yml`,
`scripts/validate/overhaul_static_audit.mjs`, `tests/e2e/`

**Acceptance.** `node scripts/deploy.mjs` exits non-zero against a build that renders the error
boundary on any of the three paths, and zero against the current build; the probe writes its results
to `docs/delivery/evidence/<run>/deploy-verify.json` with the build-commit it measured.

### 6. M-2 — MAJOR — R2 / all sections (Verified, from merge; supersedes ADV-2's R2 half)

**Finding.** R2 asks for >= 7 signature Three.js/GLSL scenes at 60 fps. With GL available and each
section scrolled to centre for 1.6 s, canvases mount for **#hero, #about and #experience only**, and
each unmounts as the section leaves view, so the page-wide canvas total is 1 at any moment:
hero → `{hero:1}`, about → `{about:1}`, experience → `{experience:1}`, skills → all 0, vitrine → all
0, listen → all 0 (`merge-probe2.json.glForceWalk`, build `3dae601a`). #skills, #vitrine and #listen
carry SVG/CSS signatures instead (1, 6 and 1 `<svg>` respectively), which the motion lens graded as
real beats — so §0.3 mandate 1 is met per section, but R2's GL count is **3 of 7**. Frame rate on
hardware remains unproven: the only fps sample this run was taken with `?gl=force` overriding the
software-rasteriser decline on a GPU-less VPS and read median 116.7 ms / p95 150 ms (~8.6 fps)
(`merge-probe2.json.fpsHero`) — a measurement of the forced-software path, not of a real GPU, and a
reason not to point `?gl=force` at visitors.

**Direction.** Build the remaining scenes on the board's own plan — `t_cbff57b0` (#skills bench
field), `t_60d9cd7a` (#vitrine and #listen fields), `t_dc096608` (MiniVic viseme stage as the seventh)
— each mounting through `components/gl/Scene.tsx` so capability detection and the reduced-motion gate
stay in one place, and each with the static counterpart item 7 specifies. Keep the
one-canvas-at-a-time unmount behaviour; it is correct for a 4-core mobile budget, so state it in the
R2 evidence rather than counting simultaneous canvases. Prove 60 fps on GPU hardware only
(`t_7e0f060c`), never with `?gl=force` on a software rasteriser.

**Files.** `components/sections/Skills/`, `components/sections/Vitrine/`,
`components/sections/Listen/`, `components/MiniVicBot.tsx`, `components/gl/Scene.tsx`,
`docs/delivery/evidence/<run>/`

**Acceptance.** With a hardware GPU (or a spoofed hardware renderer string) at 1440×900, scrolling
each of the six sections to centre mounts a `<canvas>` in that section for at least seven distinct
scenes across the page; each holds median rAF delta <= 16.7 ms at 1440 and <= 20 ms at 390 over a 3 s
sample on GPU hardware; under `reducedMotion: 'reduce'` every section reports 0 canvases.

### 7. MOT-C13-04 — MAJOR — #hero, #experience (Verified, from motion + adversarial)

**Finding.** The two sections whose flagship is a shader have no still of that light when the shader
is absent — the fallback path, every reduced-motion reader, and every software-rasteriser machine.
At 1440×900 with no `?gl=force`, #hero and #experience both report `fallbackEls: 0`,
`background-color: rgba(0, 0, 0, 0)`, `background-image: none`
(`motion-probe.json → phases.p4.perSection`), re-confirmed on the current build:
`getComputedStyle('.chartScene').backgroundImage === 'none'`
(`merge-probe2.json.experienceGL.sceneSlotBg`). `Scene.tsx:94` renders an empty slot div and
`Scene.tsx:36-37` states the intent ("the slot keeps its own CSS treatment") but no CSS treatment
exists on either slot. Captures `capture/1440-hero.png`, `capture/1440-experience.png`. This is R-c8
MOT-F-3 still open, widened to #experience.

**Direction.** Give each slot a static gradient that is the shader's own first frame — the same
light, not a substitute idea. (1) #hero scene slot in `Hero.module.css`:
`background: radial-gradient(120% 80% at 50% 18%, color-mix(in oklab, var(--white) 7%, transparent)
0%, transparent 62%), linear-gradient(180deg, color-mix(in oklab, var(--white) 3%, transparent) 0%,
transparent 45%)`. (2) `#experience .chartScene` (`Experience.module.css:73`):
`background: repeating-linear-gradient(178deg, color-mix(in oklab, var(--white) 4%, transparent) 0
1px, transparent 1px 14px)` with `mask-image: linear-gradient(180deg, #000 0%, transparent 88%)`, so
the field reads as sedimentary layers behind the bars as the shader does. (3) Tokens only, no raw
hex, so the palette gate and `TC-NFR-DEADCSS` stay green; both are unconditional CSS, so they are
correct under reduced motion, under no-GL, and behind the canvas when it does mount (the canvas is
`position: absolute; inset: 0`, `GLCanvas.tsx:25`).

**Files.** `components/sections/Hero/Hero.module.css`,
`components/sections/Experience/Experience.module.css:73`,
`components/sections/Hero/atmosphere.glsl.ts`,
`components/sections/Experience/strata.glsl.ts`, `components/gl/Scene.tsx:94`

**Acceptance.** At 1440×900 with `getContext` stubbed null, `getComputedStyle` of the hero scene slot
and of `.chartScene` each returns a `background-image` that is not `'none'`; the `1440-nogl-hero`
visual baseline differs from a flat fill; the monochrome gate and `TC-NFR-DEADCSS` still pass; both
values resolve through tokens with no raw hex outside `app/globals.css` and `lib/palette.ts`.

### 8. CC-03a — MAJOR — global chrome (MiniVic launcher) (Verified, from composition, re-confirmed by merge)

**Finding.** The launcher neither reads as a chat affordance nor shows anything at all. At 1440 it is
64×64 at (1352, 812) with `aria-label="Open Mini Vic assistant"`, `innerText` empty, `svgCount 0`,
`imgCount 0`, and its only content is
`<video class="pointer-events-none h-full w-full object-cover" autoplay loop muted playsinline
preload="none">` with **no `src`, no `<source>` child, no `poster`**, `currentSrc: ""`,
`readyState: 0` (`merge-probe.json.minivicClosed`, verbatim `html` field; source
`components/MiniVicBot.tsx:1595,1621`). It paints nothing: a 2 px ring around emptiness. R-c8's C-04
("empty ring, reads as a loading spinner") is not closed — a source-less video replaced the emptiness
with different emptiness. §0.3 mandate 5 and R3 make this control the employer/client channel; it
advertises nothing. *(The panel behind it is fine — see Contradictions §2.)*

**Direction.** (a) Read as chat: give the button a permanent 24×24 mark in `var(--white)` — an inline
`<svg>` speech-mark or a "VIC" monogram at `var(--fs-micro)`, `letter-spacing: 0.12em` — rendered
UNDER the video so it is the resting state and the avatar is the enhancement; add a `title` and a
one-line label plate on hover/focus (`var(--ink-800)` ground, `var(--white)` ink,
`var(--fs-caption)`, `padding: var(--space-05) var(--space-1)`, offset 12 px left of the ring).
(b) Never ship a source-less video: render `<video>` only when a resolved source exists, and give it
`poster={avatarPoster}` so first paint is the face; keep `preload="none"` on the clip only.

**Files.** `components/MiniVicBot.tsx:1595-1626`, `app/data/portfolio/avatar.ts`, `tests/e2e/`

**Acceptance.** At 1440×900 and 390×844 against the live URL:
`[data-testid="minivic-toggle"]` contains at least one `svg` OR non-empty `innerText`; every `video`
inside it has a non-empty `currentSrc` OR a `poster`; the toggle is visible; after `click()`,
`[data-testid="minivic-panel"]` is attached and visible within 1500 ms; Escape returns focus to the
toggle. Add as `tests/e2e/minivic-affordance.spec.ts`.

### 9. ADV-3 — MAJOR — global chrome (MiniVic launcher) (Verified, from adversarial)

**Finding.** Repeat of R-c8 ADV-F-2, not fixed. The MiniVic launcher is tab stop **83 of 83** — dead
last. A keyboard user traverses the entire page, including all of #listen and the footer, before
reaching the chatbot the brief names as the employer/client channel
(`adversarial-report.json.pass1_keyboard`: `totalStops 83`, `minivicTabStop 83`,
`minivicName "Open Mini Vic assistant"`). R-c8 specified an "Ask Mini Vic" skip-link inside the first
3 stops; the first three stops are still 1 "Skip to the evidence", 2 "Back to top", 3 "Download CV".
Only the naming half is closed — the launcher now has an accessible name.

**Direction.** As R-c8 specified: add a second visually-hidden-until-focused anchor beside "Skip to
the evidence" in `components/site/Navigation.tsx` reading "Ask Mini Vic", whose handler focuses
`toggleRef.current` in `components/MiniVicBot.tsx` and calls `setIsOpen(true)`; reuse the existing
skip-link focus rule.

**Files.** `components/site/Navigation.tsx`, `components/MiniVicBot.tsx:1595`, `tests/a11y/`

**Acceptance.** Tab from the top at 1440×900: within the first 3 tab stops one focused element
exposes the accessible name "Ask Mini Vic"; pressing Enter leaves `document.activeElement` with
`data-testid="minivic-toggle"` and the panel open.

### 10. ADV-4 / CC-04 — MAJOR — #hero / nav (Verified, from adversarial + composition)

**Finding.** Repeat of R-c8 C-07, not fixed, and both lenses measured it independently. At 1440×900
with `scrollY === 0` two identical "Download CV" controls sit in one viewport — the nav pill at
x=1140.5, y=28, 132.1×39 with a 1 px `rgb(246,246,246)` border, and the hero outline button at
x=296.6, y=755.6, 155.8×48 with a 1 px `rgba(255,255,255,0.09)` border — both
`href="/docs/Vik_Resume_Final.pdf"` (`composition-report.json.widths.1440.nav.ctas`;
`adversarial-report.json.pass1_keyboard` tab stops 3 and 7 both carry the accessible name "Download
CV"; `capture/1440x900-hero.png`, `capture/comp-1440x900-minivic-open.png`). A **third** anchor with
the same text and href occupies x=445.9, y=6, 548.1×96, overlapping the nav band — a 548×96 hit area
across the chrome that should not be in the hit-test or accessibility tree while the desktop nav
shows. Duplicate primary actions in one frame halve each other's weight and degrade the keyboard and
screen-reader path.

**Direction.** Keep exactly one per viewport band. The nav pill is the persistent recruiter action
(`Navigation.tsx:154-157`) — keep it, or demote it to plain text until `[data-scrolled]`. Then change
the hero's copy from a bordered button to the section's text-link treatment (drop the border, keep
`var(--mist-200)` at `var(--fs-small)` with the `::after` underline `.channel` uses), OR relabel it
to something the nav does not offer. Remove the third phantom anchor at (445.9, 6, 548×96).

**Files.** `components/site/Navigation.tsx:26,154-157`, `components/sections/Hero/Hero.tsx`,
`components/sections/Hero/Hero.module.css`, `app/globals.css`, `tests/overhaul/`

**Acceptance.** At 390/834/1280/1440/1920 with `scrollY === 0`: the count of elements matching
`a[href="/docs/Vik_Resume_Final.pdf"]` whose rect intersects the viewport AND whose computed
`visibility !== 'hidden'` is exactly 1. Add as `tests/overhaul/cta-duplication.spec.ts`.

### 11. CC-05 — MAJOR — #listen (Verified, from composition, re-confirmed by merge)

**Finding.** The page's business end is its quietest type. Every contact line is `font-size: 14px`,
IBM Plex Mono, `color: rgb(205, 205, 205)` (`--mist-200`), `padding: 0`, `border-width: 0`, box
height 21 px (`merge-probe.json.listen`) — while the section's own pull-quote above it is set at
54.4 px (line-height 73.44 px) in `rgb(246,246,246)`. That is a **3.9×** type ratio pointing the wrong
way: the sentence a visitor does not need is nearly four times the size of the address they came for,
and a 21 px box is under half the 44 px minimum hit target. The section does span the column now
(rightmost content 1344 = the 1248 px column's right edge), so R-c8's C-09 "right half empty" is
fixed; the hierarchy inside it is what remains inverted. Distinct from CC-02: that adds the missing
client action, this is the weight of the four channels that already exist.

**Direction.** `Listen.module.css` `.channel` (line 206, `font-size` at :210): raise `font-size` to
`var(--fs-body)` (16 px) and `color` to `var(--white)`; keep IBM Plex Mono — the monospace is right
for an address, the greyness is not. Give each channel a 44 px minimum hit box via
`padding-block: var(--space-1)`. Reduce the pull-quote from `--fs-h2` to `var(--fs-h3)` (~23 px at
1440) so the quote:address ratio is about 1.4× rather than 3.9×. Keep the `::after` underline reveal
(`:223`, `:243`) as the hover state.

**Files.** `components/sections/Listen/Listen.module.css:63,203,206-260`

**Acceptance.** At 1440 and 390: every `#listen .channel` has computed `font-size >= 16px`,
`color: rgb(246, 246, 246)`, and `getBoundingClientRect().height >= 44`; the #listen quote's computed
`font-size` divided by a channel's is <= 1.6.

### 12. CC-06 — MAJOR — #skills, #hero, #experience, #about (Verified, from composition)

**Finding.** Five running-text blocks blow past the 55–75ch measure, the widest by more than double.
Measured by rendering each `<p>`'s own computed font into a canvas and dividing its box by the "0"
advance (`composition-report.json.widths.1440.measures`): #skills "Calibrated against
public/docs/Vik_Resume_Fina…" = **173ch** (1246 px box at 12 px); #hero "Open to delivery-leadership
and AI engagements…" = 124ch (1248 px at 16 px); #experience's three metric rows (≈92%, −38%, 10k+) =
124ch each; #skills "20 links / 13 sources / 17 capabilities…" = 124ch; #about "Dimensions taken
verbatim…" = 105ch and the four provenance captions = 99ch. The site already owns the correct token —
`--measure-read: clamp(58ch, 64ch + 0.4vw, 72ch)` — and every paragraph that uses it lands on 65ch
exactly; these blocks simply inherit the full 1248 px column. A 173ch line at 12 px is one a reader
loses their place in on the return sweep, and it is the line carrying the calibration provenance —
the most load-bearing sentence in #skills.

**Direction.** Apply `max-width: var(--measure-read)` to the offenders rather than inventing new
widths: `Skills.module.css` — the provenance/footnote rule and the "20 links" summary rule;
`Experience.module.css` — the metric row caption element; `Hero.module.css` — the availability line;
`About.module.css` — the caption rules. Where a line is deliberately a full-width rule of small caps,
the fix is `letter-spacing: 0.04em` plus `max-width: var(--measure-read)` and left alignment on the
spine — never a 124ch paragraph. At 12 px, `--measure-read` resolves to a shorter pixel width
automatically because `ch` tracks the font.

**Files.** `components/sections/Skills/Skills.module.css`,
`components/sections/Experience/Experience.module.css`,
`components/sections/Hero/Hero.module.css`, `components/sections/About/About.module.css`

**Acceptance.** At 1440 and 1920, every `p` inside `#hero,#about,#experience,#skills,#vitrine,#listen`
whose `textContent.trim().length > 60` measures <= 78ch by the canvas method (the `--measure-read`
ceiling of 72ch plus 6ch tolerance). Add as `tests/overhaul/measure.spec.ts`.

### 13. CC-07 — MAJOR — global chrome (MiniVic launcher pip) (Verified, from composition, re-confirmed by merge)

**Finding.** The monochrome doctrine is breached in a colour space the gate cannot see. The
launcher's two pip spans compute to `background: oklch(0.705 0.015 286.067)` (zinc-400) and
`oklch(0.552 0.016 285.938)` (zinc-500). Chroma 0.015/0.016 at hue ~286° is a blue-violet, not a
neutral: R=G=B fails and it is not `--gold`. Source and live DOM both still carry the classes:
`components/MiniVicBot.tsx:1625-1626` `bg-zinc-400` / `bg-zinc-500`, echoed verbatim in
`merge-probe.json.minivicClosed.html`. This is the same defect R-c8 logged inside C-04, surviving a
Tailwind colour-space change. The instrument gap matters as much as the defect: composition's own
`rgb()`-based scan returned ZERO chromatic elements — a false negative the next audit must not
inherit, because the monochrome gate in `scripts/validate/overhaul_static_audit.mjs` parses `rgb()`
only.

**Direction.** Replace `bg-zinc-400` / `bg-zinc-500` on the two pip spans with the site's own tokens:
outer ping background `var(--mist-400)` at opacity 0.75, inner dot background `var(--mist-200)`. Both
are R=G=B by construction. Do not substitute another Tailwind neutral — zinc, slate, stone and
neutral all carry chroma in Tailwind v4's oklch ramp; only `--mist-*` / `--ink-*` are provably
achromatic here. Then extend the audit's colour parser to `oklch(L C H)` and fail on `C > 0.005`
unless the resolved colour is a `--gold-*` token.

**Files.** `components/MiniVicBot.tsx:1625-1626`, `app/globals.css`,
`scripts/validate/overhaul_static_audit.mjs`, `tests/monochrome/`

**Acceptance.** For every element under `[data-testid="minivic-toggle"]`, every computed
`color` / `background-color` / `border-color` / `fill` / `stroke` parsed via `oklch()`, `oklab()` AND
`rgb()` is either achromatic (C <= 0.005, or R=G=B) or exactly a `--gold-*` value. Extend the existing
spec under `tests/monochrome/`.

### 14. MOT-C13-03 — MAJOR — #vitrine (Verified, from motion)

**Finding.** The trace-on is real but not legible as a trace. Measured transition-delay between
consecutive strokes is **6.67 ms** (`motion-probe2.json → p1440.entry.vitrine.after1600ms.strokes[1]
.transDelay = "0.00666667s"`) while each stroke takes 720 ms, so a 25-stroke drawing finishes its
entire stagger in ~160 ms. The plate reads as one mechanism fading up, not as a mechanism being
drawn. Cause: the budget formula at `Drawings.module.css:52-56`,
`min(40ms, 160ms / max(1, var(--n) - 1))`, introduced to satisfy R-c8 C-02's 900 ms landing budget —
which it meets, at the cost of the gesture it was protecting. "Six of thirty-eight" wants each plate
to draw itself as it takes the light.

**Direction.** Keep the 900 ms landing budget but spend it on sequence rather than stroke duration.
(1) Stroke `transition-duration: 320ms` (`--motion-base`); stagger
`min(28ms, 520ms / max(1, var(--n) - 1))`. Twenty-five strokes then run 520 ms of stagger + 320 ms of
draw = 840 ms, inside C-02, with consecutive strokes 28 ms apart — above the ~24 ms threshold at which
a sequence stops reading as one event. (2) Keep `cubic-bezier(0.16,1,0.3,1)`; move the `.label` fade
delay from 880 ms to 860 ms so it still lands after the last stroke. (3) Leave the reduced-motion
block (`Drawings.module.css:78-93`) untouched — it is correct.

**Files.** `components/sections/Vitrine/Drawings.module.css:52-56,70-76`,
`components/sections/Vitrine/Drawings.tsx:360-361`

**Acceptance.** At 1440×900 after #vitrine enters, the computed `transition-delay` of the last
`.stroke` in a 25-stroke plate is >= 480 ms and <= 560 ms, its `transition-duration` is `0.32s`, and
the difference between consecutive strokes' delays is >= 20 ms. Total time from `data-lit` to last
stroke at `stroke-dashoffset: 0px` <= 900 ms.

### 15. CC-08 — MINOR — #vitrine (Verified, from composition)

**Finding.** The rail scrolls 3192 px inside a 1440 px window — 1752 px, 55% of the content, is
off-screen — and the only affordance is the 64 px right-edge mask fade.
`composition-report.json.sections.vitrine.thumb = 0`: no thumb, no track, no counter, no arrow. The
heading promises "Six of thirty-eight"; at rest a reader sees two cards and a sliver, with nothing
telling them the other four exist or that the region scrolls horizontally. The R-c8 C-02 direction
specified this thumb; the mask and the spine shipped, the thumb did not.

**Direction.** Add the unbuilt rail thumb: a 2 px track in `var(--ink-500)` spanning the column
(96 px to 1344 px at 1440), thumb height 2 px, `background: var(--mist-400)`, `border-radius: 1px`,
`width: calc(clientWidth / scrollWidth * 100%)`, translated by `scrollLeft / scrollWidth`, sitting
`var(--space-2)` below the cards on the same spine. Pair it with an "01 / 06" counter at
`var(--fs-micro)` in `var(--mist-400)` at the track's right end. Reduced motion: position updates
without transition. No gold.

**Files.** `components/sections/Vitrine/Vitrine.module.css:56,307+`,
`components/sections/Vitrine/Vitrine.tsx`

**Acceptance.** At 1440 and 1920, #vitrine contains an element whose computed width is <
`rail.clientWidth` and whose left offset changes after `rail.scrollBy(600)`; its track's left edge
equals the #vitrine heading's left edge within 1 px.

### 16. CC-09 — MINOR — page (vertical rhythm) (Verified, from composition)

**Finding.** Section padding is not on one scale, and the page closes tighter than it opens. At 1440:
#hero `padding-bottom: 90px` meets #about `padding-top: 108px`; the four middle sections are a
symmetric 108/108; #listen is 126 top / 45 bottom. At 1920 the same asymmetry is 151.2/48; at 390 it
is 118.16/42.2. The last section ends at roughly a third of the gap every other section opens with,
so the page stops rather than closes — the weakest possible last impression on the section carrying
the contact details.

**Direction.** `Listen.module.css:15` sets `padding: clamp(6rem,14vh,--space-20) <gutter> <smaller>`.
Make the block padding symmetric with the rest of the page by using the same
`clamp(var(--space-10), 12vh, 9rem)` block value the four middle sections use, so 1440 resolves to
108/108 and the closing gap matches the opening one. If the tight bottom exists to keep the footer
close, move that intent into the footer's own top margin rather than #listen's bottom padding.
Likewise give #hero `padding-bottom: clamp(var(--space-10),12vh,9rem)` so the hero→about seam is
108→108 rather than 90→108.

**Files.** `components/sections/Listen/Listen.module.css:15`,
`components/sections/Hero/Hero.module.css:19-21`

**Acceptance.** At 390/834/1280/1440/1920, for each of the six sections
`abs(padding-top - padding-bottom) <= 2px`, and the six `padding-top` values fall in at most two
distinct buckets <= 2 px wide.

### 17. ADV-5 — MINOR — /api/chat (Verified, from adversarial)

**Finding.** The public chat endpoint returns its routing internals to any unauthenticated caller:
`{"provider":"openai","model":"gpt-4.1-mini"}` (`api-chat-body.txt`). Two problems. Operationally it
is unnecessary vendor disclosure. Contractually, §0.4 / C-3 route the agent brain to OpenRouter with
failover to Anthropic via OAuth — a live response naming `openai` / `gpt-4.1-mini` is evidence the
deployed function is on neither. Response time 6.40 s also misses R3's "perceived real-time (<~1.5 s
first word)" bar; the endpoint is not streamed. (The answer itself is well grounded: every figure
maps to `cv-text.txt` — $5M+ l.64/75, up to 40 practitioners l.76, P95 <200 ms l.62, >30%/>15%
l.72-73, 40+ execs / >55% l.84-85.)

**Direction.** Drop the `provider` and `model` keys from the client payload (keep them in the
function's server log). Confirm the deployed function's routing against §0.4 and record the decision
in evidence. Stream the response (SSE or chunked) so the first word lands under 1.5 s.

**Files.** `services/`, `components/MiniVicBot.tsx`, `firebase.json`

**Acceptance.** `POST /api/chat` body contains no `provider` or `model` key; time to first byte of
answer text < 1.5 s; the routing recorded in evidence matches §0.4.

### 18. MOT-C13-05 — MINOR — #about (Inferred, from motion)

**Finding.** The compass sweep itself is correct (1160 ms, emphasized, `data-sweep` set once, measured
"finished" after 1600 ms — `Compass.module.css:39-51`). But at the one point sampled — pointer moved
to 50% width / 22% height of the 384×384 dial and held 600 ms — the section text did not change:
`motion-probe2.json → p1440.compassHover.changed = false`, with pre and post identical across 220
characters. The dial exposes `#compass-open` and `#compass-hub`, so the readout may require a pointer
inside a sector rather than over the bezel, and R-c8 MOT-F-2 was reported worked. Tagged **Inferred**:
one sample point is not a proof of absence.

**Direction.** Verify with a hover over each of the ten sector centroids and over `#compass-hub`. If
any sector fails to update the readout, bind the readout to `pointerenter` on the sector `path`
element rather than to a hit area the bezel overlays. Regardless of outcome, add the regression test —
this exact state has now been reported twice.

**Files.** `components/sections/About/Compass.tsx`, `components/sections/About/About.tsx`,
`tests/e2e/`

**Acceptance.** A Playwright spec that, for all ten sectors, hovers the sector centroid and asserts
`#about` innerText changes and names that dimension; and that the same ten are reachable by keyboard
with ArrowRight/ArrowLeft from `#compass-open`.

### 19. CC-10 — POLISH — #skills (Verified, from composition; doctrine half corrected)

**Finding.** #skills carries 29 gold-painted elements — more than every other section combined
(#vitrine has 3 live repository URLs; #hero, #about, #experience, #listen have 0). The 29 are 14
`Bench_mark` dots (6.7×6.7 px, `rgb(201,168,76)`, all at x=1088), 14 `Skills_statusGlyph` bullets
(10.5×18 px, all at x=1159.6), and 1 legend glyph. Total area is small — 3539 px² in a 1440×3086.5
section, 0.08%, so R-c8's C-08 gold mass **is** closed. What is wrong is the shape: two parallel gold
columns 71 px apart in one table ask the reader to learn two marks in a section headed "Calibration
card". *Composition's stronger claim — that the production glyph smuggles in a second meaning — is
rejected: CLAUDE.md prime directive 4 enumerates the "measured in production" mark as a licensed gold
surface alongside caliper jaws and live repository URLs, so adversarial's "all licensed" hold stands
on doctrine.*

**Direction.** Collapse the two parallel gold columns into one. Keep the licensed mark that carries
the most meaning per row — the caliper/source mark — in `var(--gold)`, and render the second column's
glyph in `var(--mist-200)` so the row reads as one gold mark plus neutral chrome. Do not remove the
production mark; it is licensed. Do not introduce a third gold surface.

**Files.** `components/sections/Skills/Skills.tsx:114-118,195`,
`components/sections/Skills/Skills.module.css:103-109,286-306`

**Acceptance.** #skills contains at most one vertical run of gold-painted elements sharing an x within
2 px; the total count of gold-painted elements in #skills is <= 16; every gold element in #skills sits
in a row whose caliper state is `sourced` or whose status is `production`.

### 20. ADV-6 — POLISH — #hero / #experience / #about copy (Verified, from adversarial)

**Finding.** Repeat of R-c8 ADV-F-4, not fixed. Site headline tenure still runs one year above the
CV's own headline: the page says "Sixteen years" (`app/data/portfolio/hero.ts:29`,
`experience.ts:106`, `about.ts:50`) while `public/docs/Vik_Resume_Final.pdf` line 3 says "15+ year
Senior Technical Leader" (`cv-text.txt` line 3, `pdftotext -layout`). Under the prime directive
"never grade a claim higher than its evidence", the page should not out-round its own source.

**Direction.** Either set the copy to "Fifteen years" / "15+ years", or print the derivation
(2010 → 2026) beside the claim so a reader can check the arithmetic. One decision applied to all three
data files.

**Files.** `app/data/portfolio/hero.ts:29`, `app/data/portfolio/experience.ts:106`,
`app/data/portfolio/about.ts:50`, `tests/content/content-check.spec.ts`

**Acceptance.** A content test asserts the tenure string rendered on the page is either present
verbatim in `cv-text.txt` or accompanied by its two anchor years within the same element.

### 21. MOT-C13-06 — POLISH — #vitrine (Verified, from motion)

**Finding.** The plate rail is a real horizontal carousel at 390 — `scrollWidth 2140`,
`clientWidth 390`, `overflow-x: auto`, `scroll-snap-type: x mandatory`
(`Vitrine.module.css:73`) — but `scroll-behavior` is `auto` in the no-preference path; the only
declaration in the module is `Vitrine.module.css:481-482`, inside the reduced-motion block
(`motion-probe2.json → p390.vitrineScroll`). Programmatic plate-to-plate moves therefore jump rather
than travel, which breaks the "one light raking across a cabinet" idea the section is built on
(`Vitrine.tsx:27`).

**Direction.** Set `scroll-behavior: smooth` on the rail in `Vitrine.module.css:56`, guarded by
`@media (prefers-reduced-motion: no-preference)`; the existing reduced-motion block at
`Vitrine.module.css:481-482` keeps `auto`. Snap alignment and the `data-lit` centre computation
(`Vitrine.tsx:50-60`) are already correct and need no change.

**Files.** `components/sections/Vitrine/Vitrine.module.css:56,481-482`,
`components/sections/Vitrine/Vitrine.tsx:50-60`

**Acceptance.** At 390×844 the rail's computed `scroll-behavior` is `smooth` under no-preference and
`auto` under reduce; `scroll-snap-type` remains `x mandatory`.

### 22. MOT-C13-07 — POLISH — #hero (Verified, from motion)

**Finding.** `HeroAtmosphere.tsx:51-76,82,88-92` carries a full `prefers-reduced-motion`
implementation — media-query listener, scroll listener, `uTime` forced to 0, pointer targets zeroed —
none of which can ever run, because `Scene.tsx:91` requires `allowMotion` before `GLCanvas` mounts at
all, so the component does not exist under reduced motion. Confirmed by the reduced-motion audit
(canvases: 0 in every section). It is dead defence-in-depth that reads as a second, competing
reduced-motion policy.

**Direction.** Not urgent and not wrong, but either delete the block and let `Scene.tsx:91` be the
single policy, or keep it and say so in one line at `HeroAtmosphere.tsx:20` ("belt-and-braces; Scene
already gates this"). Do not leave two policies with no note.

**Files.** `components/sections/Hero/HeroAtmosphere.tsx:20,51-76,88-92`,
`components/gl/Scene.tsx:91`

**Acceptance.** Either the block is gone and reduced motion still reports zero canvases and zero
running animations across all six sections, or the comment at `HeroAtmosphere.tsx:20` states the
redundancy explicitly.

## Keep (verified clean — do not touch)

- **The GPU-path crash is closed** (merge, Verified on `f103462f` and `3dae601a`): default path with a
  spoofed hardware renderer and `/?gl=force` both render 6 sections, h1 `Vikram Deshpande`,
  `errorBoundary false`, 0 console errors, 0 pageerrors, 1 canvas in #hero
  (`merge-probe.json`, `merge-probe2.json`, `capture/merge-1440-hardware-gpu.png`). Do not revert
  `feb12ef` without landing item 3 first.
- **The MiniVic panel** (motion + merge, Verified): opens on click with `role="dialog"` and
  `data-testid="minivic-panel"` (`MiniVicBot.tsx:1248-1249`), +133 DOM nodes, a 200×100 viseme canvas
  whose pixels change across 0/900/1800 ms samples, `/assets/my-avatar.mp4` playing, and the panel
  labels itself SYNTHETIC VOICE — NOT A RECORDING OF VIKRAM. Its R-c8 acceptance lines are met.
- **Reduced motion** (adversarial + motion, Verified): 0 running animations after 2200–3000 ms at 1440
  and 390, 0 canvases in every section, both `<video>` paused with empty `currentSrc`, `#hero h1`
  opacity 1 / transform none. R-c8 ADV-F-1 is closed, and the launcher pip now carries
  `motion-reduce:animate-none`.
- **axe-core** wcag2a + wcag2aa + wcag21a + wcag21aa: 0 violations at 1440, 1920, 834 and 390.
- **Security headers**: CSP with `frame-ancestors 'none'`, X-Frame-Options DENY, HSTS
  `max-age=31556926; includeSubDomains; preload`, Referrer-Policy strict-origin-when-cross-origin,
  X-Content-Type-Options nosniff, Permissions-Policy (`headers-root.txt`).
- **Asset budget**: 29 requests / 542 kB total at 1440; largest transfer 156 kB
  (`my-hero-avatar.mp4`); zero assets over 500 kB.
- **Six sections present and in order** with correct headings at 1440/1920/1280/834/390, on the
  fallback path and on the GL path.
- **LCP / CLS**: 1440 LCP 668 ms, CLS 0.000; 390 LCP 320 ms, CLS 0.000; LCP element `H1#hero-name`.
- **No horizontal overflow**: `scrollWidth === innerWidth` at 1440, 1920, 834, 390 and 1280
  (`merge-probe2.json.cap1280`).
- **Focus visibility**: 0 of 83 tab stops lack both an outline and a box-shadow.
- **/api/chat** 200 with a CV-grounded answer; **/api/tts** 200 `audio/mpeg`, 13000 bytes (5
  characters spent — the single allowance).
- **CT-10 / hero provenance**: all three hero figures trace to the CV, all three calipers are
  `self-reported`, and #hero carries zero gold.
- **Gold discipline**: 30–35 gold elements site-wide, all on licensed surfaces (#skills production
  marks, #vitrine live repository URLs); zero gold in #hero, #about, #experience, #listen. R-c8 C-08
  is closed (3539 px², 0.08% of the section).
- **R-c8 items closed and re-verified**: C-01 (one content spine — heading left edge identical at
  every width: 96/336/41.7/24 px), C-02 (rail on the spine, mask present, card 01 lit at rest, unlit
  0.62), C-03 (year labels inside the card at 1440 and 834), C-06 (hero at 390 does not reproduce),
  ADV-F-1, MOT-F-2, C-05.
- **Motion vocabulary**: 200/320/440/720/900/1160 ms on `cubic-bezier(0.16,1,0.3,1)` and
  `cubic-bezier(0.22,1,0.36,1)`; #hero rise 900 ms / 90 ms stagger, #about sweep 1160 ms once,
  #skills bench trace 900 ms / 38 ms across 20 wires, #listen caliper 1160 ms + 720 ms rule. Do not
  add second beats to these four.

## Not tested this run (Assumed / out of scope)

- **60 fps on GPU hardware.** The only fps sample was `?gl=force` on a GPU-less VPS (median rAF delta
  116.7 ms, p95 150 ms — the forced-software path, not hardware). R2's frame-rate bar is unproven;
  `t_7e0f060c` owns it.
- **axe, headers, asset budgets, LCP/CLS were not re-run after the hotfix** — they were measured on
  `d59621de`/`15fb165b` and are carried forward as Assumed on `3dae601a`.
- **1920 / 834 / 390 were not re-captured post-hotfix**; the GL path was walked at 1440 only.
- **Whether GL scenes mount at 390** (mobile hardware) — not measured.
- **The specific advisories cycle 13's `next 15.5.25` upgrade addressed** were not enumerated, so
  item 3's security half is Inferred.
- **MiniVic answer quality** beyond the two questions the lenses asked.
- **Keyboard traversal of the ten compass sectors** (item 18 is one sample point).

## Next cycle (single <= 10-minute increment)

**Item 1 (CC-02), the one live blocker.** Add a single engagement action to
`app/data/portfolio/listen.ts` + `components/sections/Listen/Listen.tsx:184-196` — filled
`var(--white)` plate, `var(--ink-900)` ink, `padding: var(--space-2) var(--space-4)`, min-height
48 px, first child of `.channels`, on the 96 px spine, labelled for the client and pointing at a
destination that can be completed — then one Playwright assertion that #listen has exactly one
element with a non-transparent background, height >= 48, left edge equal to the heading's, saved as
`tests/content/client-cta.spec.ts`. One data edit, one component edit, one CSS rule, one spec: clears
the only blocker and closes the client half of R4, which no other backlog item touches.

## Sources

- **merge (this file):** `merge-probe.mjs`, `merge-probe.json`, `merge-probe2.mjs`,
  `merge-probe2.json`, `capture/merge-1440-hardware-gpu.png`,
  `capture/merge-1440-minivic-open.png`, `capture/merge-1280x800-hero.png`,
  `capture/merge-1280x800-listen.png`; `git log`/`git show` on `feb12ef`, `5c0e01d`, `f103462f`,
  `3dae601a`; read-only source at `/root/forgotten-mistory`.
- **adversarial:** `adversarial-review.md`, `adversarial-report.json`,
  `adversarial-report-pass2.json`, `adversarial-report-pass3-gpu.json`, `adv.mjs`, `adv2.mjs`,
  `adv3-gpu.mjs`, `adv4-recheck.mjs`, `headers-root.txt`, `api-chat-body.txt`, `api-tts-status.txt`,
  `cv-text.txt`, `recheck-15fb165b.txt`, `capture/1440x900-*`, `capture/1920x1080-hero.png`,
  `capture/834x1194-hero.png`, `capture/390x844-*`.
- **composition:** `council-composition.md`, `composition-report.json`, `composition-triage.json`,
  `comp.mjs`, `comp-triage.mjs`, `capture/comp-*`.
- **motion:** `council-motion.md`, `motion-probe.mjs`, `motion-probe.json`, `motion-probe2.mjs`,
  `motion-probe2.json`, `capture/1440-*`, `capture/390-*`.
- **doctrine:** `/root/forgotten-mistory/CLAUDE.md`, `docs/prompt.md` §0.3 / §0.4 / §2 / §3 / §5 /
  §14, `docs/delivery/evidence/v10-20260905T0515Z/SPEC-v10.md`,
  `docs/delivery/evidence/v9-20260904T2312Z/R-c8/review.md`.
