# t_realign01 — P0 RESUME — docs/prompt.md max PEA; ship visible UI every ≤10 min

**Status:** ready · **Priority:** 0 · **Created:** 2026-09-05T09:32:35Z

## YOUR ROLE
orchestrator — feedback_refactor_loop · ultracode · docs/prompt.md §5

## ON RESUME
1. Read `docs/prompt.md` §0.1–§0.4, O1–O6, §5, §6 (MAXIMUM PEA).
2. Read `docs/ORCHESTRATOR-REALIGN.md` and run its verification commands.
3. Ship **visible** UI/UX to `main` every ≤10 minutes while work exists (O5). Docs-only cycles that leave production looking identical fail O5.
4. Never Hermes. Never ANTHROPIC_API_KEY. Never ask Owner.

## GATES
- [ ] `fm-deploy-cadence.timer` active
- [ ] Hermes inactive
- [ ] Deploy evidence ≤10 min or cadence log skip reason recorded
- [ ] Live cache-control must-revalidate / max-age=0
- [ ] At least one visible UI dispatch or ship after resume

## STATUS (2026-09-05T09:37:42.061Z)
running — claimed 09:3xZ by the orchestrator on resume; realign playbook read
