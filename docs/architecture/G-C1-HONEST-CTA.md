# G-C1 — Honest engagement CTA (Listen + Vitrine)

**Task:** `t_g2_c1` · **Adversarial cycle:** ADV-1556Z · **Role:** solutions-architect (§5)
**Decision:** CONFIRM orchestrator §0.1 — honest email labels; no invented calendar URL.
**Scope:** architecture note only. Implementation ships in `t_g2_c1b` (analyst-programmer).

## 1. Problem restatement

G-C1 acceptance is binary: on the Listen close **and** the Vitrine engage plate,
either (a) drive a **real** calendar URL sourced from a **named env key**, or
(b) rename the plates so they do not claim `Book` / `Start a project` when only a
`mailto:` exists. Two different pretend products / two different mailto promises
= FAIL. Same inbox is allowed.

## 2. Evidence — no calendar key exists (names only, never values)

Read by key NAME from `/root/.claude/.env.production`; never `source`d, never printed:

```bash
grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' \
  | grep -ciE 'cal|calendar|book|schedul|meet'
# => 0
```

**0 matches.** There is no calendar/booking/scheduling key. Therefore path (a) is
impossible without fabricating a URL, and a calendar link that 404s is worse than
none. **Path (b) — honest labels — is the only correct design.** No Cal.com /
Calendly / booking URL may be invented (G-C1, `docs/architecture/LISTEN-FLAGSHIP.md` §3.1).

## 3. origin/main state being corrected (the 1556Z lie)

- `app/data/portfolio/listen.ts` → `engage.label = 'Book a 20-minute call'` — the
  verb **Book** promises a booking tool that does not exist; the `href` is a
  `mailto:` carrying `ENGAGE_SUBJECT` + the existing four-line `ENGAGE_AGENDA` body.
- `app/data/portfolio/vitrine.ts` → `engagement.label = 'Start a project'` — a
  second, distinct pretend product / booking verb over the same `mailto:` inbox.

Both mislead: the mechanism is email, the labels claim scheduling/commitment.

## 4. Confirmed decision — exact replacement labels

| Plate | File · symbol | Current (origin/main) | Honest label (confirmed) | href (unchanged) |
|-------|---------------|-----------------------|--------------------------|------------------|
| Listen close | `listen.ts` · `engage.label` | `Book a 20-minute call` | **`Email a 20-minute-call agenda`** | `mailto:` + subject + existing 4-line `ENGAGE_AGENDA` body |
| Vitrine engage | `vitrine.ts` · `engagement.label` | `Start a project` | **`Email a project brief`** | `mailto:` + subject (no fabricated URL) |

### Why these two are honest and not "two pretend products"
- Both lead with the verb **Email**, which names the actual mechanism (`mailto:`).
  Neither claims a booking/scheduling/commit action that no key backs.
- Both resolve to the **same inbox** (`contact.email`); the differing subject lines
  ("20-minute call" agenda vs. "project brief") are honest descriptions of what the
  visitor is sending, not two competing products. Same-inbox is explicitly allowed;
  the FAIL condition is inventing two distinct fake booking systems, which this does not.
- Listen keeps its existing four-line `ENGAGE_AGENDA` body — the label
  "Email a 20-minute-call agenda" describes exactly that payload, so copy and
  behaviour now agree.

## 5. Constraints for the implementer (`t_g2_c1b`)

1. Change **label strings only**. Keep `subject`, `agenda`, and the `mailto:` `href`
   construction intact — the four-line agenda body stays.
2. `listen.ts engage.label` MUST NOT contain the word **Book**.
3. `vitrine.ts engagement.label` MUST NOT contain **Start a project**.
4. No `cal.com` / `calendly` / any calendar URL introduced anywhere.
5. Verify built output carries no stale label:
   ```bash
   grep -rn "Book a 20-minute\|Start a project" out/ || echo "clean"
   ```

## 6. Quality gates (this note)

- [x] No invented calendar URL — env has 0 calendar key names (§2).
- [x] Exact honest labels named for both plates (§4).
- [x] Decision logged (this file, docs-only branch `worktree-gc1sa-1556`).

**goal_complete: true** — decision confirmed; implementation delegated to `t_g2_c1b`.
