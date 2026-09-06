# t_rev_s7 — Reviewer probe — S7 minivic-viseme on the live build: canvas inside the open panel at /?gl=force, stage lit and moving while a reply streams, reduced-motion 0 canvases with the 2D mouth still animating, ≤1 extra GL context, avatar/voice flows intact, R2 tally 7/7 scenes measurable

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T14:53:39.430Z

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). One-Deploy reviewer task. On live (build carrying the S7 commit): open the MiniVic panel (hydration on button[data-testid=minivic-toggle], scroll past the hero, click) at /?gl=force 1440 and 390 → [data-scene=minivic-viseme] holds one live webgl canvas; send a message (mute first) and measure the stage's coverage/peak/motion while the reply streams (motion must exceed the idle motion); count WebGL contexts live (≤ 1 extra vs the page before opening); prefers-reduced-motion: 0 canvases in the panel AND the 2D mouth canvas still animates during a reply (sample its pixels over 1 s); no-GL path: panel complete and readable; gold: none in the stage; 0 pageerrors / CSP violations; G-M1/G-M3 invariants intact (one chat request, first token < 1.5 s). Report the R2 tally: how many of 7 scenes are measurable on live and pass the floors. Verdict per clause; failures first; false-positive register vs the S7 commit; push evidence; orchestrator completes on receipt.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- wait for the Deploy carrying S7
- probe with own scripts (method parity with G-REV/411650c2 for the panel and /abc475e3 for fields)
- report + captures; push

## QUALITY GATES
- Fresh live numbers per clause
- Failures first; register present

## VERIFICATION
```bash
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T15:00:00.040Z)
running — dispatched 15:00Z on live 799b4a02 (S7 c1df356 + shader resolutionScale af7355a)

## COMPLETE (2026-09-05T15:20:05.794Z)
15:17Z verdict on live 799b4a02→ce3ab346: S7 minivic-viseme canvas PASS, reduced-motion PASS, GL contexts PASS (+1 on open), no-GL PASS, chat invariants PASS (ttft P50 829 ms, 0 forbidden endpoints), resolutionScale af7355a PASS (0.5 store ratio, floors+AA unchanged at 1440), poster PASS. FAIL overall on F-1 vitrine-field @390 peak 0.3325 < 0.35 (carried, owned by t_g2_v3) and F-2 UNPROVEN (stage response to a muted streaming reply not attributable). R2 tally 7/7 mounted, 7/7 pass at 1440, 6/7 at 390. Evidence pushed on worktree-wf_a576a440-b8f-1 (G-REV/799b4a02/08-adversarial-review.md + captures). Three of the reviewer's own findings withdrawn in its false-positive register.
