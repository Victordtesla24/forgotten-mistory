#!/usr/bin/env node
/**
 * prune_static_export.mjs — post-process the public static Firebase export: remove
 * routes that must NOT ship (QA-ARCH-02), then stamp the service worker.
 *
 * Currently: /performance-benchmark — a Lighthouse-only target kept on the
 * dynamic/dev build (where the legacy perf tooling reaches it) but excluded
 * from the public static build. The page already returns notFound() under
 * NEXT_PUBLIC_STATIC_EXPORT=1, but Next still prerenders the route's HTML stub
 * during `output: 'export'`, so this step deletes the emitted artifacts to
 * guarantee absence. Every removed path is logged (never silently dropped).
 *
 * The service-worker stamp rides here because this is the one step that already owns
 * out/ after `next build` has written it, and the stamp must land on the deploy
 * artifact rather than on tracked source (see stamp_service_worker.mjs for why).
 *
 * Wired into `npm run build:static`. Exit 0 always (a no-op when out/ is absent).
 */
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stampStaticExport } from './stamp_service_worker.mjs';

const OUT = join(process.cwd(), 'out');
if (!existsSync(OUT)) {
  console.error('[prune] no out/ directory — nothing to prune (did build:static run?)');
  process.exit(0);
}

// Routes excluded from the public static export. Add future Lighthouse/dev-only
// routes here rather than scattering the exclusion across the build.
const EXCLUDED_ROUTES = ['performance-benchmark'];

let removed = 0;
for (const route of EXCLUDED_ROUTES) {
  const targets = [
    `${route}.html`,
    `${route}.txt`,
    join('_next', 'static', 'chunks', 'app', route),
  ];
  for (const t of targets) {
    const p = join(OUT, t);
    if (existsSync(p)) {
      rmSync(p, { recursive: true, force: true });
      console.log(`[prune] removed out/${t}`);
      removed += 1;
    }
  }
}
console.log(`[prune] done — ${removed} artifact(s) removed from the static export`);

// A build that cannot stamp the worker must fail loudly: an unstamped sw.js keeps the
// never-changing cache name, which is how production went stale for an hour at a time.
stampStaticExport(OUT);
