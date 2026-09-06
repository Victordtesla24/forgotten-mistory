# TC-BOT-12 / TC-BOT-14 are pre-existing on `origin/main` — not R3-A2

`tests/e2e/chatbot.spec.ts` failed twice in the S-4 battery. Both failures were
re-run against a clean build of `origin/main` `afad076bdddbfb642fa2ecfaa9ec08b3c5fb3f4e`
in a second worktree with none of this slice's changes, and reproduce with
byte-identical geometry.

| | this branch (`3ba8ed9`, port 5621) | baseline (`afad076`, port 5622) |
|---|---|---|
| TC-BOT-12 | panel `{x:984,y:360,w:432,h:452}` covers h1 `{x:88.8125,y:522.203125,w:969.859375,h:117.59375}` | identical |
| TC-BOT-14 | panel `{l:984,t:360,r:1416,b:812}` covers glyph `{l:492,t:503,r:1051,b:657,"Deshpande"}` | identical |

The hero name now runs to `x≈1051` at 1440 px while the panel's left edge is at
`x=984`, so the two overlap by ~67 px. `04-panel-1440.png` in this directory
shows it.

Nothing in this slice can move either box: the diff is
`lib/visemeSchedule.ts` (new, imported by nothing yet),
`tests/viseme_schedule.test.mjs` (new), two build/generation scripts,
three generated modules under `app/data/generated/`, the greeting MP3, and a
comment in `components/sections/Listen/Listen.tsx`. No CSS, no hero source, no
panel geometry.

**Not fixed here** — the Hero is owned by another lane this session and this
task's scope is the alignment and the schedule library. Filed as a product
finding with the numbers above.

Commands:

```
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5621 npx playwright test tests/e2e/chatbot.spec.ts \
  --grep "TC-BOT-12|TC-BOT-14" --workers=1        # this branch  → 2 failed
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5622 npx playwright test tests/e2e/chatbot.spec.ts \
  --grep "TC-BOT-12|TC-BOT-14" --workers=1        # afad076      → 2 failed, same numbers
```

Everything else in the battery passed: 27 of 29 across
`tests/e2e/avatar-voice.spec.ts`, `tests/overhaul/viseme-stage.spec.ts`
(TC-VISEME-GL-01…03 green, unmodified) and `tests/e2e/chatbot.spec.ts`.
