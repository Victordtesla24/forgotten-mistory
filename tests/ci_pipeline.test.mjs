/**
 * ci_pipeline.test.mjs — contract tests for the R6 CI/CD pipeline.
 * Validates that deploy.yml enforces all invariants and upgrade requirements.
 *
 * Usage:  node --test tests/ci_pipeline.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const yaml = readFileSync(join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8');

describe('R6 pipeline structure', () => {
  it('has all 10 required jobs', () => {
    const required = ['quality', 'lint', 'test', 'test-gpu', 'lighthouse', 'axe', 'build', 'preview', 'deploy', 'verify'];
    for (const job of required) {
      assert.ok(new RegExp(`^  ${job}:`, 'm').test(yaml), `job "${job}" missing`);
    }
  });

  it('quality job runs tsc + static audit + robustness + contract tests', () => {
    assert.ok(/tsc --noEmit/.test(yaml), 'tsc check missing');
    assert.ok(/overhaul_static_audit\.mjs/.test(yaml), 'static audit missing');
    assert.ok(/ci_pipeline_robustness\.mjs/.test(yaml), 'robustness check missing');
    assert.ok(/ci_pipeline\.test\.mjs/.test(yaml), 'contract tests missing');
  });
});

describe('R6 invariants', () => {
  it('build.needs excludes test and test-gpu (deploy never blocked on GPU runner)', () => {
    const needsMatch = yaml.match(/build:[\s\S]*?needs:\s*\[([^\]]*)\]/m);
    assert.ok(needsMatch, 'build.needs not found');
    const needs = needsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    assert.ok(!needs.includes('test'), 'build.needs must not include test');
    assert.ok(!needs.includes('test-gpu'), 'build.needs must not include test-gpu');
    assert.ok(needs.includes('quality'), 'build must need quality');
    assert.ok(needs.includes('lint'), 'build must need lint');
    assert.ok(needs.includes('lighthouse'), 'build must need lighthouse');
    assert.ok(needs.includes('axe'), 'build must need axe');
  });

  it('deploy only runs on main push', () => {
    const deployIf = yaml.match(/deploy:[\s\S]*?if:\s*(.+)/m);
    assert.ok(deployIf, 'deploy job missing if condition');
    assert.ok(deployIf[1].includes("refs/heads/main"), 'deploy must gate on main ref');
    assert.ok(deployIf[1].includes("push"), 'deploy must gate on push event');
  });

  it('test and test-gpu have continue-on-error', () => {
    for (const job of ['test', 'test-gpu']) {
      const re = new RegExp(`${job}:[\\s\\S]*?continue-on-error`);
      assert.ok(re.test(yaml), `${job} missing continue-on-error`);
    }
  });

  it('GEMINI_API_KEY used in build (fail-loud invariant)', () => {
    const buildBlock = yaml.match(/build:[\s\S]*?(?=preview:|deploy:)/m);
    assert.ok(buildBlock, 'build block not found');
    assert.ok(buildBlock[0].includes('GEMINI_API_KEY'), 'GEMINI_API_KEY missing from build');
    assert.ok(buildBlock[0].includes('secrets.GEMINI_API_KEY'), 'secrets.GEMINI_API_KEY reference missing');
  });

  it('STAGE 7: verify job runs after deploy and asserts production HTTP 200', () => {
    const verifyBlock = yaml.match(/^  verify:[\s\S]*$/m);
    assert.ok(verifyBlock, 'verify job (Stage 7) missing');
    const vb = verifyBlock[0];
    assert.ok(/needs:\s*\[[^\]]*\bdeploy\b[^\]]*\]/.test(vb), 'verify must depend on deploy');
    assert.ok(vb.includes('refs/heads/main'), 'verify must gate on main ref');
    assert.ok(vb.includes("event_name == 'push'"), 'verify must gate on push event');
    assert.ok(/curl/.test(vb), 'verify must curl the production URL');
    assert.ok(/http_code/.test(vb) && /200/.test(vb), 'verify must assert HTTP 200');
    assert.ok(!/secrets\./.test(vb), 'verify must not reference secrets (public prod URL)');
  });

  it('PR runs never auto-deploy to live (preview only)', () => {
    // Preview job gates on pull_request
    const previewBlock = yaml.match(/preview:[\s\S]*?(?=deploy:)/m);
    assert.ok(previewBlock, 'preview job not found');
    assert.ok(previewBlock[0].includes("pull_request"), 'preview must gate on pull_request');
    assert.ok(/channelId:\s*preview/.test(previewBlock[0]), 'preview must use preview channel');

    // Deploy job must not trigger on pull_request and must use live channel
    const deployBlock = yaml.match(/deploy:[\s\S]*?channelId:\s*live/m);
    assert.ok(deployBlock, 'deploy with live channel not found');
    assert.ok(deployBlock[0].includes("refs/heads/main"), 'deploy must gate on main ref');
    assert.ok(!/pull_request/.test(deployBlock[0].replace("event_name != 'pull_request'", '')), 'deploy must not trigger on pull_request');
  });
});

describe('R6 upgrades', () => {
  it('R6-HIGH: Playwright browser cache present in test and axe', () => {
    const cacheSteps = (yaml.match(/actions\/cache@v4/g) || []);
    assert.ok(cacheSteps.length >= 3,
      `expected >= 3 cache steps (test + test-gpu + axe), found ${cacheSteps.length}`);
  });

  it('R6-MED: PR preview channel present', () => {
    const previewBlock = yaml.match(/preview:[\s\S]*?(?=deploy:)/m);
    assert.ok(previewBlock, 'preview job missing');
    assert.ok(/channelId:.*preview/.test(previewBlock[0]),
      'preview channel uses PR number');
    assert.ok(/expires:\s*7d/.test(previewBlock[0]), 'preview channel has expiry');
  });

  it('R6-MED: Visual-regression baselines artifact present', () => {
    assert.ok(yaml.includes('visual-regression-baselines'),
      'visual-regression-baselines artifact name missing');
  });

  it('R6-LOW: Playwright HTML report artifact present', () => {
    assert.ok(yaml.includes('playwright-report'),
      'playwright-report artifact name missing');
  });

  it('R6-LOW: tsc fast-fail mirrored in lint job', () => {
    // lint job has tsc --noEmit before npm run lint
    assert.ok(/tsc --noEmit/.test(yaml), 'tsc --noEmit step missing');
    // Lint job runs tsc before eslint
    const lintBlock = yaml.match(/lint:[\s\S]*?(?=test:|# ── E2E)/m);
    assert.ok(lintBlock, 'lint block not found');
    assert.ok(lintBlock[0].includes('tsc --noEmit'), 'tsc --noEmit missing from lint');
    assert.ok(lintBlock[0].includes('npm run lint'), 'npm run lint missing from lint');
  });
});

describe('Concurrency safety', () => {
  it('cancel-in-progress is conditional on pull_request only', () => {
    assert.ok(/cancel-in-progress:.*pull_request/.test(yaml),
      'cancel-in-progress must be conditional on pull_request');
    assert.ok(!/cancel-in-progress:\s*true/.test(yaml),
      'cancel-in-progress must not be unconditional');
  });
});

describe('Edge cases', () => {
  it('test job skips for forks (no secrets available)', () => {
    const testBlock = yaml.match(/test:[\s\S]*?(?=test-gpu:)/m);
    assert.ok(testBlock, 'test block not found');
    assert.ok(/head\.repo\.full_name/.test(testBlock[0]),
      'test job must check fork status');
  });

  it('test-gpu only runs when E2E_RUNNER_LABELS is set', () => {
    const gpuBlock = yaml.match(/test-gpu:[\s\S]*?(?=lighthouse:)/m);
    assert.ok(gpuBlock, 'test-gpu block not found');
    assert.ok(/E2E_RUNNER_LABELS/.test(gpuBlock[0]),
      'test-gpu must gate on E2E_RUNNER_LABELS variable');
  });

  it('lighthouse uses lhci with proper budgets', () => {
    const lhBlock = yaml.match(/lighthouse:[\s\S]*?(?=axe:)/m);
    assert.ok(lhBlock, 'lighthouse block not found');
    assert.ok(/lhci/.test(lhBlock[0]), 'lighthouse must use lhci');
    assert.ok(/lighthouserc\.json/.test(lhBlock[0]), 'lighthouse must reference config');
  });
});

describe('CI-CD-4: Static audit hardening', () => {
  it('static audit report artifact is uploaded in quality job', () => {
    // The deploy.yml quality job should upload reports/static-audit.json as an artifact
    const qualityBlock = yaml.match(/quality:[\s\S]*?(?=\n  lint:)/m);
    assert.ok(qualityBlock, 'quality block not found');
    assert.ok(/static-audit-report/.test(qualityBlock[0]),
      'static-audit-report artifact name missing from quality job');
    assert.ok(/reports\/static-audit\.json/.test(qualityBlock[0]),
      'reports/static-audit.json path missing from quality job artifact');
    assert.ok(/upload-artifact@v4/.test(qualityBlock[0]),
      'upload-artifact@v4 action missing from quality job');
  });

  it('static audit fail-loud test file exists', () => {
    assert.ok(existsSync(join(process.cwd(), 'tests', 'static_audit_fail.test.mjs')),
      'tests/static_audit_fail.test.mjs must exist');
  });

  it('every job has timeout-minutes (R6 guard)', () => {
    const REQUIRED_JOBS = ['quality', 'lint', 'test', 'test-gpu', 'lighthouse', 'axe', 'build', 'preview', 'deploy', 'verify'];
    const missing = [];
    for (const job of [...REQUIRED_JOBS, 'secrets-check']) {
      const jobIdx = yaml.search(new RegExp(`^  ${job.replace(/-/g, '\\-')}:`, 'm'));
      if (jobIdx === -1) { missing.push(job); continue; }
      const remaining = yaml.slice(jobIdx);
      const nextJobIdx = remaining.slice(1).search(/^  [a-z][a-z-]*:/m);
      const block = nextJobIdx === -1 ? remaining : remaining.slice(0, nextJobIdx + 1);
      if (!/timeout-minutes/.test(block)) {
        missing.push(job);
      }
    }
    assert.equal(missing.length, 0,
      `jobs missing timeout-minutes: ${missing.join(', ')}`);
  });
});
