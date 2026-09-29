#!/usr/bin/env node
/**
 * axe_production.mjs — axe-core WCAG 2.x A/AA audit of the deployed site at
 * a mobile and a desktop viewport. Writes evidence JSON into
 * docs/uiux/evidence/<run-id>/axe__all__live__<label>__<utcstamp>.json
 *
 * Usage: node scripts/uiux/axe_production.mjs --run-id <id> [--label pre|post] [--base URL]
 * Exit 0 if zero serious/critical violations; 1 otherwise.
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const BASE = (args.base || 'https://forgotten-mistory.web.app').replace(/\/$/, '');
const RUN_ID = args['run-id'] || new Date().toISOString().replace(/[-:]/g, '').slice(0, 13) + 'Z';
const LABEL = args.label || 'pre';
const OUT_DIR = path.resolve('docs/uiux/evidence', RUN_ID);
fs.mkdirSync(OUT_DIR, { recursive: true });
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const ROUTES = ['/', '/this-route-does-not-exist-404'];
const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740, mobile: true },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
];

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const report = { base: BASE, runId: RUN_ID, label: LABEL, tags: TAGS, startedAt: new Date().toISOString(), results: [] };
let critical = 0;
let serious = 0;
try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      deviceScaleFactor: vp.mobile ? 3 : 1,
    });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      const url = BASE + route;
      let status = 0;
      try {
        const resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
        status = resp ? resp.status() : 0;
      } catch (e) {
        report.results.push({ viewport: vp.name, route, url, error: String(e) });
        continue;
      }
      await page.waitForTimeout(3500);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const violations = results.violations.map((x) => ({
        id: x.id,
        impact: x.impact,
        help: x.help,
        helpUrl: x.helpUrl,
        tags: x.tags.filter((t) => t.startsWith('wcag')),
        nodes: x.nodes.length,
        targets: x.nodes.slice(0, 8).map((n) => ({
          target: n.target.join(' '),
          html: (n.html || '').slice(0, 200),
          summary: (n.failureSummary || '').replace(/\s+/g, ' ').slice(0, 240),
        })),
      }));
      for (const v of violations) {
        if (v.impact === 'critical') critical++;
        if (v.impact === 'serious') serious++;
      }
      report.results.push({
        viewport: vp.name,
        route,
        url,
        status,
        passes: results.passes.length,
        incomplete: results.incomplete.map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length })),
        violations,
      });
      console.log(`[axe] ${vp.name} ${route} HTTP ${status} passes=${results.passes.length} violations=${violations.length} incomplete=${results.incomplete.length}`);
      for (const v of violations) console.log(`   [${v.impact}] ${v.id} nodes=${v.nodes} — ${v.help}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
report.finishedAt = new Date().toISOString();
report.summary = { critical, serious, verdict: critical + serious === 0 ? 'PASS' : 'VIOLATIONS' };
const file = path.join(OUT_DIR, `axe__all__live__${LABEL}__${stamp()}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 1));
console.log(`[axe] wrote ${file} — critical=${critical} serious=${serious}`);
process.exit(critical + serious === 0 ? 0 : 1);
