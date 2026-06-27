/**
 * static_audit_fail.test.mjs — fail-loud contract tests for the static audit.
 * Validates that the audit exits non-zero on ANY violation.
 *
 * Usage:  node --test tests/static_audit_fail.test.mjs
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const AUDIT_SCRIPT = join(ROOT, 'scripts', 'validate', 'overhaul_static_audit.mjs');
const SITE_CONTENT = join(ROOT, 'app', 'data', 'siteContent.ts');

let originalContent = null;

function runAudit() {
  try {
    const out = execSync(`node "${AUDIT_SCRIPT}"`, { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    return { exitCode: 0, stdout: out };
  } catch (e) {
    return { exitCode: e.status || 1, stdout: e.stdout || '', stderr: e.stderr || '' };
  }
}

function restore() {
  if (originalContent !== null) {
    writeFileSync(SITE_CONTENT, originalContent, 'utf8');
  }
}

describe('Static audit fail-loud contract', () => {
  before(() => {
    if (existsSync(SITE_CONTENT)) {
      originalContent = readFileSync(SITE_CONTENT, 'utf8');
    }
  });

  after(() => {
    restore();
  });

  it('baseline: audit passes on clean source (exit 0)', () => {
    restore();
    const { exitCode, stdout } = runAudit();
    assert.equal(exitCode, 0, `Expected exit 0 but got ${exitCode}`);
    assert.ok(stdout.includes('ALL PASS'), 'Expected ALL PASS in output');
  });

  it('TONE violation: injecting banned word in string literal causes exit 1', () => {
    // Inject a new TypeScript const with a literal string containing a banned word.
    // The TONE check scans string literals in app/data/*.ts files.
    const injected = originalContent.replace(
      'export interface ExperienceRole {',
      'const _TONETEST_TONE = "world-class";\nexport interface ExperienceRole {'
    );
    writeFileSync(SITE_CONTENT, injected, 'utf8');

    const { exitCode, stdout } = runAudit();

    assert.equal(exitCode, 1, `Expected exit 1 but got ${exitCode}. Output end: ${stdout.slice(-400)}`);
    assert.ok(stdout.includes('TC-NFR-TONE'), 'Expected TONE check in output');
    assert.ok(stdout.includes('world-class') || stdout.includes('[FAIL]'), 'Expected violation evidence');
  });

  it('COMPLETE violation: TODO marker causes exit 1', () => {
    // Inject a TODO comment line at the bottom of the file
    const injected = originalContent + '\n// TODO: remove after CI test\n';
    writeFileSync(SITE_CONTENT, injected, 'utf8');

    const { exitCode, stdout } = runAudit();

    assert.equal(exitCode, 1, `Expected exit 1 but got ${exitCode}`);
    assert.ok(stdout.includes('TC-NFR-COMPLETE'), 'Expected COMPLETE check mention');
    assert.ok(stdout.includes('TODO'), 'Expected TODO marker in detail');
  });

  it('MULTI-AXIS violation: multiple failures all reported before exit', () => {
    // Inject both a TONE violation and a COMPLETE violation
    const injected = originalContent.replace(
      'export interface ExperienceRole {',
      'const _TONETEST_MULTI = "cutting-edge";\nexport interface ExperienceRole {'
    ) + '\n// TODO: multi-axis test\n';
    writeFileSync(SITE_CONTENT, injected, 'utf8');

    const { exitCode, stdout } = runAudit();

    assert.equal(exitCode, 1, `Expected exit 1 but got ${exitCode}`);
    const failCount = (stdout.match(/\[FAIL\]/g) || []).length;
    assert.ok(failCount >= 2, `Expected >= 2 FAIL tags, got ${failCount}. Output: ${stdout.slice(-600)}`);
    assert.ok(stdout.includes('TC-NFR-TONE'), 'Expected TONE axis');
    assert.ok(stdout.includes('TC-NFR-COMPLETE'), 'Expected COMPLETE axis');
  });

  it('JSON report reflects FAIL when violations present', () => {
    // Use the same injected file from previous test (still dirty)
    const { exitCode } = runAudit();

    assert.equal(exitCode, 1, 'Expected exit 1');

    const reportPath = join(ROOT, 'reports', 'static-audit.json');
    assert.ok(existsSync(reportPath), 'JSON report should exist');
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.result, 'FAIL', 'JSON report.result should be FAIL');
    assert.ok(report.summary.failed >= 1, `JSON should show failures, got ${report.summary.failed}`);
  });

  it('JSON report reflects PASS on clean source', () => {
    restore();
    const { exitCode } = runAudit();

    assert.equal(exitCode, 0, 'Expected exit 0');
    const reportPath = join(ROOT, 'reports', 'static-audit.json');
    assert.ok(existsSync(reportPath), 'JSON report should exist');
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    assert.equal(report.result, 'PASS', 'JSON report.result should be PASS');
    assert.equal(report.summary.failed, 0, `Expected 0 failures, got ${report.summary.failed}`);
  });
});
