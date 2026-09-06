# t_g2_c1b — ADV-1556Z P0 — G-C1 AP: relabel Listen + Vitrine mailto plates to honest email language (no Book / no Start-a-project-as-booking)

**Status:** ready · **Priority:** 98 · **Parents:** t_adv1556 · **Created:** 2026-09-05T16:57:52.161Z

## YOUR ROLE
analyst-programmer — coding (docs/prompt.md §5). Recruiter-visible copy ship. origin/main listen.ts engage.label is 'Book a 20-minute call' with mailto — that is the 1556Z lie. vitrine.ts engagement.label is 'Start a project' with a different mailto subject. Change labels to honest email verbs (default: Listen 'Email a 20-minute-call agenda'; Vitrine 'Email a project brief') unless t_g2_c1 names different strings. KEEP structured mailto bodies. Do NOT invent a calendar URL. Worktree FROM origin/main. Port 5643. Skip local Playwright. This is a Window-1 O5 visible ship.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- worktree from origin/main
- Edit app/data/portfolio/listen.ts and vitrine.ts labels only (href mailto stays)
- Grep out/ for Book a 20-minute / Start a project as CTA labels — must be 0 on those plates
- ledger BEFORE commit
- tsc+lint+build:static+audit; push

## QUALITY GATES
- Listen engage.label does not contain Book
- Vitrine engagement.label does not contain Start a project
- hrefs remain mailto with subject
- no cal.com/calendly invented
- pushed

## VERIFICATION
```bash
grep -n "label:" app/data/portfolio/listen.ts app/data/portfolio/vitrine.ts
```

## HIERARCHY
role_matrix: coding → level 2 → effort **xhigh** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## COMMENT (2026-09-05T16:58:32.947Z)
1556Z DISPATCH NOW Window-1 O5 visible copy. Default labels: Listen 'Email a 20-minute-call agenda'; Vitrine 'Email a project brief'. Port 5643.

## STATUS (2026-09-05T16:58:33.576Z)
running — dispatched

## COMMENT (2026-09-05T17:02:53.936Z)
PM probe 17:02Z: worktree-gc1-1556 has uncommitted honest labels (Listen Email a 20-minute-call agenda; Vitrine Email a project brief). Awaiting ledger+commit+push. Do not self-PASS.

## COMMENT (2026-09-05T17:11:57.211Z)
PUSHED fb49e53 on worktree-gc1-1556. Labels honest. NOT live PASS until independent reviewer on deployed build-commit. Deploy dispatched.

## COMPLETE (2026-09-05T17:27:41.579Z)
PASS G-C1 only on live b0513692. Independent reviewer 3ca75114 G-REV/b0513692/G-C1.md: Listen 'Email a 20-minute-call agenda'; Vitrine 'Email a project brief'; 0 Book/Start-a-project. mailto retained. NOT full R4 calendar. Deploy 33980197112.

## COMMENT (2026-09-06T00:00:32.972Z)
REOPENED 2026-09-05T23:58Z by ADV-REVIEW-20260905T2315Z (host, independent, live 9136bc59): the gap this task closed is FAIL on live again — see docs/adversarial/ADV-REVIEW-20260905T2315Z.md + GAP-BACKLOG.md. Board PASS invalidated (§10.3 false-positive register); no rework of what landed (§0) — a fresh identity carries the delta under the t_w1_* wave-1 tasks. Status → archived (history), not done.

## STATUS (2026-09-06T00:00:34.364Z)
archived — PASS invalidated by ADV-2315Z; superseded by wave-1 t_w1_* task
