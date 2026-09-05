# 01 — baseline, before any change

Worktree `.claude/worktrees/wf_d9fbfbaa-53a-1` cut from `main` at `36b0d52`
("docs(cycle): v10 cycle 04 — react 19 and cycle 15 live; cycle 20 dispatched"),
`npm ci` clean, static export built from that HEAD and served on
`http://127.0.0.1:5601` (`python3 -m http.server 5601 --directory out --bind 127.0.0.1`).

## What the sections looked like

`components/sections/Listen/Listen.module.css` before this change:

- `.listen` — `padding: clamp(6rem, 14vh, var(--space-20)) <gutter> clamp(2rem, 5vh, 3rem)`
  → 126 px top / 45 px bottom at 1440 (R-c13 CC-09).
- `.sentence` — `font-size: var(--fs-title)` → 54.4 px at 1440.
- `.channels` — `display: flex; flex-direction: column; gap: var(--space-1); max-width: 46rem`.
- `.channel` — `font-size: var(--fs-small)` (14 px), `color: var(--mist-200)`
  (`rgb(205, 205, 205)`), 21 px box (R-c13 CC-05).
- No element in `#listen` carried `data-cta="engage"`; the section's only
  interactive elements were the four plain-text anchors (R-c13 CC-02).

`app/data/portfolio/{hero,about,experience}.ts` all stated "Sixteen years" with
no anchor years beside the claim; `pdftotext -layout public/docs/Vik_Resume_Final.pdf -`
line 3 states "15+ year Senior Technical Leader" (R-c8 ADV-F-4 / R-c13 ADV-6).

## Gates at baseline

| gate | result |
|---|---|
| `npm ci` | exit 0 |
| `npm run build:static` | exit 0 |
| new specs (`02-tests-failing.log`) | 8 failed / 36 passed — the intended red |

The 8 red assertions were TC-LISTEN-09, TC-LISTEN-10, TC-LISTEN-11, TC-ABOUT-13,
AP-04, AP-05, CT-11 and one flake of TC-LISTEN-05 (which passes in isolation at
baseline and was re-pointed later for a real reason — see `07-decisions.md` §5).
