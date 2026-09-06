# t_w1_rev3 — WAVE-1 REVIEW 3 — independent adversarial review of live 12cd9123: G-A3 (the About field tells ten sectors with the dial ignored; dial is chrome; ≥75% plane), G-H5 resolution half (on-demand 1080p/2160p greyscale rungs, selection rules, nothing plays by default), plus the regression table and R5 OPEN

**Status:** ready · **Priority:** 100 · **Parents:** t_w1_a3, t_w1_h5b · **Created:** 2026-09-06T01:47:59.223Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Live build-commit 12cd9123 (Deploy 34004706433, 01:45Z) = consolidation of worktree-w1-a3 e5c1e4d (About: components/sections/About/{field.glsl.ts,AboutField.tsx,Compass.tsx,*.module.css}, tests/overhaul/scene-about.spec.ts TC-SCENE-ABOUT-10/11) on top of 521dac9c (G-H5 rungs: public/assets/avatar/my-hero-avatar-1080.mp4 3.69 MB H.264, my-hero-avatar-2160.webm 2.91 MB AV1; lib/videoRung.ts selector; docs/architecture/ASSET-LADDER.md). Baselines: ADV-2315Z §About FAIL ('recruiter names the dial'); rev-56ffed3e-w1 G-H5 FAIL (only 720p served while a 2160p master exists). GAP-BACKLOG acceptances: G-A3 — recruiter recall is the GL field; hide the SVG and the remaining picture still tells ten sectors; restore it and the field still carries ≥ ~75% weight; gold/hatch honesty green. G-H5 — ≥1080p path toward 4K shipped honestly; 720p24 never presented as 4K; R5 stays OPEN (24 fps). You did not write any of it; judge on the live URL only; generate your own artifacts.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: ADV-2315Z §About + §Hero/R5 rows; GAP-BACKLOG G-A3/G-H5; the two prior reviews' verdicts.json (to know what to attack, not to reuse); docs/architecture/ASSET-LADDER.md; app/data/portfolio/about.ts (which dimensions are answered/open — needed to judge the light against the data); orchestration-skill §10.
- S-2 Assets on live (curl + ffprobe/ffmpeg + sharp, from this VPS): HEAD each rung URL; download both rungs; measure dims/fps/bytes; extract 3 frames each and assert chroma 0; confirm nothing above the largest rung exists; confirm /assets/my-hero-avatar.mp4 unchanged (1280x720, 1,916,328 B) and /assets/my-avatar.mp4 → 301.
- S-3 Browser (one headless Chrome at a time): (a) G-H5 selection — at 1440x900 DPR 1, 2 and 3 and at 390x844 DPR 3, hover/press play on the hero figure and read video.currentSrc; confirm the rule 'smallest published rung with height ≥ rendered height × DPR, saveData → 720p, canPlayType gate' holds; confirm NO request for any rung before a pointer/press (network log) — nothing plays by default; (b) G-A3 — with ?gl=force at 1440x900 and 390x844, scroll #about to the top of the viewport, hide the SVG compass and the reading column via injected CSS, screenshot the canvas, and count the sectors yourself: sample the ring under the bezel and the fan outside it in the rose's frame (the implementer's TC-SCENE-ABOUT-10 uses rr 0.40–0.96 and 1.12–1.6); report the ten per-sector means, the lit/open ratio against about.ts (role-side dimensions are 6, 7, 9), and whether YOU can count ten; then restore the SVG and measure canvas plane dominance ≥ 0.75 and the dial's brightest stroke ≤ --mist-400 luminance; gold pixels in the canvas must be 0; reduced-motion: the ten sectors still lit/dim statically; no-GL: the compass regains full contrast. Screenshots → G-REV/12cd9123/. Also: does a stranger see ten sectors of light before the dial? Say so in one sentence.
- S-4 Regression table: G-MV1 pill at 390 (visible AND a real click opens the panel — reviewer 2 found the first fold intercepts clicks; re-test and report), G-V3, G-L1 (field present; note the known 'listen beat field' motion floor result 0.00142 vs 0.004 — measure it yourself and grade), G-C1 identical engage hrefs, hero monochrome, text contrast ≥ 4.5:1 in #about, 0 pageerrors/console errors normal + ?gl=force at 1440/390, /api/tts 200.
- S-5 Write docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/08-adversarial-review.md (failures first; every verdict with command + number) and verdicts.json {sha:'12cd9123', gaps:{'G-A3':…,'G-H5':…}, regression:{…}, R5:'OPEN', false_positives:[…]}; return {task_id:'t_w1_rev3', live_sha, verdicts, failures_first:[…], evidence:[…], goal_complete:true}. Read-only; no app edits; never Hermes; never print secrets; ≤ 30 min.

## QUALITY GATES
- Every verdict cites a command and a captured number/screenshot from this task
- Ten-sector count judged from the reviewer's own capture with the dial hidden, against about.ts data
- Rung selection judged from video.currentSrc after a real press at the stated DPRs; no-autoplay judged from the network log
- R5 not graded PASS; failures first; ≤ 30 min; writes only under G-REV/12cd9123/

## VERIFICATION
```bash
cat /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/12cd9123/verdicts.json
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T01:47:59.286Z)
running — dispatched 01:49Z reviewer rev-12cd9123-w1

## COMPLETE (2026-09-06T02:10:42.745Z)
Reviewer rev-12cd9123-w1 (max, 21 min): G-A3 PASS on the GAP acceptance (ten sectors countable with dial+column hidden at 1440/390; plane dominance 75.2%; dial brightest 0.2789 = --mist-400; 0 gold/chromatic px; reduced-motion 0 canvases with the SVG still telling ten; no-GL dial recovers 0.92) with sub-claim FAIL: answered/open light ratio 1.039 at 390 DPR3 and 1.596 at 1440 in the section's first-screen state (Culture Fit answered = darkest 0.012; Company Stability open = 0.566) → correction t_w2_x2f5. G-H5 PASS (720p/1080p H.264, 2160p AV1 all chroma-flat from downloaded bytes; 301 old name; nothing above top rung; selection by real press at 7 configs; 0 requests at rest). G-MV1 FAIL at 390 first fold (hero portrait <video> z-index 1 covers the launcher; click times out; works after scroll) → t_w1_mv2 in progress. G-L1 motion floor MISS 0.0029 < 0.004 (own measurement) → t_w1_red3. R5 OPEN (24 fps). Doc defect: ASSET-LADDER.md §1–2 contradict §10 → t_w1_lad1. Regression: G-V3, G-C1 identical hrefs, hero monochrome, about contrast ≥ 6.2:1, 0 pageerrors ×4, /api/tts 200 all PASS. Evidence G-REV/12cd9123/.
