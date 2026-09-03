#!/usr/bin/env node
/**
 * axe_live_audit.mjs — run axe-core (WCAG 2.0/2.1 A & AA) against the LIVE
 * deployed portfolio site and emit a structured per-rule violation report.
 *
 * Usage:  node scripts/validate/axe_live_audit.mjs [baseUrl]
 * Default baseUrl: https://forgotten-mistory.web.app
 * Exit:   0 if zero serious/critical violations, 1 otherwise.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.argv[2] || 'https://forgotten-mistory.web.app';
// The portfolio is a single-page scroll app; audit the root plus the 404 route.
const ROUTES = ['/', '/this-route-does-not-exist-404'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const allViolations = [];
const perRoute = [];

// This host has no ms-playwright download; it runs the system Chrome.
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    const url = BASE.replace(/\/$/, '') + route;
    let status = 0;
    try {
      const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      status = resp ? resp.status() : 0;
    } catch (e) {
      // networkidle can time out on animation-heavy pages; fall back to load.
      try {
        const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        status = resp ? resp.status() : 0;
      } catch (e2) {
        perRoute.push({ route, url, error: String(e2) });
        continue;
      }
    }
    // Let intro animations / hydration settle.
    await page.waitForTimeout(3500);

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const v = results.violations.map((x) => ({
      id: x.id,
      impact: x.impact,
      help: x.help,
      helpUrl: x.helpUrl,
      tags: x.tags.filter((t) => t.startsWith('wcag')),
      nodes: x.nodes.length,
      targets: x.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 240),
      })),
    }));
    perRoute.push({
      route,
      url,
      status,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      violations: v,
    });
    for (const item of v) allViolations.push({ route, ...item });
  }
} finally {
  await browser.close();
}

// ── Report ───────────────────────────────────────────────────────────────────
const order = { critical: 0, serious: 1, moderate: 2, minor: 3, null: 4 };
const sev = (i) => (order[i] ?? 4);

console.log('\n  AXE LIVE ACCESSIBILITY AUDIT');
console.log('  base: ' + BASE);
console.log('  tags: ' + TAGS.join(', '));
console.log('  ' + '-'.repeat(64));

let serious = 0, critical = 0, totalNodes = 0;
for (const r of perRoute) {
  if (r.error) {
    console.log(`\n  ROUTE ${r.route}  ERROR: ${r.error}`);
    continue;
  }
  console.log(`\n  ROUTE ${r.route}  (HTTP ${r.status})`);
  console.log(`    passes=${r.passes}  incomplete=${r.incomplete}  violations=${r.violations.length}`);
  const sorted = [...r.violations].sort((a, b) => sev(a.impact) - sev(b.impact));
  for (const v of sorted) {
    if (v.impact === 'critical') critical++;
    if (v.impact === 'serious') serious++;
    totalNodes += v.nodes;
    console.log(`    [${(v.impact || 'n/a').toUpperCase()}] ${v.id} — ${v.help}`);
    console.log(`        wcag: ${v.tags.join(', ')}  nodes: ${v.nodes}`);
    console.log(`        ${v.helpUrl}`);
    for (const t of v.targets) {
      console.log(`        · ${t.target}`);
      if (t.summary) console.log(`          ↳ ${t.summary}`);
    }
  }
  if (r.violations.length === 0) console.log('    ✓ no WCAG A/AA violations');
}

console.log('\n  ' + '-'.repeat(64));
const distinct = [...new Set(allViolations.map((v) => v.id))];
console.log(`  SUMMARY: distinct rules=${distinct.length}  critical=${critical}  serious=${serious}  total affected nodes=${totalNodes}`);
console.log(`  RESULT: ${critical + serious === 0 ? 'PASS (no serious/critical)' : 'VIOLATIONS PRESENT'}\n`);

// Emit machine-readable JSON for the kanban handoff.
console.log('---JSON---');
console.log(JSON.stringify({ base: BASE, tags: TAGS, perRoute, critical, serious, distinctRules: distinct }, null, 0));

process.exit(critical + serious === 0 ? 0 : 1);
