#!/usr/bin/env node
/**
 * prune_static_export.mjs — remove routes that must NOT ship on the public
 * static Firebase export (QA-ARCH-02).
 *
 * Currently: /performance-benchmark — a Lighthouse-only target kept on the
 * dynamic/dev build (where the legacy perf tooling reaches it) but excluded
 * from the public static build. The page already returns notFound() under
 * NEXT_PUBLIC_STATIC_EXPORT=1, but Next still prerenders the route's HTML stub
 * during `output: 'export'`, so this step deletes the emitted artifacts to
 * guarantee absence. Every removed path is logged (never silently dropped).
 *
 * Wired into `npm run build:static`. Exit 0 always (a no-op when out/ is absent).
 */
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
