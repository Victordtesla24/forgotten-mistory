#!/usr/bin/env node
// Median-of-N mobile Lighthouse gate (UX-P1-006). Usage:
//   node scripts/uiux/lighthouse_mobile_gate.mjs <outDir> [url] [runs]
// Reads existing lighthouse-mobile-run*.json in <outDir> if present, else runs lighthouse N times.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [outDir, url = 'https://forgotten-mistory.web.app/', runs = '3'] = process.argv.slice(2);
if (!outDir) { console.error('usage: lighthouse_mobile_gate.mjs <outDir> [url] [runs]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
let files = fs.readdirSync(outDir).filter((f) => /^lighthouse-mobile-run\d+\.json$/.test(f));
if (!files.length) {
  for (let i = 1; i <= Number(runs); i++) {
    execFileSync('npx', ['--no-install', 'lighthouse', url, '--only-categories=performance,accessibility,best-practices,seo',
      '--form-factor=mobile', "--chrome-flags=--no-sandbox --headless=new", '--output=json',
      `--output-path=${path.join(outDir, `lighthouse-mobile-run${i}.json`)}`, '--quiet'], { stdio: 'inherit' });
  }
  files = fs.readdirSync(outDir).filter((f) => /^lighthouse-mobile-run\d+\.json$/.test(f));
}
const rows = files.sort().map((f) => {
  const r = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'));
  const a = r.audits;
  return {
    file: f, fetchTime: r.fetchTime, url: r.finalDisplayedUrl, benchmarkIndex: r.environment?.benchmarkIndex,
    performance: r.categories.performance.score, accessibility: r.categories.accessibility.score,
    bestPractices: r.categories['best-practices'].score, seo: r.categories.seo.score,
    lcp: Math.round(a['largest-contentful-paint'].numericValue), tbt: Math.round(a['total-blocking-time'].numericValue),
    cls: a['cumulative-layout-shift'].numericValue, fcp: Math.round(a['first-contentful-paint'].numericValue),
    si: Math.round(a['speed-index'].numericValue), colorContrast: a['color-contrast']?.score ?? null,
  };
});
const med = (k) => { const v = rows.map((r) => r[k]).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const median = Object.fromEntries(['performance', 'accessibility', 'bestPractices', 'seo', 'lcp', 'tbt', 'cls', 'fcp', 'si'].map((k) => [k, med(k)]));
const thresholds = { performance: 0.9, lcp: 2500, tbt: 200, cls: 0.05 };
const verdict = {
  performance: median.performance >= 0.9 ? 'PASS' : 'FAIL', lcp: median.lcp <= 2500 ? 'PASS' : 'FAIL',
  tbt: median.tbt <= 200 ? 'PASS' : 'FAIL', cls: median.cls <= 0.05 ? 'PASS' : 'FAIL',
};
const out = { url, runs: rows, median, thresholds, verdict, overall: Object.values(verdict).every((v) => v === 'PASS') ? 'PASS' : 'FAIL' };
fs.writeFileSync(path.join(outDir, 'lighthouse-mobile-medians.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ median, verdict, overall: out.overall }, null, 1));
process.exit(out.overall === 'PASS' ? 0 : 1);
