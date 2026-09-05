# ORCHESTRATOR RECTIFICATION PROMPT

Paste into the **running** terminal-19 claude session (or a fresh ultracode session if you restart). This supersedes soft “waiting on workflows” behaviour for the next hour.

---

**RECTIFY NOW.** Host compliance audit found you **PARTIAL**: intake/§5/reviewer OK; **O5 first-ship FAIL** (~26m); Playwright soft-gating; MiniVic spawn delay; Hermes process hygiene.

Read and obey:

1. `docs/adversarial/ORCH-COMPLIANCE-20260905T1245Z.md`
2. `artifacts/kanban/INBOX/RECTIFY-20260905T1252Z.md`
3. Still bound by `docs/prompt.md` + `docs/ORCHESTRATOR-LAUNCH-PROMPT.md`

**Immediate actions (non-interactive, ≤5 minutes to first push):**

- Unblock: do **not** wait for Playwright green before push (O3).
- Push all ready P0 WIP (G-H1, any MiniVic leftovers, G-S1 if buildable).
- `kanban_complete` gaps that already have independent live PASS (G-V1+).
- Confirm `pgrep -af 'hermes gateway'` empty; `fm-deploy-cadence.timer` active.
- After next Deploy, spawn **reviewer** on live for G-H1 / G-M1 / G-M2 / G-A1c.

Do not ask the Owner. Do not start Hermes. Ship visible UI this cadence window.

---
