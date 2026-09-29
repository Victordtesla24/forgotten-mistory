#!/usr/bin/env node
// Fold a Playwright JSON report of tests/e2e/adversarial-matrix-full.spec.ts into a per-cell matrix.
// Usage: node scripts/uiux/matrix_summary.mjs <report.json[,rerun.json...]> <out.json> [out.md]
// Later reports override earlier ones cell-by-cell (superseded results are kept under `history`).
import fs from 'node:fs';

const [inFile, outFile, mdFile] = process.argv.slice(2);
const cells = [];
const history = [];
const walk = (suite) => {
  for (const s of suite.suites || []) walk(s);
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const ann = (t.annotations || []).find((a) => a.type === 'matrix');
      if (!ann) continue;
      const meta = JSON.parse(ann.description);
      const res = t.results?.at(-1) || {};
      const iterations = (res.attachments || []).filter((a) => a.name === 'matrix-profile' && a.body)
        .map((a) => JSON.parse(Buffer.from(a.body, 'base64').toString('utf8')));
      const status = res.status === 'passed' ? 'pass' : res.status === 'skipped' ? 'pending' : res.status ? 'fail' : 'pending';
      const prev = cells.findIndex((c) => c.profile === meta.profile && c.mechanism === meta.mechanism && c.scenario === meta.scenario);
      const cell = { ...meta, status, durationMs: res.duration, iterations, source: currentFile };
      if (prev >= 0) { history.push(cells[prev]); cells[prev] = cell; } else cells.push(cell);
    }
  }
};
let currentFile = '';
for (const f of inFile.split(',')) {
  currentFile = f;
  const report = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const s of report.suites || []) walk(s);
}

const MECH = ['Hero', 'About', 'Experience', 'Skills', 'Vitrine', 'Listen'];
const SCEN = ['cold-warm-reload', 'deep-anchor', 'back-forward', 'fast-scroll', 'remount', 'hidden-tab-resume', 'resize-orientation', 'slow-network', 'cpu-delayed-hydration', 'keyboard', 'touch', 'fallback-no-blank'];
const profiles = [...new Set(cells.map((c) => c.profile)), 'firefox', 'webkit'];
for (const p of ['firefox', 'webkit']) for (const m of MECH) for (const s of SCEN)
  cells.push({ profile: p, mechanism: m, scenario: s, status: 'pending', reason: 'browser not installed/configured (playwright.config.ts has chromium only)', iterations: [] });

const count = (arr, st) => arr.filter((c) => c.status === st).length;
const iters = cells.flatMap((c) => c.iterations);
const summary = {
  cells: { total: cells.length, pass: count(cells, 'pass'), fail: count(cells, 'fail'), pending: count(cells, 'pending') },
  iterations: { total: iters.length, pass: iters.filter((i) => i.result === 'pass').length, fail: iters.filter((i) => i.result === 'fail').length },
  failures: cells.filter((c) => c.status === 'fail').map((c) => ({ profile: c.profile, mechanism: c.mechanism, scenario: c.scenario,
    iterations: c.iterations.filter((i) => i.result === 'fail').map((i) => ({ iteration: i.iteration, viewport: i.viewport, network: i.network, cpuDelay: i.cpuDelay, hiddenMs: i.hiddenMs, error: i.error })) })),
};
fs.writeFileSync(outFile, JSON.stringify({ generatedFrom: inFile.split(','), summary, cells, superseded: history.map(({ iterations, ...c }) => ({ ...c, errors: iterations.map((i) => i.error).filter(Boolean) })) }, null, 1));
if (mdFile) {
  const sym = { pass: 'PASS', fail: '**FAIL**', pending: 'PENDING' };
  let md = `# Adversarial matrix results\n\nCells: ${summary.cells.pass} pass / ${summary.cells.fail} fail / ${summary.cells.pending} pending (of ${summary.cells.total}). Iterations: ${summary.iterations.pass} pass / ${summary.iterations.fail} fail.\n`;
  for (const p of profiles) {
    md += `\n## ${p}\n\n| scenario | ${MECH.join(' | ')} |\n|---|${MECH.map(() => '---').join('|')}|\n`;
    for (const s of SCEN) md += `| ${s} | ${MECH.map((m) => { const c = cells.find((x) => x.profile === p && x.mechanism === m && x.scenario === s); return c ? sym[c.status] : 'n/a'; }).join(' | ')} |\n`;
  }
  md += `\n## Failures\n\n`;
  for (const f of summary.failures) for (const i of f.iterations) md += `- ${f.profile} · ${f.mechanism} · ${f.scenario} · iter ${i.iteration} (vp ${i.viewport.width}x${i.viewport.height}, net ${i.network}, cpu ${i.cpuDelay}, hidden ${i.hiddenMs ?? '-'}): ${String(i.error).split('\n').slice(0, 3).join(' ')}\n`;
  fs.writeFileSync(mdFile, md);
}
console.log(JSON.stringify(summary.cells), JSON.stringify(summary.iterations));
