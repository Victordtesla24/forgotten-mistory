# t_g2_h5 — ADV-1451Z P0 — G-H5 hero video assets: replace the 720p24 loop with the best honest source available, document the asset ladder (source → 1080p → 4K path), retire the orphan 360p file, and stop any R5 claim until measured

**Status:** todo · **Priority:** 94 · **Parents:** — · **Created:** 2026-09-05T14:57:53.204Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z: my-avatar.mp4 is 1280×720@24 and my-hero-avatar.mp4 360p (R5 P0). Higgsfield has 0 credits (no new generation possible without the Owner — do not ask, do not fake). Acceptance: (1) audit every shipped raster/video asset (public/assets) with ffprobe/identify → docs/delivery/evidence/…/G2-H5/asset-ladder.md listing dimensions, fps, bytes, where used, and the R5 status per asset (PASS only ≥ 3840×2160@60 or resolution-independent); (2) retire the unused my-hero-avatar.mp4 (grep for references first — if unreferenced, delete it and its preload/link; if referenced, replace with the 720p asset); (3) if a higher-resolution SOURCE of the portrait loop exists on the host (search /root for the original: find / -iname "*avatar*" -size +5M), re-encode a ≥ 1080p AV1/H.264 ladder within the 500 kB/5 MB budgets and wire srcset/source order; if none exists, say so — the ladder documents exactly what a 4K render needs (the HyperFrames pipeline t_x1_10 renders the ATMOSPHERE, not the portrait; the portrait needs a real source or Higgsfield credits); (4) the R5 register (t_x1_09) references this ladder. No fake upscale presented as 4K.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Inventory + references (grep -rn my-hero-avatar / my-avatar across app components public firebase.json sw).
- S-2 ffprobe/identify every asset → asset-ladder.md; search for higher-res sources.
- S-3 Implement what is honestly possible (retire orphan; wire a better source if found); tests: asset budget + TC-HERO-13/19 loop specs green.
- S-4 PUSH RULE; evidence follow-up.

## QUALITY GATES
- asset-ladder.md complete and honest; orphan 360p retired or justified; no asset > budget; hero loop specs green
- ledger; pushed

## VERIFICATION
```bash
ls -la public/assets | grep -E "mp4|webm|avif|webp"
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5632 npx playwright test tests/e2e/hero-photo.spec.ts --workers=1
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:33.292Z)
1556Z DISPATCH researcher inventory NOW; AP after path exists.

## STATUS (2026-09-05T16:58:34.015Z)
running — researcher inventory

## COMMENT (2026-09-05T17:53:50.042Z)
PM snippet: live HEAD /assets/my-hero-avatar.mp4 = 404 on 58d9c111. Not a PASS until independent reviewer vs GAP-BACKLOG (PNG 1480×826, honest no-higher-source ladder, R5 not claimed).

## COMMENT (2026-09-05T18:34:14.369Z)
C19 left G-H5 OPEN. 360p retire e983dd9 is ancestor of live. Focused reviewer dispatched. R5 stays FAIL unless they measure otherwise.

## COMPLETE (2026-09-05T19:32:50.504Z)
PASS live 64404134. my-hero-avatar.mp4 HEAD 404; PNG IHDR 1480x826; ladder declares R5 FAIL honestly. R5 remains OPEN. https://forgotten-mistory.web.app/ build-commit 64404134 · independent rev-64404134-c22 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/64404134/08-adversarial-review.md + verdicts.json

## COMMENT (2026-09-06T00:00:30.239Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:30.835Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
