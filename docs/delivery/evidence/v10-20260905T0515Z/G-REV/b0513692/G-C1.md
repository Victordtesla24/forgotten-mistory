# G-C1 — Independent Adversarial Review (§5 reviewer, max)

- **task_id**: `t_rev_gc1`
- **Reviewer identity**: FRESH §5 reviewer — NOT the G-C1 author (`e4ec7e47`), NOT the `t_rev_adv1556` baseline.
- **Timestamp**: 2026-09-05T17:16:58Z (UTC)
- **Live target probed**: `https://forgotten-mistory.web.app/` (LIVE ONLY)
- **Live build-commit** (from page `<meta name="commit" content="…">`): `b0513692`
- **origin/main HEAD**: `b051369` (`consolidate: merge worktree-gv3-1556 into main`) — live matches origin/main.

## Binary acceptance under test (GAP-BACKLOG G-C1)

> Real calendar URL from a named env OR honest labels so plates do not say
> "Book" / "Start a project" when only `mailto:` exists. Two different `mailto:`
> promises labeled as booking / project-start = FAIL.
> If labels are "Email a 20-minute-call agenda" and "Email a project brief"
> → PASS G-C1 only (not R1/R4 full).

## Live HTML/DOM evidence

Fetched live HTML (`curl -s https://forgotten-mistory.web.app/`, 125,113 bytes).

### 1. Listen filled CTA — PASS
- Rendered label: **"Email a 20-minute-call agenda"** (NOT "Book a 20-minute call").
- Anchor class `Listen_channel__9UH85`.
- href (mailto, permitted): `mailto:sarkar.vikram@gmail.com?subject=20-minute%20call%20%E2%80%94%20Vikram%20Deshpande&body=What%20you're%20building%3A%0A…`

```
…&amp;body=…">Email a 20-minute-call agenda</a></li>
<li><a class="Listen_channel__9UH85" href="mailto:sarkar.vikram@gmail.com">…
```

### 2. Vitrine engage — PASS
- Rendered label: **"Email a project brief"** (NOT "Start a project").
- Anchor class `Vitrine_engage__MV11x`, `data-cta="engage"`.
- href (mailto, permitted): `mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry%20%E2%80%94%20Vikram%20Deshpande`

```
…answers a role enquiry answers a project brief.</p>
<a class="Vitrine_engage__MV11x" data-cta="engage"
   href="mailto:sarkar.vikram@gmail.com?subject=Engagement%20enquiry%20%E2%80%94%20Vikram%20Deshpande">Email a project brief</a>
```

### 3. Old dishonest labels — ABSENT
- `grep -oiE '(Book a 20-minute call|Start a project)'` over live HTML → **0 matches**.

## Verdict

| Check | Expected | Observed | Result |
|-------|----------|----------|--------|
| Listen filled CTA ≠ "Book a 20-minute call" | honest label | "Email a 20-minute-call agenda" | PASS |
| Vitrine engage ≠ "Start a project" | honest label | "Email a project brief" | PASS |
| hrefs may be `mailto:` | allowed | both `mailto:` | OK |
| Old labels absent | 0 | 0 | PASS |

**VERDICT: PASS — G-C1 only** (honest-labels path satisfied; hrefs remain
`mailto:`, so this is NOT R1/R4 full acceptance — a real named-env calendar URL
would be required for full R1/R4).

No implementation performed. No Hermes. ANTHROPIC_API_KEY never touched.
