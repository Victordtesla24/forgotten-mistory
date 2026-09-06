# t_w1_rev1 — WAVE-1 REVIEW — independent adversarial review of live build-commit 56ffed3e (G-H6 monochrome portrait + G-H5 canonical /assets/my-hero-avatar.mp4 + G-C1 one engagement product) plus the regression table (G-MV1, G-V3, G-L1, palette, contrast, 0 pageerrors, ?gl=force)

**Status:** ready · **Priority:** 100 · **Parents:** t_w1_h6h5, t_w1_c1ap · **Created:** 2026-09-06T00:53:33.657Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). O2/O6: every production deploy gets an independent, ruthlessly honest adversarial review against https://forgotten-mistory.web.app/ only. Live build-commit 56ffed3e (Deploy consolidated worktree-w1-h6h5 5ab86cd + worktree-w1-c1 4488389 into main). You did not write this code. Prior ADV-REVIEW-20260905T2315Z is the baseline (FAIL). Judge each wave-1 gap PASS/FAIL with captured evidence, and re-run the regression table so nothing that was closed on 9136bc59 reopened. Do not consult the implementers' evidence except to know what to attack (orchestration-skill §10.2).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read: docs/adversarial/ADV-REVIEW-20260905T2315Z.md (baseline), docs/adversarial/GAP-BACKLOG.md (binary acceptances for G-H5, G-H6, G-C1 and the 'Closed on live' table), docs/prompt.md §0.3-2/-3, R4, R5, §14 C-8, orchestration-skill §10 (posture) — then generate your OWN artifacts.
- S-2 Live probes (curl, from this VPS): `curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'` must be 56ffed3e (if it moved, review the SHA that is live and say so); `curl -sI …/assets/my-hero-avatar.mp4` → 200 video/mp4 and `curl -sI …/assets/my-avatar.mp4` → 301 to the canonical; download the mp4 + my_avatar.png/.webp/.avif and measure with ffprobe/identify/sharp: dimensions, fps, and per-pixel chroma (max(|R-G|,|G-B|,|R-B|)) on 3 video frames + each still — monochrome means ≤ 2 on 100% of pixels; record numbers.
- S-3 Browser evidence (Playwright with the system Chrome, --no-sandbox; write a throwaway script under docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/probe.mjs): at 1440x900 and 390x844, normal and ?gl=force: 0 pageerrors and 0 console errors for the whole page; screenshots hero / #listen / #vitrine / MiniVic launcher → the same folder; the rendered <picture> in the hero: screenshot the element and compute chroma on real pixels (≤ 4 on ≥ 99.5% of pixels); both engage plates (`[data-cta=engage]` on #listen and #vitrine): identical href, identical label, decode subject+body and print them, and neither contains Book / Start a project / booking; R4 both paths: hero Download CV → real PDF 200; engage → mailto; G-MV1: the MiniVic launcher is visible and labelled 'Ask Mini Vic' at 390 after scrolling past the hero and its pill is display:inline-block; G-V3: vitrine rest-plate strokes ≥ 4.5:1; G-L1: #listen field canvas present under ?gl=force; palette: sample the hero fold and the portrait for any pixel with saturation > 0.25 outside gold hue (35–60°) — report counts.
- S-4 Attack: try to make the portrait show colour (hover/toggle the loop; play it; check the MiniVic panel talking-head); look for any remaining reference to my-avatar.mp4 in the shipped JS (`curl -s` the _next chunks named in index.html and grep); check the OG image is documented as out of scope rather than claimed monochrome; check docs/architecture/PALETTE-EXCEPTIONS.md on origin/main says retired and that tests/palette_bundle.test.mjs enforces zero exceptions (read-only).
- S-5 Write docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/08-adversarial-review.md (failures first; each verdict with the command and the number) and verdicts.json {sha:'56ffed3e', gaps:{'G-H6':'PASS|FAIL','G-H5':'PASS|FAIL','G-C1':'PASS|FAIL'}, regression:{'G-MV1':…,'G-V3':…,'G-L1':…,'palette':…,'pageerrors_0':…,'contrast':…}, false_positives:[…], notes}. R5 stays OPEN regardless (720p24 is not 4K) — say so; do not grade R5 PASS.
- S-6 Return {task_id:'t_w1_rev1', live_sha, verdicts:{…}, evidence:[paths], failures_first:[…], goal_complete:true}. Read-only: never edit app code; never Hermes; never print secrets.

## QUALITY GATES
- Every verdict cites a command + captured number/screenshot produced in this task
- 0 pageerrors at 1440/390 normal and ?gl=force, or the error text quoted verbatim
- Monochrome measured on real pixels (download + render), not inferred from code
- Both engage plates compared by decoded href, not by label alone
- R5 not graded PASS; failures listed before successes
- ≤ 25 min; no writes outside docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/

## VERIFICATION
```bash
cat /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/verdicts.json
ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/56ffed3e/
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T00:53:33.924Z)
running — dispatched 00:48Z reviewer rev-56ffed3e-w1
