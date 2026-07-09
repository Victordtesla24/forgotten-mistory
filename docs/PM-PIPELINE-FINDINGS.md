# PM-Driven Kanban Delivery Pipeline — Findings & Surgical-Fix Catalog

**Mode:** observe-and-document only (no fixes applied). **Date:** 2026-06-29.
**Sources of truth:** `docs/PM-KANBAN-OPERATIONS.md` (behaviour) + `docs/PM-PIPELINE-WIRING-DESIGN.md` (v1 wiring).
**System:** Hermes agent at `~/.hermes/` (code `~/.hermes/hermes-agent/`), live board `~/.hermes/kanban.db`,
8 council gateways + 1 default-profile PM (`hermes` pid 69301, session `20260629_043437_4b754f`).

> Verified by a 9-lane read-only diagnosis (Explore agents, investigate→adversarial-verify; 18 agents,
> 1.29M tokens). Each defect cites a `file:line` fix-site. Two prior assumptions were **corrected** by the
> verification pass (see D2, D5). The online Max-OAuth research (§6) is **partially blocked** — the account
> hit its **monthly API spend limit** (the same wall the PM hit), so `WebSearch`/`WebFetch` failed; §6 is
> grounded in the local code + the authoritative `claude-api` reference and flagged where web confirmation is pending.

---

## 0. Headline root cause — API billing vs Max subscription (D0)

> **⚠ CORRECTION (2026-06-29, verified live — D0 below is WRONG).** `provider: anthropic` in Hermes **does
> bill Max**, not the metered API. The live inference path resolves credentials via
> `agent/anthropic_adapter.resolve_anthropic_token()` (`runtime_provider.py:1786`, `agent_init.py:667`,
> `agent_runtime_helpers.py:1638`), which is **OAuth-FIRST**: `ANTHROPIC_TOKEN` → `CLAUDE_CODE_OAUTH_TOKEN`
> → **`~/.claude/.credentials.json` (Max OAuth, auto-refresh)** → `~/.hermes/auth.json` pool →
> `ANTHROPIC_API_KEY` (LAST). The API-first `auth.get_anthropic_key()` is only used by config/doctor/status
> *display* helpers, never inference. Proof: `resolve_runtime_provider()` for every council profile returns
> `provider=anthropic, base=https://api.anthropic.com, _is_oauth_token=True, source=claude_code`; a live
> `messages.create` returned **HTTP 429** (auth accepted on the Max pool, throttled) — never 401. The
> assumption below incorrectly applied the `claude` *binary's* API-first precedence to Hermes's own resolver.
>
> **The actual 2026-06-29 stall** was 6 council profiles mis-pinned to **DeepSeek**
> (`profiles/{tester,analyst-programmer,solutions-architect,cleanup-agent}` → `deepseek/deepseek-v4-pro`;
> `orchestrator`+`reviewer` too), contradicting `models.yaml`/`PM-KANBAN-OPERATIONS.md`. The DeepSeek key
> (`****WpQs`) was dead (401 invalid + 402 insufficient balance) → those workers died — not Anthropic.
> **Fixed:** all 6 switched to `provider: anthropic` (opus ×5, sonnet for cleanup-agent) → all resolve to Max;
> malformed `ANTHROPIC_TOKEN=https://platform.claude…` blanked in 4 profile `.env` files;
> `kanban.max_in_progress: 2` added to cap the shared Max pool. Config backups: `~/.hermes/_config-backups/`.
> Remaining DeepSeek roles (coder + auxiliary helpers) still need a valid key (owner's choice). The
> `/claude-code` slash dispatch is one valid Max path, but **not** required — `provider: anthropic` already is one.

The PM and 5 of 6 council profiles run `provider: anthropic`, which in Hermes routes through the **metered
Anthropic API key**, *not* the Max-subscription OAuth quota. `~/.hermes/council/models.yaml` encodes the
misconception in its own header:

```
#   native-anthropic = provider: anthropic → bills Max subscription      <-- INCORRECT in practice
#   /claude-code     = dispatched via `claude -p` CLI → bills Max subscription   <-- the ONLY Max path
```

**Why `provider: anthropic` ≠ Max:** the Anthropic SDK/CLI credential precedence is *API key → auth token →
OAuth profile* — **first match wins, and a set `ANTHROPIC_API_KEY` (even empty `""`) silently outranks the
Max OAuth login** (confirmed in the `claude-api` reference: *"profiles are only consulted when no API key is
set"*). So with a key present, `provider: anthropic` bills the metered API.

**Observed cascade:**
1. Opus council workers + PM hit the **API** (finite quota), not Max.
2. API quota **maxed out** → workers fail mid-turn, exit `rc=0` → logged as protocol violations (D2), and
   `failure_limit=1` then **permanently blocks** them.
3. Delegation became unproductive → PM **degraded into a doer** (terminal+write_file, zero `kanban_*`).
4. PM session went **idle at 06:18** (quota-stalled). Even `WebSearch`/`WebFetch` now fail with *"monthly
   spend limit"* — same root cause.

**Grounding (read-only):** `providers.py:281` `"claude-code":"anthropic"`; `runtime_provider.py:1259,1710`
fallbacks say *"run `claude setup-token`, or authenticate with `claude /login`"*; `config.yaml:1-3` default
`provider: anthropic`; `council/models.yaml` (5× `native-anthropic`, researcher/coder on OpenRouter).

---

## 1. Live observation (read-only)

| Signal | Value |
|--------|-------|
| PM process | pid 69301, session `20260629_043437_4b754f`, `claude-opus-4-8`/`anthropic`/`cli` |
| PM activity | API call #41 by 06:05; **idle 06:18** (confirmed: 7 min no activity) — quota-stalled |
| PM work | "VPS Maintenance — Final Report" via terminal+write_file |
| Board | **blocked 19 · done 43 · ready 3 · todo 37**; **running 0**; **done last 30 min: 0** → STALLED |

---

## 2. Verified defect catalog (file:line fix-sites)

### Blockers

**D0 — API-vs-Max billing.** (see §0) `council/models.yaml` + `config.yaml:1-3`. Opus on `provider: anthropic`
bills metered API; quota maxed → whole pipeline died. **Fix:** route Claude turns via `/claude-code` (`claude -p`)
+ unset `ANTHROPIC_API_KEY`; see §6.

**D1 — Invalid assignees never dispatch.** 6×`worker` + 6×`agent` tasks target non-existent profiles (only 8
real profiles exist). `create_task()` normalizes via `_canonical_assignee()` but **never validates**.
- `kanban_db.py:2434-2450` — after assignee normalization, add `profile_exists()` validation that raises naming valid profiles.
- `kanban_db.py:7201-7209` — dispatcher silently buckets invalid as `skipped_nonspawnable` with **no event/log**; add `_append_event(... 'dispatch_skipped' ...)` + `_log.warning`.
- Data: `UPDATE tasks SET assignee='orchestrator' WHERE assignee IN ('worker','agent') AND status IN ('todo','ready')` (after the validator exists, to re-map the 12 stranded tasks).
- **Verify:** `sqlite3 ~/.hermes/kanban.db "SELECT COUNT(*) FROM tasks WHERE assignee IN ('worker','agent')"` → 0.

**D2 — Protocol-violation epidemic.** *(prior "missing kanban tools / bad exit" theory REFUTED by verification.)*
Real cause: workers die on the **D0 quota failure** mid-turn and exit `rc=0`; the `os._exit(0)` is intentional
(zombie prevention, issue #28181) and kanban tools **are** present. The damage is that one violation →
`failure_limit=1` → permanent block with **no auto-recovery**.
- `kanban_db.py:6525` (and `detect_crashed_workers` ~`6413-6418`) — for `protocol_violation`, record the outcome and **requeue (status→ready)** up to a retry cap instead of immediate `failure_limit=1`/block.
- **Verify:** after D0 fix, a protocol-violated task transitions `ready→running` on the next dispatch tick rather than staying `blocked`.

**D4-blocker / L4 — Stale dispatcher singleton lock = the actual board freeze.** A singleton dispatcher lock has
been held since the 06-28 corruption event, so **no gateway can dispatch** (this is *why* the board is frozen,
beyond D0/D1). Three sub-causes:
- `gateway/run.py:6453-6455` — dispatcher watcher task created fire-and-forget, **not** registered in `self._background_tasks`, so SIGTERM never cancels it and the lock is never released. Add it to `_background_tasks` with an `add_done_callback(discard)`.
- `gateway/kanban_watchers.py:1113-1185` — wrap the dispatcher loop in `try/finally` to release the lock even on cancellation/loop-close.
- `gateway/kanban_watchers.py:702-711` `_acquire_singleton_lock()` — add **stale-lock detection**: on failed acquire, read the holder PID and force-release if the PID is dead.
- Data: remove stale `kanban.db.dispatch.lock` / `kanban.db.init.lock` (06-28 19:20).
- **Verify:** SIGTERM mid-tick logs "releasing lock"; a fresh gateway reclaims a dead-PID lock; board starts promoting.

**L5-A — Duplicate Telegram polling (active).** All ~7 council gateways share one bot token → continuous HTTP 409.
- `plugins/platforms/telegram/adapter.py:1616` (+ 7 LaunchAgent plists, `~/.hermes/.env`) — only the root/PM gateway should poll Telegram; set empty `TELEGRAM_BOT_TOKEN` for the 6 council profiles, or dispatch council via kanban only.
- **Verify:** `ps aux|grep gateway` ≤2; no "Telegram polling conflict" in 60 s of `agent.log`.

**L6 — Kill switch (Piece 1) & user_message routing (Piece 2) completely unimplemented.**
- Piece 1: `gateway/kanban_watchers.py:1113-1134` add a dispatch-pause sentinel check (`~/.hermes/kanban/.dispatcher.pause`); `kanban_db.py` after line 3680 add `release_all_claims()`; create `hermes-kill`/`hermes-resume` scripts.
- Piece 2: `plugins.py:128-200` add `user_message` to `VALID_HOOKS`; invoke it in `conversation_loop.py` (~1083-1108, before the LLM call); bypass-token parser (`/chat` `/ask` `--direct`) in `cli.py` (~1200-1300).
- **Verify:** `hermes-kill` writes the sentinel and dispatch pauses next tick; a non-bypass prompt creates a `ready` kanban task.

**L7-005 — Legitimate delivery starved by pollution.** 8 reviewer R-verification tasks blocked behind 22
VPS-cleanup tasks. **Fix:** archive the VPS pollution (below) so reviewer tasks dispatch.

**L9-1 — Fusion Council (Piece 4) unimplemented.** No `invoke_fusion_council`; `config default_preset: fusion`
is a *local* MOA preset, not the OpenRouter server-side panel the design specifies.
- `kanban_db.py` dispatch loop ~`7040-7103` — on delivery-confirmation create a `FUSION:` task on OpenRouter; `council/orchestrator.md` after ~line 151/172 add the delivery-gate section; `config.yaml:471-495` clarify the preset.

### High / medium

**D3 / L3 — PM schema-blindness + dual-DB path.** PM monitoring SQL uses non-existent columns
(`outcome`,`updated_at`,`archived_at`,`reason`,`parent_ids`,`claim_payload`,…). Verification found the **DB-path
code is correct** (`kanban_db.py:21-23` maps `default`→`~/.hermes/kanban.db`); the breakage is in the **docs the
PM follows**, which point at the stale `~/.hermes/kanban/boards/default/kanban.db` (118 KB, frozen 06-28 19:18).
- Fix `PM-KANBAN-OPERATIONS.md:620` (and `~/.hermes/council/PM-KANBAN-OPERATIONS.md:605`): replace the stale path with `~/.hermes/kanban.db`, and replace raw-SQL examples that use bogus columns with `hermes kanban` CLI calls or correct column names.
- Remove/archive the orphan `kanban/boards/default/kanban.db`.

**L5-B / L5-C — config noise.** `config.yaml:16` invalid `service_tier: 'flex'`; `gateway/shutdown_forensics.py:143`
mislabels macOS launchd as `under_systemd=yes` (this is **launchd**, not systemd).

**L7 — Board pollution / watchdog.** `scripts/vps-cleanup-watchdog.sh` (06-29 05:22) + auto-decomposer created
22 VPS tasks (PHASE-1..8, A1..A7) and 1 stuck auto-decomposed task (`t_272acb43`).
- Archive: `... WHERE title LIKE 'PHASE%' OR title LIKE 'A_:%'`; stop/disable the watchdog; `kanban_decompose.py:239-244` is where decomposition sets assignees (ensure valid).

---

## 3. PM adherence audit vs `PM-KANBAN-OPERATIONS.md` (L8 — 10 breaches)

Session `20260629_043437_4b754f`: **38 terminal calls, 6 write_file, 0 `kanban_complete`/`kanban_block`, 0 QA gates, 0 cycle report.**

| Breach | Rule | Fix-site |
|--------|------|----------|
| L8-01 Zero delegation (does work itself) | "Delegate 100% / zero implementation" | ops doc §1; **routing hook (Piece 2)** to force kanban-first |
| L8-02 No PM CYCLE REPORT | §3 lines 347-384 | PM exit handler in `config.yaml` |
| L8-03 Zero QA gates | §4 lines 166-185 | QA-gate task template / cron after orchestrator completion |
| L8-04 19 blocked, no unblock (SLA breach) | §6 lines 386-423 | `pm-blocker-audit` cron |
| L8-05 12 invalid-assignee tasks | §2 line 48 | D1 validator + data fix |
| L8-07/08 VPS work + watchdog created directly | anti-patterns | delete watchdog; delegate; optional PM tool-guard |
| L8-10 No Fusion Council | §1 lines 87-101 | L9 |

**Root (not excuse):** both PM levers were broken — dispatch (D1/D4) and observation (D3) — and the model path
(D0) was quota-dead, so the PM had no *compliant* way to progress.

---

## 4. Pieces 1–4 wiring status

| Piece | Built? | Evidence |
|-------|--------|----------|
| 1 — Kill switch | **No** | L6-P1 (no scripts, no sentinel, no `release_all_claims`) |
| 2 — user_message routing | **No** | L6-P2 (not in `VALID_HOOKS`, no invoke site, no bypass parser) |
| 3 — Serialized DAG | partial | board exists; dispatch broken by D0/D1/D2/D4 |
| 4 — Fusion Council | **No** | L9 (design-only; `default_preset:fusion` is local MOA) |

---

## 5. Confirmed environment facts

- 8 real profiles: orchestrator, reviewer, tester, analyst-programmer, coder, researcher, solutions-architect, cleanup-agent. PM = top-level default profile (`SOUL.md`).
- Real `tasks` columns (use these, not the schema-blind set): `id,title,body,assignee,status,priority,created_by,created_at,started_at,completed_at,result,consecutive_failures,worker_pid,last_failure_error,last_heartbeat_at,block_kind,block_recurrences,…`; links in `task_links`.
- Canonical DB `~/.hermes/kanban.db`; orphans `kanban/boards/{default,completed}/kanban.db`.

---

## 6. Max-subscription routing architecture (recommended) — web-confirmed

> **Goal:** maximise Max-subscription usage by routing all Opus work through `/claude-code` (`claude -p`) instead
> of `provider: anthropic` (API). All items confirmed against the official Claude Code authentication docs and
> current (2026) Max rate-limit reporting — see Sources at the end of this section.

### 6.1 The credential-precedence rule (the exact mechanism)

Claude Code resolves credentials in this **fixed order** (official auth doc — first match wins):

1. Cloud provider (`CLAUDE_CODE_USE_BEDROCK`/`VERTEX`/`FOUNDRY`)
2. **`ANTHROPIC_AUTH_TOKEN`** (`Authorization: Bearer`)
3. **`ANTHROPIC_API_KEY`** (`X-Api-Key`) — **"In non-interactive mode (`-p`), the key is always used when present."**
4. `apiKeyHelper` script output
5. **`CLAUDE_CODE_OAUTH_TOKEN`** (from `claude setup-token`)
6. Subscription OAuth from `claude /login` (default for Pro/Max/Team/Enterprise)

So the Max path (#5/#6) is **preempted by any of #2–#4**. In headless `claude -p` (which the Hermes dispatcher
uses to spawn workers) a present `ANTHROPIC_API_KEY` is **always** used — no prompt — and **bills the metered API**.
That is exactly D0. The cure is to make sure #2–#4 are absent so resolution falls through to the Max OAuth.

### 6.2 Wiring steps

1. **Authenticate Claude Code to Max.** Interactive `claude /login` (browser OAuth, stored in the macOS Keychain),
   or for headless/automated runs mint a **one-year** token: `claude setup-token` → it prints once (not saved) →
   `export CLAUDE_CODE_OAUTH_TOKEN=<token>` in the gateway/worker env. Requires a Pro/Max/Team/Enterprise plan;
   scoped to inference only.
2. **Unset the preempting credentials everywhere `claude -p` runs** — gateway env, the 9 LaunchAgent plists, and
   `~/.hermes/.env`: `unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN`, and ensure no `apiKeyHelper` returns an API
   key. (Truly unset, not `""` — an empty value still wins its slot.) Matches memory `anthropic-key-skip-max-subscription`.
   **Verify with `/status`** (or `claude` `/status`): the *Auth token* field should read `CLAUDE_CODE_OAUTH_TOKEN`
   (or subscription), **not** API key.
3. **Default model → `deepseek-v4-pro`** (OpenRouter, off-Max) for the PM's own orchestration + the non-Claude
   council roles (researcher/coder). Switch the 5 Claude council profiles (orchestrator, solutions-architect,
   analyst-programmer, reviewer, cleanup-agent) from `billing_pathway: native-anthropic` to the **`/claude-code`**
   pathway so their Opus turns dispatch via `claude -p` on Max.
4. **Serialize Opus work — confirmed essential.** Subagents (Task tool) and nested `claude -p` invocations **share
   one account rate-limit pool** — there are no per-agent quotas. Max enforces a **rolling 5-hour window** (doubled
   2026-05-06; peak-hour throttling removed) **plus two weekly caps** (all-models + Sonnet-only), and the pool is
   **shared across Claude chat + Claude Code**. High fan-out exhausts per-minute RPM/ITPM/OTPM → 429; sustained
   concurrency → **HTTP 529 overloaded**, which Claude Code currently **mislabels as "Rate limited" and hard-fails
   without backoff** (known bug). → cap concurrent `claude -p` at **≤1–2 Opus**, ramp gradually (acceleration
   limits punish bursts), add exponential backoff that does **not** count 529 against the rate-limit timer, and
   `/compact` to cut per-request tokens.
5. **Opus-plan / Sonnet-execute.** Opus burns the Max pool ~5× faster than Sonnet. Anthropic's built-in
   `/model opusplan` plans with Opus and executes with Sonnet — apply the same split to the council (Opus for
   solutions-architect/reviewer planning; Sonnet for analyst-programmer/coder execution) to stretch the Max quota.

### 6.3 Two viable shapes (owner's choice)

- **(a) Per-profile `/claude-code` pathway** — each council worker the dispatcher spawns wraps `claude -p` on Max.
  Simplest mapping to the existing 8-profile model; serialize via the dispatcher concurrency cap (step 4).
- **(b) deepseek PM spawns `claude -p`** — PM/orchestrator runs on deepseek (off-Max, cheap) and explicitly shells
  `claude -p` (or `delegate_task` → claude-code) for heavy reasoning, then fans out sub-agents on Max. Maximises
  Max headroom by keeping all orchestration off-Max; matches the owner's stated design.

### 6.4 ⚠ Terms-of-service note

Using the **official `claude` binary** via `claude setup-token` for your own scripts/CI is the **sanctioned** path.
The ToS risk is routing subscription OAuth through *third-party* apps that reverse-engineer the OAuth to hit the
API directly. Hermes invoking the official `claude -p` binary sits on the sanctioned side, but review Anthropic's
current OAuth-usage policy before scaling an automated fleet. (Not legal advice.)

### Sources (§6)
- [Claude Code — Authentication (precedence, setup-token, CLAUDE_CODE_OAUTH_TOKEN, apiKeyHelper)](https://code.claude.com/docs/en/authentication)
- [Claude Code OAuth vs API key billing, 2026 (invoice-shock precedence gotcha)](https://lalatenduswain.medium.com/claude-code-on-claude-max-plan-understanding-oauth-token-vs-api-key-authentication-in-2026-96a6213d2cde)
- [Claude Code headless self-hosting guide (2026)](https://amux.io/guides/claude-code-headless/)
- [Models, usage, and limits in Claude Code — Help Center](https://support.claude.com/en/articles/14552983-models-usage-and-limits-in-claude-code)
- [What is the Max plan? — Help Center](https://support.claude.com/en/articles/11049741-what-is-the-max-plan)
- [Claude Code usage limits 2026 — 5-hour doubled, weekly caps by plan](https://www.morphllm.com/claude-code-usage-limits)
- [HTTP 529 mislabeled as "Rate limited", hard-fails parallel subagents — claude-code#68502](https://github.com/anthropics/claude-code/issues/68502)
- [Anthropic API rate limits (RPM/ITPM/OTPM, 429 vs 529)](https://platform.claude.com/docs/en/api/rate-limits)

---

## 7. Recommended surgical fix sequence (safe order)

1. **Piece 1 kill switch** (L6-P1) — build the safety net first (sentinel + `release_all_claims` + scripts).
2. **D0 Max-OAuth routing** (§6) — unset `ANTHROPIC_API_KEY`; auth Claude Code to Max; switch council Claude profiles to `/claude-code`; deepseek default. *Prerequisite for everything else.*
3. **D4 dispatcher lock** — register watcher in `_background_tasks`, `try/finally` release, stale-lock detection; clear stale lock files. *Restores dispatch.*
4. **D1 assignees** — add create-time validation + dispatch telemetry; re-map the 12 stranded tasks.
5. **D2 protocol-violation recovery** — requeue instead of `failure_limit=1` block.
6. **D3/L3 PM observability** — fix ops-doc SQL/paths; remove orphan DB.
7. **L7/L8 hygiene** — archive 22 VPS tasks; stop watchdog; PM resumes delegation.
8. **L5 stability** — Telegram single-poller; `service_tier`; launchd mislabel.
9. **Piece 2 routing hook** (L6-P2) — enforce delegate-by-default with bypass tokens.
10. **Piece 4 Fusion Council** (L9) — final adversarial gate on delivery.

---

## 8. Status of investigations

- ✅ 9-lane read-only diagnosis **recovered from transcripts** (the workflow threw on one lane's structured-output
  cap, but all 9 lanes' investigate+verify results were salvaged from the journal — not re-run, to conserve the
  exhausted spend budget). Full JSON: `$CLAUDE_JOB_DIR/tmp/diag_results.json`.
- ✅ **Online Max-OAuth research COMPLETE** — direct `WebSearch`/`WebFetch` succeeded (spend limit lifted). All
  three previously-pending items confirmed against the official Claude Code auth doc + 2026 Max limit reporting;
  §6 rewritten with the exact credential-precedence order and citations.
- PM idle-watcher fired: **PM idle at 06:18** (fix window open per owner's "fix when PM idle").

---

## 9. Runtime session 2026-06-29 (later) — observer log + findings-board handoff

Owner directive mid-session: **observer-only** — observe, document, file kanban tasks for the PM; do **not** write code or change the pipeline. Live observations this session:

- **Max wiring (original task) — DONE & validated.** All 6 council profiles + PM resolve to `provider=anthropic, base=api.anthropic.com, _is_oauth_token=True, source=claude_code` (Max OAuth). Live `messages.create` → **HTTP 429, never 401** (auth accepted on Max pool). cleanup-agent on sonnet; opus ×5. coder/researcher off-Max (OpenRouter) by design. `kanban.max_in_progress: 2` added. Config backups: `~/.hermes/_config-backups/20260629_104304_maxwire/`.
- **Board hygiene — DONE by the council.** A cleanup-agent worker archived **58** stale/pollution tasks (PHASE-*/A*-VPS/Docker/invalid-assignee/stale V-R*); default board now `done=44, blocked=1`.
- **D2 confirmed LIVE.** Observer-created reroute task `t_d2a287be` (analyst-programmer, Opus/Max) → `protocol_violation` ×2 → `gave_up` (effective_limit=1). Config left intact (no partial write). The failed `blocked` task still sits on the **default** board — recommend the PM archive it (the requirement is re-filed cleanly as a finding).
- **Max-429 throttle LIVE.** The shared Max pool (5h + weekly, shared with Claude chat + this Claude Code session) 429s Opus workers mid-turn → surfaces as D2. Sonnet worker completed in the same window. → serialize Opus + rate-limit-aware requeue (findings on board).
- **CLI quirk.** `hermes kanban archive <~59 ids>` silently no-ops; batches of ≤10 work.

**Handoff:** 12 documented findings filed on a separate observer backlog board **`pipeline-findings`** (`~/.hermes/kanban/boards/pipeline-findings/kanban.db`), unassigned/ready (inert — no dispatcher on that board). The PM owns decomposition → analysis → assignment → delivery. The orchestrating EPIC is `t_2dd98c0a` (Autonomous PM-driven delivery pipeline → production, loop to 100%). This file remains the authoritative detail for each finding.
