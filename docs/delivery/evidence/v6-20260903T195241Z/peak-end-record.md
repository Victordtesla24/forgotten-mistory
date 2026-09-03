# The Peak-and-Ending Design Record

Run `v6-20260903T195241Z` · execution step 14 · **R-59 … R-64, R-177, R-185** → **SC-38.1, SC-39.1, SC-40.1, SC-41.1** → **Gate H**

> **R-60.** *"Peak within the first two sections; the feedback & coffee ending is the second-strongest moment."*
> **SC-39.1.** *"The reviewer identifies peak and ending unprompted; the ending rates second-strongest."*

---

## 0 · The shape being engineered

Peak–end says a visit is remembered as two samples: its most intense moment, and its last.
Everything between is compressed. This site therefore engineers exactly two moments to be
memorable, and deliberately makes the middle *dense but calm* so it does not compete.

```
intensity
   ▲
 1 │  ██  PEAK — The Lattice (§1, Front Door)
   │  ██
   │  ██        ░░       ░░       ░░           ██  END — Feedback & Coffee (§6)
   │  ██   ░░   ░░   ░░  ░░  ░░   ░░      ░░   ██
   └────────────────────────────────────────────────▶
      §1   §2   §3   §4   §5                    §6
```

The middle four sections are not flattened — each carries its own signature moment
(`signature-moment-register.md`) — but none is engineered to peak. `Skills.tsx:31-34`
records that choice explicitly: *"The section before this one scrubs a sixteen-year chart;
this one is meant to be flat, dense and silent."* The calm is what makes the ending land.

---

## 1 · The peak — **The Lattice**, Front Door (§1)

**Position.** Section 1 of 6, above the fold. R-60 requires the peak inside the first two
sections; this is the first.

**What it is.** The full description is `signature-moment-register.md` §SD. In one line:
the working set drawn as a standing structure, with a single gold filament running from the
repository the site is most willing to be judged on to the capability it evidences in
production.

**Status: TO BUILD.** `components/sections/Hero/HeroAtmosphere.tsx` ships an atmosphere
shader today — real craft, but texture rather than topology. Until the Lattice lands, the
site's strongest first-section moment is **the graded ledger** (`Hero.tsx:59-83`), which is
a peak of *register*, not of intensity. A reviewer under SC-39.1 will currently identify the
ledger, or the bench in §4 — and the bench being nameable as the peak is precisely the
failure R-60 describes, because it sits in section four.

**Why the peak is a topology and not an effect.** R-102 makes *"flashy"* a failing verdict
and R-106 says a moment must earn admiration or be deleted. An effect impresses for two
seconds and then invites the question *what is it actually showing?* — which a decorative
field cannot answer. A topology answers it: every node is a repository or a capability that
exists, every edge is a link the data asserts, and the one gold strand is the site's own
claim about which piece of work it stands on. It is the only kind of peak that survives the
dual-audience test (R-107): a business client sees *a lot, connected*; an engineering leader
sees *38 nodes, one draw call, 60 fps, and the data behind it is on the page below*.

**Guardrails the peak is built under.**
- R-51 / SC: LCP under 2.0 s, CLS under 0.05 — the scene is dynamically imported
  (`Hero.tsx:11-13`) and the hero is complete without it (`Hero.tsx:25-27`).
- R-100: one WebGL context, lazy init, full disposal, declared memory ceiling, and a
  low-power path — asserted today by `TC-HERO-11` and `TC-RENDER-02`.
- R-101: the reduced-motion composition is beautiful, not absent —`TC-CINE-06`, `TC-CINE-07`.

**Verification.** `TC-RENDER-10` (to add), `TC-HERO-11`, `TC-CINE-01`, `TC-CINE-04`,
`PERF-01`, `PERF-02`; and T-24 (admiration panel) at Gate L.

---

## 2 · The ending — **"Always willing to listen — feedback & Coffee?"** (§6)

**Design intent.** The last impression is engineered as the **second-strongest** moment on
the site, and its strength comes from *subtraction*. After five screens of instruments the
page goes quiet: one italic sentence, one hairline, four real anchors, and a way to buy him
a coffee — under sixty-five visible words (`app/data/portfolio/listen.ts:2-7`, asserted by
`TC-LISTEN-02`). *"The residue in memory is meant to be the absence of the instrument after
five screens of it: no chart, no table, no rail, no scene."*

**What is present today.**

| Element | Where | Assertion |
|---|---|---|
| The one italic on the site, and the one line with no source | `Listen.tsx:37-39`, `listen.ts:20-22` | `TC-LISTEN-01` |
| Four real anchors — mailto, tel, LinkedIn, GitHub; no form, no third party | `Listen.tsx:44-58`, `listen.ts:23-32`, rationale `Listen.tsx:18-21` | `TC-LISTEN-03`, `TC-LISTEN-04` |
| The corrections ledger — the evidence for the claim above it | `Listen.tsx:67-95`, `feedback-log.ts`, `scripts/build/feedback_log.mjs` | `TC-LEDGER-01`, `TC-LEDGER-02` |
| The avatar, disclosed before it can be played, transcript on the page | `Avatar.tsx:19-26`, `avatar.ts:26-27` | `TC-LISTEN-07`, `TC-LISTEN-08` |
| A colophon stating what the page does **not** do | `Listen.tsx:100`, `listen.ts:46-47` | `TC-LISTEN-06` |

**What is outstanding, and why the ending is not yet second-strongest.**

1. **The participatory interactive is not built (R-177, R-96).** R-96 assigns this section
   *"a participatory interactive engineered as the second-strongest moment"* — **The Open
   Caliper** (`hero-visualisation-register.md` §6): the reader sets the next thing that
   should be measured, and the mark that has graded every claim on the site is handed to
   them. Today the section is read, not participated in. The corrections ledger is the
   strongest thing in it, and a ledger is evidence, not participation.
2. **One canonical contact route (R-185).** Contact affordances currently appear in the hero
   (`hero.ts:51-55`), the navigation (`Navigation.tsx:25-26`) and the closing section
   (`listen.ts:23-32`). R-185 requires consolidation into a single presented path in the
   closing section, because scattered repetition dilutes the one moment R-60 requires to be
   strongest. The hero and nav links are not deleted — they are demoted to *routes*, while
   the closing section holds the only *invitation*.
3. **The footer is boilerplate (R-181).** `© 2026 … ` is exactly the kind of line R-82
   prohibits. It becomes authored microcopy carrying the statement, including the honest
   build-and-deploy signal R-54 assigns to delivery excellence (`statement-trait-map.md`
   rows 5 and 14).
4. **The avatar's content is a self-introduction (P-9, R-147).** Replaced by the explainer.
   Its three structural rules — disclosure before play, transcript as page text, never
   autoplays — survive unchanged.

**Assertion for the ending's rank (SC-39.1).** T-24's panel is shown the site once and
asked, unprompted, to name the strongest and second-strongest moments. Pass requires the
peak named in §1 or §2 **and** the closing section named second, by a majority of the panel,
with neither prompted by name. This is the one criterion in this record that cannot be
reduced to a Playwright assertion; everything supporting it can, and is listed above.

---

## 3 · The five-second contract (R-61) — testable statement

> **Contract.** *Within five seconds of first paint, on a mid-tier mobile device over 4G,
> an unprimed visitor who has never heard of the owner can state (a) who he is, (b) the
> calibre he operates at, and (c) that this site is not like other portfolio sites.*

**How each clause is delivered.**

| Clause | Delivered by | Where |
|---|---|---|
| (a) who he is | `Vikram Deshpande` at display scale, one `<h1>`; `Delivery leadership · AI solutions architecture`; `Melbourne, Australia` | `Hero.tsx:39-50`, `hero.ts:22-26` |
| (b) the calibre | the one-sentence statement — sixteen years, government/banking/telco, currently ATO Payday Super — plus three figures each with the programme they came from | `Hero.tsx:52-54`, `Hero.tsx:59-77`, `hero.ts:28-46` |
| (c) unlike others | the caliper marks and the grading line: the site marks its own headline figures as self-reported before anyone asks | `Hero.tsx:68-70`, `:80-82`, `Caliper.tsx:17-38` |

**Test (T-13, timed).**
```ts
test('TC-CONTRACT-05S: the five-second contract is legible at first paint', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route('**/*', (r) => setTimeout(() => r.continue(), 40));   // 4G-ish
  const t0 = Date.now();
  await page.goto('/', { waitUntil: 'commit' });
  await page.locator('#hero h1').waitFor({ state: 'visible' });
  const fold = page.viewportSize()!.height;
  for (const sel of ['#hero h1', '[data-hero-role]', '[data-hero-statement]', '#hero ul li']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(fold);              // above the fold
  }
  expect(Date.now() - t0).toBeLessThan(5000);
  await expect(page.locator('#hero [data-state="self-reported"]')).toHaveCount(3);
});
```
**Supported today by:** `TC-HERO-01`, `TC-HERO-02`, `TC-HERO-04`, `TC-HERO-09` (whole hero
legible in the first viewport), `TC-HERO-10` (no preloader), `PERF-02` (LCP), `PERF-03`
(CLS). The human half is T-13 under timed evaluation → SC-40.1.

---

## 4 · The thirty-second contract (R-62) — testable statement

> **Contract.** *Within thirty seconds — one scroll, no clicks required — the visitor has
> met exactly one piece of hard evidence they could go and verify themselves, and exactly
> one interaction they did not expect a portfolio site to contain.*

**The one piece of hard evidence.** The Front Door ledger's first figure, printed with its
source and graded: **`≈92%` · evidence effort removed · ATO Payday Super · 200+ SIT
scenarios**, drawn `self-reported` because no third party published a methodology
(`hero.ts:30-35`, `Hero.tsx:59-83`). *Hard* here means the reader can name the programme, the
scope and the epistemic status without asking anyone. The site's second, stronger artefact of
verification — the CV's MD5 printed on the calibration card, checkable with `md5sum`
(`Skills.tsx:198-203`) — sits in section four and is therefore outside the thirty-second
window by design; it is what the thirty-second contract *promises*, not what it delivers.

**The one unexpected interaction.** The pointer moving the Lattice and lighting its gold
filament (§1, **TO BUILD**). Until it lands, the unexpected interaction inside thirty
seconds is **the open sector** in §2 (`About.tsx:103-114`): a portfolio that turns an
instrument toward you and then refuses to score three of its ten axes. Both are reachable
within one scroll of the fold.

**Test (T-13).**
```ts
test('TC-CONTRACT-30S: one verifiable figure and one unexpected interaction inside 30s', async ({ page }) => {
  await page.goto('/');
  const ledger = page.locator('#hero ul li').first();
  await expect(ledger).toContainText('92%');
  await expect(ledger).toContainText('ATO Payday Super');          // the source, not just the number
  await expect(ledger.locator('[data-state="self-reported"]')).toHaveCount(1);

  await page.locator('#about').scrollIntoViewIfNeeded();           // one scroll, no clicks
  const open = page.locator('#about [data-state="open"]');
  expect(await open.count()).toBe(3);                              // the three role-side dimensions
  await expect(open.first()).toContainText('measured from the role');
});
```
**Supported today by:** `TC-HERO-04`, `CT-10`, `TC-ABOUT-05`, `TC-ABOUT-03`.

---

## 5 · The post-visit takeaway (R-63) — exactly one, named

> **R-63.** *"Exactly one elegant, ungated takeaway from the R-8 corpus."*

**It is the CV: `public/docs/Vik_Resume_Final.pdf`.**

**Why this and nothing else.**
- **It is from the R-8 corpus.** R-8 names the CV as one of the four permitted sources; it
  is the *"CV of record"* in §1 of the master prompt, MD5 `16b856c0`, 157,615 bytes.
- **It is ungated.** A direct `<a download>` — no form, no email wall, no interstitial.
  Offered from the hero (`app/data/portfolio/hero.ts:49`, rendered `Hero.tsx:89-95`) and from
  the persistent navigation (`Navigation.tsx:26`, always-visible at `:154-157`). The closing section deliberately
  carries no form at all (`Listen.tsx:18-21`).
- **It survives the visit.** The service worker keeps it available offline
  (`components/site/ServiceWorkerRegister.tsx`), asserted by `TC-DURABLE-05`.
- **It is the only one.** There is no second downloadable artefact on the site, and adding
  one would breach *"exactly one"*. Any future artefact (a one-page dossier, a diagram
  export) must **replace** this, never join it.
- **It is checkable.** The takeaway is fingerprinted on the page it is offered from:
  `Skills.tsx:198-203` prints the CV's MD5 and byte count from
  `app/data/generated/cv-fingerprint.ts` and invites the reader to run `md5sum` against the
  file they just downloaded. A takeaway that proves it is the same document the site was
  calibrated against is the elegant form of this artefact.

**The elegance obligation, stated plainly.** R-63 says *elegant*, and a PDF laid out by a
word processor is not. The remedy is **not** a second artefact: it is to typeset this one in
the site's own design language — the same two type faces, the caliper marks on the same
figures with the same three states, and the same provenance lines — so the document a
recruiter forwards is unmistakably from this site (R-91). Owned by the takeaway workstream
(execution step 36); the file path, the single-artefact rule and the fingerprint do not
change.

**Test.**
```ts
test('TC-TAKEAWAY-01: exactly one ungated downloadable, and it is the CV', async ({ page }) => {
  await page.goto('/');
  const downloads = page.locator('a[download], a[href$=".pdf"]');
  const hrefs = new Set(await downloads.evaluateAll((a) => a.map((e) => e.getAttribute('href'))));
  expect([...hrefs]).toEqual(['/docs/Vik_Resume_Final.pdf']);      // exactly one artefact
  const res = await page.request.get('/docs/Vik_Resume_Final.pdf');
  expect(res.status()).toBe(200);                                   // ungated: no redirect, no form
  await expect(page.locator('form')).toHaveCount(0);
});
```
**Supported today by:** `TC-DURABLE-03`, `TC-DURABLE-04`, `TC-DURABLE-05`, `TC-DURABLE-06`,
`TC-SKILL-08`, `TC-NAV-02`, `TC-LISTEN-03`. → **SC-41.1**.

---

## 6 · Unaided seven-day recall targets (R-59) — with the scoring rule

> **R-59.** *"Unaided seven-day recall of identity and domain, one signature interaction,
> and one specific piece of evidence."* → **SC-38.1**: all three target items returned.
> Measured by **T-14**: the same visitor, seven days later, one open question — *"What do
> you remember about that site?"* — no prompts, no multiple choice, no site access.

| # | Target | What a passing answer contains | Accept-set (any one) | Carried by |
|---|---|---|---|---|
| 1 | **Identity** | the person, placed | "Vikram Deshpande" · "Vikram, the delivery lead in Melbourne" · "the ATO / tax office guy" | `Hero.tsx:44-46`, `hero.ts:22-29`; one `<h1>`, `TC-HERO-01` |
| 2 | **Domain** | what he does, and the register he does it in | "delivery leadership and AI systems" · "runs programmes and builds the AI himself" · "the one whose site refuses to make up numbers" | `hero.ts:24, :28-29`; `about.ts:103-107` (North Star); the caliper grammar site-wide |
| 3 | **One signature interaction** | an interaction, described by what it *did*, not named | "the thing where you touch a source and everything unrelated fades" (the trace) · "the light that follows the card you're looking at" (the raking light) · "the 3-D structure with the one gold thread" (the Lattice) | `Bench.tsx:242` + `Skills.tsx:174`; `Vitrine.tsx:36-76`; `HeroAtmosphere.tsx` (to build) |
| 4 | **One specific piece of evidence** | a figure or artefact *with its qualifier* | "92% of the evidence effort at the tax office — and it said that was self-reported" · "six repos out of thirty-eight, and it listed the ones it left out" · "it printed the checksum of its own CV" | `hero.ts:30-35` + `Hero.tsx:80-82`; `vitrine.ts:109-111` + `Vitrine.tsx:188-203`; `Skills.tsx:198-203` |

**Scoring rule (T-14).** Each row scores 1 if the response contains any member of its
accept-set, unprompted. **SC-38.1 passes at 4/4.** Row 4 requires the *qualifier* as well as
the figure — a recalled "92%" with no memory that the site graded it does not score, because
the qualifier is the thing the site was built to make memorable, and recall of the bare
number would mean the integrity mechanism (R-54, trait 7) did not land.

**What this predicts about the build.** Rows 1, 2 and 4 are carried by mechanisms that ship
today. Row 3 is carried by two shipped interactions (the trace, the raking light) that sit in
sections four and five — deep in the compressed middle. The Lattice exists to move the
recalled interaction into the peak, where peak–end says it will actually survive seven days.

---

## 7 · What Gate H is waiting on

| # | Item | Requirement | State |
|---|---|---|---|
| 1 | The Lattice — the peak | R-60, R-96 | **TO BUILD** |
| 2 | The Open Caliper — participatory ending | R-177, R-96 | **TO BUILD** |
| 3 | Contact consolidated to one canonical route in §6 | R-185 | **TO BUILD** |
| 4 | Authored footer carrying deploy + perf signal | R-181, R-54 | **TO BUILD** |
| 5 | Explainer replaces the self-introduction | P-9, R-147 … R-156 | **TO BUILD** |
| 6 | The takeaway typeset in the site's design language | R-63 | **TO BUILD** |
| 7 | `TC-CONTRACT-05S`, `TC-CONTRACT-30S`, `TC-TAKEAWAY-01` written | R-61, R-62, R-63 | **TO BUILD** |
| 8 | T-13 timed evaluation · T-14 seven-day recall · T-24 panel | SC-38.1, SC-39.1, SC-40.1 | **scheduled** (steps 40, 50) |

Everything else in this record ships today and is asserted by a test that runs today.
