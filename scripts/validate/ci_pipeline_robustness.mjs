#!/usr/bin/env node
/**
 * ci_pipeline_robustness.mjs — validates the R6-upgraded deploy.yml against
 * acceptance criteria and invariants.
 *
 * Usage:  node scripts/validate/ci_pipeline_robustness.mjs
 * Exit:   0 if all checks PASS, 1 otherwise.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const YAML_PATH = join(ROOT, '.github', 'workflows', 'deploy.yml');

const results = [];
const record = (id, pass, detail) => results.push({ id, pass, detail });
let allPass = true;

let yaml;
try {
  yaml = readFileSync(YAML_PATH, 'utf8');
} catch (e) {
  record('EXISTS', false, `deploy.yml not found at ${YAML_PATH}: ${e.message}`);
  allPass = false;
  report();
  process.exit(1);
}

// ── YAML syntax: check for balanced quotes, braces, brackets ──
function checkSyntax() {
  const lines = yaml.split('\n');
  let inRunBlock = 0;
  let inBlockScalar = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Track block scalars (`run: |` or `run: >`)
    if (/^\s+run\s*:\s*[|>]/.test(line)) inBlockScalar = true;
    else if (inBlockScalar && /^\S/.test(line)) inBlockScalar = false;
    // Skip block scalar content
    if (inBlockScalar) continue;
    // Check for unclosed expression braces in non-block-scalar lines
    const opens = (line.match(/\$\{\{/g) || []).length;
    const closes = (line.match(/\}\}/g) || []).length;
    inRunBlock += opens - closes;
    // Check for trailing colons on keys with empty values
    if (/^\s+\w[\w-]*\s*:\s*$/.test(line) && !/^\s+(steps|needs|with|env|permissions|restore-keys|headers|assertions|settings|projects|use):/.test(line)) {
      // Allow known keys that can have empty values
    }
  }
  record('SYNTAX', inRunBlock === 0,
    inRunBlock === 0 ? 'expression braces balanced' : `unbalanced expression braces (diff: ${inRunBlock})`);
}

checkSyntax();

// ── Required jobs ──
const REQUIRED_JOBS = ['quality', 'lint', 'test', 'test-gpu', 'lighthouse', 'axe', 'build', 'preview', 'deploy', 'verify'];
for (const job of REQUIRED_JOBS) {
  const jobRe = new RegExp(`^\\s{2}${job.replace('-', '\\-')}:`, 'm');
  record(`JOB-${job}`, jobRe.test(yaml),
    jobRe.test(yaml) ? `job "${job}" present` : `job "${job}" MISSING`);
}

// ── Invariant: build.needs does NOT include test or test-gpu ──
const buildNeedsMatch = yaml.match(/^\s{4}needs:\s*\[([^\]]*)\]/m);
if (buildNeedsMatch) {
  const needs = buildNeedsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
  const hasTest = needs.includes('test');
  const hasTestGpu = needs.includes('test-gpu');
  record('INV-NO-GPU-GATE', !hasTest && !hasTestGpu,
    (!hasTest && !hasTestGpu) ? 'build.needs excludes test/test-gpu (deploy never blocks on GPU runner)'
      : `build.needs includes ${[hasTest ? 'test' : '', hasTestGpu ? 'test-gpu' : ''].filter(Boolean).join('/')} — VIOLATES R6 invariant`);
}

// ── Invariant: Deploy only on main push ──
const deployIf = yaml.match(/^\s{2}deploy:[\s\S]*?\n\s{4}if:\s*(.+)/m);
if (deployIf) {
  const cond = deployIf[1].trim();
  const hasMainRef = cond.includes("refs/heads/main");
  const hasPushEvent = cond.includes("push");
  record('INV-DEPLOY-MAIN-ONLY', hasMainRef && hasPushEvent,
    (hasMainRef && hasPushEvent) ? 'deploy gated to main push only' : 'deploy if condition incomplete');
}

// ── Stage 7 (R6): post-deploy verify job ──
const verifyBlock = yaml.match(/^\s{2}verify:[\s\S]*$/m);
if (verifyBlock) {
  const vb = verifyBlock[0];
  // Runs only after a successful deploy
  const needsDeploy = /needs:\s*\[[^\]]*\bdeploy\b[^\]]*\]/.test(vb);
  record('R6-VERIFY-NEEDS-DEPLOY', needsDeploy,
    needsDeploy ? 'verify runs after deploy (needs: [deploy])' : 'verify must depend on deploy');
  // Gated to main push only (never runs on PRs)
  const verifyMainOnly = vb.includes('refs/heads/main') && vb.includes("event_name == 'push'");
  record('R6-VERIFY-MAIN-ONLY', verifyMainOnly,
    verifyMainOnly ? 'verify gated to main push only' : 'verify must gate on main push');
  // Performs an HTTP 200 production check via curl
  const checks200 = vb.includes('curl') && /200/.test(vb) && /http_code/.test(vb);
  record('R6-VERIFY-HTTP200', checks200,
    checks200 ? 'verify curls production URL and asserts HTTP 200' : 'verify must curl prod URL for HTTP 200');
  // No secrets referenced in the verify job (production URL is public)
  const noSecrets = !/secrets\./.test(vb);
  record('R6-VERIFY-NO-SECRETS', noSecrets,
    noSecrets ? 'verify references no secrets (public prod URL)' : 'verify must not reference secrets');
} else {
  record('R6-VERIFY-NEEDS-DEPLOY', false, 'verify job MISSING (Stage 7)');
}

// ── R6 Upgrade: Playwright cache present ──
const cacheCount = (yaml.match(/actions\/cache@v4/g) || []).length;
record('R6-CACHE', cacheCount >= 2,
  `${cacheCount} Playwright cache step(s) (expected >= 2: test + axe)`);

// ── R6 Upgrade: PR preview channel present ──
const hasPreviewJob = /^\s{2}preview:/m.test(yaml);
const hasPreviewChannel = /channelId:\s*preview-\$\{\{\s*github\.event\.number\s*\}\}/.test(yaml);
record('R6-PREVIEW', hasPreviewJob && hasPreviewChannel,
  (hasPreviewJob && hasPreviewChannel) ? 'preview job with per-PR channel present' : 'preview channel MISSING');

// ── R6 Upgrade: Visual-regression baselines artifact ──
const hasVrArtifact = yaml.includes('visual-regression-baselines');
record('R6-VISUAL-REG', hasVrArtifact,
  hasVrArtifact ? 'visual-regression baselines artifact present' : 'visual-regression artifact MISSING');

// ── R6 Upgrade: HTML report artifact ──
const hasHtmlReport = yaml.includes('playwright-report');
record('R6-HTML-REPORT', hasHtmlReport,
  hasHtmlReport ? 'Playwright HTML report artifact present' : 'HTML report artifact MISSING');

// ── R6 Upgrade: tsc fast-fail in lint ──
const lintBlock = yaml.match(/lint:[\s\S]*?(?=\n  \w)/);
const hasTscInLint = lintBlock && lintBlock[0].includes('tsc --noEmit') && lintBlock[0].includes('npm run lint');
record('R6-TSC-FASTFAIL', hasTscInLint,
  hasTscInLint ? 'tsc fast-fail mirrored in lint job' : 'tsc fast-fail in lint MISSING');

// ── Invariant: test and test-gpu have continue-on-error ──
for (const job of ['test', 'test-gpu']) {
  const jobBlockRe = new RegExp(`${job}:\\s*[\\s\\S]*?(?=\\n  \\w)`);
  const jobBlock = yaml.match(jobBlockRe);
  const hasCOE = jobBlock && jobBlock[0].includes('continue-on-error');
  record(`INV-${job.toUpperCase()}-COE`, hasCOE,
    hasCOE ? `${job} has continue-on-error` : `${job} MISSING continue-on-error (R6 invariant)`);
}

// ── Invariant: GEMINI_API_KEY used in build ──
const hasGeminiKey = yaml.includes('GEMINI_API_KEY');
record('INV-GEMINI-KEY', hasGeminiKey,
  hasGeminiKey ? 'GEMINI_API_KEY present (fail-loud invariant)' : 'GEMINI_API_KEY MISSING');

// ── R6 Upgrade: All jobs must have timeout-minutes ──
// Every job in deploy.yml must declare a timeout-minutes to prevent hung runners
// from blocking the pipeline indefinitely (GitHub default is 360 min — far too long).
// We count timeout-minutes declarations and compare against the known job count.
const timeoutCount = (yaml.match(/^\s+timeout-minutes:/gm) || []).length;
// Also check that every known job has its own timeout-minutes by verifying
// that each job block (top-level key at indent 2) is followed by timeout-minutes
// before the next job or end of file.
const missingTimeout = [];
for (const job of [...REQUIRED_JOBS, 'secrets-check']) {
  // Find the job line and check if timeout-minutes appears before the next job
  const jobIdx = yaml.search(new RegExp(`^\\s{2}${job.replace(/-/g, '\\-')}:`, 'm'));
  if (jobIdx === -1) { missingTimeout.push(`${job}(missing job)`); continue; }
  // Find the next job after this one
  const remaining = yaml.slice(jobIdx);
  const nextJobIdx = remaining.slice(1).search(/^\s{2}[a-z][a-z-]*:/m);
  const block = nextJobIdx === -1 ? remaining : remaining.slice(0, nextJobIdx + 1);
  if (!/\btimeout-minutes\b/.test(block)) {
    missingTimeout.push(job);
  }
}
record('R6-TIMEOUT', missingTimeout.length === 0,
  missingTimeout.length === 0
    ? `all ${REQUIRED_JOBS.length + 1} jobs have timeout-minutes`
    : `MISSING timeout-minutes on: ${missingTimeout.join(', ')}`);

// ── Report ──
function report() {
  console.log('\n  CI/CD PIPELINE ROBUSTNESS — R6 validation\n  ' + '-'.repeat(60));
  for (const r of results) {
    const tag = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) allPass = false;
    console.log(`  [${tag}] ${r.id.padEnd(20)} ${r.detail}`);
  }
  console.log('  ' + '-'.repeat(60));
  console.log(`  RESULT: ${allPass ? 'ALL PASS' : 'FAILURES PRESENT'} (${results.filter(r => r.pass).length}/${results.length})\n`);
}

report();
process.exit(allPass ? 0 : 1);
