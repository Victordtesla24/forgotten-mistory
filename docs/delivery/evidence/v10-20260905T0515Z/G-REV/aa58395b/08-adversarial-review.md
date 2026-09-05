# Adversarial live review — `aa58395b`

- **Reviewer identity:** `rev-aa58395b-c19` (fresh, independent; not an implementer; did not resume `a9d720a4` or any AP).
- **Target:** live `https://forgotten-mistory.web.app/` only.
- **Deploy run:** `33983551491`.
- **Verdict:** **FAIL** (commit's own deliverable G-L1 **C3 PASS**, but G-L1 **overall FAIL** — reading still `—`; other P0 gaps remain open/unverified).

## 0. Live probe — headers & build

```
HTTP/2 200
cache-control: public, max-age=0, must-revalidate
content-type: text/html; charset=utf-8
last-modified: Sat, 05 Sep 2026 18:17:59 GMT
```

- `<meta name="build-commit" content="aa58395b"/>` — matches expected `aa58395b`. ✔
- Ancestry (in `origin/main`, tip `aa58395bd85c…`):
  - `35b4f39` (t_l1_04 gold) **IS ancestor** ✔
  - `47b6f0e` (G-V3 tier fix) **IS ancestor** ✔
  - `8d772fb9` **IS ancestor** (not rubber-stamped; re-derived below) ✔

Worktree `worktree-rev-aa58395b-c19` created from `origin/main`; HEAD `aa58395bd85c7a06026e834a3bb3456758c75adb` === live build-commit. Source under review is exactly what is served.

## 1. G-L1 — Listen (this commit's focus)

### C3 (gold ONLY on LinkedIn+GitHub) — **PASS**
Live CSS (`/_next/static/css/…`), single gold rule keyed off the data attribute, never a hardcoded index:

```
.Listen_arrival__CwLkO[data-arrival=external] .Listen_arrivalJawLeft__95c5k,
.Listen_arrival__CwLkO[data-arrival=external] .Listen_arrivalJawRight__w0ocr{stroke:var(--gold);opacity:.85}
--gold:#c9a84c;
```

Live SSR DOM — four arrival marks, `data-arrival` set from `channel.kind`:
- `data-arrival="email"` (x=38) — **grey** currentColor (`--mist-400`), no gold ✔
- `data-arrival="phone"` (x=118) — **grey**, no gold ✔
- `data-arrival="external"` (x=198, LinkedIn) — **gold** ✔
- `data-arrival="external"` (x=278, GitHub) — **gold** ✔

Engage plate `data-cta="engage"` is `.engage{background:var(--white)}` — **white, never gold** ✔. Envelope (engage mailto) + four arrivals live ✔.

### G-L1 overall — **FAIL**
Live reading text node renders `—` (dash):
```
<text class="Listen_reading___amBx" … >—</text>
```
Reading = measured greeting duration (clause C5) is **not** in this commit. Per directive, C3 scored PASS separately, but G-L1 **overall FAILs** while the reading is still a dash.

## 2. G-M4 — Hosting `POST /api/chat` TTFB — **PASS (TTFB clause); R3 OPEN**

Valid streaming body `{"messages":[{"role":"user","content":"What did Vikram do at the ATO?"}],"mode":"hiring","stream":true}` against **Hosting** origin `forgotten-mistory.web.app/api/chat` (never a ping-400). All runs HTTP 200 with real SSE `data:{"delta":…}` tokens (answer about the ATO / Payday Super).

| run | TTFB (s) | http |
|-----|----------|------|
| 1 | 1.330 | 200 |
| 2 | 1.204 | 200 |
| 3 | 1.165 | 200 |
| 4 | 1.045 | 200 |
| 5 | 1.386 | 200 |
| 6 | 1.368 | 200 |
| 7 | 1.105 | 200 |

- **Median (7 runs) = 1.204 s**, max = 1.386 s — **every run < 1.5 s.** Author's "~1.25 s after shortening answers" is **verified**. R3 avatar stays **OPEN/honest** (not judged here).

## 3. G-V3 — Vitrine composited rest contrast — **PASS** (re-derived on this live, not from `8d772fb9`)

Live CSS confirms the tier system is shipped (white ink, real widths — not the prior `--mist-200` hairline):
```
.Drawings_primary__reZgd{stroke-width:1.7;stroke-opacity:1;opacity:1}
.Drawings_guide__LoZs1{stroke-width:1.4;stroke-opacity:.7;opacity:1}
.Drawings_label__SuZSS{color:var(--white);fill:currentColor;opacity:.85}
.Vitrine_plate__p2JME{…opacity:.82}   /* rest */
.Vitrine_plate__p2JME[data-lit]{opacity:1; background:…,var(--ink-900)}
--white:#f6f6f6;  --ink-900:#0a0a0a;
```
Ink is `--white` (#f6f6f6). Composited effective alpha = element-opacity × stroke-opacity; plate interior at rest is the dark section ground. The shader (`vitrine.glsl.ts`) adds **light only via alpha**, anchored on the **opaque** lit plate (`opacity:1` over `--ink-900`), so neighbours see only the low ambient wash (`0.055–0.09` luma). WCAG on composited channels:

- **Primary** (α≈0.82 white over `#0a0a0a`): ≈ **12:1**; even under gather-level ground (luma 0.30) ≈ **5.8:1** → **≥4.5 on all six** ✔
- **Guide** (eff α≈0.574): ≈ **6.3:1** at rest, ≈ **3.8:1** worst case → **≥3:1** ✔
- **Label** (eff α≈0.70): ≈ **8.9:1** at rest, ≈ **4.8:1** worst case → **≥4.5:1** ✔

25 `.primary` usages distributed across the six drawings (every plate carries ≥1 primary). All six plates at rest clear the bars. **PASS.**

## 4. G-C1 — engage plates / mailto honesty — **PASS**
No calendar env value exists; both engage plates are renamed to honest **Email** actions (neither says Book / Start a project):
- Listen: `Email a 20-minute-call agenda` → `mailto:…?subject=20-minute%20call…`
- Vitrine: `Email a project brief` → `mailto:…?subject=Engagement%20enquiry…`

Two distinct-purpose emails, both plainly labelled "Email …" — not two conflicting booking promises. **PASS.**

## 5. G-NEW-1 — MiniVic live pill freeze — **PASS**
Live CSS: `.minivic-launcher__pill{…display:inline-block}` and **zero** `display:none` rules on the pill at any width / media query. **PASS.**

## 6. Remaining GAP-BACKLOG (not addressed by `aa58395b`; not positively verified this cycle)

`aa58395b` is the t_l1_04 gold merge; it does not touch hero/about/experience/skills or scene mounts. No new live PASS evidence was produced for these this cycle, so they do **not** clear:

- **G-H1 / G-H5 / G-H6** (hero plane / ≥1080p asset ladder / palette memo): **OPEN — not re-verified on this live.**
- **G-A3** (about GL field): **OPEN — not re-verified.**
- **G-X2** (≥7 **visible cinematic** scenes at 60 fps w/ reduced-motion): **FAIL/OPEN — no positive live evidence of seven cinematic scenes; MiniVic viseme census is explicitly not a scene 7.**
- **G-E2 / G-S2** (P1 experience / skills): **OPEN — not re-verified.**

## Verdict

**FAIL.** This commit correctly ships its intended slice — **G-L1 C3 (gold on LinkedIn+GitHub only) PASS**, **G-M4 TTFB PASS (median 1.204 s)**, **G-V3 PASS**, **G-C1 PASS**, **G-NEW-1 PASS** — but **G-L1 overall FAILs** because the reading is still `—`, and several P0 gaps (notably **G-X2**, hero **G-H1/H5/H6**) remain open/unverified on this live. Orchestrator must keep the feedback_refactor_loop open (do not kanban-complete).
