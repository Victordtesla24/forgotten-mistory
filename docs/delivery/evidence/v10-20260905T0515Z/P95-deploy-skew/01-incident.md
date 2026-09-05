# P95 — deploy skew: a mid-visit scroll loads chunks the next deploy has deleted

## The monitor line (10:09Z, build c5d808c3)

```
pageerrors: [
  "Loading chunk 427.8222755a6b18eedc.js failed.",
  "Loading chunk 743.9672a1f959c17edf.js failed."
]
canvasesAfterExperience: 0
```

## What it means

The document the visitor was holding was the **previous** build. Firebase Hosting serves
exactly one version of a site at a time: the moment the next deploy goes live, every hashed
file of the version before it returns 404. The HTML is the only file that names this build's
hashed chunks, so a page that has been open across a deploy asks for filenames that no longer
exist. Those two chunks are the lazily-imported WebGL scene bundle
(`components/gl/GLCanvas` → `three` + `@react-three/fiber`), which is why
`canvasesAfterExperience` was 0: the import rejected, the scene never mounted.

`.github/workflows/deploy.yml` runs on push **and every ten minutes**. A visitor who reads
the page for longer than one cadence window and then scrolls to `#experience` hits this. It
is not a rare race; it is the common case for an engaged reader.

## Why the existing worker did not save it

`public/sw.js` precached only `['/', '/docs/Vik_Resume_Final.pdf']` and cached hashed
sub-resources **on first request**. A chunk that is only requested when the reader reaches
`#experience` was therefore never in the cache at the moment the deploy removed it — the
worker had nothing to answer with. Worse, `activate` deleted *every* cache whose name is not
the current one, so the instant build N+1's worker activated, build N's cached chunks were
destroyed under the page still running build N.

## The fix, in three parts

1. **Precache the whole build.** `scripts/build/stamp_service_worker.mjs` now injects
   `PRECACHE_ASSETS` — every `.js`, `.css` and `.woff2` under `out/_next/static/` — into
   `out/sw.js`, and `install` caches them in batches of 20 under `Promise.allSettled` so a
   single 404 cannot abort the install.
2. **Keep two generations.** `activate` keeps the current cache *and* the immediately
   previous one (a ledger in `fm-generations` records the order), so a page still running
   build N can still lazy-load build N's chunks after N+1 activates. The generation before
   that is dropped on the following activation. A 404 from the network for
   `/_next/static/**` is also rescued by searching every `fm-static-*` cache.
3. **Recover in the app.** `components/gl/Scene.tsx` catches `ChunkLoadError`, retries the
   import once after 800 ms, then reloads the page once per session
   (`sessionStorage['fm-chunk-reload']`) to pick up the current build's document — and if it
   has already reloaded, renders the static fallback and logs once. The failure never
   reaches `app/error.tsx`, and a scene-local error boundary keeps any other scene fault
   inside its own slot.
