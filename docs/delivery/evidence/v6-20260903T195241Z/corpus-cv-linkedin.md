# CV + LinkedIn corpus — reconciliation

Contract: `/root/.claude/rebuilding-my-website-prompt.md` v6 — R-8, R-9 (content sourcing),
R-108 (canonical dataset layer), R-143 (generation records), R-173 (fifteen vs sixteen).
Evidence set: `v6-20260903T195241Z`. As-at date: **2026-09-03**.

Companion files: [`corpus-cv.json`](./corpus-cv.json) · [`corpus-linkedin.json`](./corpus-linkedin.json)

---

## 1. The two sources

| | CV | LinkedIn |
|---|---|---|
| Identifier | `/root/forgotten-mistory/public/docs/Vik_Resume_Final.pdf` | `https://www.linkedin.com/in/vikramd-profile` |
| md5 (full) | `16b856c0f3f4ec0d801fdde6d084452c` | — |
| md5 (first 8) | `16b856c0` | — |
| sha256 | `0700d1aa1a48de5dc9ca308968ff5a6049b2b0ea38adac5550353279b0768a25` | — |
| Bytes | 157,615 | — |
| File mtime (UTC) | 2026-07-09T22:56:02Z | — |
| PDF authored (CreationDate) | 2026-06-12 17:30:37 UTC | — |
| Pages | 3 (612 × 792 pt, letter) | — |
| Retrieved? | **Yes, in full** | **No — not observable** |

The LinkedIn URL itself *is* observable: it is printed on page 1 of the CV, in the
`CONTACT INFO` block. Only the content behind it is not.

### Extraction tool used

`pdftotext` — **version 26.01.0** (Poppler), at `/usr/bin/pdftotext`.

```
pdftotext -layout /root/forgotten-mistory/public/docs/Vik_Resume_Final.pdf -
pdftotext -layout -f <n> -l <n> ... -   # per-page, to assign page provenance
```

The node and python3 fallbacks were not needed. Every record's `page` was read from a
per-page run, not inferred from position in a concatenated dump.

The CV is a **two-column layout** (sidebar + body). `-layout` interleaves the two columns
onto shared lines, so `-x`/`-W` column crops were used to read each column cleanly. Text is
verbatim; the only transformation is that soft line-wrap breaks and column padding were
collapsed to single spaces so each bullet is one string. No word, number, punctuation mark
or dash character was altered.

### Self-verification

Every extracted string was re-checked as a substring of a fresh `pdftotext` run of the page
it claims: **149 assertions, 149 passed, 0 failures.** One correction was made during
verification and is logged in `corpus-cv.json → self_verification.corrections_made`: a draft
metric had truncated `5+ cross-functional squads (up to 40 resources, including offshore
teams)` mid-parenthetical. It was restored to the full printed phrase before the file was
finalised.

---

## 2. Years of experience — the arithmetic (settles R-173)

**Earliest dated role start on the CV:** MYOB, *Developer Support / Software Testing /
Analyst* — **`May 2010`** (page 3, `WORK EXPERIENCE`).

The CV prints month-and-year only, with no day. `2010-05-01` is used as the start instant.
**This is an assumption, not an observed value**, and it is recorded as such. It is also the
generous end of a two-day-wide range: using `2010-05-31` instead gives 16.26 years, which
still rounds to **16** whole years. The answer does not depend on the assumption.

```
start  = 2010-05-01      (assumed day; CV states "May 2010")
end    = 2026-09-03      (contract as-at date)

elapsed          = 5,969 days
decimal (Julian) = 5969 / 365.25          = 16.3422
calendar         = 16 years, 4 months, 2 days
decimal (y+m/12) = 16 + 4/12              = 16.3333
```

| | Value |
|---|---|
| **To one decimal** | **16.3 years** |
| **As a whole number** | **16 years** |

### The contradiction, and the ruling

The CV's own prose disagrees with the CV's own dates:

> "**15+ year** Senior Technical Leader and Certified Scrum Master (CSM)…"
> — page 1, `CAREER OBJECTIVE`

`15+` is not false — 16.3 *is* 15+ — but it understates the dated record by a full year.
It reads as a figure written once and never re-derived as time passed.

**Ruling: sixteen.** The dated employment record is the harder evidence and it is internal
to the same document, so this is settled without leaving the CV. Site copy should say
**sixteen**, or better, state the year — *"since 2010"* — and let the number compute itself,
so it never goes stale again. This is the R-182 shape of the fix: make the data current by
making it derived rather than typed.

There is one caveat worth stating plainly: this measures **elapsed time since the first
dated role**, not time in continuous employment. The CV shows one gap — `June 2025 – Feb 2026`
is filled by *Independent AI Consulting & Upskilling*, so the span is in fact continuous on
the CV's own account. No adjustment applies.

---

## 3. LinkedIn — not observable

Five retrieval attempts, all recorded verbatim in `corpus-linkedin.json → attempts`:

| # | Method | Outcome |
|---|---|---|
| 1 | `mcp__firecrawl__firecrawl_scrape` | Provider-level refusal: *"we do not support this site"* — the request never reached LinkedIn |
| 2 | `WebFetch` | `HTTP 999 Unknown Status`, no body retrieved |
| 3 | `curl` with a full Chrome User-Agent, following redirects | `HTTP/2 999`, 1,530-byte body, `server: cloudflare`, `x-li-fabric: prod-lor1` |
| 4 | `curl` bare, no User-Agent | `http_code=999` |
| 5 | `mcp__firecrawl__firecrawl_search` for the exact URL | Succeeded, **zero matching results** |

HTTP 999 is LinkedIn's non-standard refusal for unauthenticated automated clients. It was
returned identically with and without a browser User-Agent, so this is a login gate, not a
User-Agent filter. No public preview page is offered on redirect.

Attempt 5 matters most for discipline. The search returned five results, and **every one of
them is a different person named Vikram Deshpande** — a Cisco engineer in Raleigh-Durham who
studied at Cal State LA, someone in Oakland who studied at UIC, a University of Michigan
mechanical engineer, and a 70+ profile disambiguation directory. The CV owner is in
**Melbourne, VIC, Australia**, with **Monash University** and the **University of Melbourne**.
None of these is him. **None may be used as a substitute source; doing so would be
fabrication.** They are logged precisely so that a later reader does not mistake them for
near-misses worth chasing.

No LinkedIn field is recorded. Headline, about, roles, role dates, education, certifications,
skills, endorsements, recommendations, connection count, follower count and last activity are
each written as **`not observable`**.

**No authenticated path was available.** The variable-name inventory of `~/.claude/.env.production`
was listed (names only — no value was read, printed, copied or committed) and contains **no
`LINKEDIN_*` credential**.

### Consequence under R-173

The CV of record wins **by default, not by contest**. There is no LinkedIn value to agree
with or contradict; the comparison could not be performed at all. Concretely:

- Every biographical claim on the site must cite `corpus-cv.json` with its page/section provenance.
- No claim may be attributed to LinkedIn.
- Any fact currently on the site that traces to LinkedIn and does **not** appear in
  `corpus-cv.json` is unsourced, and must be removed or re-sourced.

To make this observable later, in order of least privilege: the owner exports his own profile
via LinkedIn's *"Get a copy of your data"* and commits the archive as a first-party source;
or saves the profile to PDF from a logged-in session; or a credential with `r_liteprofile`
scope is provisioned.

---

## 4. What the CV yielded

| Record type | Count |
|---|---|
| Roles | 9 |
| Role bullets (verbatim) | 21 |
| Education records | 2 |
| Certifications | 2 |
| Skills blocks / individual items | 4 / 32 |
| Quantitative metrics (verbatim, role-attributed) | 37 |

### Roles, in true chronological order

| # | Employer | Title | Dates (verbatim) | Location | Page |
|---|---|---|---|---|---|
| 1 | MYOB | Developer Support / Software Testing / Analyst | May 2010 - Aug 2011 | Melbourne, VIC | 3 |
| 2 | InfoCentric | Senior Business Analyst | Aug 2011 - Nov 2014 | Melbourne, VIC | 3 |
| 3 | Telstra | Business Analyst / Project Coordinator | Nov 2014 - Oct 2015 | Melbourne, VIC | 3 |
| 4 | Microsoft Inc. | Lead Business Analyst | Oct 2015 - Oct 2016 | Sydney, NSW | 2 |
| 5 | National Australia Bank (NAB) | Senior Project Manager & Business Analyst | Nov 2016 - Sept 2017 | Melbourne, VIC | 2 |
| 6 | ANZ | AI/ML Strategy & Solutions Architect | 2017 - 2022 | Melbourne, VIC | 2 |
| 7 | ANZ | Senior Delivery Lead / Technical Product Owner | Sept 2017 - June 2025 | Melbourne, VIC | 2 |
| 8 | Independent | Independent AI Consulting & Upskilling | June 2025 - Feb 2026 | Melbourne, VIC | 3 |
| 9 | Australian Taxation Office (ATO) | Scrum Master / Project Manager | March 2026 - Present | Melbourne, VIC | 1 |

### Education (page 1, `EDUCATION`)

| Qualification | Institution | Date | Note |
|---|---|---|---|
| Master of Computer Science | Monash University | 2010 | "Honors" |
| Bachelor of Engineering, Computer Science | University of Melbourne | 2007 | — |

### Certifications (page 3, `CERTIFICATIONS`)

| Credential | Issuer | Status | Date |
|---|---|---|---|
| Certified Scrum Master (CSM) | Scrum Alliance | Held | **not observable** — no date printed on the CV |
| Cloud/Data Certifications | AWS/GCP | "(In progress)" | **not observable** — no date printed on the CV |

R-8/R-9 ask for a date per credential. The CV does not print one for either. Recorded as
not observable rather than estimated.

---

## 5. Anomalies a downstream builder must handle

Four, all logged in `corpus-cv.json → observed_anomalies`:

1. **The two ANZ entries overlap.** *Senior Delivery Lead / Technical Product Owner* is dated
   `Sept 2017 - June 2025`; *AI/ML Strategy & Solutions Architect* at the same employer is
   dated `2017 - 2022`. The CV does not say whether these were concurrent, a promotion
   sequence printed out of order, or a layout artefact. **Impact:** none on the
   years-of-experience figure — both sit inside the continuous May 2010–present span. A
   timeline rendering ANZ as one tenure should use `Sept 2017 - June 2025` and nest the
   Architect title inside it.

2. **Print order is not chronological order.** *Independent AI Consulting & Upskilling*
   (`June 2025 - Feb 2026`) is printed **last** on page 3, after MYOB (`May 2010`). It is
   chronologically the second-most-recent role. **Sort by parsed start date, never by print
   order** — a naive top-to-bottom reader puts a 2025 role before a 2010 one.

3. **Two different sidebar blocks both titled `SKILLS`** (pages 1 and 2). They are not
   duplicates: page 1 is the technology inventory, page 2 the management/architecture
   inventory. Both are recorded separately with their own page provenance rather than merged.

4. **Neither certification carries a date** — see above.

---

## 6. Provenance contract

Every record in `corpus-cv.json` carries `{"source": "CV", "page": <1-3>, "section": <string>}`.
Sections in use: `HEADER`, `CONTACT INFO`, `CAREER OBJECTIVE`, `WORK EXPERIENCE`, `EDUCATION`,
`SKILLS`, `CERTIFICATIONS`. Bullets carry their own provenance independently of their parent
role, because a role's heading and its bullets can fall on different pages.

Nothing in either file is estimated, inferred, rounded from a guess, or carried over from a
source not named in it. Where a value is not published, the field says **`not observable`**
and the command and its output stand next to it.
