# t_4adf34f7 — R-c13 — adversarial + composition + motion council review of the LIVE site after cycles 11/13 land (O2/O6)

**Status:** todo · **Priority:** 95 · **Parents:** t_dc02ded1, t_6fb8914b · **Created:** 2026-09-05T05:58:06.011Z

> Continuity: Hermes t_4adf34f7 (ready).

## YOUR ROLE
reviewer — 3rd_party_independent_adversarial_review (docs/prompt.md §5). Three independent reviewers (adversarial, composition, motion) against https://forgotten-mistory.web.app/?gl=force at 1440/1920/834/390 + reduced-motion + no-GL; merged verdict with a prioritised, file:line-exact backlog like R-c8. Also grades the §0.3 mandates (one flagship visualisation per section; black/white/gold only; narrative) and R2 (≥7 signature scenes — currently 2 GLSL + 4 SVG/CSS).

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read docs/delivery/evidence/v9-20260904T2312Z/R-c8/review.md (format + closed items C-01/C-02/ADV-F-1/MOT-F-2/C-05/C-06) and the live build-commit meta.
- S-2 Adversarial lens: console errors, pageerrors, failed requests, axe (wcag2a/2aa/21a/21aa), CSP/XFO/HSTS, asset budgets, reduced-motion running animations, no-GL readability, /api/chat 200 + resume-grounded answer, tab order, keyboard path to every CTA → R-c13/adversarial-report.json + adversarial-review.md.
- S-3 Composition lens (senior creative UI council): per section, exact aesthetic directions with px measurements and file:line targets; palette = tokens only, gold only on sourced → R-c13/council-composition.md.
- S-4 Motion lens: per section one flagship animation/visualisation graded against the Marvel-Studios/60 fps bar; fps sampled via requestAnimationFrame over 3 s at 1440 and 390; reduced-motion path per scene → R-c13/council-motion.md.
- S-5 Merge: verdict PASS/FAIL; contradictions resolved with reasons; backlog table (id, section, severity, tag, one line) + per-item Finding/Direction/Files/Acceptance → R-c13/review.md.

## QUALITY GATES
- [ ] every finding tagged Verified/Inferred/Assumed with the artifact path
- [ ] screenshots at 390/834/1280/1440/1920 in R-c13/capture/
- [ ] verdict stated; FAIL items carry exact acceptance lines
- [ ] no self-review: reviewer never touched cycles 11/13 code

## VERIFICATION
```bash
ls docs/delivery/evidence/v10-20260905T0515Z/R-c13/
grep -c "^### " docs/delivery/evidence/v10-20260905T0515Z/R-c13/review.md
```

## HIERARCHY
role_matrix: 3rd_party_independent_adversarial_review → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T06:34:52.590Z)
running — R-c13 workflow dispatched 06:3xZ: adversarial → composition → motion → merge (sequential, opus max), gated on live meta f86b125

## COMMENT (2026-09-05T06:36:10.564Z)
06:36Z: first R-c13 run stopped after 2 min — its precondition named f86b125 literally, but that run was cancelled by the queued 3adf126a deploy (GitHub keeps one pending run per concurrency group); relaunched with the precondition 'live build is a descendant of f86b125' (3adf126a qualifies).

## COMPLETE (2026-09-05T07:30:51.833Z)
R-c13 merged verdict FAIL on builds 3adf126a→3dae601a (review.md, 3 lens reports, 16 holds, 7 contradictions resolved, 22 ranked items). Blocker ADV-1 = the WebGL crash (fixed by t_p100hotfx at 07:12Z). 16 holds incl. R-c8 C-01, ADV-F-1, MOT-F-3, C-08(gold discipline) closed; 0 console errors on the fallback path; axe 0; headers; LCP 668/320 ms; CLS 0; /api/chat grounded; /api/tts 200. Backlog folded: 15 items → existing tasks (comments), 7 new tasks. Next review R-c14 after cycles 15/16/16b + react19 land.
