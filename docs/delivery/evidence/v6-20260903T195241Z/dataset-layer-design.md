# Canonical dataset layer — implementation design

Run `v6-20260903T195241Z` · Contract: **R-108** (canonical dataset layer), **R-95** (data truth),
**R-109** (render architecture by class), **R-110** (one encoding grammar), **R-112** (dossiers),
**R-115** (channel extension), **R-119** (vanity-metric prohibition), **R-143** (generation records),
**R-175** (counter integrity / no visible zero), **R-182** (make the data current),
**SC-51.1**, **SC-62.1**, **SC-64.1**, **SC-94.1**, **T-19**, **T-37**, **T-40**, Gates K and R.

Status: **design only — nothing in this document is implemented yet.** Every path, type and script
name below is a build instruction, not a description of the current tree.

---

## 0 · What exists today, and why it does not satisfy R-108

Verified by reading the tree on 2026-09-03:

| Present | Path | What it does | Gap against R-108 |
|---|---|---|---|
| CV fingerprint | `scripts/build/cv_fingerprint.mjs` → `app/data/generated/cv-fingerprint.ts` | MD5 + byte size of the CV PDF, on every build | Typed but **untyped provenance** — no `source`/`method`/`url`, no `retrievedAt` |
| Repo harvest | `scripts/build/harvest_repos.mjs` → `app/data/generated/repo-harvest.json` | 6 repos via `gh api`, **run by hand** | Not deploy-refreshed (R-182); `harvestedAt` is a single date for the whole file, not per field; no `method`, no `url` |
| Corrections ledger | `scripts/build/feedback_log.mjs` → `app/data/generated/feedback-log.ts` | `git log` corrections, on every build | Provenance is prose in a file header, not data |
| Channel | *(none)* | — | R-113 … R-115 strand absent from the codebase entirely |
| LinkedIn | *(none)* | — | Absent |
| Delivery history | *(none)* | — | Absent |
| Generation records | *(none)* | — | R-143 absent |

Build wiring today (`package.json`):

```
"build":        "rm -rf .next && node scripts/build/cv_fingerprint.mjs && node scripts/build/feedback_log.mjs && NODE_ENV=production next build",
"build:static": "rm -rf .next out && node scripts/build/cv_fingerprint.mjs && node scripts/build/feedback_log.mjs && NODE_ENV=production FIREBASE_STATIC_EXPORT=1 next build && node scripts/build/prune_static_export.mjs",
```

`harvest_repos.mjs` appears in **neither** script. That is exactly the defect R-182 names, and the
site's own copy currently tells the truth about it (`app/data/portfolio/vitrine.ts` →
`limits: 'Every figure on it is quoted from a CV or a repository — none is computed live.'`).
When this layer lands, that line becomes false and must be rewritten in the same commit (§3.6).

Four corpora already harvested this run are the **seed inputs**, not the runtime source:
`docs/delivery/evidence/v6-20260903T195241Z/corpus-cv.json` (37 metrics, 9 roles, per-field
provenance), `corpus-linkedin.json` (status: not observable, 5 recorded attempts),
`corpus-repositories.json` (41 repositories, `_provenance` per field group),
`corpus-youtube.json` (11 videos, channel `UCJSYpoFkGKKzYTKzAr8vGzQ`, no API key).

---

## 1 · The type system

### 1.1 `app/data/canonical/provenance.ts` — new file, no dependencies

```ts
/**
 * The provenance kernel. Nothing enters the canonical dataset except through
 * `sourced()` or `notObservable()`, so a value without a source is not
 * representable — R-95 enforced by the compiler rather than by review.
 */

/** UTC, second precision, always `Z`. e.g. '2026-09-03T20:09:30Z'. */
export type Iso8601 = string;

/** The systems this site is allowed to believe. Adding one is a contract change. */
export type SourceSystem =
  | 'github-rest'        // api.github.com, via gh CLI or fetch + token
  | 'github-actions'     // /actions/runs and /actions/workflows on this repo
  | 'git-local'          // `git log` in this working tree
  | 'youtube-web'        // channel/watch page ytInitialData; no API key exists
  | 'youtube-ytdlp'      // yt-dlp --flat-playlist enumeration
  | 'cv-pdf'             // public/docs/Vik_Resume_Final.pdf bytes and text
  | 'linkedin-public'    // linkedin.com/in/vikramd-profile (auth-walled)
  | 'generation-ledger'  // data/generation-records/*.json (R-143)
  | 'filesystem';        // bytes on disk in this repository

/** How the value was obtained. Must be a runnable command or an exact API route. */
export interface Provenance {
  /** Which system published it. */
  readonly source: SourceSystem;
  /** When THIS value was observed. Not when the build ran. */
  readonly retrievedAt: Iso8601;
  /** The literal command or API route. A reader must be able to run it. */
  readonly method: string;
  /** Where a human verifies it. `null` only when the source has no public URL. */
  readonly url: string | null;
  /** Optional independent second observation of the same value. */
  readonly corroboratedBy?: string;
  /** Optional qualifier that travels with the value into the UI (R-165). */
  readonly note?: string;
}

/** A value that exists and knows where it came from. */
export interface Sourced<T> {
  readonly kind: 'sourced';
  readonly value: T;
  readonly provenance: Provenance;
}

/**
 * A value that was looked for and is not published. This is a POSITIVE record —
 * the open caliper in components/marks/Caliper.tsx — never an omission, never a
 * zero, never a placeholder (R-175, R-165).
 */
export interface NotObservable {
  readonly kind: 'not-observable';
  readonly value: null;
  /** Why it cannot be had. Rendered to the reader verbatim. */
  readonly reason: string;
  /** The command whose output proves the reason. */
  readonly provedBy: string;
  readonly provenance: Provenance;
}

/** Every field in the dataset is one of exactly these two. There is no third. */
export type Field<T> = Sourced<T> | NotObservable;

export function sourced<T>(value: T, provenance: Provenance): Sourced<T> {
  return { kind: 'sourced', value, provenance };
}

export function notObservable(
  reason: string,
  provedBy: string,
  provenance: Provenance,
): NotObservable {
  return { kind: 'not-observable', value: null, reason, provedBy, provenance };
}

export function isObservable<T>(field: Field<T>): field is Sourced<T> {
  return field.kind === 'sourced';
}

/** Narrowing accessor for call sites that have already branched. */
export function must<T>(field: Field<T>, at: string): T {
  if (field.kind !== 'sourced') {
    throw new Error(`[canonical] ${at}: required field is not observable — ${field.reason}`);
  }
  return field.value;
}
```

Two rules the reviewer checks: **(a)** no exported type in `app/data/canonical/**` may declare a
bare `number | string | Date` for a fact — it must be `Field<number>` etc.; **(b)** `Field<T>` is
never `T | null` — `null` alone loses the reason and would produce the zero-state R-175 forbids.

### 1.2 `app/data/canonical/envelope.ts` — module and dataset wrappers

```ts
import type { Field, Iso8601 } from './provenance';

export type ModuleId = 'cv' | 'linkedin' | 'repositories' | 'channel' | 'delivery';

/** Outcome of one deploy-time refresh attempt for one module. */
export type RefreshOutcome =
  | 'fresh'     // every field re-observed this run
  | 'partial'   // some fields re-observed, the rest retained with their ORIGINAL retrievedAt
  | 'retained'  // the source was unreachable; every field is the previous true value
  | 'static';   // the source is local bytes; "refresh" is deterministic (cv)

export interface RefreshFailure {
  /** Exit code of the command, or the HTTP status. */
  readonly exitCode: number | null;
  readonly httpStatus: number | null;
  /** First 500 chars of stderr/body, secrets already scrubbed by the adapter. */
  readonly detail: string;
}

export interface RefreshRecord {
  readonly attemptedAt: Iso8601;
  readonly outcome: RefreshOutcome;
  /** The exact command line attempted, secrets replaced by their VARIABLE NAME. */
  readonly command: string;
  readonly durationMs: number;
  readonly attempts: number;            // 1 + retries actually made
  readonly fieldsFresh: number;
  readonly fieldsRetained: number;
  readonly failure: RefreshFailure | null;
}

export interface DatasetModule<T> {
  readonly moduleId: ModuleId;
  /** Semver of the SHAPE. Bumping it is a code change, not a data change. */
  readonly schemaVersion: string;
  /** sha256 of canonical JSON of `data` with every `provenance.retrievedAt` removed. */
  readonly valueHash: string;
  /** sha256 of canonical JSON of the whole module. */
  readonly recordHash: string;
  readonly refresh: RefreshRecord;
  readonly data: T;
}

export interface DatasetManifest {
  /** Monotonic integer, incremented only when some module's valueHash changes. */
  readonly datasetVersion: number;
  readonly builtAt: Iso8601;
  /** Commit the build ran from, or 'not observable' outside a git checkout. */
  readonly commit: Field<string>;
  readonly modules: Record<ModuleId, {
    schemaVersion: string;
    valueHash: string;
    recordHash: string;
    outcome: RefreshOutcome;
    /** Oldest retrievedAt in the module — what the site's currency copy prints. */
    oldestRetrievedAt: Iso8601;
    newestRetrievedAt: Iso8601;
  }>;
  /** Every provenance key rendered anywhere, for SC-51.1. See §5.3. */
  readonly provenanceIndexHash: string;
}
```

`valueHash` versus `recordHash` is the whole diffability story: a build that re-fetches identical
numbers changes `recordHash` (new `retrievedAt`) and leaves `valueHash` alone, so T-37 can
distinguish *"the data moved"* from *"we looked again"* without a human reading a diff.

### 1.3 Canonical JSON (used by every hash and every diff)

`scripts/dataset/lib/canonical_json.mjs`: keys sorted lexicographically at every depth, arrays in
declared order, `\n` line endings, no trailing whitespace, numbers serialised by `JSON.stringify`,
UTF-8. `sha256 = createHash('sha256').update(canonicalJson(x)).digest('hex')`. The same function
writes the committed files, so `git diff` on a dataset file is always minimal and reviewable.

---

## 2 · The five modules

All generated artefacts are **committed** (a fresh clone must typecheck and build offline), written
to `app/data/canonical/generated/` and imported through typed loaders in `app/data/canonical/`.

```
app/data/canonical/
  provenance.ts                 §1.1
  envelope.ts                   §1.2
  index.ts                      the ONLY import surface for components (§5.1)
  selectors.ts                  derived, memoised read models (§5.2)
  dossiers.ts                   R-112 registry (§6)
  cv.ts        linkedin.ts      repositories.ts   channel.ts   delivery.ts
  generated/
    manifest.v1.json            DatasetManifest
    cv.v1.json                  DatasetModule<CvData>
    linkedin.v1.json            DatasetModule<LinkedInData>
    repositories.v1.json        DatasetModule<RepositoriesData>
    channel.v1.json             DatasetModule<ChannelData>
    delivery.v1.json            DatasetModule<DeliveryData>
    provenance-index.v1.json    { [sourceId]: Provenance }  (§5.3)
```

Each `<module>.ts` is four lines and does the one job the JSON cannot: attach the type and assert
the shape at module load.

```ts
// app/data/canonical/repositories.ts
import raw from './generated/repositories.v1.json';
import { assertModule } from './assert';
import type { DatasetModule } from './envelope';
import type { RepositoriesData } from './schema/repositories';

export const repositories: DatasetModule<RepositoriesData> =
  assertModule<RepositoriesData>('repositories', '1.0.0', raw);
```

`assertModule` (`app/data/canonical/assert.ts`) checks `moduleId`, `schemaVersion` compatibility and
that **every leaf that should be a `Field` has `kind: 'sourced' | 'not-observable'`**, throwing at
import time. A malformed dataset therefore fails `next build`, never renders.

### 2.1 `cv` — `scripts/dataset/sources/cv.mjs`

- **Source:** `public/docs/Vik_Resume_Final.pdf` (MD5 `16b856c0f3f4ec0d801fdde6d084452c`, 157,615 bytes).
- **Method:** `createHash('md5'|'sha256')` over the bytes; `pdftotext -layout` per page for text;
  the structured extraction seeded from `corpus-cv.json` (9 roles, 2 education, 2 certifications,
  4 skill blocks, 37 metrics, all with `page` + verbatim spans).
- **Refresh:** `outcome: 'static'` — deterministic, offline, no network. Runs every build.
- **Hard failure:** file missing, or `pdftotext` absent → **exit 1, build stops.** (Today's
  `cv_fingerprint.mjs` already does this and is right to.)
- **Shape** (`app/data/canonical/schema/cv.ts`): `fingerprint: { md5: Sourced<string>, sha256,
  bytes: Sourced<number>, pages }`, `roles: CvRole[]` where each role carries
  `{ id, employer: Sourced<string>, title: Sourced<string>, start: Field<string>, end: Field<string>,
  bullets: Sourced<string>[], metrics: CvMetric[] }`, and
  `yearsOfExperience: Sourced<number>` computed from the earliest role with the computation in
  `provenance.method` (settles R-173's fifteen-vs-sixteen split from data, once).
- **Replaces:** `scripts/build/cv_fingerprint.mjs`, `app/data/generated/cv-fingerprint.ts`.

### 2.2 `linkedin` — `scripts/dataset/sources/linkedin.mjs`

- **Observed state:** the profile is auth-walled; five retrieval attempts are recorded in
  `corpus-linkedin.json` with verbatim responses.
- **Method:** attempt an unauthenticated `fetch` of `https://www.linkedin.com/in/vikramd-profile`
  with a 10 s timeout, record status, then emit **every** field as `notObservable(reason, provedBy, …)`
  unless a body with parseable profile JSON-LD is returned.
- **Refresh:** `outcome: 'retained'` in the expected case, with `failure.httpStatus` recorded.
- **Why the module exists at all:** R-8 and R-173 require LinkedIn reconciliation. Modelling it as
  data means the site can *state* that LinkedIn was checked and is not publishable, sourced,
  instead of silently omitting it. The CV of record wins the reconciliation (`reconciliation_ruling`
  in the corpus), and that ruling ships as a `Sourced<string>` note.
- **No fabrication path exists:** the adapter has no code that can emit a `sourced()` LinkedIn field
  without a parsed response body.

### 2.3 `repositories` — `scripts/dataset/sources/repositories.mjs`

- **Source:** GitHub REST. Transport, in order: (1) `gh api` when `gh auth status` exits 0
  (host is authenticated as `Victordtesla24`, scopes `gist, read:org, repo, workflow`);
  (2) `fetch` with `Authorization: Bearer $GITHUB_TOKEN`; (3) `$GITHUB_PERSONAL_ACCESS_TOKEN`
  read from the environment by **name** only. A token value is never written to any file, and
  `RefreshRecord.command` prints the variable name, never the value.
- **Routes**, one `Provenance.method` per field group (mirrors `corpus-repositories.json`):
  - `GET /user/repos?per_page=100&affiliation=owner&sort=full_name` (paginated) → owner totals, `publicRepoCount`
  - `GET /repos/Victordtesla24/{repo}` → `pushedAt`, `createdAt`, `sizeKb`, `primaryLanguage`, `openIssues`, `homepage`
  - `GET /repos/{owner}/{repo}/languages` → `languageBreakdown`
  - `GET /repos/{owner}/{repo}/commits?per_page=1` + `Link: rel="last"` → `commitCount`
  - `GET /repos/{owner}/{repo}/actions/workflows` and `…/actions/runs?branch=main&per_page=1` → CI truth for R-184
- **Scope:** the six vitrine repositories **and** the owner totals. The 41-repository sweep stays in
  the evidence corpus; the shipped dataset carries only what the site renders plus the counts it cites.
- **Refresh:** `fresh` on success; per-repo failure degrades that repo's fields to retained and the
  module to `partial`; total network failure → `retained`.
- **Replaces:** `scripts/build/harvest_repos.mjs`, `app/data/generated/repo-harvest.json`.

### 2.4 `channel` — `scripts/dataset/sources/channel.mjs` (R-113 … R-115, R-119)

- **Credential reality, verified this run:**
  `grep -c -ai 'YOUTUBE' /root/.claude/.env.production` → `0`. **There is no YouTube API key on this
  host.** The design therefore does not depend on one; if a key is added later the adapter prefers it
  and the provenance `source` flips from `youtube-web` to a new `youtube-api` member.
- **Method of record** (the one that actually worked, per `corpus-youtube.json`):
  1. enumerate with `yt-dlp --flat-playlist --dump-single-json https://www.youtube.com/@vicd0ct/videos`
     (also `/podcasts`, `/playlists`); the system `/usr/local/bin/yt-dlp` is broken
     (`ModuleNotFoundError: No module named 'yt_dlp'`) — the adapter resolves a pinned standalone
     binary from `$YTDLP_BIN`, and if that is unset or non-executable it records the fact and retains;
  2. per video, `curl` the watch page and parse `ytInitialData.videoPrimaryInfoRenderer` /
     `videoSecondaryInfoRenderer` for title, `dateText`, verbatim description;
  3. channel About fields from `ytInitialData.metadata.channelMetadataRenderer`
     (`externalId` = `UCJSYpoFkGKKzYTKzAr8vGzQ`).
- **Known gate:** transcripts are bot-gated (`playabilityStatus=LOGIN_REQUIRED`, confirmed with real
  Chrome). Transcript fields ship as `notObservable` with that exact `provedBy` string — which is
  also the honest reason the R-122 deep-linking corpus is empty rather than invented.
- **R-119 is enforced by the schema, not by discipline:** `ChannelData` declares **no**
  `subscriberCount`, `viewCount`, `likeCount` or `watchTime` field. A vanity metric has nowhere to go.
- **R-114 derived models** (`themes`, `formatProfile`, `cadence`, `depthSignals`, `productionEvolution`)
  are computed **in the adapter from observed fields only**, and each derived field's
  `provenance.method` is the literal formula, e.g.
  `"derived: median gap between consecutive publish_date over 11 videos (channel.videos[].publishDate)"`.
  A derived field whose inputs are `notObservable` is itself `notObservable` — never defaulted.
- **Unlisted items** discovered through playlists are marked `listingStatus: 'unlisted'` and are
  excluded from every rendered count; `corpus_strand_risk` in the corpus explains why.

### 2.5 `delivery` — `scripts/dataset/sources/delivery.mjs`

Three strands, one module:

1. **Corrections ledger** — `git log --no-merges -400 --date=short --pretty=format:%h%x1f%ad%x1f%s%x1e`,
   filtered exactly as `feedback_log.mjs` does today (`^(fix|perf|refactor)\(` or a review word).
   `provenance.source: 'git-local'`. Outside a git checkout → `retained`, never empty.
   **Replaces** `scripts/build/feedback_log.mjs` / `app/data/generated/feedback-log.ts`.
2. **Pipeline history** — `GET /repos/Victordtesla24/forgotten-mistory/actions/runs?branch=main&per_page=30`
   → `{ runId, conclusion, createdAt, durationMs, headSha }[]`, feeding R-181's honest build-and-deploy
   footer signal and R-184's CI-truth line.
3. **Generation records (R-143)** — every AI-generated asset writes one JSON file to
   `data/generation-records/<assetId>.json` **at generation time** (committed, hand-off from the asset
   pipeline), shape:

```ts
export interface GenerationRecord {
  readonly assetId: string;                 // 'avatar/introduction.mp4'
  readonly modelId: Sourced<string>;        // 'bytedance/omnihuman-1.5'
  readonly prompt: Sourced<string>;         // full, verbatim, not summarised
  readonly parameters: Sourced<Record<string, string | number | boolean>>;
  readonly seed: Field<string>;             // notObservable when the provider returns none
  readonly renderDurationMs: Field<number>;
  readonly costUsd: Field<number>;          // actual charged amount, never a list price
  readonly outputSha256: Sourced<string>;   // hash of the shipped file, re-verified at build
  readonly tier: Sourced<'previz' | 'final'>;  // R-141 ladder stage
}
```

  The adapter **re-hashes every referenced asset on disk** and fails the build if
  `outputSha256` does not match — a generation record that describes a file the site is not shipping
  is worse than none.

---

## 3 · Deploy-time refresh

### 3.1 Scripts

```
scripts/dataset/
  build_dataset.mjs        orchestrator — the only entry point
  verify_dataset.mjs       schema + policy gate (§3.4)
  diff_dataset.mjs         T-37 diff against the committed previous version (§4)
  lib/canonical_json.mjs   sorted-key serialiser + sha256
  lib/http.mjs             fetch with timeout, 2 retries, exponential backoff, secret scrubbing
  lib/retain.mjs           merge(previous, fresh) → module + RefreshRecord
  sources/cv.mjs  linkedin.mjs  repositories.mjs  channel.mjs  delivery.mjs
```

### 3.2 `package.json` — exact replacement scripts

```json
"dataset:refresh": "node scripts/dataset/build_dataset.mjs",
"dataset:verify":  "node scripts/dataset/verify_dataset.mjs",
"dataset:diff":    "node scripts/dataset/diff_dataset.mjs",
"build":           "rm -rf .next && npm run dataset:refresh && npm run dataset:verify && NODE_ENV=production next build",
"build:static":    "rm -rf .next out && npm run dataset:refresh && npm run dataset:verify && NODE_ENV=production FIREBASE_STATIC_EXPORT=1 next build && node scripts/build/prune_static_export.mjs && npm run dataset:diff",
```

`cv_fingerprint.mjs` and `feedback_log.mjs` drop out of both scripts in the same commit that adds
`sources/cv.mjs` and `sources/delivery.mjs`; the two old scripts and their two generated files are
deleted only after `app/data/portfolio/*.ts` stops importing them (migration order in §7).

### 3.3 `build_dataset.mjs` — exact order of operations

1. `t0 = Date.now()`; read the **previous** committed dataset from
   `app/data/canonical/generated/*.json` into memory. If a file is missing, `previous = null` for
   that module (first run only).
2. Run the five adapters **concurrently** with `Promise.allSettled`, each under a hard
   `AbortController` timeout: cv 10 s, linkedin 10 s, repositories 45 s, channel 90 s, delivery 30 s.
   Each adapter returns `{ fields, refresh }` and **never throws for a network reason** — it returns
   a `RefreshRecord` with `failure` populated.
3. For each module, `retain.merge(previous, fresh)`:
   - a field observed this run → the fresh `Sourced` with **this run's** `retrievedAt`;
   - a field not observed this run but present in `previous` → **the previous object, byte-identical,
     including its original `retrievedAt`**;
   - a field not observed and absent from `previous` → `notObservable(reason, provedBy, …)` built
     from the failure record;
   - `fieldsFresh` / `fieldsRetained` counted here, `outcome` derived: all fresh → `fresh`,
     none fresh → `retained`, otherwise `partial`.
4. Compute `valueHash` and `recordHash` per module (§1.3).
5. `datasetVersion = previousManifest.datasetVersion + (any valueHash changed ? 1 : 0)`.
6. Write the five module files, `manifest.v1.json`, and `provenance-index.v1.json` (§5.3), all via
   `canonicalJson`, all with a trailing newline.
7. Print a table to stdout: module · outcome · fresh/retained · oldest `retrievedAt` · duration.
   Exit 0. **A degraded refresh is a normal build, not a failed one.**

### 3.4 Failure policy — what an unreachable API may and may not do

| Situation | What the dataset does | What the page shows |
|---|---|---|
| GitHub 401/403/429/timeout | every repo field retained at its original `retrievedAt`; `outcome: 'retained'`; `failure` recorded | the real previous numbers, and the real earlier date — the currency line reads that date (§3.6) |
| One repo 404 (renamed/deleted) | that repo's fields retained; module `partial` | unchanged |
| yt-dlp missing / bot gate | channel fields retained; transcripts stay `notObservable` | unchanged; open caliper where a transcript would be |
| LinkedIn auth wall | `notObservable` with the HTTP status as `provedBy` | "checked; not publishable", with the reason |
| CV PDF missing | **exit 1** | build stops |
| Schema/assert failure | **exit 1** | build stops |
| A field observable in `previous` and now absent with no retained value | **exit 1** | build stops |
| Secret-shaped string (`gh[pousr]_`, `sk-`, `AIza`) in any output | **exit 1** | build stops |

Three things this policy makes **impossible**, which is the point of R-175 and R-95:
a fabricated value (no adapter can construct `sourced()` without a parsed response);
a `0` where a number belongs (a failed fetch produces a retained value or `notObservable`, never
`0` — `verify_dataset.mjs` additionally rejects any `Sourced<number>` whose value is `0` unless the
adapter marked it `zeroIsMeaningful: true`, as `openIssues` legitimately is); and a fresh
`retrievedAt` on a value that was not re-observed (retention copies the previous object whole).

### 3.5 CI wiring — `.github/workflows/deploy.yml`

The `build` job (line 627) runs `npm run build:static` and uploads `out/`. Two edits:

```yaml
      - run: npm run build:static
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}          # repositories + delivery adapters
          YTDLP_BIN: ${{ runner.temp }}/yt-dlp           # fetched in the step below
      - name: Upload dataset refresh manifest
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: dataset-manifest
          path: |
            app/data/canonical/generated/manifest.v1.json
            reports/dataset-diff.json
          retention-days: 30
```

with a preceding step that downloads the pinned `yt-dlp` standalone binary to `${{ runner.temp }}`
(never into the repo). `secrets.GITHUB_TOKEN` has public read across GitHub, which is all the
repositories adapter needs. The dataset files that the refresh rewrites are **not** committed back
by CI — the deployed artefact carries them, and the next local `dataset:refresh` + commit keeps the
tree honest. `reports/dataset-diff.json` is the T-37 input.

`scripts/deploy/firebase_static_deploy.sh` needs no change: it calls `npm run build`, which now
refreshes.

### 3.6 The copy that must change with it (R-182, T-40)

- `app/data/portfolio/vitrine.ts` → plate 06 `limits` currently reads *"Every figure on it is quoted
  from a CV or a repository — none is computed live."* Replace with a line generated from the
  manifest, e.g. *"Repository and channel figures refresh on every deploy; each carries the date it
  was last observed. CV figures are quoted from the document itself."*
- `vitrineContent.harvestedAt` becomes `manifest.modules.repositories.oldestRetrievedAt` — so the
  date on the page is the date in the data, and **cannot** drift from it.
- Any section printing a currency line reads it from `selectors.currency(moduleId)`, never a literal.
- T-40 asserts exactly this: extract every self-claim, diff against `manifest.v1.json`.

---

## 4 · Versioning and diffability (T-37)

- **Stable ids everywhere.** `repo:aether-job-career-agent`, `video:p9pGAmqJCSk`,
  `cv:role:anz`, `cv:metric:anz-portfolio`, `cap:kubernetes`, `run:1234567890`. Diffs are keyed by
  id, never positional, so reordering is a no-op and a deletion is unmistakable.
- **`schemaVersion`** per module, semver. Minor = additive field; **major = a field changed meaning
  or was removed**, which requires a matching `assertModule` compatibility range bump and is a
  reviewable code change.
- **`datasetVersion`** increments only when a `valueHash` moves. A build that only re-observes leaves
  it unchanged.
- **`scripts/dataset/diff_dataset.mjs`** compares `git show HEAD:app/data/canonical/generated/<m>.v1.json`
  against the working copy and emits **RFC 6902 JSON Patch** to `reports/dataset-diff.json`, plus a
  human table. It exits non-zero — failing T-37 / Gate R — on any of:
  1. a field id present in HEAD and absent now (**preservation loss**);
  2. a transition `sourced → not-observable` without a `reason` naming a cause;
  3. any `provenance` object removed or emptied;
  4. a `retrievedAt` moving **backwards**;
  5. a `retrievedAt` moving **forwards on a field whose value did not change and whose module
     outcome was not `fresh`** (that is a fabricated freshness claim);
  6. a Preservation-Register semantic disappearing: a calibration `status`, a vitrine `limits`
     string, an exclusion entry, a `measured from the role` annotation, a CV calibration figure
     (R-165 … R-170, enumerated in `T37-baseline-inventory.json`, which is the diff's baseline).
- The baseline of record is
  `docs/delivery/evidence/v6-20260903T195241Z/T37-baseline-inventory.json`; the tool takes
  `--baseline <path>` so each certification run pins its own.

---

## 5 · How visualisations consume it — and how SC-51.1 is tested mechanically

### 5.1 One import surface

`app/data/canonical/index.ts` re-exports `{ cv, linkedin, repositories, channel, delivery, manifest }`
and the selectors. **A component may not import from `app/data/canonical/generated/**` or from
`app/data/generated/**`.** Enforced by an ESLint `no-restricted-imports` rule in `.eslintrc.json`
*and* by `scripts/validate/dataset_integrity.mjs` (so it also fails outside the linter).

`app/data/portfolio/*.ts` keeps its role — **editorial copy only** (titles, ledes, `limits` lines,
descriptions, curation, drawing ids). Every *figure* moves out of those files into selectors.
That split is what makes the mechanical test possible: prose lives in one place, facts in the other.

### 5.2 Selectors — `app/data/canonical/selectors.ts`

```ts
/** Everything a mark needs to render itself honestly, in one object. */
export interface MarkBinding<T> {
  /** Stable, unique, dot-notated. THE key SC-51.1 resolves. */
  readonly sourceId: string;          // 'repositories.aether-job-career-agent.commits'
  readonly field: Field<T>;
  /** Which caliper the reader sees (components/marks/Caliper.tsx). */
  readonly caliper: 'sourced' | 'self-reported' | 'open';
  /** Pre-formatted display string. Never '0' for an unobserved value. */
  readonly display: string;
}

export function bind<T>(sourceId: string, field: Field<T>, format?: (v: T) => string): MarkBinding<T>;
export function currency(moduleId: ModuleId): { observedAt: string; outcome: RefreshOutcome };
```

`caliper` is derived, not authored: `not-observable` → `'open'`; `source: 'cv-pdf'` with no
published methodology → `'self-reported'`; everything else → `'sourced'`. The three states of
R-166 therefore fall out of provenance instead of being re-asserted by hand in each section.

### 5.3 The rendered contract

Every mark that draws a value emits three attributes, produced by one helper so they cannot
disagree:

```ts
// app/data/canonical/markAttrs.ts
export function markAttrs<T>(b: MarkBinding<T>, markId: string) {
  return {
    'data-mark-id': markId,           // unique per rendered mark, per view
    'data-source-id': b.sourceId,     // MUST exist in provenance-index.v1.json
    'data-caliper': b.caliper,
    'data-retrieved-at': b.field.provenance.retrievedAt,
  } as const;
}
```

`build_dataset.mjs` also writes `provenance-index.v1.json` — a flat
`{ [sourceId]: Provenance }` map over every leaf `Field` in the dataset — and `next build` copies it
to `public/dataset-provenance.json`, so it is fetchable from the static export at
`https://forgotten-mistory.web.app/dataset-provenance.json`.

For WebGL and Canvas classes (R-109), where there is no DOM node per mark, the required R-101 text
alternative carries the attributes: each `<canvas>` sits beside a visually-hidden `<table>` or list
whose cells are the marks and carry the same `data-source-id`. That satisfies R-101 and makes the
WebGL sections testable by exactly the same assertion as the SVG ones.

### 5.4 The two-part mechanical test for SC-51.1

**Static half — `scripts/validate/dataset_integrity.mjs`** (added to the `quality` job next to
`overhaul_static_audit.mjs`, and to `npm run dataset:verify`):

1. every `data-source-id="…"` literal in `components/**` and `app/**` resolves in
   `provenance-index.v1.json`;
2. no file in `components/sections/**` imports `app/data/generated/**` or
   `app/data/canonical/generated/**`;
3. no numeric literal appears in JSX **text** position in `components/sections/**` (viewBox
   geometry, indices and CSS values are excluded by only scanning text children and
   `aria-label`/`title` strings);
4. every `Sourced<number>` rendered through `bind()` has a formatter (no raw `String(value)`);
5. exactly **one** `data-gold="true"` mark per registered visualisation (R-110).

**Runtime half — `tests/content/dataset_marks.spec.ts`** (Playwright, against the static export at
`PLAYWRIGHT_BASE_URL`, alongside the existing `tests/content` specs):

```ts
const index = await (await fetch(`${baseURL}/dataset-provenance.json`)).json();
const marks = await page.$$eval('[data-mark-id]', (els) =>
  els.map((e) => ({
    markId: e.getAttribute('data-mark-id'),
    sourceId: e.getAttribute('data-source-id'),
    caliper: e.getAttribute('data-caliper'),
    text: e.textContent?.trim() ?? '',
  })),
);
// 1. every mark resolves
for (const m of marks) expect(index[m.sourceId!], `${m.markId}`).toBeDefined();
// 2. mark ids are unique
expect(new Set(marks.map((m) => m.markId)).size).toBe(marks.length);
// 3. every section renders at least one mark (R-93/R-95)
for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#contact'])
  expect(await page.locator(`${id} [data-mark-id]`).count()).toBeGreaterThan(0);
// 4. R-175 — a sourced mark never renders a bare zero, a dash or a placeholder
for (const m of marks)
  if (m.caliper !== 'open') expect(m.text).not.toMatch(/^(0|0\+|\$0M?\+?|—|-|N\/A|NaN|null|undefined)$/);
// 5. no unmarked figure — every number in section prose is inside a marked element
const stray = await page.$$eval('section', (secs) => /* text nodes outside [data-mark-id] */ []);
expect(stray, `unsourced figures: ${JSON.stringify(stray)}`).toHaveLength(0);
```

Assertion 5 is the one that actually proves SC-51.1 ("**every** rendered mark resolves"), because
1 – 4 only prove the marks that opted in. It runs with a per-section allowlist file
(`tests/content/unsourced-allowlist.json`) that must be **empty** at certification and whose every
entry requires a written reason — an allowlist entry is a Gate K finding, not a pass.

Run under T-39's degraded matrix too (JS disabled, `prefers-reduced-motion`, WebGL unavailable):
the same assertions must hold, which is what makes R-175 provable rather than promised.

---

## 6 · The per-visualisation dossier (R-112)

### 6.1 Registry — `app/data/canonical/dossiers.ts` (typed, hand-authored, validated)

```ts
export type RenderClass = 'svg' | 'canvas2d' | 'webgl';   // R-109
export type InteractionKind = 'hover-reveal' | 'focus-zoom' | 'filter' | 'drill-down' | 'curiosity';

export interface PerformanceMeasurement {
  readonly fps: number;              // sustained, everything active (R-100 target 60)
  readonly initMs: number;           // lazy init to first paint of the artefact
  readonly memoryMb: number;         // JS heap delta while mounted
  readonly disposedCleanly: boolean; // R-100 full disposal
  readonly measuredAt: Iso8601;
  readonly method: string;           // exact spec + device, e.g. 'tests/perf/viz_fps.spec.ts · Desktop Chrome · CPU 4× throttle'
}

export interface Dossier {
  readonly vizId: string;                    // 'experience.career-strata'
  readonly section: '#hero' | '#about' | '#experience' | '#skills' | '#vitrine' | '#contact';
  readonly title: string;
  readonly renderClass: RenderClass;
  /** What it shows — one paragraph, no adjectives of self-praise. */
  readonly whatItShows: string;
  /** Every canonical field it draws. Validated against provenance-index.v1.json. */
  readonly datasetFields: readonly string[];
  /** The one mark allowed to be gold in this view (R-110), or null. */
  readonly goldMark: string | null;
  readonly interactions: readonly { kind: InteractionKind; description: string }[];
  /** The skill the artefact demonstrates by existing. */
  readonly demonstratedSkill: string;
  /** One line, the site's voice, ≤ 20 words (R-99). */
  readonly takeaway: string;
  readonly accessibility: {
    readonly textAlternative: string;   // selector of the equivalent DOM
    readonly reducedMotion: string;     // what the reduced-motion composition is
  };
  readonly performance: PerformanceMeasurement;
}

export const dossiers: readonly Dossier[];
```

### 6.2 Where the numbers come from

`performance` is **not authored**. `tests/perf/viz_perf.spec.ts` measures each `data-viz-id` region
(`requestAnimationFrame` sampling for fps, `performance.measure` for init, `performance.memory`
delta, a mount/unmount cycle for disposal) and writes `reports/viz-perf.json`.
`scripts/dataset/build_dossiers.mjs` joins registry + measurements and writes:

```
docs/delivery/visualisation-dossiers/index.md
docs/delivery/visualisation-dossiers/<vizId>.md
```

Each generated page carries, in this fixed order: **What it shows · Provenance (a table of every
`datasetFields` entry with `source`, `retrievedAt`, `method`, `url`) · Interactions · Demonstrated
skill · Takeaway · Performance (fps / init / memory / disposal, with `measuredAt` and `method`) ·
Accessibility**. A dossier whose `performance.measuredAt` predates the current `datasetVersion` is
printed as **stale** and fails Gate K.

### 6.3 Validation

`dataset_integrity.mjs` additionally asserts: every `data-viz-id` in the rendered DOM has a dossier;
every dossier's `vizId` appears in the DOM; every `datasetFields` entry resolves in the provenance
index; `goldMark` (when non-null) is one of `datasetFields` and is the only `data-gold="true"` in
that view; `takeaway` ≤ 20 words; `renderClass` matches the element actually used
(`svg` / `canvas` + `2d` / `canvas` + `webgl`), which is how R-109 stops being an aspiration.

---

## 7 · Migration order (no step leaves the tree broken)

1. Add `provenance.ts`, `envelope.ts`, `assert.ts`, `schema/*` — types only, nothing imports them.
2. Add `scripts/dataset/**`; run `npm run dataset:refresh` locally; commit the six generated files.
3. Add `selectors.ts`, `markAttrs.ts`, `index.ts`.
4. Move figures section by section (vitrine → skills → experience → about → hero → contact),
   each section's commit also adding its `data-mark-id`/`data-source-id` attributes and its dossier.
5. Switch `package.json` `build` / `build:static` to the §3.2 forms; update `deploy.yml` per §3.5.
6. Rewrite the currency and limits copy (§3.6) **in the same commit** that makes the refresh live.
7. Delete `scripts/build/cv_fingerprint.mjs`, `scripts/build/feedback_log.mjs`,
   `scripts/build/harvest_repos.mjs`, `app/data/generated/` — only once step 4 has removed every
   import of them (`grep -rn "data/generated" app components lib` must be empty).
8. Turn on `dataset_integrity.mjs` in the `quality` job and `dataset_marks.spec.ts` in `tests/content`.

## 8 · Open facts recorded rather than assumed

- **No YouTube API key exists on this host** — `grep -c -ai 'YOUTUBE' /root/.claude/.env.production` → `0`.
  The channel adapter is designed around the web/yt-dlp path that was proven to work this run, and
  prefers an API key only if one is later present.
- **YouTube transcripts are not retrievable unauthenticated** — `playabilityStatus=LOGIN_REQUIRED`,
  confirmed with real Chrome. R-122's deep-linking corpus is `notObservable` until that changes.
- **LinkedIn is auth-walled** — five recorded attempts in `corpus-linkedin.json`; the CV of record wins.
- **`gh` on this host is authenticated** as `Victordtesla24` with scopes `gist, read:org, repo, workflow`
  (`gh auth status`), so the repositories adapter has a working local transport today.
- **CI network reachability for `api.github.com` and `youtube.com` from the GitHub runner is not yet
  measured.** If either is blocked, the first CI build ships `outcome: 'retained'` — true, dated and
  correct — and the fix is a transport change, never a copy change.
