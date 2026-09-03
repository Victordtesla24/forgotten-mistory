# Product & engineering decisions taken on the Owner's behalf
Run `v6-20260903T195241Z` · §14 of the orchestration contract · R-164 (rationale travels with the requirement)

Execution is non-interactive (R-39, R-41). Every ambiguity below was resolved by the Orchestrator
and is recorded with: what was advertised, what is actually there, the decision, the alternative
the Owner would have to fund, and the reversal cost.

---

## D-01 · R-187 "proficiency" vs R-166 "no proficiency bars"

**Advertised.** R-187 orders Skills rebuilt as *"the force-directed skill topology, with
proficiency, recency and adjacency encoded"*. R-166 orders preservation of *"the explicit refusal
of proficiency bars ('nobody can check one')"*. §9 Prohibitions bans *"skill-percentage bars"*
outright. The live site's own words: *"There are no proficiency bars on this page, because nobody
can check one."*

**Actually there.** `app/data/portfolio/skills.ts` carries no proficiency field, by design. It
carries `status` (three calibration states), `evidence`, `where`, `sources[]` and `caveat`.

**Decision.** The topology encodes **evidence strength, recency and adjacency** — never a
self-assigned proficiency scalar:
- *strength* → the three calibration states already in the data (`production` /
  `non-production` / `pending`), which is a statement about **where the evidence was taken**, not
  about how good he is;
- *recency* → the real last-touched date of the evidencing repository or engagement, from the
  canonical dataset (R-108), never an estimate;
- *adjacency* → shared sources between capabilities, which is data the registry already asserts.

**Rationale.** P-3 resolves tension in favour of the higher quality bar and forbids resolving it by
lowering an inherited standard; R-171 requires satisfying both rather than trading one away; §9
bans skill-percentage bars unconditionally. A proficiency scalar would be exactly the unfalsifiable
claim the whole site exists to refuse, and would fail Gate R via SC-87.1.

**Alternative the Owner would have to approve.** Publishing self-assigned proficiency numbers,
which would forfeit R-166, SC-87.1 and the integrity trait in R-54.

**Reversal cost.** Low — a numeric channel could be added to the encoding later without
restructuring the graph.

---

## D-02 · R-47 "one display + one text face" vs the shipped three faces

**Advertised.** R-47 demands one display face and one text face. SC-28.1: *"Exactly two type faces
shipped."*

**Actually there.** Three self-hosted faces: Source Serif 4 (display), Inter (text), IBM Plex Mono
— and the repository's own audit gate `TC-NFR-TYPE` explicitly sanctions the third, reserving mono
for provenance and data.

**Decision.** Keep three. The mono face is ruled a **data instrument, not a third voice**: it is
used only for sources, dates, axis readouts and repository metrics, never for prose or emphasis.
The rule is enforced mechanically rather than asserted — the audit gate already fails the build if
a fourth family appears, and a test will assert mono never carries prose.

**Rationale.** P-3: apply both versions and resolve in favour of the higher quality bar, never by
lowering an inherited standard. Deleting the mono face would remove the typographic distinction
between a claim and its provenance — the single clearest craft signal on the page (R-103) and a
Preservation-Register asset in substance (R-165). Reading SC-28.1 as "two *voices*" satisfies its
intent; reading it as "two *files*" would damage the site.

**Alternative.** Collapse provenance into the body face and lose the claim/evidence distinction.

**Reversal cost.** Low, but destructive to R-165's signal.

---

## D-03 · Dependency uplift strategy (see BLOCKED-01)

Recorded in full at `BLOCKED-01-pr-hygiene.md`. Summary: close the 10 dependabot PRs, restore a
main-only remote per §15, and fold the dependency work into one controlled uplift verified through
the full gate battery — because R-84 mandates adding GSAP + ScrollTrigger, Lenis, D3 and three.js
`postprocessing` regardless, and ten independent major-version merges is the worse risk profile
under R-43. **Execution is blocked by a harness permission boundary, not by the contract.**

---

## D-04 · Where the server-side layers run

**Advertised.** R-65..R-74 (chatbot), R-123..R-138 (real-time presence), R-87 (telemetry) and
R-182 (deploy-time refresh) all need a server. The site is a Next.js static export.

**Actually there** (scout evidence, `step5-server-infra-scout.md`): the static site is *not*
serverless — Firebase Hosting rewrites already give it real Cloud Functions, and `minivicChat`
(`functions/index.js:111`) is **live**, calling OpenRouter and returning a real completion at
`https://forgotten-mistory.web.app/api/chat`. There is no `app/api` directory at all. The
`services/` realtime stack exists as source but was never installed, never run, and its ports
refuse. There is no nginx vhost; 80/443 are held by traefik.

**Decision.** Build every server-side layer on **Firebase Cloud Functions**, extending the
already-working `minivicChat` path — not on the uninstalled `services/` stack and not on a new VPS
vhost. Retrieval, grounding enforcement, streaming, telemetry collection and the deploy-time
refresh all land there.

**Rationale.** §13 bans creating a duplicate implementation without first confirming one does not
already exist; one does, and it works in production. §3.6/§7.3 of the orchestration contract make
standing up a competing stack on a 15 GiB, 81%-full host an R4 violation, and the scout found the
`services/` scripts already collide with the guardian-owned Aether production API on :8000.

**Alternative.** Provision a VPS service behind traefik — more moving parts, a new guardian
surface, and no capability the Functions path lacks for these four layers.

**Reversal cost.** Moderate: the `services/` source is preserved in-repo and unmodified.

---

## D-05 · False-positive readiness gates must be repaired, not relied on

**Actually there.** `scripts/validate/phase07..phase10` and `phase21` break out of their readiness
loop when `http://127.0.0.1:8000/health` returns 200 — which on this host is the **Aether
production API**, a foreign service. The gates therefore pass instantly and their assertions then
404. `package.json:42` and `phase21_realtime_pipeline.sh:37` reference
`tests/test_realtime_pipeline.js`, deleted in `3d6b071`.

**Decision.** Treat these as defects to fix, not as passing gates. §13 bans false-positive results
and §11 bans a gate that cannot fail. Each is opened as a work item: repair the readiness probe to
assert the *identity* of the service it found, remove or restore the dangling test reference, and
never bind :8000.

**Reversal cost.** None — this only removes a way to fake a green run.

---

## D-06 · Orphan billable Cloud Function

**Actually there.** `ssrforgottenmistory` (v2, us-central1) is live but appears in neither
`firebase.json` nor `functions/index.js` — a leftover webframeworks SSR function, still billable.

**Decision.** Removal is a deliverable (R-162): delete it as a shipped, verified removal rather
than leaving it as undocumented live infrastructure. Verified by re-listing deployed functions
after the change.

**Reversal cost.** None — it serves no route the static export uses.
