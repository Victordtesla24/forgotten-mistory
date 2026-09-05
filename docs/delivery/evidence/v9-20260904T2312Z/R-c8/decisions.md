# Decisions taken on the Owner's behalf — review c8

## D-c8-1 — "Sixteen years" stays (adversarial F-4, polish)

- **Finding:** the CV's headline says "15+ years"; the hero and About say "Sixteen years".
- **Evidence:** the CV's own dates run May 2010 (MYOB) to the present (September 2026), which is 16.3 years; `app/data/portfolio/experience.ts` computes the same axis from the CV dates.
- **Decision:** keep "sixteen" — it is the CV's dates stated exactly, not a claim above the evidence; "15+" is the CV's rounded headline. If the Owner prefers the CV's headline wording, the change is two strings (`hero.ts` statement, `about.ts` Experience Level) and the MiniVic greeting. Reversal cost: one cycle.

## D-c8-2 — hero portrait at 390 stays an 88 px stamp (composition item 9 vs research spec P1)

- The placement research (B-research/02) specified the 88 px stamp at the eyebrow row on phones so the H1 keeps its first-screen position; the c8 composition reviewer proposes a static full-width portrait after the lede. The stamp keeps the one-fold requirement (TC-HERO-12) reachable; the full-width portrait would push the actions below 844 px. Keep the stamp; revisit only with a measured fold budget.
