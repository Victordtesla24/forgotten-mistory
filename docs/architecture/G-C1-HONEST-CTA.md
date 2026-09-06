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

---

## 7. ADV-2315Z — single product (2026-09-06)

**Task:** `t_w1_c1sa` · **Adversarial cycle:** ADV-REVIEW-20260905T2315Z · **Role:** solutions-architect (§5)
**Decision:** **path (b) — ONE engagement product.** Identical label, subject, body and
`href` on `#listen` and `#vitrine`. Implementation ships in `t_w1_c1ap` (analyst-programmer).

### 7.1 Why §4 was not enough, and why this supersedes it

§4 (ADV-1556Z) fixed the *verbs* — `Book` and `Start a project` became `Email …` — but left
**two products** standing over one inbox. ADV-2315Z re-read the live SHA and held the line:

> `#vitrine` — **FAIL** G-C1 · "Engage: **Email a project brief** mailto — honest label, not booking."
> `#listen` — **FAIL** G-C1 · "Engage: **Email a 20-minute-call agenda** mailto — second product, same inbox."
> *(`docs/adversarial/ADV-REVIEW-20260905T2315Z.md:73-79`)*

GAP-BACKLOG G-C1 (`docs/adversarial/GAP-BACKLOG.md:28`) is binary and admits no third option:

> "Real calendar URL from a **named env key** on Listen **and** Vitrine engage — **or** one single
> honest mailto (same subject/body) and drop dual products. Two different mailto promises = FAIL."

§4's reasoning that "differing subject lines are honest descriptions, not two products" is
**withdrawn**. Verified drift on `origin/main` today:

| | `#listen` | `#vitrine` |
|---|---|---|
| label | `Email a 20-minute-call agenda` (`listen.ts:64`) | `Email a project brief` (`vitrine.ts:139`) |
| subject | `20-minute call — Vikram Deshpande` (`listen.ts:33`) | `Engagement enquiry — Vikram Deshpande` (`vitrine.ts:136`) |
| body | four agenda lines (`listen.ts:34-39`) | **none** (`vitrine.ts:142` — no `&body=`) |

Different label, different subject, and one surface prefills an agenda while the other opens a
blank compose window. That is two products. **Collapse to one.**

### 7.2 Path (a) is closed — re-confirmed by key NAME only, 2026-09-06

```bash
grep -E '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production | sed 's/=.*//' | grep -ciE 'cal|book|schedul|meet'
# => 0
grep -cE '^[A-Z][A-Z0-9_]*=' /root/.claude/.env.production
# => 90
```

**90 key names, 0 matches.** No value was read, printed, logged or `source`d. There is no
`CAL_COM_URL`, no `CALENDLY_URL`, no booking key of any name, so path (a) would require
fabricating a URL — a 404 in front of the one visitor ready to buy, and a direct R7 breach.
**Path (b) is the only correct design.** §3.1 of `docs/architecture/LISTEN-FLAGSHIP.md` keeps the
activation condition intact: if such a key ever appears, path (a) reopens and the label becomes
`Book a 20-minute call →`. Until then `TC-LISTEN-CTA-04` keeps asserting no booking host ships.

### 7.3 The one product — strings verbatim

These four values are the **entire** product. Both surfaces get all four, byte-identical.

**Label** (both plates, verbatim — carries no `Book`, no `Start a project`, no `booking`):

```
Email a 20-minute-call agenda
```

**Subject** (both plates, verbatim — unchanged from `listen.ts:33`, keeps `TC-LISTEN-CTA-02`'s
`/20-minute call/i` assertion true):

```
20-minute call — Vikram Deshpande
```

**Body** — five lines, `\n`-joined. Line 1 is new; lines 2-5 are the existing `ENGAGE_AGENDA`
verbatim (`listen.ts:34-39`). Straight apostrophe in line 2 on purpose: a mailto body is parsed
by mail clients and ASCII survives every one of them.

```
Hiring or a project:
What you're building:
The decision you need made:
Two or three times that suit you (Melbourne time):
Anything I should read first:
```

**`href` expression** (single definition, see §7.4):

```ts
`mailto:${contact.email}?subject=${encodeURIComponent(ENGAGEMENT_SUBJECT)}&body=${encodeURIComponent(ENGAGEMENT_BODY.join('\n'))}`
```

**Resolved href, measured this session** (`node -e` with `contact.email = sarkar.vikram@gmail.com`):

```
mailto:sarkar.vikram@gmail.com?subject=20-minute%20call%20%E2%80%94%20Vikram%20Deshpande&body=Hiring%20or%20a%20project%3A%0AWhat%20you're%20building%3A%0AThe%20decision%20you%20need%20made%3A%0ATwo%20or%20three%20times%20that%20suit%20you%20(Melbourne%20time)%3A%0AAnything%20I%20should%20read%20first%3A
```

| Measured constraint | Result | Gate it satisfies |
|---|---|---|
| length | **305** ≤ 900 | `HREF_CAP`, `TC-LISTEN-CTA-02` |
| raw whitespace | **none** | `TC-LISTEN-CTA-02` |
| contains `%0A` | **yes** | `TC-LISTEN-CTA-02` |
| `url.pathname` | `sarkar.vikram@gmail.com` | `TC-LISTEN-CTA-02`, `AP-05` |
| subject matches `/20-minute call/i` | **yes** | `TC-LISTEN-CTA-02` |
| decoded body | exactly the five lines above | `TC-LISTEN-CTA-02` |
| label whitespace tokens | 4 (was 4 on both surfaces) | `WORD_CAP = 65` on `#listen` unchanged |
| banned-tone words | **none** of the 24 in `overhaul_static_audit.mjs:50-59` | `TC-NFR-TONE` |

**Why this label and this body serve both audiences.** The label names the mechanism first
(`Email`) and the payload second (`a 20-minute-call agenda`) — nothing in it claims a booking
tool, a commitment, or a response time. It is already the live Listen copy, so the single product
is assembled from strings that have already cleared the tone linter and the adversarial reviewer;
**no new claim is invented.** The one new line, `Hiring or a project:`, is what makes a *single*
product honest across both doors: an employer arriving from `#vitrine` and a client arriving from
`#listen` now send the same enquiry and are asked, in the same register as the other four prompts,
to say which they are. It is a prompt to the sender, not a promise from the site (`listen.ts:26`
standing rule), and it renders nowhere on the page — it lives in the `mailto` body.

**Vitrine's `note` is unchanged and becomes load-bearing:** *"These six are shipped work. The
inbox that answers a role enquiry answers a project brief."* (`vitrine.ts:140`) — that sentence is
now literally the design, not a consolation for a second product.

### 7.4 Exact edits (`t_w1_c1ap`) — one definition, two importers

The root cause of G-C1 is that two files each own a copy of the product and drifted. The fix is
structural: **define it once** in `app/data/siteContent.ts`, next to `contact`, which both section
files already import. No new file, no cross-section import (`vitrine.ts` must not import
`listen.ts`), and drift becomes impossible rather than merely tested-for.

| # | File | Line hint | Change |
|---|------|-----------|--------|
| 1 | `app/data/siteContent.ts` | after `contact`, ends line **504** | **Add** `ENGAGEMENT_SUBJECT`, `ENGAGEMENT_BODY` (5 lines) and `export const ENGAGEMENT = { label, subject, agenda: ENGAGEMENT_BODY, href } as const;` using the §7.3 strings and href expression. `agenda` keeps its key name so `listenContent.engage.agenda` does not change shape. |
| 2 | `app/data/portfolio/listen.ts` | **15** | `import { contact } from '../siteContent';` → `import { contact, ENGAGEMENT } from '../siteContent';` |
| 3 | `app/data/portfolio/listen.ts` | **33**, **34-39**, **44-46** | **Delete** `ENGAGE_SUBJECT`, `ENGAGE_AGENDA`, `ENGAGE_HREF`. Move their doc-comments (lines 17-32, 40-43) up to `ENGAGEMENT` in `siteContent.ts` — the reasoning must travel with the definition, not be lost. |
| 4 | `app/data/portfolio/listen.ts` | **63-68** | `engage: { label: 'Email a 20-minute-call agenda', subject: ENGAGE_SUBJECT, agenda: ENGAGE_AGENDA, href: ENGAGE_HREF }` → `engage: ENGAGEMENT,` |
| 5 | `app/data/portfolio/vitrine.ts` | **16** | `import { contact } from '../siteContent';` → `import { contact, ENGAGEMENT } from '../siteContent';` (`contact` stays — it is used elsewhere in the file) |
| 6 | `app/data/portfolio/vitrine.ts` | **136** | **Delete** `const ENGAGEMENT_SUBJECT = 'Engagement enquiry — Vikram Deshpande';` |
| 7 | `app/data/portfolio/vitrine.ts` | **138-144** | `export const engagement = { ...ENGAGEMENT, note: 'These six are shipped work. The inbox that answers a role enquiry answers a project brief.' } as const;` — `note` is the only Vitrine-local field and is unchanged verbatim. |

**No component edit is required.** `components/sections/Listen/Listen.tsx:303-306` and
`components/sections/Vitrine/Vitrine.tsx:261-263` already render `{…label}` and `href={…href}`
straight from the data, both under `data-cta="engage"`. Neither file carries a hard-coded label.
Confirmed: `grep -rn "Email a project brief\|Email a 20-minute" components/` → no hits.

### 7.5 Two tests are ALREADY RED on `main` and must be repaired in the same commit

`t_g2_c1b` renamed the labels (§4) without updating two constants that still hold the pre-§4
copy. Both compare a literal against text that comes from `listenContent.engage.label`, so the
mismatch is deterministic and provable without a build:

| File · line | Constant | Holds | Renders | Test it breaks |
|---|---|---|---|---|
| `tests/overhaul/listen-flagship.spec.ts:38` | `LABEL` | `Book a 20-minute call` | `Email a 20-minute-call agenda` | `TC-LISTEN-CTA-01` (`toBe(LABEL)`, `toEqual([LABEL])`), `TC-LISTEN-CTA-03` (`toContain(LABEL)`) |
| `tests/e2e/audience-paths.spec.ts:25` | `CLIENT_NAME` = `/engagement\|book\|start a project\|work together/i` | matches neither honest label | `Email a 20-minute-call agenda` | `AP-04` (`expect(probe.name).toMatch(CLIENT_NAME)`) |

Measured this session:

```
node -e '…/engagement|book|start a project|work together/i…'
"Email a 20-minute-call agenda" AP-04 CLIENT_NAME match: false
"Email a project brief"         AP-04 CLIENT_NAME match: false
```

Do **not** weaken either check. Repair them to the new truth:

- `listen-flagship.spec.ts:38` → `const LABEL = 'Email a 20-minute-call agenda';`
- `listen-flagship.spec.ts:41-46` `AGENDA` → the **five** §7.3 lines (`TC-LISTEN-CTA-02`'s
  `toEqual(AGENDA)` then passes; its `lines.length >= 4` still holds at 5).
- `listen-flagship.spec.ts:28` and `:119` — the prose/title still quote `"Book a 20-minute call"`;
  restate them to the shipped label so the file does not document a lie.
- `audience-paths.spec.ts:25` → `const CLIENT_NAME = /email .*(agenda|brief)|engagement|enquiry|work together/i;`
  — this **tightens** the rule (it no longer accepts the banned `book` / `start a project` verbs)
  while still requiring a client-named action.

### 7.6 TDD cases — write these BEFORE the edits in §7.4 (R9)

**(1) `tests/engage_single_product.test.mjs`** — new `node --test` file, text-parsed like
`tests/about_sourced_semantics.test.mjs` (node cannot import `.ts`), so it fails **before** a build:

| Name | Assertion |
|---|---|
| `ESP-01: the product is defined exactly once` | `app/data/siteContent.ts` matches `/mailto:\$\{contact\.email\}\?subject=/` exactly **1** time; `app/data/portfolio/listen.ts` and `app/data/portfolio/vitrine.ts` each match it **0** times. |
| `ESP-02: no section file redeclares a subject or a body` | Neither `listen.ts` nor `vitrine.ts` contains `ENGAGE_SUBJECT`, `ENGAGE_AGENDA`, `ENGAGE_HREF` or `ENGAGEMENT_SUBJECT`; both contain `ENGAGEMENT` imported from `'../siteContent'`. |
| `ESP-03: both surfaces import the same symbol` | `/import \{[^}]*\bENGAGEMENT\b[^}]*\} from '\.\.\/siteContent'/` matches in **both** section files. |
| `ESP-04: the strings are the agreed ones` | `siteContent.ts` contains `'20-minute call — Vikram Deshpande'`, `'Email a 20-minute-call agenda'` and all five body lines of §7.3, each **exactly once**. |
| `ESP-05: no booking verb anywhere in the product` | The concatenation of `siteContent.ts` + `listen.ts` + `vitrine.ts` label/subject/body literals does **not** match `/\bbook(ing)?\b|start a project/i`. |
| `ESP-06: no calendar host is introduced` | None of the three files matches `/cal\.com\|calendly\|savvycal/i`. |

**(2) `tests/e2e/audience-paths.spec.ts` — `AP-06: both engagement plates are byte-identical`**
(new test in the existing R4 file):

```ts
const hrefs = await page.locator('[data-cta="engage"]').evaluateAll((els) =>
  els.map((el) => ({ href: el.getAttribute('href') || '', text: (el.textContent || '').trim() })));
expect(hrefs).toHaveLength(2);                                   // one on #vitrine, one on #listen
expect(new Set(hrefs.map((h) => h.href)).size, 'two different mailto products').toBe(1);
expect(new Set(hrefs.map((h) => h.text)).size, 'two different labels').toBe(1);
const p = new URLSearchParams(new URL(hrefs[0].href).search);
expect(p.get('subject')).toBe('20-minute call — Vikram Deshpande');
expect((p.get('body') || '').split('\n')).toEqual(BODY);          // the five §7.3 lines
```

**(3) `tests/e2e/audience-paths.spec.ts` — `AP-07: both audiences finish` (R4 click-through):**

- employer: `AP-01`/`AP-02`/`AP-03` already own hero → `Download CV` → real PDF; extend `AP-07`
  only to assert the CV control and an `[data-cta="engage"]` are both reachable in one pass.
- client: scroll `#vitrine`, read its `[data-cta="engage"]` href; scroll `#listen`, read its
  `[data-cta="engage"]` href; assert both are non-empty, `startsWith('mailto:')`, resolve to
  `contact.email` in `url.pathname`, and carry a non-empty `subject` **and** a non-empty `body`.
  Assert the two hrefs are `===`. (Today Vitrine has no `body` at all — this is the assertion
  that would have caught G-C1 and did not exist.)

**(4) `tests/e2e/audience-paths.spec.ts` — `AP-08: no plate promises a tool that does not exist`
(the copy test):**

```ts
const labels = await page.locator('[data-cta="engage"]').allTextContents();
expect(labels).toHaveLength(2);
for (const l of labels) {
  expect(l, `"${l}" promises a booking tool`).not.toMatch(/\bbook(ing)?\b|start a project/i);
  expect(l.trim(), `"${l}" does not name the mechanism`).toMatch(/^Email\b/);
}
```

**(5) Repairs from §7.5**, in the same commit: `listen-flagship.spec.ts` `LABEL` + `AGENDA` +
lines 28/119 prose; `audience-paths.spec.ts:25` `CLIENT_NAME`.

**Untouched and must stay green:** `TC-LISTEN-CTA-02` (subject/body/encoding/900-char cap),
`TC-LISTEN-CTA-04` (no booking host in the built export), `CT-09`
(`tests/content/content-check.spec.ts:173`, `#listen` engage href matches
`/^mailto:sarkar\.vikram@gmail\.com\?subject=.+/`), `TC-SCENE-LISTEN-04/05` and
`listen-flagship` `ANCHORS` (anchor count in `#listen` is unchanged — no anchor is added or
removed by this change).

### 7.7 Verification the implementer runs before pushing

```bash
npx tsc --noEmit
npm run lint
node --test tests/engage_single_product.test.mjs
npm run build:static
node scripts/validate/overhaul_static_audit.mjs                      # 10/10
grep -rn "Engagement enquiry\|Email a project brief" out/ || echo "clean — one product shipped"
PLAYWRIGHT_BASE_URL=http://127.0.0.1:<own-port> npx playwright test \
  tests/e2e/audience-paths.spec.ts tests/overhaul/listen-flagship.spec.ts tests/content/content-check.spec.ts
```

Ports `:5599` and `:8080` belong to other tenants — bind your own.

### 7.8 Risk register

| Assumption | Mitigation |
|---|---|
| `siteContent.ts` is the right home for a cross-section product | It already holds `contact`, which both section files import; `ESP-03` pins the import path, so a future move is a visible, failing edit rather than a silent drift. |
| A five-line body is still under every mail client's URL limit | Measured: **305** chars against a 900 cap (`TC-LISTEN-CTA-02`); 595 chars of headroom. |
| `Hiring or a project:` reads as a prompt, not a promise | Same colon-terminated register as the four existing agenda lines, which the adversarial reviewer has already passed twice; it renders nowhere on the page. `ESP-04` pins it verbatim. |
| One label must work in two visual contexts | Neither plate is claim-bearing chrome (`Listen.tsx:301`, `Vitrine.tsx:256` both state the plate is achromatic and never gold), so no gold/caliper grade changes and `TC-NFR-MONO` is untouched. |
| Collapsing to one product loses Vitrine's project framing | It does not: `vitrine.ts:140` `note` carries it in prose above the plate, and the new body line 1 carries it into the enquiry itself. |
| The two red tests in §7.5 are red for another reason | The mismatch is a string literal vs. rendered `listenContent.engage.label`; proven by `grep` + `node -e` above without a build. If a run shows otherwise, stop and re-open this section rather than editing the assertion. |

**goal_complete: true** — path (b) decided, strings fixed verbatim, edits and TDD cases named;
implementation delegated to `t_w1_c1ap`. No app code was edited by this task.
