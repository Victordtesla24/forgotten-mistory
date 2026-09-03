# The Trait Encoding Map

Run `v6-20260903T195241Z` · execution step 14 · **R-53, R-54** → **SC-34.1** → **Gate H**

> **SC-34.1.** *"Fifteen of fifteen traits traceable to an implemented mechanism."*
> Traceable means: a named mechanism, a file that carries it, and an assertion anyone can run.
> A trait whose mechanism is an adjective in a document is not traced.

---

## 0 · How to read this map

Each of the fifteen traits in **R-53** gets exactly one row. The **mechanism** column is
R-54's assignment, quoted or compressed — it is not re-invented here. **Where** is a real
path in `/root/forgotten-mistory`. **Assertion** is a command that either passes or fails
today; where the assertion does not exist yet it is written out in full so it can be
added without further design.

**Status is binary and honest:**

- **PRESENT** — the mechanism is implemented, and a line of code carries it.
- **TO BUILD** — the mechanism is not implemented, or only its measurable half is.
  Where part of it exists, the present half is stated so nothing already shipped is
  discarded (P-10, R-165).

Nothing in this file is marked PRESENT on the strength of a comment. Every PRESENT row
cites executable code or authored data, and — with one stated exception per row — an
assertion that already runs in `tests/`.

**Test harness.** `playwright.config.ts:11-16` declares no `webServer`: the static export
is built and served separately and the suite is pointed at it. Every assertion below is
therefore run as:

```bash
cd /root/forgotten-mistory
npm run build:static && npx serve out -l 8080 &          # or the CI export step
PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test <spec> -g '<id>'
```

---

## 1 · The map at a glance

| # | Trait | Mechanism (R-54) | Carried by | Status |
|---|---|---|---|---|
| 1 | Humility | restraint; whitespace; zero self-superlatives; one display-scale name | `components/sections/Hero/Hero.tsx`, `app/data/portfolio/skills.ts` | **PRESENT** |
| 2 | Experience | artefact depth from real delivery and repository data | `components/sections/Experience/Experience.tsx`, `app/data/generated/repo-harvest.json` | **PRESENT** |
| 3 | Career growth | a continuous scroll-linked progression thread accumulating across sections | *(no owner today)* → `components/site/ProgressionThread.tsx` | **TO BUILD** |
| 4 | Strategic vision | every Experience artefact framed context → decision → outcome | `app/data/siteContent.ts`, `components/sections/Experience/Experience.tsx` | **TO BUILD** |
| 5 | Technological excellence | the site as proof: 60 fps, silent console, sub-2 s LCP — **measured and visible** | `tests/perf`, `tests/overhaul` (measured) · footer (visible) | **TO BUILD** (measured half PRESENT) |
| 6 | Continuous learning | "keeping me busy" reads live and current; the channel strand is the strongest evidence | `components/sections/Vitrine/Vitrine.tsx` (repo strand) · channel strand absent | **TO BUILD** (repo strand PRESENT) |
| 7 | Integrity | zero fabrication; every claim traceable; provenance plain | `components/marks/Caliper.tsx` and every section | **PRESENT** |
| 8 | Patience | paced motion; easing that settles; no attention-grabbing | `components/sections/Hero/Hero.module.css`, `Skills.tsx`, `Vitrine.tsx` | **PRESENT** |
| 9 | High drive | density of shipped evidence and the cadence of the carousel | `app/data/portfolio/vitrine.ts`, `skills.ts` | **PRESENT** |
| 10 | Ambition | the site-defining signature moment and the Front Door's technical ceiling | `components/sections/Hero/HeroAtmosphere.tsx` → **The Lattice** | **TO BUILD** |
| 11 | Seniority | editorial restraint; systems-level framing over feature-level detail | `components/sections/Vitrine/Vitrine.tsx:188-199` | **PRESENT** |
| 12 | Engagement | interactive artefacts and a conversational layer that respond to the visitor | `components/sections/Skills/Bench.tsx`, `components/MiniVicBot.tsx` | **PRESENT** |
| 13 | Approachability | one low-friction path to conversation **per section**; warm microcopy | `hero.ts`, `listen.ts` (2 of 6 sections) | **TO BUILD** |
| 14 | Delivery excellence | a live, honest "last deployed" signal from real deployment metadata | *(no owner today)* → `app/data/generated/deploy-stamp.ts` | **TO BUILD** |
| 15 | Exceptional hybrid profile | one artefact rendering delivery leadership and hands-on engineering side by side; the explainer proves he can teach what he builds | `components/sections/Skills/Bench.tsx:72-77` (artefact) · explainer absent | **TO BUILD** (artefact half PRESENT) |

**Count: 7 PRESENT · 5 TO BUILD · 3 half-present.** Fifteen of fifteen are traced to a
named mechanism and a named file. **SC-34.1 is not yet met**, and this map is the exact
list of what closes it.

---

## 2 · The rows

### 1 · Humility — **PRESENT**

**Mechanism (R-54).** Restraint; generous whitespace; zero self-superlatives; outcomes
credited to teams and context; the name at display scale **once**.

**Where.**
- The name appears at display scale exactly once: `components/sections/Hero/Hero.tsx:44-46`
  is the document's only `<h1>`; every other section opens at `<h2>`
  (`About.tsx:37`, `Experience.tsx:62`, `Skills.tsx:95`, `Vitrine.tsx:102`, `Listen.tsx:33`).
- Outcomes are credited to their programme, never to a person:
  `app/data/portfolio/hero.ts:30-46` prints `ATO Payday Super · 200+ SIT scenarios`,
  `ANZ · 5+ squads, 40+ practitioners`, `ANZ · real-time telemetry platform` under the figures.
- The anti-superlative rule is enforced structurally, not asserted:
  `app/data/portfolio/skills.ts:213-219` ships the one row that cannot flatter —
  `AWS and GCP certification · studying; no certificate issued`, with the caveat
  *"listed because the CV lists it — saying so is the point of the card"*.
- `app/data/portfolio/hero.ts:27` caps the pitch at one sentence, twenty-nine words.

**Assertion (runs today).**
```bash
npx playwright test tests/e2e/hero.spec.ts -g 'TC-HERO-01'   # exactly one h1, and it is the name
npx playwright test tests/e2e/skills.spec.ts -g 'TC-SKILL-04' # the un-held credential is stated, not hidden
```

**Assertion to add (mechanical superlative ban, R-56).** `tests/content/content-check.spec.ts`:
```ts
test('CT-18: no self-praising adjective appears in body copy', async ({ page }) => {
  const BANNED = /\b(world[- ]class|best[- ]in[- ]class|rock ?star|ninja|guru|visionary|passionate|exceptional|unparalleled|cutting[- ]edge)\b/i;
  const prose = await page.locator('main').innerText();
  expect(prose).not.toMatch(BANNED);
});
```

---

### 2 · Experience — **PRESENT**

**Mechanism (R-54).** Artefact depth from real delivery and repository data that rewards
inspection.

**Where.**
- Eight roles, month-precision, read off the CV: `app/data/portfolio/experience.ts:24-79`
  (`SPANS`, e.g. `start: 2017 + 8 / 12, // September 2017`).
- Each role expands into its own bullets: `components/sections/Experience/Experience.tsx:152-206`.
- Repository depth is harvested, not typed: `app/data/generated/repo-harvest.json`,
  produced by `scripts/build/harvest_repos.mjs` against the real GitHub API; consumed at
  `app/data/portfolio/vitrine.ts:16` and rendered per plate at
  `components/sections/Vitrine/Vitrine.tsx:141-156`.
- Seventeen capabilities each carry evidence and the place it was measured:
  `app/data/portfolio/skills.ts:80-219`.

**Assertion (runs today).**
```bash
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-01|TC-EXP-05'
npx playwright test tests/e2e/vitrine.spec.ts    -g 'TC-VIT-01|TC-VIT-03'
npx playwright test tests/content/content-check.spec.ts -g 'CT-04'
```

---

### 3 · Career growth — **TO BUILD**

**Mechanism (R-54).** A continuous **scroll-linked progression thread accumulating across
sections**.

**What exists, and why it is not the mechanism.** `app/page.tsx:44-49` renders a
`scroll-progress` bar driven by `useScroll()`. That is a *reading* indicator for the
document: it says how far down the page you are, and it carries no career information and
accumulates nothing. `components/sections/Experience/Experience.tsx:78-127` draws the
sixteen-year span, but it starts and ends inside one section. Neither is a thread that
crosses sections.

**Where it will be implemented.**
- `components/site/ProgressionThread.tsx` *(new)* — one SVG hairline pinned to the page
  gutter, its drawn length bound to `scrollYProgress`, carrying seven notches read from
  `experience.ts` `SPANS` (`:24-79`): 2010 MYOB → 2011 InfoCentric → 2014 Telstra →
  2015 Microsoft → 2016 NAB → 2017 ANZ → 2026 ATO. The notch nearest the viewport centre
  is labelled; the rest are hairlines. Gold marks only the current engagement (R-110).
- Mounted once in `app/page.tsx`, beside the existing progress element, so it accumulates
  from the Front Door to the closing section rather than restarting per section.

**Assertion to add.** `tests/e2e/progression.spec.ts`:
```ts
test('TC-THREAD-01: the thread accumulates monotonically across all six sections', async ({ page }) => {
  const drawn = () => page.locator('[data-progression-thread]').evaluate(
    (el: SVGPathElement) => Number(el.getAttribute('data-drawn')));
  const marks: number[] = [];
  for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    marks.push(await drawn());
  }
  expect(marks).toEqual([...marks].sort((a, b) => a - b));   // never goes backwards
  expect(marks.at(-1)).toBeGreaterThan(marks[0]);            // and it actually accumulates
});
test('TC-THREAD-02: every notch is a real role from the CV', async ({ page }) => {
  const notches = await page.locator('[data-progression-thread] [data-role]').evaluateAll(
    (els) => els.map((e) => e.getAttribute('data-role')));
  expect(notches).toEqual(['myob','infocentric','telstra','microsoft','nab','anz','independent','ato']);
});
```

---

### 4 · Strategic vision — **TO BUILD**

**Mechanism (R-54).** **Every** Experience artefact framed **context → decision → outcome**.

**What exists, and why it is not yet the mechanism.** Roles carry free-prose bullets
rendered at `components/sections/Experience/Experience.tsx:197-201` from
`app/data/siteContent.ts`. A bullet list is not a frame: nothing in the type system
requires a context, a decision and an outcome, and nothing on the page labels which is
which, so the frame cannot be asserted and cannot be read at a glance.

**Where it will be implemented.**
- `app/data/siteContent.ts` — widen `ExperienceRole` with a required
  `frames: Array<{ context: string; decision: string; outcome: string; source: string }>`.
  Making it required is the mechanism: a role that cannot state the triple fails the type
  check, so the frame cannot silently degrade back to prose.
- `components/sections/Experience/Experience.tsx:192-202` — render each frame as a
  three-column definition row with the three labels printed, and keep the outcome column
  inside a `<Caliper>` whose state matches how the figure was measured
  (`components/marks/Caliper.tsx:7`), so an outcome with no published figure draws an
  open bracket rather than an invented number.

**Assertion to add.** `tests/e2e/experience.spec.ts`:
```ts
test('TC-EXP-09: every role frames context, decision and outcome', async ({ page }) => {
  const roles = page.locator('#experience [data-role-frame]');
  expect(await roles.count()).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < await roles.count(); i += 1) {
    const row = roles.nth(i);
    for (const part of ['context', 'decision', 'outcome']) {
      await expect(row.locator(`[data-part="${part}"]`)).not.toBeEmpty();
    }
  }
});
```

---

### 5 · Technological excellence — **TO BUILD** *(measured half PRESENT)*

**Mechanism (R-54).** The site itself as proof: 60 fps, silent console, sub-2 s LCP —
**measured and visible**.

**Measured — PRESENT.**
- LCP and CLS: `tests/perf/performance.spec.ts` `PERF-02` (LCP), `PERF-03` (CLS < 0.05),
  `PERF-01` (first-view transfer ≤ 2.5 MB).
- Silent console: `tests/overhaul/telemetry-stability.spec.ts` `TS-01`, `TS-04`, `TS-05`;
  `tests/perf/performance.spec.ts` `PERF-04`.
- Frame integrity and no context loss: `tests/overhaul/render.spec.ts` `TC-RENDER-02`,
  `TC-RENDER-06`; single-context budget asserted by `tests/e2e/hero.spec.ts` `TC-HERO-11`.

**Visible — TO BUILD.** No measurement is printed on the page. The colophon
(`app/data/portfolio/listen.ts:46-47`) states *architecture* — static export, at most one
WebGL context per section, no analytics — which is a design claim, not a measurement.

**Where the visible half will be implemented.**
- `scripts/build/perf_stamp.mjs` *(new)* — read the Lighthouse CI / Playwright run that
  gates the deploy (`lighthouserc.json`, `tests/perf/performance.spec.ts`) and emit
  `app/data/generated/perf-stamp.ts` with `{ lcpMs, cls, fps, measuredAt, runUrl }`.
- Rendered in the authored footer (R-181) beside the deploy stamp of trait 14, each figure
  inside a `sourced` caliper — the one state on this site that means *measured, with its
  source printed* (`components/marks/Caliper.tsx:22-23`).

**Assertion to add.** `tests/perf/performance.spec.ts`:
```ts
test('PERF-06: the page publishes its own measured LCP, and the figure is real', async ({ page }) => {
  const printed = Number(await page.locator('[data-perf-lcp]').getAttribute('data-ms'));
  expect(printed).toBeGreaterThan(0);
  expect(printed).toBeLessThan(2000);                       // R-51: sub-2 s
  const actual = await measureLcp(page);                     // helper already in this spec
  expect(Math.abs(actual - printed) / printed).toBeLessThan(0.35); // published ≈ observed
});
```

---

### 6 · Continuous learning — **TO BUILD** *(repository strand PRESENT)*

**Mechanism (R-54).** *"What is keeping me busy"* **reads live and current**; the
**channel strand is the strongest evidence**.

**Present.** The repository strand reads from a real harvest and prints the date it was
taken rather than implying freshness it does not have:
`components/sections/Vitrine/Vitrine.tsx:200-203` —
`{publicRepoCount} public repositories · metrics harvested {harvestedAt} from the GitHub
API, not live` — sourced at `app/data/portfolio/vitrine.ts:118-119`.

**Absent.** There is no channel strand. `youtube.com/@vicd0ct` appears only as a
`sameAs` entry in the Person schema (`app/layout.tsx:109`). `app/data/portfolio/vitrine.ts`
has no video type, no series, no upload cadence. R-113 calls the creator stream a strand,
never a side note; R-116 requires both strands on **one shared timeline** with neither
subordinate. The corpus for it already exists in this run:
`docs/delivery/evidence/v6-20260903T195241Z/corpus-youtube.json`.

**Where it will be implemented.**
- `scripts/build/harvest_channel.mjs` *(new)* → `app/data/generated/channel-harvest.json`,
  same shape discipline as `harvest_repos.mjs` (stamped `harvestedAt`, per-field provenance).
- `app/data/portfolio/vitrine.ts` — a second exported strand, joined to the plates on one
  time axis (**The Double Rail**, per `hero-visualisation-register.md` §5).
- `components/sections/Vitrine/Vitrine.tsx` — the rail renders both strands interleaved;
  R-119 forbids leading with subscriber or view counts, so the encoding is cadence and
  subject, never vanity metrics.

**Assertion to add.** `tests/e2e/vitrine.spec.ts`:
```ts
test('TC-VIT-10: both strands are present and neither is subordinate', async ({ page }) => {
  const build  = page.locator('#vitrine [data-strand="build"]  [data-item]');
  const create = page.locator('#vitrine [data-strand="create"] [data-item]');
  expect(await build.count()).toBeGreaterThan(0);
  expect(await create.count()).toBeGreaterThan(0);
  const h = async (l) => (await l.first().boundingBox())!.height;
  expect(Math.abs(await h(build) - await h(create)) / await h(build)).toBeLessThan(0.15);
});
test('TC-VIT-11: the channel strand never leads with a vanity metric', async ({ page }) => {
  const text = await page.locator('#vitrine [data-strand="create"]').innerText();
  expect(text).not.toMatch(/\b(subscribers?|views?|likes?|watch ?time)\b/i);
});
```

---

### 7 · Integrity — **PRESENT**

**Mechanism (R-54).** Zero fabrication anywhere; every claim traceable; provenance stated
plainly (R-157, R-158). *"The audited baseline's refusal to publish unsourced numbers is
the purest expression of this trait"* — preserved under R-165.

**Where.** This is the most densely implemented trait on the site.
- The mark itself: `components/marks/Caliper.tsx:7` declares three states —
  `sourced | self-reported | open` — and `:40-56` announces the state to assistive
  technology as well as drawing it, *"because a mark that only exists visually would make
  the same claim to sighted readers and no claim at all to everyone else"* (`:36-38`).
- Front Door: every hero figure is wrapped `state="self-reported"`
  (`Hero.tsx:68-70`), prints its source beneath (`Hero.tsx:74`), and the grading rule is
  stated once in plain words (`Hero.tsx:80-82`).
- About: no dimension is scored — `about.ts:9-13` states why, and the three role-side
  dimensions draw an **open** caliper reading *"measured from the role"*
  (`About.tsx:103-114`).
- Experience: five of eight roles state no figure and say so, once, under the chart
  (`Experience.tsx:131-134`), with an open bracket on each (`Experience.tsx:185-189`).
- Skills: the card fingerprints the document it claims to be calibrated against —
  `Skills.tsx:198-203` prints the CV's MD5 and invites the reader to run `md5sum`.
- Vitrine: an unharvested metric renders as `not harvested` inside an open caliper rather
  than a blank cell (`Vitrine.tsx:146-152`).
- Avatar: the synthetic clip discloses itself in visible text before it can be played
  (`app/data/portfolio/avatar.ts:26-27`, `components/sections/Listen/Avatar.tsx:19-26`).

**Assertion (runs today).**
```bash
npx playwright test tests/content/content-check.spec.ts -g 'CT-10'        # every hero figure prints its source
npx playwright test tests/e2e/skills.spec.ts  -g 'TC-SKILL-08'            # the CV fingerprint matches
npx playwright test tests/e2e/about.spec.ts   -g 'TC-ABOUT-03|TC-ABOUT-05'
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-03'
npx playwright test tests/e2e/listen.spec.ts  -g 'TC-LISTEN-07'
```

---

### 8 · Patience — **PRESENT**

**Mechanism (R-54).** Paced motion; easing that settles; no attention-grabbing.

**Where.**
- The hero entrance is a pure CSS stagger with an explicit step index per element
  (`Hero.tsx:39,44,48,52,59,85,98` — `--step: 0…6`), so it settles in order and never
  waits on JavaScript (`Hero.tsx:18-24`).
- Motion is deliberately *nil* in the densest section, as a designed decision:
  `Skills.tsx:31-34` — *"The section before this one scrubs a sixteen-year chart; this one
  is meant to be flat, dense and silent"* — and filtering hides rows inside a measured
  height floor (`Skills.tsx:45-78`) so nothing moves under the reader.
- The vitrine has no autoplay, no drag physics, no scroll hijack and no progress dots
  (`Vitrine.tsx:20-29`); the light is caused by the reader's own scroll.
- The avatar never autoplays and never loops (`Avatar.tsx:23-26`), and is `preload="none"`.
- Reduced motion is a parallel choreography, not a switch-off
  (`app/globals.css:214,238,290,691,720`).

**Assertion (runs today).**
```bash
npx playwright test tests/overhaul/cinematic.spec.ts -g 'TC-CINE-06|TC-CINE-07'
npx playwright test tests/e2e/skills.spec.ts         -g 'TC-SKILL-06'   # filtering moves nothing else
npx playwright test tests/e2e/listen.spec.ts         -g 'TC-LISTEN-03'  # no third-party embed, no form
```

---

### 9 · High drive — **PRESENT**

**Mechanism (R-54).** Density of shipped evidence and the cadence of the carousel.

**Where.** The density is stated as a ratio the reader can check, not as a boast:
six plates against a denominator of thirty-eight public repositories
(`vitrine.ts:38-107` and `:118-119`, rendered `Vitrine.tsx:200-203`); seventeen
capabilities with evidence (`skills.ts:80-219`); eight roles across sixteen years
(`experience.ts:24-79`); a corrections ledger showing *n* of fifty-nine
(`app/data/generated/feedback-log.ts:17-20`, rendered `Listen.tsx:90-94`).

**Assertion (runs today).**
```bash
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-01|TC-VIT-08'
npx playwright test tests/e2e/skills.spec.ts  -g 'TC-SKILL-01|TC-SKILL-02'
npx playwright test tests/e2e/listen.spec.ts  -g 'TC-LEDGER-02'
```

---

### 10 · Ambition — **TO BUILD**

**Mechanism (R-54).** The **site-defining signature moment** and the **Front Door's
technical ceiling**.

**What exists.** `components/sections/Hero/HeroAtmosphere.tsx` — one screen quad, one
fragment program, code-split so it never enters the critical bundle (`Hero.tsx:11-13`),
with the hero fully legible when it does not mount (`Hero.tsx:25-27`). That is a ceiling
on *craft* and on *restraint*. It is not the ceiling R-96 assigns the Front Door: *"WebGL
signature scene from real repository, skill and delivery topology"*. Today the shader
renders texture, not the working set — so the site has no site-defining moment.

**Where it will be implemented.** `components/sections/Hero/HeroAtmosphere.tsx` becomes
**The Lattice** (`hero-visualisation-register.md` §1): repository nodes in depth from
`app/data/generated/repo-harvest.json`, capability nodes on the near plane from
`app/data/portfolio/skills.ts:44-59` and `:80-219`, and exactly one gold filament running
from the repository the site is most willing to be judged on to the capability it
evidences in production — gold reserved for the single most important mark in the view
(R-110).

**Assertion to add.** `tests/overhaul/render.spec.ts`:
```ts
test('TC-RENDER-10: the Lattice draws the real working set, and lights exactly one filament', async ({ page }) => {
  const stats = await page.evaluate(() => (window as any).__lattice.stats());
  const harvest = require('../../app/data/generated/repo-harvest.json');
  expect(stats.repoNodes).toBe(harvest.repositories.filter((r) => r.evidenced).length);
  expect(stats.goldFilaments).toBe(1);                    // R-110: one gold mark per view
  expect(stats.contexts).toBe(1);                         // R-100 / TC-HERO-11 budget
});
```

---

### 11 · Seniority — **PRESENT**

**Mechanism (R-54).** Editorial restraint; systems-level framing over feature-level detail.

**Where.**
- The vitrine publishes what it **excluded and why** — a Codex scratch workspace, a repo
  with an env file in its early history, a personal legal matter
  (`app/data/portfolio/vitrine.ts:109-111`, rendered `Vitrine.tsx:188-199`). Publishing the
  exclusion list is the senior act; six of thirty-eight is the editorial claim.
- Every plate must state what its repository does **not** do
  (`vitrine.ts:32-33`, rendered `Vitrine.tsx:158-161`) — including *"The public CI workflow
  is red on main"* on the flagship (`vitrine.ts:46`).
- `app/page.tsx:14-23` records that the page went from 783 lines and thirty imports to a
  composition — systems framing applied to the site's own source.

**Assertion (runs today).**
```bash
npx playwright test tests/e2e/vitrine.spec.ts -g 'TC-VIT-02|TC-VIT-04'
```

---

### 12 · Engagement — **PRESENT**

**Mechanism (R-54).** Interactive artefacts, and the conversational layer that responds to
the visitor.

**Where.**
- **The bench** wires thirteen sources to seventeen capabilities and lets the reader trace
  either end: `components/sections/Skills/Bench.tsx:242` reports the traced capability
  upward, and `Skills.tsx:174` marks the matching row in the record below rather than
  filtering the table out from under the reader (`Skills.tsx:38-41`).
- **The compass** turns to the dimension under the reader's attention
  (`About.tsx:86-121` → `Compass.tsx` `active` prop), and is complete at rest
  (`About.tsx:15-20`).
- **The chart** responds on hover, focus and click, and scrolls the matching role into view
  (`Experience.tsx:94-127`).
- **The conversational layer** is mounted site-wide from the layout
  (`app/layout.tsx:142`), with an eleven-test contract in `tests/e2e/chatbot.spec.ts`.

**Assertion (runs today).**
```bash
npx playwright test tests/e2e/skills.spec.ts  -g 'TC-BENCH-01|TC-BENCH-03|TC-BENCH-04'
npx playwright test tests/e2e/about.spec.ts   -g 'TC-ABOUT-06'
npx playwright test tests/e2e/experience.spec.ts -g 'TC-EXP-04|TC-EXP-06'
npx playwright test tests/e2e/chatbot.spec.ts -g 'TC-BOT-10'
```

---

### 13 · Approachability — **TO BUILD**

**Mechanism (R-54, R-57).** **One distinct low-friction path to conversation per section**;
warm microcopy; the real-time conversation as the most approachable surface.

**Present, and the shortfall.** Two of six sections carry a path of their own: the Front
Door (`hero.ts:51-55` — LinkedIn, GitHub, Email) and the closing section
(`listen.ts:23-33` — four real anchors, `Listen.tsx:44-58`). About, Experience, Skills and
the Vitrine carry none. `MiniVicBot` is mounted globally (`app/layout.tsx:142`), which is a
site-wide surface, not the *per-section distinct* path R-57 requires — and R-185 warns that
scattered, repeated contact affordances dilute the closing section, so the four new paths
must each be **section-specific**, not four copies of a "contact me" button.

**Where it will be implemented.** One line of authored microcopy per section, each opening
the conversational layer pre-seeded with that section's question:
- `about.ts` → *"Ask how I'd score against your role"* → seeds the ten dimensions.
- `experience.ts` → *"Ask what the ATO number actually measures"* → seeds the ≈92% figure.
- `skills.ts` → *"Ask what is not on this card"* → seeds the pending row.
- `vitrine.ts` → *"Ask which of these you should read first"* → seeds the exclusions.
Rendered by each section component; wired to `components/MiniVicBot.tsx` through a
`fm:ask` event, which the bot already listens for the `fm:page-ready` sibling of
(`app/page.tsx:29-35`).

**Assertion to add.** `tests/e2e/navigation.spec.ts`:
```ts
test('TC-NAV-10: every section offers exactly one distinct path to a conversation', async ({ page }) => {
  const ids = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'];
  const labels = new Set<string>();
  for (const id of ids) {
    const paths = page.locator(`${id} [data-conversation-path]`);
    expect(await paths.count(), `${id} has no conversation path`).toBeGreaterThanOrEqual(1);
    labels.add((await paths.first().innerText()).trim());
  }
  expect(labels.size).toBe(ids.length);            // distinct, not six copies of one button
});
```

---

### 14 · Delivery excellence — **TO BUILD**

**Mechanism (R-54, R-181).** A **live, honest "last deployed" signal from real deployment
metadata**.

**Verified absent.** Run in this session:
```bash
grep -rn "last deployed\|lastDeployed\|deployedAt\|buildTime\|BUILD_TIME" \
  --include=*.ts --include=*.tsx --include=*.mjs --include=*.js \
  app components lib scripts next.config.js
```
→ no matches. The colophon (`listen.ts:46-47`, rendered `Listen.tsx:100`) carries a
copyright year and architectural facts, and no deployment metadata at all. R-181 names the
current footer line as *"boilerplate of exactly the kind R-82 prohibits"*.

**Where it will be implemented.**
- `scripts/build/deploy_stamp.mjs` *(new)* — at build time, read the commit being deployed
  (`git rev-parse --short HEAD`, `git log -1 --format=%cI`) and the Firebase Hosting release
  metadata written by `scripts/deploy/firebase_static_deploy.sh`; emit
  `app/data/generated/deploy-stamp.ts` as `{ commit, committedAt, releasedAt, channel }`,
  in the same generated-file discipline as
  `app/data/generated/feedback-log.ts:1-6` and `cv-fingerprint.ts`.
- Rendered in the authored footer beside the perf stamp of trait 5, each figure in a
  `sourced` caliper, with the commit hash a link to the diff — exactly the pattern the
  corrections ledger already uses (`Listen.tsx:74-82`).

**Honesty constraint.** The signal states when *this build* was released. It must not be
rendered as a relative "live" string that keeps counting after the page is cached: the
service worker (`components/site/ServiceWorkerRegister.tsx`) can serve a stale document
offline (`TC-DURABLE-05`), and a stamp that lied about it would fail the very trait it
encodes.

**Assertion to add.** `tests/overhaul/durability.spec.ts`:
```ts
test('TC-DURABLE-08: the footer publishes a real deploy stamp that matches the build', async ({ page }) => {
  const { execSync } = require('node:child_process');
  const head = execSync('git rev-parse --short HEAD').toString().trim();
  const stamp = page.locator('[data-deploy-stamp]');
  await expect(stamp).toBeVisible();
  await expect(stamp.locator('[data-commit]')).toHaveText(head);
  const iso = await stamp.locator('time').getAttribute('datetime');
  expect(Number.isFinite(Date.parse(iso!))).toBe(true);
  await expect(stamp.locator('a')).toHaveAttribute('href', new RegExp(`/commit/${head}`));
});
```

---

### 15 · Exceptional hybrid profile — **TO BUILD** *(artefact half PRESENT)*

**Mechanism (R-54, R-58).** **One artefact rendering delivery leadership and hands-on
engineering side by side**; and the **explainer proves the ability to teach what he builds**.

**Artefact half — PRESENT.** The bench is that artefact. Its source rail is banded by the
three kinds of evidence a reader checks differently, in one board:
`components/sections/Skills/Bench.tsx:72-77` (`BANDS` = programmes | repositories |
credentials) over the registry at `app/data/portfolio/skills.ts:44-57` — `ATO · Payday
Super` and `ANZ Banking Group` on the same rail as `aether-job-career-agent` and
`containerised-birth-time-rectifier`, wired into the same seventeen capabilities. Delivery
leadership and hands-on engineering are not two lists on one page; they are two bands
wired into one graph, and a wire is gold only where the evidence at its end was measured
in production (`Bench.tsx:33-38`).

**Explainer half — TO BUILD.** `components/sections/Listen/Avatar.tsx` ships, but its
content is a **self-introduction** (`app/data/portfolio/avatar.ts:41-46`), which P-9 /
R-147 removes. R-148 … R-156 replace it with a single explainer teaching a genuinely
difficult concept from the R-8 corpus, coupled to a hero visualisation, with the register
confident rather than apologetic (R-154, R-157).

**Where the explainer will be implemented.**
- `app/data/portfolio/avatar.ts` — replace `transcript` with the explainer script and its
  concept rationale (R-149 requires the rationale be recorded). The concept selection is
  owned by the explainer workstream; the coupling constraint is that it must teach the
  mechanism behind an artefact already on the page.
- `components/sections/Listen/Avatar.tsx` — unchanged in structure: disclosure before play
  (`:19-22`), transcript as page text (`:21-24`), no autoplay (`:23-26`). Those three rules
  survive the content change and are what let a synthetic face sit on this site at all.

**Assertion (artefact half, runs today).**
```bash
npx playwright test tests/e2e/skills.spec.ts -g 'TC-BENCH-01|TC-BENCH-02'
```
**Assertion to add (both halves).**
```ts
test('TC-HYBRID-01: one artefact renders both bands, wired into the same capabilities', async ({ page }) => {
  const bench = page.locator('#skills [data-bench]');
  await expect(bench.locator('[data-band="programme"]  button')).not.toHaveCount(0);
  await expect(bench.locator('[data-band="repository"] button')).not.toHaveCount(0);
  const wired = await bench.locator('svg path[data-source]').evaluateAll(
    (p) => new Set(p.map((e) => e.getAttribute('data-kind'))).size);
  expect(wired).toBeGreaterThanOrEqual(2);      // both kinds actually reach capabilities
});
test('TC-EXPLAIN-01: the clip teaches a concept and never introduces its author', async ({ page }) => {
  const transcript = await page.locator('#listen [data-transcript]').innerText();
  expect(transcript).not.toMatch(/^\s*(hello|hi)\b.*\bI'?m\b/i);   // R-147: no self-presentation
  expect(transcript).toMatch(/because|which means|the reason|so that/i); // it explains
});
```

---

## 3 · Gate H closure list

`SC-34.1` passes when these eight rows change state. Nothing else on this map is
outstanding.

| Row | Deliverable | Blocking requirement |
|---|---|---|
| 3 | `components/site/ProgressionThread.tsx` + `TC-THREAD-01/02` | R-54 |
| 4 | `frames` on `ExperienceRole` + `TC-EXP-09` | R-54, R-174 |
| 5 | `perf-stamp.ts` printed in the footer + `PERF-06` | R-54, R-181 |
| 6 | channel strand → **The Double Rail** + `TC-VIT-10/11` | R-113 … R-117, R-186 |
| 10 | **The Lattice** + `TC-RENDER-10` | R-96, R-60 |
| 13 | four section-specific conversation paths + `TC-NAV-10` | R-57, R-179, R-185 |
| 14 | `deploy-stamp.ts` printed in the footer + `TC-DURABLE-08` | R-54, R-181 |
| 15 | explainer content replacing the introduction + `TC-EXPLAIN-01` | P-9, R-147 … R-156 |
