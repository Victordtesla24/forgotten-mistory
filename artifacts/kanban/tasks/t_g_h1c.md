# t_g_h1c — CORRECTION — G-H1: the actions group sits INSIDE the fold at every viewport, the portrait control does not read as a second CTA, CLS < 0.05 on cold loads, ledger margin ≥ 40 px

**Status:** todo · **Priority:** 99 · **Parents:** — · **Created:** 2026-09-05T13:12:45.009Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ## CORRECTION: G-H1 reviewer FAIL on live 9b864752 (docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/08-adversarial-review.md — read it fully; captures/probeA-hero.json has the per-viewport numbers). Original output: 0506e7e split Hero.tsx into [data-testid=hero-fold] and [data-testid=hero-proof]. Failing criteria: (1) at 1440×900 and 1280×800 the actions group [data-testid=hero-actions] (See the evidence + Download CV) renders BELOW the first viewport — the fold's only CTA is the portrait toggle (the letter of 'one CTA group' met by the wrong group); (2) at 834×1194 and 390×844 the fold holds TWO CTA groups — hero-actions AND the 'Play the portrait' <button class=Hero_portraitToggle> inside [data-testid=hero-portrait]; (3) CLS 0.176 at 1280×720 in 2 of 3 cold loads (gate < 0.05), LCP element = IMG my_avatar.avif — the moved photograph reflows; (4) #hero ul clears the fold by 1 px at 834 (top 1195 vs 1194). Required fix: the fold is a layout the four viewports all satisfy with margin — name, statement, ONE actions group (both links) fully inside y < innerHeight − 40 px, photograph inside the fold at ≥ 1280; the portrait's play/pause affordance must not present as a CTA in the fold: either make the figure itself the control (focusable figure, role=button semantics via a single icon-only control that the reviewer's probe — buttons/links with an accessible name grouped by nearest data-testid ancestor — would still count… so prefer: pointer hover / keyboard focus on the figure toggles the loop, reduced-motion = still, and the explicit text control moves into the proof band next to the photograph's caption) — decide, record the decision, and keep TC-HERO-13/14/16/17 semantics (keyboard operability) by rewriting those tests deliberately; the ledger starts ≥ innerHeight + 40 px at every viewport; CLS < 0.05 on 3/3 cold loads at 1280×720, 1440×900, 390×844 (reserve the photograph's box with explicit aspect-ratio/width/height and make sure nothing below the LCP image shifts it — inspect PerformanceObserver layout-shift sources). Regenerate the stale hero visual baselines (TC-RENDER-07 hero-section.png 1280×742→782) deliberately and look at the PNG.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read the reviewer report + probeA-hero.json; Hero.tsx, Hero.module.css (.inner/.fold, .actions, .proof, portrait placement, ≤700px plates), HeroPortrait.tsx, tests/e2e/hero-fold.spec.ts, hero.spec.ts (TC-HERO-12/13/14/16/17/21), hero-photo.spec.ts, tests/perf/performance.spec.ts (CLS), tests/overhaul/render.spec.ts TC-RENDER-07.
- S-2 TDD: extend hero-fold.spec.ts with the reviewer's exact probe semantics — CTA groups in fold (buttons+links with accessible names grouped by nearest [data-testid] ancestor) === 1 and it is hero-actions; hero-actions bottom ≤ innerHeight − 40; #hero ul top ≥ innerHeight + 40; at all four viewports; add a cold-load CLS assertion (3 loads, each < 0.05) at 1280×720 + 1440×900 + 390×844 to tests/perf/performance.spec.ts. RED → 02-tests-failing.log.
- S-3 Implement layout + portrait-control decision + CLS reservation. No copy deleted; tokens only; plates preserved on /?gl=force at 390.
- S-4 PUSH RULE (RECTIFY): as soon as tsc + lint + build:static + audit 10/10 are green → ledger → commit → push. Then run hero-fold, hero, hero-photo, content-check (CT-10), flagship-visibility, text-contrast, performance, render specs (--workers=1) and regenerate the hero visual baselines (UPDATE_SNAPSHOTS=1 on the hero-section baseline only) → follow-up evidence commit → push.
- S-5 Screenshots 1440/1280/834/390 fold → 08-screens/ under G-H1/correction/.

## QUALITY GATES
- hero-fold.spec: exactly one CTA group in fold = hero-actions at 1440/1280/834/390; actions bottom ≤ innerHeight−40; ledger top ≥ innerHeight+40
- CLS < 0.05 on 3/3 cold loads at 1280×720, 1440×900, 390×844; LCP < 2.5 s
- CT-10 green; plates + phone scene intact on /?gl=force @390; AA 0 failures; hero visual baseline regenerated and inspected
- tsc, lint, audit 10/10; ledger; pushed

## VERIFICATION
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5616 npx playwright test tests/e2e/hero-fold.spec.ts tests/perf/performance.spec.ts tests/e2e/hero.spec.ts tests/e2e/hero-photo.spec.ts tests/content/content-check.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T13:12:45.102Z)
running — dispatched 13:12Z — fresh analyst-programmer (correction identity), isolated worktree from origin/main, port 5616, RECTIFY push rule

## COMMENT (2026-09-05T13:14:01.792Z)
NOTE 13:13Z (read before you push): the ORIGINAL hero lane finished its battery and pushed 44c3e08 'fix(hero): the fold is one column of type beside the photograph (G-H1)' + a merge of origin/main; it is on main as 6224a7f and live within minutes. It may already move the actions group into the fold — BUILD ON IT: run Updating d58c5c7..6224a7f
Fast-forward
 app/data/generated/build-stamp.ts                  |    6 +-
 components/sections/Hero/Hero.module.css           |   45 +-
 components/sections/Hero/Hero.tsx                  |   61 +-
 .../v10-20260905T0515Z/G-H1/04-tests-passing.log   |  224 +--
 .../v10-20260905T0515Z/G-H1/05-regression.log      |  124 ++
 .../v10-20260905T0515Z/G-H1/06-post-merge.log      |   34 +
 .../G-H1/08-screens/hero-fold-1280x800.png         |  Bin 0 -> 425236 bytes
 .../G-H1/08-screens/hero-fold-1440x900.png         |  Bin 0 -> 499390 bytes
 .../G-H1/08-screens/hero-fold-390x844.png          |  Bin 0 -> 192763 bytes
 .../G-H1/08-screens/hero-fold-834x1194.png         |  Bin 0 -> 339887 bytes
 .../G-H1/08-screens/hero-proof-1280x800.png        |  Bin 0 -> 320261 bytes
 .../G-H1/08-screens/hero-proof-1440x900.png        |  Bin 0 -> 457568 bytes
 .../G-H1/08-screens/hero-proof-390x844.png         |  Bin 0 -> 120015 bytes
 .../G-H1/08-screens/hero-proof-834x1194.png        |  Bin 0 -> 297760 bytes
 .../v10-20260905T0515Z/G-H3/05-regression.log      |   69 +
 .../G-H3/08-screens/page-top-1440.png              |  Bin 0 -> 488897 bytes
 .../v10-20260905T0515Z/G-H3/09-live-after.log      |   12 +
 .../G-REV/874f1ee9/08-adversarial-review.md        |  127 ++
 .../G-REV/874f1ee9/captures/api-chat-timings.csv   |    6 +
 .../G-REV/874f1ee9/captures/api-tts-headers.txt    |   24 +
 .../874f1ee9/captures/css-chroma-scan-874f1ee9.txt |   14 +
 .../874f1ee9/captures/greeting-text-compare.json   |   41 +
 .../874f1ee9/captures/live-headers-874f1ee9.txt    |   21 +
 .../G-REV/874f1ee9/captures/minivic-1440-muted.png |  Bin 0 -> 681251 bytes
 .../874f1ee9/captures/minivic-1440-unmuted.png     |  Bin 0 -> 684376 bytes
 .../G-REV/874f1ee9/captures/minivic-390-muted.png  |  Bin 0 -> 154618 bytes
 .../874f1ee9/captures/minivic-ttft-trials.png      |  Bin 0 -> 681194 bytes
 .../G-REV/874f1ee9/captures/mp3-ffprobe.txt        |   12 +
 .../G-REV/874f1ee9/captures/mp3-hash.txt           |    4 +
 .../G-REV/874f1ee9/captures/mp3-headers.txt        |   21 +
 .../G-REV/874f1ee9/captures/probe2-a.json          |   60 +
 .../G-REV/874f1ee9/captures/probe2-b.json          |   61 +
 .../G-REV/874f1ee9/captures/probe2-c.json          |   75 +
 .../G-REV/874f1ee9/captures/probe2-d.json          |  132 ++
 .../G-REV/874f1ee9/captures/probe2.mjs             |  156 ++
 .../captures/served-greeting-transcript.txt        |    1 +
 .../G-REV/874f1ee9/captures/served-js-scan.txt     |   47 +
 .../G-REV/9b864752/08-adversarial-review.md        |  210 +++
 .../G-REV/9b864752/captures/1280-normal-fold.png   |  Bin 0 -> 459623 bytes
 .../captures/1440-glforce-benchfield-t0.png        |  Bin 0 -> 379946 bytes
 .../captures/1440-glforce-benchfield-t1.png        |  Bin 0 -> 380794 bytes
 .../G-REV/9b864752/captures/1440-glforce-fold.png  |  Bin 0 -> 543022 bytes
 .../9b864752/captures/1440-glforce-long-skills.png |  Bin 0 -> 575560 bytes
 .../9b864752/captures/1440-glforce-skills.png      |  Bin 0 -> 405450 bytes
 .../9b864752/captures/1440-nogl-normal-skills.png  |  Bin 0 -> 230745 bytes
 .../9b864752/captures/1440-nogl-reduced-skills.png |  Bin 0 -> 230737 bytes
 .../captures/1440-normal-benchfield-t0.png         |  Bin 0 -> 158746 bytes
 .../captures/1440-normal-benchfield-t1.png         |  Bin 0 -> 158746 bytes
 .../G-REV/9b864752/captures/1440-normal-fold.png   |  Bin 0 -> 542724 bytes
 .../G-REV/9b864752/captures/1440-normal-skills.png |  Bin 0 -> 283341 bytes
 .../captures/1440-reduced-benchfield-t0.png        |  Bin 0 -> 158746 bytes
 .../captures/1440-reduced-benchfield-t1.png        |  Bin 0 -> 158746 bytes
 .../9b864752/captures/1440-reduced-skills.png      |  Bin 0 -> 283774 bytes
 .../captures/390-glforce-benchfield-t0.png         |  Bin 0 -> 22681 bytes
 .../captures/390-glforce-benchfield-t1.png         |  Bin 0 -> 33502 bytes
 .../G-REV/9b864752/captures/390-glforce-fold.png   |  Bin 0 -> 199432 bytes
 .../9b864752/captures/390-glforce-long-skills.png  |  Bin 0 -> 126261 bytes
 .../G-REV/9b864752/captures/390-glforce-skills.png |  Bin 0 -> 112482 bytes
 .../G-REV/9b864752/captures/390-normal-fold.png    |  Bin 0 -> 199588 bytes
 .../G-REV/9b864752/captures/834-normal-fold.png    |  Bin 0 -> 356800 bytes
 .../G-REV/9b864752/captures/probeA-hero.json       | 1663 ++++++++++++++++++++
 .../G-REV/9b864752/captures/probeA-hero.mjs        |  187 +++
 .../G-REV/9b864752/captures/probeB-gl.json         | 1406 +++++++++++++++++
 .../G-REV/9b864752/captures/probeB-gl.mjs          |  128 ++
 .../G-REV/9b864752/captures/probeC-final.json      |  586 +++++++
 .../G-REV/9b864752/captures/probeC-final.mjs       |  133 ++
 66 files changed, 5549 insertions(+), 141 deletions(-)
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/05-regression.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/06-post-merge.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-fold-1280x800.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-fold-1440x900.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-fold-390x844.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-fold-834x1194.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-proof-1280x800.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-proof-1440x900.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-proof-390x844.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H1/08-screens/hero-proof-834x1194.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H3/05-regression.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H3/08-screens/page-top-1440.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-H3/09-live-after.log
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/08-adversarial-review.md
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/api-chat-timings.csv
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/api-tts-headers.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/css-chroma-scan-874f1ee9.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/greeting-text-compare.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/live-headers-874f1ee9.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/minivic-1440-muted.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/minivic-1440-unmuted.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/minivic-390-muted.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/minivic-ttft-trials.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/mp3-ffprobe.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/mp3-hash.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/mp3-headers.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/probe2-a.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/probe2-b.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/probe2-c.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/probe2-d.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/probe2.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/served-greeting-transcript.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/874f1ee9/captures/served-js-scan.txt
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/08-adversarial-review.md
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1280-normal-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-glforce-benchfield-t0.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-glforce-benchfield-t1.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-glforce-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-glforce-long-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-glforce-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-nogl-normal-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-nogl-reduced-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-normal-benchfield-t0.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-normal-benchfield-t1.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-normal-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-normal-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-reduced-benchfield-t0.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-reduced-benchfield-t1.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/1440-reduced-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-glforce-benchfield-t0.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-glforce-benchfield-t1.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-glforce-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-glforce-long-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-glforce-skills.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/390-normal-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/834-normal-fold.png
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeA-hero.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeA-hero.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeB-gl.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeB-gl.mjs
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeC-final.json
 create mode 100644 docs/delivery/evidence/v10-20260905T0515Z/G-REV/9b864752/captures/probeC-final.mjs again immediately and once more right before you push, resolve any Hero.tsx/Hero.module.css conflict keeping both intents (never let consolidation's 'branch wins conflicts' throw 44c3e08 away), then re-measure the reviewer's four failing clauses on your build before deciding what is still open.
