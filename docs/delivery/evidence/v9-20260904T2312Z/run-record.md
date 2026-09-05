# v9 run record — unit · status · evidence · open points

Cadence from 2026-09-04T23:51Z (Owner directive): every verified increment lands on `main` and is deployed within ~10 minutes; no agent workflow runs longer than 30 minutes; every deployment gets an independent adversarial review plus a senior creative design council whose directions feed the next cycles.

| Cycle | Commit | Live verified | What | Evidence |
|---|---|---|---|---|
| 1 | 6dcb4f5 | 00:0x (`build-commit` 6dcb4f53) | toolchain green: dead components + 43 orphaned CSS rules removed, chat handler repaired, Playwright discovers 276 tests, 4K masters out of `public/`, 1.1 MB idle loop | `01-discoveries.md`, `masters-sha256.txt`, smoke 58/58, full suite 236/276 (`C5-regression/`) |
| 2 | (functions) | 00:05 | secrets refreshed, functions redeployed, `/api/chat` answers from a real model on production | `C2-chatbot-brain/06-deploy.log` |
| 3 | 5f05575 | 00:2x (`build-commit` 5f055759) | research-backed MiniVic introduction, six employer-ordered quick prompts, fallback | `B-research/01-employer-expectations.md`, 78 specs green |
| 5 | e64566e | 00:3x (`build-commit` e64566e3) | neutral black/white/gilt tokens at AA contrast, CSS-drawn provenance mark, Listen hairline off gold, compass numerals, hero note | `R-c1/council-composition.md` C1/C3/C7/C8a/P1; WCAG ratios computed; 77 specs + 2 intentional rebaselines |
| n8n | — | 00:20 (published) | both avatar workflows repaired and published (credit preflight, exact 24 fps, review autoFix off, autonomous approval gates) | `E-n8n/n8n-fix.md`, `E-n8n/publish.log` |
| 4 | in worktree | — | hero video portrait (placement P1), tests first | `C4-hero-portrait/` |
| 6 | in worktree | — | regression triage of the 40 cycle-1 failures | `C5-regression/` |
| 8 | in worktree | — | Listen caliper beat | `C8-listen-beat/` |
| review c1 | 6dcb4f53 | — | adversarial FAIL (F-1 re-scoped, F-2 fixed in cycle 5, F-3 partly fixed) · composition FAIL (C1/C3/C7 fixed, C2/C4/C5/C6/C8 open) · motion FAIL (M-01..M-08 open) | `R-c1/` |
| review c5 | e64566e3 | running | with `?gl=force` so the scenes are reviewed, not the fallback | `R-c5/` |

## Blocked on the Owner (cannot be closed by any agent)

- **OpenRouter balance −$5.38** → the chat ladder's first rung and every n8n paid generation return 402. The site works via the OpenAI rung; the n8n end-to-end 4K proof (~$0.85 WEB_PARITY proof; ~$10.5 per UHD asset per the v8 chunked-flux costs) waits for credits.
- **ElevenLabs tier `payg`, instant voice cloning not permitted** → `/api/tts` and any new cloned-voice greeting are refused; the deployed greeting MP3 keeps speaking its old fixed sentence, which no longer matches the new written introduction. Decision needed: plan upgrade, or a non-cloned voice labelled synthetic.
- **Security workflow red** on every push: `npm audit --audit-level=high` flags next 14.2.35 (patched in ≥15.5.21 / 16.3.4), browserslist, fflate. Upgrade is a dedicated cycle with the full battery (Phase F).

## Stale worktrees left by earlier agents (not touched; escalated per R8b)

`/var/tmp/dbg-wt`, `/var/tmp/v6-clean`, `/var/tmp/v6-wt/data-backend` (branch `wt/data-backend`, 3 unmerged test-only commits, dirty).
