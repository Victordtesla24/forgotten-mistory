# Step 5 — Codebase Defect & Gap Catalogue

- **Repository:** `/root/forgotten-mistory`
- **Git HEAD at capture:** `d1fce27f8a28ef6b4ef2df3bf77436e7f5be7bc5` — `2026-09-03 17:53:38 +0000` — `chore(ledger): refresh the corrections log and note that it trails by one`
- **Working tree:** clean except untracked `docs/delivery/` (this evidence directory). `git status --porcelain` → `?? docs/delivery/`
- **Production parity proof:** `md5sum` of `https://forgotten-mistory.web.app/` HTML **and** of the local `out/index.html` are both `74712d2c420b80127a72846d82e139b0`. **The local build in `out/` is byte-identical to what production serves**, so every `out/index.html` observation below is simultaneously a live-site observation.
- **Method:** every value below comes from a file read, a `grep`, or an HTTP request executed in this session. Nothing is inferred. Where something could not be observed it is written `not observable`.

---

## A · Section components, and the mandated six-section architecture (R-16)

`app/page.tsx:52-64` renders exactly six sections into `<main>`, in this order:

| # | Component | Import | Rendered at | DOM id | Rendered `kicker` / `title` | Mandated R-16 name |
|---|---|---|---|---|---|---|
| 1 | `Hero` | `app/page.tsx:6` | `app/page.tsx:53` | `#hero` (`components/sections/Hero/Hero.tsx:31`) | no kicker; `h1` = `Vikram Deshpande` (`app/data/portfolio/hero.ts:23`) | Front Door |
| 2 | `About` | `app/page.tsx:7` | `app/page.tsx:55` | `#about` (`components/sections/About/About.tsx:33`) | kicker `About`, title `Ten dimensions, answered` (`app/data/portfolio/about.ts:32-33`) | About Me |
| 3 | `Experience` | `app/page.tsx:8` | `app/page.tsx:57` | `#experience` (`components/sections/Experience/Experience.tsx:58`) | kicker `Experience`, title `Sixteen years, to scale` (`app/data/portfolio/experience.ts:105-106`) | Experience |
| 4 | `Skills` | `app/page.tsx:9` | `app/page.tsx:59` | `#skills` (`components/sections/Skills/Skills.tsx:91`) | kicker `Skills & Certifications`, title `Calibration card` (`app/data/portfolio/skills.ts:224-225`) | Skills & Certifications |
| 5 | `Vitrine` | `app/page.tsx:10` | `app/page.tsx:61` | `#vitrine` (`components/sections/Vitrine/Vitrine.tsx:99`) | kicker + title from `app/data/portfolio/vitrine.ts` | "What is keeping me busy" |
| 6 | `Listen` | `app/page.tsx:11` | `app/page.tsx:63` | `#listen` (`components/sections/Listen/Listen.tsx:30`) | kicker `Always willing to listen`, title `Feedback & coffee?` (`app/data/portfolio/listen.ts:18-19`) | "Always willing to listen — feedback & Coffee?" |

Production HTML confirms the same six ids in the same order (`grep -o 'id="\(hero\|about\|experience\|skills\|vitrine\|listen\)"' prod-index.html` → `hero, about, experience, skills, vitrine, listen`).

**Supporting components inside those sections** (all under `components/sections/`):
`Hero/HeroAtmosphere.tsx` (81 ln) + `Hero/atmosphere.glsl.ts` (181 ln); `About/Compass.tsx` (227 ln); `Experience/CareerStrata.tsx` (66 ln) + `Experience/strata.glsl.ts` (91 ln); `Skills/Bench.tsx` (432 ln); `Vitrine/Drawings.tsx` (348 ln); `Listen/Avatar.tsx` (114 ln).
Shared: `components/marks/Caliper.tsx` (57 ln), `components/gl/{GLCanvas,Scene}.tsx`, `components/site/Navigation.tsx`, `components/site/ServiceWorkerRegister.tsx`, `components/MiniVicBot.tsx` (1561 ln), `components/MotionProvider.tsx`, `components/ui/button.tsx`.

### A.1 — `#architecture-lab` (R-176): **ABSENT — nothing to absorb**

`grep -rn "architecture-lab\|architectureLab\|ArchitectureLab" app components lib tests scripts` returns **zero component or JSX matches**. Every hit is a comment or a historical note:

- `components/site/Navigation.tsx:9` — comment: *"Three of these used to point at #architecture-lab, #work and #contact — sections deleted in the rebuild"*
- `tests/e2e/navigation.spec.ts:9`, `scripts/testing/postprod_prod_probe.mjs:13`, `scripts/testing/rendering_stability_validation.mjs:16`, `scripts/testing/adversarial_evidence.mjs:33` — the same historical note
- `app/globals.css:732` — an orphan comment `/* Architecture section frame (from architecture-lab worktree) */` with **no rule body**

Production HTML contains **0** occurrences of `architecture-lab`.
**Finding:** the section R-176 orders absorbed and removed **does not exist in this codebase or in production**. R-176's removal half is already satisfied; what remains open is R-176's *positive* half — Experience currently carries **no** authored system / delivery-flow diagram layer (`components/sections/Experience/Experience.tsx` renders a duration bar-chart + role accordion only; the only WebGL is `CareerStrata`, described at `Experience.tsx:40-42` as *"texture, not data"*).

---

## B · Navigation entries and labels (R-178)

Source of truth: `components/site/Navigation.tsx:14-27` (`NAV_LINKS`), plus a separate always-visible action at `Navigation.tsx:153-158`.

| Order | Line | `href` | Label as shipped | Mandated section title | Verdict |
|---|---|---|---|---|---|
| 1 | `Navigation.tsx:15` | `#hero` | **`Home`** | Front Door | generic substitute — R-178 defect |
| 2 | `Navigation.tsx:16` | `#about` | **`About`** | About Me | not the mandated title — R-178 defect |
| 3 | `Navigation.tsx:17` | `#experience` | `Experience` | Experience | matches |
| 4 | `Navigation.tsx:18` | `#skills` | **`Skills`** | Skills & Certifications | truncated title — R-178 defect |
| 5 | `Navigation.tsx:23` | `#vitrine` | **`Keeping me busy`** | "What is keeping me busy" | near-match, not verbatim |
| 6 | `Navigation.tsx:24` | `#listen` | **`Feedback & coffee`** | "Always willing to listen — feedback & Coffee?" | near-match, not verbatim |
| 7 | `Navigation.tsx:25` | `contact.linkedin` (external) | `LinkedIn` | — | outbound |
| 8 | `Navigation.tsx:26` | `/docs/Vik_Resume_Final.pdf` (external) | `Download CV` | — | CV affordance #2 (see §C) |
| — | `Navigation.tsx:156-158` | `/docs/Vik_Resume_Final.pdf` | `Download CV` (`.nav-cv`, always visible) | — | CV affordance #1 (see §C) |
| — | `Navigation.tsx:129-130` | `#hero` | wordmark `VIKRAM.` | — | logo |

**R-178 status:** the three worst substitutes named in the requirement — `"Work"`, `"Contact"`, `"Architecture"` — are **gone** (0 occurrences in `Navigation.tsx` and 0 in production HTML). But four entries still use generic or truncated labels (`Home`, `About`, `Skills`) or paraphrases rather than the mandated section titles. **R-178 is partially, not fully, satisfied.**

All six internal anchors resolve: production HTML `href="#…"` set = `{#hero ×2, #about, #experience ×2, #skills, #vitrine, #listen}`, and every one of those ids exists in the same document. **No dead nav links.**

---

## C · "Download CV" affordances (R-179)

**Three distinct affordances ship, exactly as R-179 states.** Production HTML contains the literal string `Download CV` **3 times** (`grep -o -F "Download CV" prod-index.html | wc -l` → `3`) and `Vik_Resume_Final.pdf` **4 times** (the fourth is the Skills calibration footnote, not an affordance).

| # | File:line | Surface | Renders in first viewport? |
|---|---|---|---|
| 1 | `components/site/Navigation.tsx:156-158` — `<a className="nav-cv" href={CV_HREF} download target="_blank">Download CV</a>` (`CV_HREF` at `Navigation.tsx:29`) | Always-visible header action, next to the menu toggle (`Navigation.tsx:153` `.nav-actions`) | **Yes** — fixed nav |
| 2 | `components/site/Navigation.tsx:26` — `{ href: '/docs/Vik_Resume_Final.pdf', label: 'Download CV', external: true }` | Last entry of the full-screen overlay menu (`Navigation.tsx:182-198`) | Only when the overlay is opened |
| 3 | `components/sections/Hero/Hero.tsx:89-95` — `<a className={styles.secondaryAction} href={heroContent.actions.secondary.href} download>` with label from `app/data/portfolio/hero.ts:49` (`{ label: 'Download CV', href: '/docs/Vik_Resume_Final.pdf' }`) | Hero secondary CTA, beside `See the evidence` (`hero.ts:48`) | **Yes** |

**Two of the three (#1 and #3) render in the first viewport, before a single artefact.** Additionally #1 and #2 are the *same* words on the *same* href from the *same* component — a literal duplicate. R-179 is **unsatisfied**.

---

## D · Footer copy, verbatim (R-181)

There is **no `<footer>` element on the page.** `grep -rn "<footer" app components` → 0 hits. The only `footer` identifier in the section components is a CSS-module class name for the Skills calibration line (`components/sections/Skills/Skills.tsx:198`).

The closing line is the **colophon**, rendered at `components/sections/Listen/Listen.tsx:100` from `app/data/portfolio/listen.ts:46-47`. Verbatim, character for character:

```
© 2026 Vikram Deshpande · Melbourne · static export · at most one WebGL context per section, and none on a phone · no analytics, no trackers, no cookies
```

Confirmed present in production HTML (`grep -o "© 2026[^<]*" prod-index.html` returns exactly that string, once).

The Skills section carries a second closing statement (`components/sections/Skills/Skills.tsx:198-203`), verbatim:

```
Calibrated against public/docs/Vik_Resume_Final.pdf · MD5 16b856c0 · 157,615 bytes.
Run md5sum against the PDF this page links to and you should get the same eight characters.
```
(values injected from `app/data/generated/cv-fingerprint.ts:10-14`: `md5: '16b856c0f3f4ec0d801fdde6d084452c'`, `short: '16b856c0'`, `bytes: 157615`.)

**R-181 status:** the string **"All rights reserved" does not exist** anywhere in `app/`, `components/`, `lib/`, `public/`, `scripts/`, or in production HTML (`grep -rni "all rights reserved"` → 0 hits; production `grep -c` → 0). **The boilerplate R-181 orders removed is already gone.** What R-181 still requires is the *positive* half: the colophon carries no build/deploy signal (R-54) — no commit sha, no build timestamp, no deploy id.

**Related defect (R-183):** the colophon asserts *"no analytics, no trackers, no cookies"*. That statement is currently **true** — `grep -rn "analytics\|gtag\|plausible\|umami\|posthog\|sendBeacon"` over `app components lib` finds no instrumentation, only prose; the only web-storage call in the whole app is a crash-loop guard at `app/error.tsx:37-44` using `sessionStorage`. So R-183 is a *build*, and the copy must be rewritten in the same change or the site will start contradicting itself.

---

## E · Hidden terminal easter egg / "sudo hire vic" / Konami code (R-180)

**All three are ABSENT from the codebase. There is nothing to adjudicate at Gate L — only dead CSS to delete.**

| Artefact | Search | Result |
|---|---|---|
| `sudo hire vic` command | `grep -rni "sudo hire" app components lib public scripts tests config` | **0 hits** |
| any `sudo` string | included in the above sweep | **0 hits** |
| Konami key handler | `grep -rni "konami" app components lib public scripts config` | **1 hit, and it is a CSS comment**: `app/globals.css:746` `/* 5. Konami / Terminal Overlay */` |
| Konami key sequence | `grep -rn "ArrowUp\|38,38,40,40\|keyCode"` over `app components` | no sequence handler; the only `keydown` listeners are `Navigation.tsx:68-71` (Escape) and `Navigation.tsx:92-107` (Tab focus trap) |
| `~/terminal` overlay component | `grep -rn 'id="' app components` | ids present are only: `minivic-panel`, `minivic-input`, `minivic-toggle`, `minivic-audio`, `site-nav-overlay`, the six section ids + `*-title`, `compass-open`, `compass-hub`, `avatar-transcript`, `d1t…d6d`, `arrow`. **No `#terminal-*` element is ever rendered.** |
| Production HTML | `grep -c -F "sudo hire" prod-index.html` | **0** |

**Orphan CSS that remains (dead code — R-162 violation):**
- `app/globals.css:746` — comment `/* 5. Konami / Terminal Overlay */`
- `app/globals.css:748-754` — `#terminal-close { … }`
- `app/globals.css:756-762` — `#terminal-form { … }`
- `app/globals.css:764-768` — `.prompt { … }`
- `app/globals.css:770-780` — `#terminal-input { … outline: none; }`
- `app/globals.css:892-893` — comment referring to `#terminal-log`, an element that does not exist

**R-180 adjudication input:** the easter egg cannot pass or fail the restraint check because it is not implemented. The correct action is the *shipped removal* of the orphan CSS above, recorded as a deliverable under R-162.

(Note: `app/data/siteContent.ts:29` and `:260` use the literal `'terminal'` as one value of a `visual` union on `ProjectCard`. That data export is itself unconsumed — see §H.4.)

---

## F · Contact affordances and routes (R-185)

Canonical data: `app/data/siteContent.ts:492-504` — `email: 'sarkar.vikram@gmail.com'`, `phone: '+61 433 224 556'`, `phoneHref: 'tel:+61433224556'`, `linkedin: 'https://www.linkedin.com/in/vikramd-profile'`, `github: 'https://github.com/Victordtesla24'`, `youtube: 'https://youtube.com/@vicd0ct'`.

| # | File:line | Surface | Route |
|---|---|---|---|
| 1 | `components/site/Navigation.tsx:25` | Overlay menu link `LinkedIn` | `https://www.linkedin.com/in/vikramd-profile` |
| 2 | `components/sections/Hero/Hero.tsx:101-112` ← `app/data/portfolio/hero.ts:52` | Hero availability bar link `LinkedIn` | same LinkedIn URL |
| 3 | `Hero.tsx:101-112` ← `hero.ts:53` | Hero link `GitHub` | `https://github.com/Victordtesla24` |
| 4 | `Hero.tsx:101-112` ← `hero.ts:54` | Hero link `Email` | `mailto:sarkar.vikram@gmail.com` |
| 5 | `components/sections/Listen/Listen.tsx:44-58` ← `app/data/portfolio/listen.ts:24` | Closing-section channel | `mailto:sarkar.vikram@gmail.com` |
| 6 | `Listen.tsx:44-58` ← `listen.ts:25` | Closing-section channel | `tel:+61433224556` |
| 7 | `Listen.tsx:44-58` ← `listen.ts:27-30` | Closing-section channel | LinkedIn |
| 8 | `Listen.tsx:44-58` ← `listen.ts:31` | Closing-section channel | GitHub |
| 9 | `Listen.tsx:60` ← `listen.ts:33` | `Coffee · Melbourne CBD · I'll come to you` — **plain text, not a link** | none |

Production HTML counts, independently measured: `mailto:sarkar.vikram@gmail.com` **×2**, `tel:+61433224556` **×1**, `https://www.linkedin.com/in/vikramd-profile` **×3**, `https://github.com/Victordtesla24` (bare profile) **×3**.

**R-185 status: unsatisfied.** Contact is scattered across three surfaces (nav overlay, hero, closing section) and repeats the same LinkedIn URL three times and the same mailto twice. There is **no contact form** — deliberately, per the authored rationale at `Listen.tsx:18-21` (*"On a static export a form either lies about where the message goes or hands the visitor to a third party"*). `MiniVicBot` offers **no** contact route at all (`grep -n "mailto\|linkedin\|calendly\|contact" components/MiniVicBot.tsx` → 0 hits) — an R-72 gap ("every session offers a natural path to a real conversation").

---

## G · Counters that animate from zero (R-175)

**No counter on this site animates from zero. R-175's stated defect does not reproduce against this codebase.**

Evidence:
1. `grep -rn "useMotionValue\|useSpring\|animate(\|CountUp\|countUp\|useTransform" --include=*.tsx --include=*.ts app components lib` → **2 hits, both irrelevant**: `components/sections/About/Compass.tsx:76` and `:191`, both the words *"counter-rotate"* in comments/markup about numeral orientation.
2. Hero figures are **pre-formatted string literals**, never numbers: `app/data/portfolio/hero.ts:32,37,42` — `value: '≈92%'`, `'$5M+'`, `'10k+'`; the interface comment at `hero.ts:15` states *"these are quoted, not computed"*. They are rendered as text through `Caliper` at `Hero.tsx:68-70`.
3. About renders **no numeric counters at all** — ten dimensions of prose (`components/sections/About/About.tsx:86-121`); the only numbers are the ordinal indices `String(index + 1).padStart(2, '0')` at `About.tsx:98`.
4. Server-rendered proof: production HTML already contains `≈92%` (×3), `$5M+` (×3), `10k+` (×2) and `Sixteen years` (×3) in the shipped markup — i.e. final values are present **on first paint, before any JavaScript runs**. `$0M` appears **0** times.
5. The only `requestAnimationFrame` loops in section code are layout measurement (`Skills/Bench.tsx:164-165`, `Vitrine/Vitrine.tsx:65`), a page-ready signal (`app/page.tsx:30`) and video playback (`Listen/Avatar.tsx:37`) — none interpolates a displayed figure.

**R-175 is satisfied by the current baseline** and is a *preservation* obligation, not a build.

---

## H · Anti-patterns per R-90

### H.1 — Prohibited outcomes: **not present**

| R-90 prohibition | Evidence | Verdict |
|---|---|---|
| Template hero | `components/sections/Hero/Hero.tsx` is bespoke: a WebGL atmosphere slot (`Hero.tsx:34-36`), a three-entry provenance ledger drawn with the caliper mark (`Hero.tsx:60-77`), a grading line (`Hero.tsx:80-82`). No hero-image/blurb template shape. | clear |
| Stock gradients | The hero backdrop is a GLSL shader (`components/sections/Hero/atmosphere.glsl.ts`, 181 ln) with a flat-ink CSS gradient as the *no-WebGL* fallback, documented at `Hero.tsx:25-27`. Not a decorative stock gradient. | clear |
| Generic three-card grid | Vitrine renders a **six**-plate horizontal rail (`components/sections/Vitrine/Vitrine.tsx:110-186`), each plate carrying a bespoke SVG drawing (`Vitrine/Drawings.tsx`, six distinct drawings `#d1t…#d6d`), a `Limits` line (`Vitrine.tsx:161-164`) and an `Excluded, and why` list (`Vitrine.tsx:190-200`). | clear |
| Default system fonts | Three self-hosted `next/font` faces declared at `app/layout.tsx:24-61`: `Source_Serif_4` (display), `Inter` (body), `IBM_Plex_Mono` (data), applied via CSS vars on `<html>` at `layout.tsx:127`. | clear |
| Emoji iconography | `grep -rInP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]' --include=*.tsx --include=*.ts --include=*.css app components lib` → **0 hits**. Status glyphs are geometric marks rendered by `components/marks/Caliper.tsx`; the bot uses `lucide-react` SVG icons (`components/MiniVicBot.tsx:7`). | clear |
| Unstyled focus rings | `focus-visible` styling present in `app/globals.css` and in 9 of the section CSS modules (`Experience`, `Skills`, `Bench`, `Hero`, `About`, `Listen`, `Avatar`, `Vitrine`) plus `app/error.tsx`, `app/not-found.tsx`, `components/ui/button.tsx:10`. `Navigation.tsx:82-112` implements an explicit focus trap and focus restore. | clear |
| Dead links | Every `href="#…"` in production resolves to an id that exists in the same document (§B). No `href="#"`, no `javascript:void(0)`. | clear |
| Boilerplate copy | No "All rights reserved" (§D); no lorem; copy is authored throughout. | clear |

### H.2 — **Anti-pattern that IS present: the floating chat widget (R-75 violation)**

`components/MiniVicBot.tsx:1181-1190` renders `className="fixed bottom-5 right-5 z-[10030] …"` — a bottom-right circular launcher (`MiniVicBot.tsx:1519-1553`) that fades in once past the hero (`pastHero`, `MiniVicBot.tsx:172, 1184-1189`) and opens a `22rem/27rem` floating dialog panel (`MiniVicBot.tsx:1192-1199`). R-75 states the video avatar is *"Never a floating widget pasted over the design."* R-70 additionally requires a *"gold-accent"* entry point; the launcher is styled `border-zinc-300/70` with a `bg-zinc-500` pulse dot (`MiniVicBot.tsx:1531, 1548-1550`) — grey, not gold. (Gold *is* used inside the panel at `MiniVicBot.tsx:1244` via `var(--gold-light)`/`var(--gold)`.)

### H.3 — **Dead CSS shipped to every visitor (R-162 violation)**

Selectors in `app/globals.css` (1020 lines total) with **zero** references anywhere in `app/`, `components/` or `lib/`:

| Selector | Line(s) | References found |
|---|---|---|
| `[data-magnetic]` | `app/globals.css:233` | 0 |
| `[data-parallax="true"]` | `app/globals.css:431` | 0 |
| `[data-outcome-card="true"]` (+`:hover`,`:focus-visible`,`:active`) | `app/globals.css:443-460` | 0 — and `:451-456` sets `outline: none` on a `:focus-visible` state |
| `#terminal-close`, `#terminal-form`, `.prompt`, `#terminal-input` | `app/globals.css:748-780` | 0 rendered elements (§E) |
| `#mini-vic-form`, `#mini-vic-input`, `#mini-vic-input:focus`, `#mini-vic-form button` | `app/globals.css:782-836` | 0 — the shipped bot uses `#minivic-*` ids, not `#mini-vic-*` |
| Empty comment-only blocks (`/* System B — Living Sparkline */`, `/* G2 — telemetry grid */`, `/* 3. Interactive Architecture Diagram */`, `/* Architecture section frame (from architecture-lab worktree) */`, `/* Connections */`, and an empty `@media (max-width: 768px) { }`) | `app/globals.css:726-745` | rule bodies removed, comments and one empty media query left behind |

### H.4 — **Dead data module**

`app/data/siteContent.ts` (581 ln) exports 15 symbols; only **two** are imported anywhere: `contact` (`app/data/portfolio/hero.ts:12`, `app/data/portfolio/listen.ts:15`, `components/site/Navigation.tsx:5`) and `experience` (`app/data/portfolio/experience.ts:11`). Unconsumed exports: `hero` (`:59`), `skillGroups` (`:171`), `projects` (`:233`), `featuredRepos` (`:352`), `synthesisSources` (`:405`), `projectionDimensions` (`:464`), `credibility` (`:511`), `proof` (`:529`), `dossier` (`:554`), plus the `SkillGroup`/`ProjectCard`/`FeaturedRepo`/`SynthesisSource`/`ProjectionDimension`/`ProofPoint`/`DossierEdition` interfaces. This is where the `visual: 'terminal'` union member at `:29`/`:260` lives.

### H.5 — Doc/code contradiction inside the avatar module

`components/sections/Listen/Avatar.tsx:14` documents `preload="none"`; the shipped `<video>` at `Avatar.tsx:54` sets `preload="auto"`. (The lazy behaviour is nonetheless real, because the `<video>` is only mounted after the play button is pressed — `Avatar.tsx:48-50` is inside the `started ? … : …` branch.)

---

## I · Confirmed-absent layers (R-186) — audited against **this** codebase and **live** production

> **Headline correction.** R-186 asserts the audit found *"no AI chatbot"* and *"no self-presentational avatar video present"*. **Both assertions are false against the baseline captured here.** A chatbot ships and answers from a real server-side LLM in production, and a self-presentational avatar video ships in the closing section. Everything else R-186 lists is genuinely absent.

| R-186 layer | Requirement range | Present? | Evidence |
|---|---|---|---|
| **AI chatbot** | R-65 … R-74 | **PRESENT — R-186 is wrong** | see I.1 |
| Explainer avatar (teaching a hard concept) | R-147 … R-156 | **ABSENT** | see I.2 |
| Real-time conversational presence | R-123 … R-138 | **ABSENT in production**; substantial dormant code exists | see I.3 |
| YouTube creator strand | R-113 … R-122 | **ABSENT** | see I.4 |
| Dual-strand hero visualisation | R-116 | **ABSENT** | see I.5 |
| Content-DNA visualisation | R-117 | **ABSENT** | see I.6 |
| **Self-presentational avatar video** | R-147 / R-186 no-op claim | **PRESENT — the removal is NOT a no-op** | see I.7 |

### I.1 — AI chatbot: **PRESENT and LIVE**

- Mounted globally: `app/layout.tsx:4` imports `MiniVicBot`, rendered at `app/layout.tsx:142` inside `<MotionProvider>` on every page.
- Component: `components/MiniVicBot.tsx`, **1561 lines** — panel dialog (`:1192-1199`), message list, quick prompts, three persona modes (`recruiter | engineer | story`, `:52-59`), mic/STT via `webkitSpeechRecognition` (`:19-32`), TTS playback and an amplitude-driven mouth canvas (`:1221-1226`).
- Brain: `lib/miniVicBrain.ts` (402 ln). Answer ladder documented at `:1-14`: **(1)** `POST /api/chat` (`CHAT_ENDPOINT`, `lib/miniVicBrain.ts:322`, called at `:336`); **(2)** direct Gemini (`:44`, gated by a key-shape test at `:41`); **(3)** deterministic local knowledge base `app/data/miniVicKnowledge.ts` (963 ln).
- Server side: `functions/index.js:111-185` `exports.minivicChat` — Firebase Functions v2 `onRequest`, secret `OPENROUTER_API_KEY` (`functions/index.js:20`), model `meta-llama/llama-3.3-70b-instruct` (`:23`), CORS allow-list (`:31-35`), role whitelist + 24-message / 16 000-char cap (`:124-143`), `maxInstances: 5`. Routed by `firebase.json:16` → `{"source": "/api/chat", "function": {"functionId": "minivicChat", "region": "us-central1"}}`.
- **Live proof:** `POST https://forgotten-mistory.web.app/api/chat` with `{"messages":[{"role":"user","content":"Reply with the single word OK."}]}` → **HTTP 200**, body `{"text":"OK"}`.
- Production HTML carries `id="minivic-toggle"`, `id="minivic-audio"` and the string `Mini Vic`.
- **No client-exposed keys:** `grep -ro "AIza[0-9A-Za-z_-]\{20,\}" out/_next/` → **0 matches**. (`NEXT_PUBLIC_GEMINI_API_KEY` is read at `lib/miniVicBrain.ts:36` but nothing was inlined into the shipped bundle.)

**Gaps against R-65 … R-74 even though the layer exists:** floating-widget placement violates R-75 (§H.2); the launcher is grey, not the gold-accent affordance of R-70; no conversation-to-outcome path (R-72 — zero contact affordances in the component); grounding is a hand-written 963-line knowledge file rather than retrieval over the site's own dataset (R-66); no rate limiting or injection-resistance layer beyond size caps in `functions/index.js` (R-73); answers are non-streaming — `functions/index.js:145-181` awaits the whole completion before responding, so R-71's sub-second first token is not achievable on this path.

### I.2 — Explainer avatar (R-147 … R-156): **ABSENT**

No component, route, asset or copy teaches a difficult concept. The only avatar module is the self-presentation clip (I.7), whose script (`app/data/portfolio/avatar.ts:41-46`) teaches nothing. There is no four-movement structure, no coupled hero visualisation, no recorded concept-selection rationale (R-149). `app/data/portfolio/` contains no explainer data file.

### I.3 — Real-time conversational presence (R-123 … R-138): **ABSENT in production**

- Client code exists: `components/MiniVicBot.tsx:883` reads `NEXT_PUBLIC_REALTIME_WS_URL`; `:929` posts to `/api/realtime/session`; `:1074` calls `sendRealtimeMessage`. `lib/visemeMap.ts` (229 ln) and `lib/voiceoverController.ts` (458 ln) implement viseme/lip-sync machinery.
- **It cannot run in production.** `firebase.json:14-17` declares exactly two rewrites — `/api/tts` and `/api/chat`. Nothing routes `/api/realtime/session`. Live probe: `POST https://forgotten-mistory.web.app/api/realtime/session` → **HTTP 404**. `POST /api/chat-with-vic` → **HTTP 404**.
- The production build sets `NEXT_PUBLIC_STATIC_EXPORT: '1'` (`next.config.js:2, 91`), and `components/MiniVicBot.tsx:1063-1065` short-circuits the entire realtime/compat path on that flag before any request is made.
- No WebRTC anywhere: `RTCPeerConnection` appears nowhere in `app`, `components` or `lib`. Transport in the dormant code is WebSocket/gRPC, not WebRTC as R-123 … R-138 specify.

### I.4 — YouTube creator strand (R-113 … R-122): **ABSENT**

`app/data/siteContent.ts:503` holds `youtube: 'https://youtube.com/@vicd0ct'`, but that key is never read: the only consumers of `contact` (`hero.ts:52-54`, `listen.ts:24-31`, `Navigation.tsx:25`) use `linkedin`, `github`, `email`, `phoneHref` only. Production HTML contains **no** `href` to YouTube — the single `youtube.com/@vicd0ct` occurrence is inside the `Person` JSON-LD `sameAs` array (`app/layout.tsx:109`). There is no channel data module, no facade player, no `youtube-nocookie` iframe (the CSP at `firebase.json:25` permits `frame-src https://www.youtube-nocookie.com`, but nothing uses it).

### I.5 — Dual-strand hero visualisation (R-116): **ABSENT**

`components/sections/Hero/Hero.tsx` renders one strand only: eyebrow, name, role, statement, a three-entry ledger, two actions and an availability line. There is no shared repositories×videos timeline and no interleaved carousel. The Vitrine rail (`Vitrine.tsx:110`) carries repositories only — six plates, zero channel items.

### I.6 — Content-DNA visualisation (R-117): **ABSENT**

No topic-taxonomy artefact exists. The nearest structure is the Skills bipartite bench (`components/sections/Skills/Bench.tsx`, 432 ln — 13 sources on the left, 17 capabilities on the right, SVG wires; documented at `Bench.tsx:15-42`), which has no topic taxonomy and nothing to cross-link into. Note this bench is also *not* the force-directed topology R-187 requires, and the calibration record beneath it is still a `<table>` (`components/sections/Skills/Skills.tsx:150-193`).

### I.7 — Self-presentational avatar video (R-147 / R-186): **PRESENT — the removal is NOT a no-op**

R-186 states *"no self-presentational avatar video present, so R-147's removal step is a no-op against this baseline"*. **The evidence contradicts this.** The module in `components/sections/Listen/` is a self-presentational "hello, I am Vik" clip — precisely the artefact R-147 removes.

**Files that constitute it (all four ship):**
- `components/sections/Listen/Avatar.tsx` — 114 lines, 4 122 bytes
- `components/sections/Listen/Avatar.module.css` — 230 lines, 5 651 bytes
- `app/data/portfolio/avatar.ts` — 47 lines
- Assets, on disk and deployed: `public/assets/avatar/introduction.mp4` (**4 041 235 bytes**), `public/assets/avatar/introduction.vtt` (1 116 bytes), `public/assets/avatar/poster.jpg` (36 140 bytes); mirrored in `out/assets/avatar/` and referenced by production HTML (`assets/avatar/poster.jpg`, ×1).
- Mount point: `components/sections/Listen/Listen.tsx:97` — `<Avatar />`, inside the closing section.

**The script, quoted verbatim** (`app/data/portfolio/avatar.ts:41-46`, identical to `public/assets/avatar/introduction.vtt` cues 1-10):

> 1. "Hello. I'm Vikram Deshpande."
> 2. "What you're watching is an AI-generated avatar — my photograph, my own cloned voice, rendered by a model. I'm telling you that straight away, because I build systems that are not allowed to fabricate their own evidence."
> 3. "Everything else here is real. The figures come from my CV, and from repositories you can open and read. Where something could not honestly be measured, the page says so."
> 4. "If any of it is useful to you, I would welcome a conversation."

**Caption / invitation copy, verbatim:**
- `avatar.ts:22` — invitation: `A word from me — 29 seconds`
- `avatar.ts:26-27` — disclosure: `AI-generated: my photograph, my cloned voice, animated by a model. Nothing else on this site is synthetic.`
- `avatar.ts:30-34` — provenance rows: `Face: my own photograph, unretouched framing` · `Voice: my own voice, cloned from a recording of me` · `Render: ByteDance OmniHuman 1.5, one take, no edit` · `Master: 1440 × 1440 · delivered at 1080 × 1080, H.264` · `Script: written by me; the transcript is below, verbatim`
- `avatar.ts:39` — `durationSeconds: 29`
- `Listen.tsx:23-26` — the placement rationale: *"a synthetic talking head at the front door is an advertisement, and at the end, after five screens of checkable evidence, it is an offer."*

**Adjudication.** Four sentences, 29 seconds, zero technical content. Movement 1 states the speaker's name; movement 2 discloses the synthesis; movement 3 restates the site's own honesty policy; movement 4 asks for a conversation. It teaches no concept, is coupled to no visualisation, and exists — in the module's own words at `Avatar.tsx:11` — as *"a synthetic introduction, labelled as one."* **This is a self-presentational avatar video. R-147's removal step has real work to do: three source files, three binary/caption assets (~4.08 MB), one mount point at `Listen.tsx:97`, and the `Video`/avatar copy in `avatar.ts`.**

**Second self-presentational video, separately:** `components/MiniVicBot.tsx:225` `AVATAR_VIDEO_URL = "/assets/my-avatar.mp4"` is the looping talking-head shown in the bot panel (`MiniVicBot.tsx:1201-1215`) and on the launcher (`:1540-1547`), with a pre-rendered cloned-voice greeting at `MiniVicBot.tsx:251` `GREETING_AUDIO_URL = "/assets/minivic-greeting.mp3"`. Assets present: `public/assets/my-avatar.mp4`, `public/assets/my-hero-avatar.mp4`, `public/assets/my-avatar-voice.mp3`, `public/assets/minivic-greeting.mp3`, `public/assets/my_avatar.{png,webp,avif}`.

---

## J · Dependencies, and R-84's mandated libraries

`package.json` — **dependencies (12):** `@radix-ui/react-slot@1.2.4`, `@react-three/drei@9.122.0`, `@react-three/fiber@8.18.0`, `@types/three@0.165.0`, `class-variance-authority@0.7.1`, `clsx@2.1.1`, `framer-motion@11.18.2`, `lucide-react@0.344.0`, `next@^14.2.35`, `react@18.2.0`, `react-dom@18.2.0`, `tailwind-merge@3.3.1`, `three@0.165.0`.
**devDependencies (21):** `@axe-core/playwright@4.10.2`, `@babel/core@^8.0.1`, `@babel/preset-env@^8.0.2`, `@babel/preset-react@^8.0.1`, `@babel/preset-typescript@^8.0.1`, `@playwright/test@1.57.0`, `@tailwindcss/postcss@4.1.13`, `@types/node@20.11.24`, `@types/react@18.2.61`, `@types/react-dom@18.2.19`, `autoprefixer@10.4.17`, `eslint@8.57.0`, `eslint-config-next@^14.2.35`, `eslint-plugin-react-hooks@4.6.2`, `pixelmatch@^5.3.0`, `playwright@1.57.0`, `pngjs@^7.0.0`, `postcss@8.5.15`, `sharp@0.33.5`, `tailwindcss@4.1.13`, `typescript@5.3.3`.
Service workspaces have their own manifests: `services/api-gateway/package.json` (fastify 5.6.1, @fastify/{cors,jwt,rate-limit,websocket}, @grpc/grpc-js 1.14.0, ioredis 5.7.0, prom-client 15.1.3, zod 3.24.1), `services/realtime-orchestrator/package.json` (@grpc/grpc-js, @grpc/proto-loader, zod), `services/viseme-bridge/package.json` (ws ^8.16.0, zod ^3.22.0), `functions/package.json` (firebase-functions ^5.1.1 only).

| R-84 mandated library | Declared in `package.json`? | In `node_modules`? | Used in `app/components/lib`? |
|---|---|---|---|
| **GSAP + ScrollTrigger** | **NO** | **NO** (`node_modules/gsap` absent) | none |
| **Lenis** | **NO** | **NO** (`gsap`, `lenis`, `@studio-freight/lenis` all absent) | none |
| Framer Motion | yes — `framer-motion@11.18.2` | yes `11.18.2` | `app/page.tsx:4`, `components/site/Navigation.tsx:4`, `components/MiniVicBot.tsx:4`, `components/MotionProvider.tsx` |
| three.js | yes — `three@0.165.0` (+ `@react-three/fiber@8.18.0`, `@react-three/drei@9.122.0`) | yes `0.165.0` | `components/gl/Scene.tsx`, `components/gl/GLCanvas.tsx`, `components/sections/Hero/HeroAtmosphere.tsx`, `components/sections/Experience/CareerStrata.tsx` |
| **`postprocessing`** | **NO** | **NO** | `grep -rn "postprocessing\|EffectComposer\|UnrealBloom"` → 0 hits |
| **D3** | **NO** | **NO** | none — all data-driven SVG is hand-authored (`Skills/Bench.tsx`, `Vitrine/Drawings.tsx`, `About/Compass.tsx`) |
| Playwright | yes — `@playwright/test@1.57.0`, `playwright@1.57.0` | yes | `playwright.config.ts`; 10 specs under `tests/e2e/` |
| axe-core | yes — `@axe-core/playwright@4.10.2` | yes | `tests/a11y/` |
| **Lighthouse CI** | **NO** — `lighthouserc.json` exists at repo root and `scripts/validate/phase02_lighthouse.sh` is wired into `package.json:17`, but **neither `@lhci/cli` nor `lighthouse` is a declared dependency, and neither is installed** | **NO** | config present, runner absent |

**Summary: 5 of R-84's 9 mandated layers are missing — GSAP + ScrollTrigger, Lenis, `postprocessing`, D3, and Lighthouse CI's runner.**

---

## K · `services/` and `functions/` — server-side capability that already exists

The site is a **static export**: `next.config.js:2` `const isStaticExport = process.env.FIREBASE_STATIC_EXPORT === '1'`, and `package.json:11` builds with `FIREBASE_STATIC_EXPORT=1 next build` then prunes. Consequently **there are no Next.js API routes** — `app/` contains no `api/` directory. All server capability is out-of-process.

### K.1 — `functions/` — the only server-side capability actually reachable from production

`functions/package.json` — `firebase-functions ^5.1.1`, node 20, codebase `tts` (`firebase.json:2-9`). `functions/index.js` is 185 lines and exports **two** HTTPS functions:

| Export | Lines | Secret | Upstream | Hosting route | Live status (measured) |
|---|---|---|---|---|---|
| `elevenLabsTts` | `functions/index.js:48-104` | `ELEVENLABS_API_KEY` (`:19`) | `https://api.elevenlabs.io/v1/text-to-speech/0ZJ4kFDo6bZUNQsuULOW` (`:26`, `:70`), model `eleven_turbo_v2_5` (`:28`), 600-char cap (`:29`) | `firebase.json:15` → `/api/tts` | `POST /api/tts` → **HTTP 502** |
| `minivicChat` | `functions/index.js:111-185` | `OPENROUTER_API_KEY` (`:20`) | `https://openrouter.ai/api/v1/chat/completions` (`:146`), model `meta-llama/llama-3.3-70b-instruct` (`:23`), `temperature 0.6`, `max_tokens 512` (`:158-159`) | `firebase.json:16` → `/api/chat` | `POST /api/chat` → **HTTP 200**, `{"text":"OK"}` |

Shared guards: origin allow-list `forgotten-mistory.web.app`, `forgotten-mistory.firebaseapp.com`, `localhost:8080`, `127.0.0.1:8080` (`:31-35`); `applyCors` (`:37-45`); `maxInstances: 5`, `timeoutSeconds: 30`, `memory: "256MiB"` on both.

**This is the foundation a chatbot is already built on, and it works.** Two gaps for R-71/R-73: neither function streams (both `await` the complete upstream body before responding — `:145-181`), and neither implements rate limiting or prompt-injection defence beyond payload size caps.

### K.2 — `services/` — three complete Node services, **none of them deployed or reachable**

| Service | Files | Capability, per source | Reachable from production? |
|---|---|---|---|
| `services/api-gateway` | `src/index.ts`, `src/types.ts`, `src/lib/{metrics,provider-error,ttft-benchmark}.ts`, `src/providers/{index,interface,gemini-provider,openai-provider,local-llama-provider,mock-provider}.ts`, `src/realtime/grpc-client.ts`, `src/viseme/{bridge,elevenlabs-ws,smoother}.ts` + `__tests__/bridge.test.ts` | Fastify 5 HTTP + WebSocket gateway with JWT (`@fastify/jwt`), CORS, rate limiting (`@fastify/rate-limit`), Redis (`ioredis`), Prometheus metrics (`prom-client`), zod validation, a pluggable LLM provider interface, a gRPC client to the orchestrator, and an ElevenLabs streaming-WS viseme bridge with a smoother | **No.** No Hosting rewrite targets it (`firebase.json:14-17` lists only `/api/tts` and `/api/chat`) |
| `services/realtime-orchestrator` | `src/index.ts`, `src/grpc/server.ts`, `src/orchestrator/session-manager.ts`, `src/integrations/{did,elevenlabs}.ts`, `src/providers/{index,interface,gemini-provider,openai-provider,local-llama-provider,mock-provider}.ts`, `src/lib/provider-error.ts`, `src/types.ts` | gRPC session orchestrator: session manager, D-ID streaming-avatar integration, ElevenLabs integration, same provider abstraction | **No** |
| `services/viseme-bridge` | `src/index.ts` | *"Frame-accurate viseme extraction from audio packets for D-ID lip-sync (FR-CLONE-LIVE)"* (`services/viseme-bridge/package.json:4`), `ws` + `zod` | **No** |

Wiring for these lives in `docker-compose.yml` (5 127 bytes) and `.env.example` (`API_GATEWAY_URL=http://api-gateway:8000`, `ORCHESTRATOR_GRPC_ADDR=realtime-orchestrator:50051`, `REDIS_URL`, `DID_API_KEY`, `ELEVENLABS_API_KEY`, `JWT_SECRET`, `NEXT_PUBLIC_REALTIME_WS_URL`). None of it is exercised by the Firebase deployment.

**Bottom line for K:** a real-time presence (R-123 … R-138) has a substantial, already-written server foundation in `services/` — provider abstraction, gRPC orchestration, viseme bridge, streaming TTS integration — but it is **entirely dormant**: no rewrite, no reachable origin, and `NEXT_PUBLIC_STATIC_EXPORT=1` disables the client half before it ever issues a request (`components/MiniVicBot.tsx:1063-1065`). Making it live requires a reachable origin plus a CSP amendment (`firebase.json:25` currently allows `connect-src 'self' ws: wss: https://api.github.com https://generativelanguage.googleapis.com https://*.googleapis.com`) and a `NEXT_PUBLIC_REALTIME_WS_URL` value, which `.env.example` ships empty.

---

## Appendix — commands run for this catalogue

```
git log -1 --format="%H %ad %s" --date=iso ; git status --porcelain
curl -s https://forgotten-mistory.web.app/ -o prod-index.html ; md5sum prod-index.html out/index.html
curl -s -o /dev/null -w "%{http_code}" -X POST https://forgotten-mistory.web.app/api/chat  -H 'content-type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}'
curl -s -o /dev/null -w "%{http_code}" -X POST https://forgotten-mistory.web.app/api/tts   -H 'content-type: application/json' -d '{"text":"hi"}'
curl -s -o /dev/null -w "%{http_code}" -X POST https://forgotten-mistory.web.app/api/realtime/session -d '{}'
curl -s -o /dev/null -w "%{http_code}" -X POST https://forgotten-mistory.web.app/api/chat-with-vic  -d '{}'
grep -rni "all rights reserved|konami|sudo hire|architecture-lab" app components lib public scripts tests
grep -rn "useMotionValue|useSpring|CountUp|useTransform|animate\(" --include=*.tsx --include=*.ts app components lib
grep -rInP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{FE0F}]' --include=*.tsx --include=*.ts --include=*.css app components lib
grep -ro "AIza[0-9A-Za-z_-]\{20,\}" out/_next/ | wc -l
node -e "require('./node_modules/<pkg>/package.json').version"   # per R-84 library
```

*Every finding above is traceable to one of these commands or to the cited file and line. No value in this document was inferred.*
