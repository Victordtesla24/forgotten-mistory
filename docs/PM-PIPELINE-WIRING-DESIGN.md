# PM-Driven Autonomous Kanban Pipeline — Wiring Design (v1)

**Status:** approved 2026-06-28. Serialized v1, pilot-first, hardened iteratively over the next
2–3 real prompts toward full autonomy. Source of truth for behaviour: `PM-KANBAN-OPERATIONS.md`.

## Goal
Every prompt to Hermes (CLI / API / desktop / Telegram) is, **by default**, driven through the
Kanban board by the **Project Manager** (Default profile) and the council — end-to-end from the
first user prompt to production deployment + verification, with a final **Fusion Council**
adversarial review. Fully autonomous, **quota-safe (serialized)**, with a **kill switch**.
Flexible: an explicit bypass token returns normal Hermes chat.

## Foundation already in place
- PM = Default profile: `claude-opus-4-8` / `anthropic` (Max OAuth), `xhigh`, PM persona (`SOUL.md`).
- 8 council profiles on the doc-table models/providers; anthropic bills Max OAuth (no API keys).
- Kanban board (VPS `:9119` / `:8443/hermes/kanban`); dispatcher `dispatch_interval_seconds: 60`.
- Council docs (`~/.hermes/council/*`) reconciled to `PM-KANBAN-OPERATIONS.md`.

## Pieces (build order)

### Piece 1 — Kill switch (safety net, built FIRST)
One mechanism, three surfaces. Mechanism: a **dispatch-pause sentinel** the dispatcher honours +
**reclaim/stop** of running workers.
- **CLI:** `hermes-kill` / `hermes-resume` (pause sentinel + reclaim running tasks + sweep worker PIDs).
- **Telegram:** `/kill` and `/resume` chat commands → same mechanism.
- **Board button:** dashboard control; if the prebuilt React dist makes a true button heavy, fall
  back to a one-click dashboard API endpoint that invokes the same script.

### Piece 2 — Default routing (`user_message` hook)
A `user_message` hook on the Default(PM) profile intercepts every prompt:
- starts with bypass token (`/chat`, `/ask`, or `--direct`) → normal Hermes chat, no board;
- otherwise → PM opens a Kanban **intake** task from the prompt and drives the pipeline. The
  originating chat is auto-subscribed to terminal events (`completed/blocked/gave_up/crashed`).

### Piece 3 — Serialized pipeline DAG
Parent-linked task chain, **≤1–2 opus workers at once** (never 429-stall). OpenRouter profiles
(coder/researcher/Fusion) may run in parallel without taxing Max.
```
prompt → PM decompose → [researcher ∥ solutions-architect] → analyst-programmer
       → reviewer QA → tester → SA deploy-gate → orchestrator deploy
       → production verification → Fusion Council → PM delivery report
```
The PM runs independent QA between stages; PEA<100% → targeted re-delegation.

### Piece 4 — Fusion Council (final adversarial gate)
On delivery-confirmation the PM convenes Fusion (OpenRouter server-side panel + judge per
`fusion-os.md`) → `consensus/contradictions/partial_coverage/unique_insights/blind_spots` →
PM folds findings into the backlog. Runs on OpenRouter, **off the Max quota**.

## Quota & reliability rules
- Serialized execution; concurrency cap ≤2 opus workers.
- Retry limit per task → auto-block (no infinite reclaim loops).
- Protocol-violation handling: worker exits `rc=0` without `kanban_complete` → blocked + logged, not re-spun forever.
- 429-aware backoff: on rate-limit, pause dispatch, resume after the Max window resets.

## Pilot + hardening roadmap
1. Wire pieces 1→4. Verify each in isolation (kill switch works; routing routes; a hand-built DAG
   runs serialized; Fusion returns structured JSON).
2. **Pilot:** one real prompt end-to-end with the kill switch armed; prove prompt→production holds
   without protocol thrash or 429 stall.
3. Harden over the next 2–3 real prompts: tighten protocol compliance, retry/backoff tuning,
   board-button UX, widen concurrency only once reliability is proven — toward full autonomy.

## Open feasibility items (confirmed during build)
- `user_message` hook can short-circuit a prompt into a Kanban dispatch (not just observe).
- Cleanest board-button path vs API+Telegram+CLI fallback.
- Native dispatcher pause vs sentinel-file mechanism.
