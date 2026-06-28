#!/usr/bin/env node
/**
 * CI-CD-7: Visual Regression Diff Engine
 * Compares PR screenshots against baseline (main branch) screenshots
 * using pixelmatch. Generates HTML report and JSON summary.
 *
 * Usage:
 *   node scripts/ci/visual_diff.mjs --baseline <dir> --actual <dir> --output <dir> [--threshold 0.5]
 *
 * Outputs:
 *   - HTML report: <output>/visual-diff-report.html
 *   - Diff PNGs:   <output>/diffs/*-diff.png
 *   - JSON summary to stdout
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join, basename, relative } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Parse CLI args
const args = process.argv.slice(2);
let baselineDir = '';
let actualDir = '';
let outputDir = '';
let threshold = 0.5;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--baseline' && args[i + 1]) { baselineDir = resolve(args[++i]); }
  else if (args[i] === '--actual' && args[i + 1]) { actualDir = resolve(args[++i]); }
  else if (args[i] === '--output' && args[i + 1]) { outputDir = resolve(args[++i]); }
  else if (args[i] === '--threshold' && args[i + 1]) { threshold = parseFloat(args[++i]); }
}

if (!baselineDir || !actualDir || !outputDir) {
  console.error('Usage: node visual_diff.mjs --baseline <dir> --actual <dir> --output <dir> [--threshold 0.5]');
  process.exit(1);
}

if (!existsSync(baselineDir)) {
  console.error(`Baseline directory not found: ${baselineDir}`);
  process.exit(1);
}
if (!existsSync(actualDir)) {
  console.error(`Actual directory not found: ${actualDir}`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
const diffDir = join(outputDir, 'diffs');
mkdirSync(diffDir, { recursive: true });

const baselineFiles = readdirSync(baselineDir).filter(f => f.endsWith('.png')).sort();
const actualFiles = readdirSync(actualDir).filter(f => f.endsWith('.png')).sort();
const allNames = [...new Set([...baselineFiles, ...actualFiles])].sort();

const results = [];

for (const name of allNames) {
  const baselinePath = join(baselineDir, name);
  const actualPath = join(actualDir, name);

  if (!existsSync(baselinePath)) {
    results.push({ name, status: 'added', diffPercent: null, diffPixels: null });
    continue;
  }
  if (!existsSync(actualPath)) {
    results.push({ name, status: 'removed', diffPercent: null, diffPixels: null });
    continue;
  }

  try {
    const baselinePng = PNG.sync.read(readFileSync(baselinePath));
    const actualPng = PNG.sync.read(readFileSync(actualPath));

    const width = Math.max(baselinePng.width, actualPng.width);
    const height = Math.max(baselinePng.height, actualPng.height);

    let baselineData = baselinePng.data;
    let actualData = actualPng.data;
    if (baselinePng.width !== width || baselinePng.height !== height) {
      const resized = new PNG({ width, height });
      PNG.bitblt(baselinePng, resized, 0, 0, baselinePng.width, baselinePng.height, 0, 0);
      baselineData = resized.data;
    }
    if (actualPng.width !== width || actualPng.height !== height) {
      const resized = new PNG({ width, height });
      PNG.bitblt(actualPng, resized, 0, 0, actualPng.width, actualPng.height, 0, 0);
      actualData = resized.data;
    }

    const diffPng = new PNG({ width, height });
    const numDiffPixels = pixelmatch(
      baselineData, actualData, diffPng.data,
      width, height,
      { threshold: 0.1, alpha: 0.1 }
    );

    const totalPixels = width * height;
    const diffPercent = totalPixels > 0 ? (numDiffPixels / totalPixels) * 100 : 0;
    const passed = diffPercent <= threshold;

    const diffName = name.replace(/\.png$/i, '-diff.png');
    writeFileSync(join(diffDir, diffName), PNG.sync.write(diffPng));

    results.push({
      name,
      status: passed ? 'unchanged' : 'changed',
      diffPercent: Math.round(diffPercent * 100) / 100,
      diffPixels: numDiffPixels,
      diffImage: `diffs/${diffName}`,
    });
  } catch (err) {
    results.push({ name, status: 'error', diffPercent: null, diffPixels: null, error: err.message });
  }
}

const changed = results.filter(r => r.status === 'changed').length;
const added = results.filter(r => r.status === 'added').length;
const removed = results.filter(r => r.status === 'removed').length;
const unchanged = results.filter(r => r.status === 'unchanged').length;
const errors = results.filter(r => r.status === 'error').length;
const total = results.length;

function generateHtml() {
  const rows = results.map(r => {
    let icon, badge;
    switch (r.status) {
      case 'unchanged': icon = 'PASS'; badge = 'Pass'; break;
      case 'changed': icon = 'WARN'; badge = `Diff: ${r.diffPercent}%`; break;
      case 'added': icon = 'NEW'; badge = 'New'; break;
      case 'removed': icon = 'MISS'; badge = 'Missing'; break;
      case 'error': icon = 'ERR'; badge = 'Error'; break;
      default: icon = '?'; badge = r.status;
    }
    const diffPercentDisplay = r.diffPercent != null ? `${r.diffPercent}%` : '-';
    const thresholdDisplay = r.diffPercent != null
      ? (r.diffPercent <= threshold ? 'OK' : 'OVER')
      : '-';

    let imagesHtml = '';
    if (r.status === 'changed') {
      imagesHtml = `
        <td><img src="${join(relative(outputDir, baselineDir), r.name)}" alt="baseline" loading="lazy"></td>
        <td><img src="${join(relative(outputDir, actualDir), r.name)}" alt="actual" loading="lazy"></td>
        <td><img src="${r.diffImage}" alt="diff" loading="lazy"></td>`;
    } else if (r.status === 'added') {
      imagesHtml = `
        <td class="na">-</td>
        <td><img src="${join(relative(outputDir, actualDir), r.name)}" alt="new" loading="lazy"></td>
        <td class="na">-</td>`;
    } else if (r.status === 'removed') {
      imagesHtml = `
        <td><img src="${join(relative(outputDir, baselineDir), r.name)}" alt="removed" loading="lazy"></td>
        <td class="na">-</td>
        <td class="na">-</td>`;
    } else if (r.status === 'unchanged') {
      imagesHtml = `
        <td><img src="${join(relative(outputDir, baselineDir), r.name)}" alt="baseline" loading="lazy"></td>
        <td><img src="${join(relative(outputDir, actualDir), r.name)}" alt="actual" loading="lazy"></td>
        <td class="na">-</td>`;
    } else {
      imagesHtml = `<td colspan="3" class="error">${r.error || 'Unknown error'}</td>`;
    }

    return `<tr class="${r.status}">
      <td>${icon}</td>
      <td><code>${r.name}</code></td>
      <td class="status">${badge}</td>
      <td>${diffPercentDisplay}</td>
      <td>${thresholdDisplay}</td>
      ${imagesHtml}
    </tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Visual Regression Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #c9d1d9; padding: 24px; }
  h1 { font-size: 24px; margin-bottom: 8px; color: #58a6ff; }
  .summary { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
  .summary-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; min-width: 100px; }
  .summary-card .label { font-size: 12px; color: #8b949e; text-transform: uppercase; }
  .summary-card .value { font-size: 28px; font-weight: bold; margin-top: 4px; }
  .summary-card.changed .value { color: #d2991d; }
  .summary-card.added .value { color: #3fb950; }
  .summary-card.removed .value { color: #f85149; }
  .summary-card.unchanged .value { color: #58a6ff; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #161b22; border-bottom: 2px solid #30363d; position: sticky; top: 0; }
  td { padding: 8px 12px; border-bottom: 1px solid #21262d; vertical-align: top; }
  tr.changed { background: rgba(210, 153, 29, 0.08); }
  tr.added { background: rgba(63, 185, 80, 0.08); }
  tr.removed { background: rgba(248, 81, 73, 0.08); }
  tr.error { background: rgba(248, 81, 73, 0.15); }
  img { max-width: 280px; max-height: 200px; border: 1px solid #30363d; border-radius: 4px; display: block; }
  .na { color: #484f58; text-align: center; font-style: italic; }
  .error { color: #f85149; }
  .threshold-info { font-size: 13px; color: #8b949e; margin: 8px 0; }
  code { font-size: 12px; background: #161b22; padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body>
<h1>Visual Regression Report</h1>
<p class="threshold-info">Threshold: ${threshold}% pixel difference | Screenshots: ${total} total</p>
<div class="summary">
  <div class="summary-card unchanged"><div class="label">Unchanged</div><div class="value">${unchanged}</div></div>
  <div class="summary-card changed"><div class="label">Changed</div><div class="value">${changed}</div></div>
  <div class="summary-card added"><div class="label">Added</div><div class="value">${added}</div></div>
  <div class="summary-card removed"><div class="label">Removed</div><div class="value">${removed}</div></div>
  ${errors > 0 ? `<div class="summary-card error"><div class="label">Errors</div><div class="value">${errors}</div></div>` : ''}
</div>
<table>
<thead>
  <tr><th></th><th>Screenshot</th><th>Status</th><th>Diff %</th><th>Thr</th><th>Baseline</th><th>PR Actual</th><th>Diff</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<p style="margin-top:24px;color:#8b949e;font-size:12px;">Generated by CI-CD-7 visual_diff.mjs | pixelmatch diff engine</p>
</body>
</html>`;
}

const htmlReport = generateHtml();
const reportPath = join(outputDir, 'visual-diff-report.html');
writeFileSync(reportPath, htmlReport);

const jsonSummary = {
  total,
  changed,
  added,
  removed,
  unchanged,
  errors,
  threshold: threshold,
  reportPath: reportPath,
  results: results.map(r => ({
    name: r.name,
    status: r.status,
    diffPercent: r.diffPercent,
    diffPixels: r.diffPixels,
  })),
};

console.log(JSON.stringify(jsonSummary, null, 2));

if (errors > 0) {
  process.exit(1);
}
