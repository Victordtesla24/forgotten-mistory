# ORCHESTRATOR REALIGN + RESUME PLAYBOOK

**Issued:** 2026-09-05T09:35:00Z by host operator  
**Paused agent:** Owner paused workflows. When Owner says resume, execute this playbook with **MAXIMUM PROMPT EXECUTION ACCURACY**.  
**Sole source of truth:** [`docs/prompt.md`](prompt.md) — this file restores adherence; it does not replace the prompt.

---

## Host fixes already in place (do not redo)

| Fix | Detail |
|-----|--------|
| O1 VPS metronome | `fm-deploy-cadence.timer` → every **10 min** `gh workflow run deploy.yml` (skips if Deploy already running). Log: `/var/log/fm-deploy/cadence.log` |
| Hermes | `hermes-gateway` + `hermes-dashboard` **stopped and disabled** — do **not** start them |
| §5 profiles | `/root/.sub-agents/claude-roles/{reviewer,solutions-architect,analyst-programmer,cleanup-agent}.*` + `/root/.sub-agents/hierarchy/profile_map.yaml` |
| HTML cache | Live `Cache-Control: public, max-age=0, must-revalidate` — re-verify every cycle |

---

## On RESUME — first 5 minutes (HARD)

1. Re-read **`docs/prompt.md`** §0.1–§0.4, §0.2 O1–O6, §5, §6 in full.
2. Claim **`t_realign01`** (Ready → Running) and close it only when its gates pass.
3. Scan board: continue in-flight UI tasks; **do not** re-open Done work (§0 Continuity).
4. Confirm cadence:
   ```bash
   systemctl is-active fm-deploy-cadence.timer   # must be active
   systemctl is-active hermes-gateway.service || true  # must NOT be active
   gh run list -R Victordtesla24/forgotten-mistory --workflow=deploy.yml --limit 8
   curl -sI https://forgotten-mistory.web.app/ | grep -i cache-control
   ```
5. **Ship visible UI/UX every ≤10 minutes** while work exists (O1/O5):
   - Each cadence window: at least one merged change that a recruiter can *see* (hero/about/experience/skills/vitrine/listen/motion/contrast/copy), **or** a recorded live verification that production already matches the latest verified slice.
   - Idle “docs-only” cycles that leave the page looking identical **fail O5**.
   - Push to `main`; the VPS timer + `deploy.yml` publish. Do not wait on GitHub `schedule` alone.

---

## Operating rules (non-negotiable)

| Rule | Action |
|------|--------|
| §0.1 Non-interactive | Never ask Owner; never wait for approval |
| Credits / 402 | §0.4 failover to Anthropic **OAuth**; ship achievable UI without Higgsfield/IVC; **no “Owner-blocked” parking** |
| Profiles | Spawn **only** §5 names via `profile_map.yaml` |
| PEA | Loop until criteria pass; cycle report must not claim O1 met without Deploy evidence ≤10 min |
| Hermes | Forbidden |
| ANTHROPIC_API_KEY | Forbidden — OAuth only |

---

## Incremental UI cadence (every 10 min)

Pick the highest-impact incomplete board UI task → dispatch `analyst-programmer` (xhigh) → independent `reviewer` on **live URL** → merge to `main` → confirm Deploy success + `build-commit` on live page → open next slice. Cap each agent run ≤30 min (O1). Parallelize under O4 without deadlocking Deploy.

### Verification snippet (paste into every cycle report)

```bash
systemctl is-active fm-deploy-cadence.timer
tail -5 /var/log/fm-deploy/cadence.log
gh run list -R Victordtesla24/forgotten-mistory --workflow=deploy.yml --limit 6 \
  --json createdAt,event,conclusion,displayTitle
curl -fsS https://forgotten-mistory.web.app/ | grep -o 'build-commit" content="[^"]*"'
curl -sI https://forgotten-mistory.web.app/ | grep -i cache-control
```
