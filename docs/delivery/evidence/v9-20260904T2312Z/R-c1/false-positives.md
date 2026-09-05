# False-positive register — review c1

Per the orchestration contract §10.3: every prior claim that fresh evidence contradicts is named, with the original wording, its source, and the contradicting evidence.

## FP-1 — "HeroAtmosphere is imported by nothing" (adversarial reviewer, F-1)

- **Original claim (verbatim):** "In the working tree, `grep -rn "HeroAtmosphere" app components --include=*.tsx --include=*.ts -l` returns **no file**: `components/sections/Hero/HeroAtmosphere.tsx` … is imported by nothing. This is the documented 'committed but never wired' failure mode."
- **Source:** `R-c1/adversarial-review.md`, F-1, 2026-09-05.
- **Contradicting evidence (orchestrator, same hour):** `components/sections/Hero/Hero.tsx:13` `const HeroAtmosphere = dynamic(() => import('./HeroAtmosphere'), { ssr: false });` and `:35` `<HeroAtmosphere />`; likewise `Experience.tsx:17/70` for `CareerStrata`. Both scenes are wired. The reviewer's "0 canvas" observation is real but has a different cause: `components/gl/useGLCapability.ts` refuses software rasterisers (SwiftShader/llvmpipe) by design, so a headless browser without a GPU renders the static fallback; `?gl=force` overrides it. The motion council's force pass (`R-c1/force-hero-*.png`) shows the atmosphere rendering.
- **What survives of F-1:** #listen owns no visualisation in any path (true; cycle 8 builds one); the no-GL fallback gives no depth cue (true; cycle 10); reviewers must capture with `?gl=force` to judge the scenes (adopted for review c5).

## FP-2 — prior acceptance notes (v7 `ACCEPTANCE.md`, v8 `ACCEPTANCE.md`)

- **Original claims:** "Delivery pipeline + independent adversarial review PASS"; "Deployed to https://forgotten-mistory.web.app".
- **Contradicting evidence:** on 2026-09-04T23:12Z the suite could not be discovered (0 tests), `tsc` was red, the live page carried no `build-commit` meta (deployed from a dirty tree), and hosting had been released with `firebase.static.json`, which removed the `/api/chat` rewrite (`01-discoveries.md` P1–P3, R1–R4). The v8 deployment was real; the "verified" status was not.
