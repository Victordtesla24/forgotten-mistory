# t_g2_l1 — ADV-1451Z P0 — G-L1 Listen: one true flagship visualisation (the beat field becomes the section’s story, not an empty caliper void) + a client CTA beyond mailto (booking) — architecture then first visual

**Status:** todo · **Priority:** 95 · **Parents:** — · **Created:** 2026-09-05T14:57:53.104Z

## YOUR ROLE
solutions-architect — architecture / requirements_analysis (docs/prompt.md §5). ADV-REVIEW-20260905T1451Z §Listen: deliberately sparse caliper field = opposite of the §0.3 flagship mandate (P0); dual mailto pills, no booking (P1 R4). listen-field sceneId shipped (192d743). Two parts: (A) solutions-architect (≤20 min): a one-page design docs/architecture/LISTEN-FLAGSHIP.md — what the listen field SHOWS (e.g. the four channels as beats arriving on a timeline; the synthetic-introduction waveform as the field’s pulse driven by the greeting audio envelope; gold only where a channel is a checkable record) with acceptance tests, plus the booking decision: listen.ts records there is no booking tool on this account and a 404 link is worse than none — design the honest achievable CTA (a mailto with a structured subject/body template for a 20-min call, plus a visible “reply within 24 h” commitment sourced from the CV/LinkedIn if true; a real Cal.com/Calendly URL only if one exists in .env.production by key name — never invent one) → tasks JSON for the analyst-programmer; (B) analyst-programmer lane(s) created from that JSON.

## PROJECT ROOT
/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/v10-20260905T0515Z/. Live: https://forgotten-mistory.web.app. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.

## MANDATORY
Call kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a `grep -E '^[A-Z][A-Z0-9_]*='` reader, never `source` it, never print values.

## EXECUTION ORDER
- S-1 Read Listen.tsx/listen.glsl.ts/field component/listen.ts, scene-listen.spec, G-REV creative directions (#listen), SIGNATURE-SCENES-v1.md S6.
- S-2 Write docs/architecture/LISTEN-FLAGSHIP.md + LISTEN-TASKS.json (≤30-min tasks, §5 profiles, verify commands); check /root/.claude/.env.production key NAMES only for any booking/calendar URL.
- S-3 Commit on a docs branch; push.

## QUALITY GATES
- Design names the story, the data source per visual element, the acceptance test per clause, and the honest CTA decision with its evidence
- Tasks JSON validates; no fake booking link

## VERIFICATION
```bash
python3 -c "import json;json.load(open('docs/architecture/LISTEN-TASKS.json'))"
```

## HIERARCHY
role_matrix: architecture / requirements_analysis → level 1 → effort **max** (effort_cascade.yaml; depth_cap 4). Model: claude-opus · Max OAuth. max_runtime_seconds 1800 (O1) · goal_max_turns 20.

## PROVIDER
Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.

## STATUS (2026-09-05T14:58:24.552Z)
running — dispatched 14:59Z — solutions-architect max, docs-only worktree (no Chrome)

## COMPLETE (2026-09-05T15:20:05.967Z)
15:17Z docs-only brief delivered: docs/architecture/LISTEN-FLAGSHIP.md + LISTEN-TASKS.json (b5f2230 on worktree-wf_377e987c-eab-2, consolidated). No booking tool exists on this account (45 env key NAMES, 0 matching cal/calendar/book/schedul/meet) — honest CTA = mailto with a 20-minute-call agenda body; envelope-driven band from the greeting MP3 RMS; four arrival marks; gold only on the two record channels. Imported as t_l1_01..t_l1_06.

## STATUS (2026-09-05T16:57:52.597Z)
ready — 1556Z reopen — live still FAIL G-L1 sin() field / gold 0 / reading em-dash; LISTEN-FLAGSHIP.md is not live PASS

## COMMENT (2026-09-05T16:57:52.645Z)
1556Z: docs-as-done invalid. AP t_l1_02..05 for envelope/arrivals/gold/reading. CTA lie owned by t_g2_c1b not this task.

## COMMENT (2026-09-05T17:58:40.708Z)
C1 envelope live on 58d9c111; C2 arrivals 553de013 on origin branch not yet live. C3/C5 still queued. Do not complete.

## COMMENT (2026-09-05T18:16:37.661Z)
C3 gold 35b4f39 on origin, not live. C1 envelope + C2 arrivals already on 0892d092. C5 reading still queued. Do not complete G-L1.

## COMMENT (2026-09-05T18:19:48.288Z)
C3 gold live on aa58395b. C5 reading dispatched ap-gl1-05-c19. Overall G-L1 still open until C5 live + independent PASS of all clauses.

## COMMENT (2026-09-05T18:31:47.085Z)
C3 PASS on live aa58395b. C1 envelope + C2 arrivals live. C5 FAIL: reading still em-dash. Keep open. t_l1_05 hung at dispatch — respawn.

## COMMENT (2026-09-05T18:34:14.689Z)
C5 still in flight ap-gl1-05-c20. C19 C3 PASS already boarded t_l1_04.

## COMMENT (2026-09-05T19:11:49.785Z)
t_l1_02 and t_l1_03 done from C19 live evidence. C5 in flight ap-gl1-05-c21. Parent stays open.

## COMMENT (2026-09-05T19:32:50.842Z)
C5 6b4755c now ancestor of live b4b4a9a3. Parent open until rev-b4b4a9a3-c23 PASSes reading ≠ —.

## COMPLETE (2026-09-05T19:44:49.796Z)
PASS live b4b4a9a3 overall G-L1: envelope/arrivals/gold already C19; C5 reading 24.98 s independent PASS. https://forgotten-mistory.web.app/ build-commit b4b4a9a3 · independent rev-b4b4a9a3-c23 · docs/delivery/evidence/v10-20260905T0515Z/G-REV/b4b4a9a3/REVIEW.md · Deploy 33987226379
