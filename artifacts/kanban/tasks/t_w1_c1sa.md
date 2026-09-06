# t_w1_c1sa — WAVE-1 P0 — G-C1 architecture decision: ONE engagement product on Listen and Vitrine (identical mailto subject+body) unless a named-env calendar URL exists; exact strings + TDD cases written into docs/architecture/G-C1-HONEST-CTA.md

**Status:** ready · **Priority:** 98 · **Parents:** — · **Created:** 2026-09-06T00:05:41.249Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-REVIEW-20260905T2315Z: Listen ships 'Email a 20-minute-call agenda' (subject '20-minute call — Vikram Deshpande' + 4-line agenda body) and Vitrine ships 'Email a project brief' (subject 'Engagement enquiry — Vikram Deshpande', no body) — two different mailto products over one inbox = G-C1 FAIL. GAP-BACKLOG acceptance: a real calendar URL from a NAMED env key on both surfaces, OR one single honest mailto product (same subject, same body) on both. Orchestrator §0.1 default: single product, because /root/.claude/.env.production carries no calendar/booking key (read names only: grep -E '^[A-Z][A-Z0-9_]*=' … | sed 's/=.*//' | grep -ciE 'cal|book|schedul|meet' → 0). This task is read-only architecture (≤ 12 min) and feeds t_w1_c1ap immediately.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read docs/prompt.md R4 + O2; docs/adversarial/ADV-REVIEW-20260905T2315Z.md (Vitrine, Listen rows); docs/adversarial/GAP-BACKLOG.md G-C1; docs/architecture/G-C1-HONEST-CTA.md (extend this file — do not create a new one); docs/architecture/LISTEN-FLAGSHIP.md §3; app/data/portfolio/listen.ts (ENGAGE_SUBJECT/ENGAGE_AGENDA/ENGAGE_HREF, engage.label) and app/data/portfolio/vitrine.ts (engagement); components/sections/Vitrine/Vitrine.tsx and components/sections/Listen/Listen.tsx where the plates render; tests/e2e/listen.spec.ts, tests/e2e/vitrine.spec.ts, tests/e2e/audience-paths.spec.ts (R4 click-through).
- S-2 Re-confirm the env fact by key NAME only (never print values, never source the file). If — and only if — a named key holding a calendar/booking URL exists, design path (a): NEXT_PUBLIC_<KEY> read at build time, both plates link to it, label 'Book a 20-minute call', tests assert the href host. Otherwise design path (b): one product. Choose the one subject line and one body that serve BOTH audiences (an employer and a business client) — e.g. subject '20-minute call — Vikram Deshpande' and a body whose first line asks the sender to say which they are (hiring / project) followed by the existing agenda lines. Both surfaces get the SAME label, SAME subject, SAME body, SAME href string. Copy must be traceable (no invented facts) and free of the words Book / Start a project / booking unless path (a).
- S-3 Write the decision into docs/architecture/G-C1-HONEST-CTA.md as a dated §7 'ADV-2315Z — single product' with: the chosen strings verbatim, the exact file:line edits for listen.ts / vitrine.ts (and any component label), and the TDD cases the analyst-programmer must write first: (1) node test: listenContent.engage.href === vitrine engagement.href (byte-identical); (2) e2e: both plates' <a href> are identical and decode to the same subject+body; (3) e2e R4: employer path (hero → Download CV) and client path (Vitrine/Listen engage → mailto) both complete; (4) a copy test that neither label contains Book/Start a project/booking. Name the test files and the exact assertions.
- S-4 Return structured output: {task_id:'t_w1_c1sa', path:'a'|'b', label, subject, body_lines:[], href_expression, edits:[{file, line_hint, change}], tests:[{file, name, assertion}], doc_section:'docs/architecture/G-C1-HONEST-CTA.md §7', goal_complete:true}. Read-only otherwise: do not edit app code (the analyst-programmer implements).

## QUALITY GATES
- Decision is binary and matches GAP-BACKLOG G-C1 (one product or named-env calendar) — no third option
- Strings are verbatim and identical for both surfaces; no Book/Start-a-project wording unless a real calendar URL
- TDD cases name exact files and assertions before any code
- Doc extended in place (no new file); nothing printed from .env.production
- Runtime ≤ 12 minutes; no code edits

## VERIFICATION
```bash
grep -n 'ADV-2315Z' /root/forgotten-mistory/docs/architecture/G-C1-HONEST-CTA.md | head -3
git -C /root/forgotten-mistory status --short -- app | wc -l  # must be 0 from this task
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-06T00:10:56.827Z)
running — dispatched 00:06Z via claude-cli Workflow (fresh identity)

## COMPLETE (2026-09-06T00:53:34.408Z)
SA decision path (b) single product recorded in docs/architecture/G-C1-HONEST-CTA.md §7 (verified on origin/main by PM); implemented by t_w1_c1ap 4488389, live 56ffed3e
