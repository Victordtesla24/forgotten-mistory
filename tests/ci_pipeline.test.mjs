/**
 * ci_pipeline.test.mjs — contract tests for the delivery pipeline.
 *
 * The contract, in one sentence: every ten minutes and on every push, main is
 * consolidated with every other branch and deployed to production, and nothing
 * in that path waits on a test, a lint, an audit or a Lighthouse run. Checks
 * report in their own workflow and can never block a deploy.
 *
 * Usage:  node --test tests/ci_pipeline.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

const ROOT = process.cwd();
const WORKFLOWS = join(ROOT, '.github', 'workflows');
const deployText = readFileSync(join(WORKFLOWS, 'deploy.yml'), 'utf8');
const checksText = readFileSync(join(WORKFLOWS, 'checks.yml'), 'utf8');
const deploy = yaml.load(deployText);
const checks = yaml.load(checksText);
// js-yaml reads the bare `on:` key as boolean true.
const triggersOf = (doc) => doc.on ?? doc[true];

describe('the deploy pipeline is simple and autonomous', () => {
  it('is the only workflow that deploys, and there are exactly two workflows', () => {
    const files = readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml')).sort();
    assert.deepEqual(files, ['checks.yml', 'deploy.yml']);
    assert.ok(!/action-hosting-deploy|firebase deploy/.test(checksText), 'checks.yml must not deploy');
  });

  it('runs on every push to main, every ten minutes, and on demand', () => {
    const on = triggersOf(deploy);
    assert.deepEqual(on.push.branches, ['main']);
    assert.ok(Array.isArray(on.schedule) && on.schedule.some((s) => s.cron === '*/10 * * * *'), 'ten-minute schedule missing');
    assert.ok('workflow_dispatch' in on, 'workflow_dispatch missing');
  });

  it('has one job with no needs on any check', () => {
    const jobs = Object.keys(deploy.jobs);
    assert.deepEqual(jobs, ['consolidate-and-deploy']);
    assert.equal(deploy.jobs['consolidate-and-deploy'].needs, undefined);
    for (const banned of ['quality', 'lint', 'test', 'lighthouse', 'axe', 'audit', 'build', 'preview']) {
      assert.ok(!(banned in deploy.jobs), `deploy.yml must not carry a "${banned}" job`);
    }
  });

  it('consolidates every remote branch into main before deploying and deletes what it merged', () => {
    const run = deploy.jobs['consolidate-and-deploy'].steps.find((s) => s.id === 'consolidate').run;
    assert.ok(/git fetch --prune origin/.test(run));
    assert.ok(/for-each-ref[^\n]*refs\/remotes\/origin/.test(run), 'must enumerate every remote branch');
    assert.ok(/grep -vE '\^origin\/\(main\|HEAD\)\$'/.test(run), 'must skip main itself');
    assert.ok(/git merge --no-edit "\$ref"/.test(run), 'must merge each branch');
    assert.ok(/git merge --abort/.test(run), 'a conflicting branch is abandoned for this run, not forced');
    assert.ok(/git push origin HEAD:main/.test(run), 'must push the consolidated main');
    assert.ok(/git push origin --delete "\$name"/.test(run), 'must delete a branch it merged');
  });

  it('deploys with the Firebase service account to the live channel and reads the commit back', () => {
    const steps = deploy.jobs['consolidate-and-deploy'].steps;
    const fb = steps.find((s) => (s.uses || '').startsWith('FirebaseExtended/action-hosting-deploy'));
    assert.ok(fb, 'Firebase hosting deploy step missing');
    assert.equal(fb.with.channelId, 'live');
    assert.equal(fb.with.projectId, 'forgotten-mistory');
    assert.equal(fb.with.firebaseServiceAccount, '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}');
    const verify = steps[steps.length - 1];
    assert.ok(/build-commit/.test(verify.run), 'the last step verifies the live build-commit meta');
    assert.ok(/exit 1/.test(verify.run), 'a mismatch is reported as a failure, not swallowed');
  });

  it('can push (contents: write), queues runs and never cancels a deploy in flight', () => {
    assert.equal(deploy.permissions.contents, 'write');
    assert.equal(deploy.concurrency['cancel-in-progress'], false);
  });

  it('never weakens itself', () => {
    assert.ok(!/continue-on-error/.test(deployText), 'no continue-on-error in the deploy path');
    assert.ok(!/\|\|\s*true/.test(deployText.replace(/\|\| true\)"/g, '')), 'no "|| true" after a command');
  });
});

describe('checks report and never gate', () => {
  it('run on every push and carry no deploy step', () => {
    const on = triggersOf(checks);
    assert.deepEqual(on.push.branches, ['**']);
    for (const job of Object.values(checks.jobs)) {
      assert.equal(job.needs, undefined, 'checks jobs do not chain');
      assert.ok(!('continue-on-error' in job), 'a check that cannot fail proves nothing');
    }
  });

  it('cover types, lint, the static audit, the node contract tests, the Playwright suite and npm audit', () => {
    assert.ok(/tsc --noEmit/.test(checksText));
    assert.ok(/npm run lint/.test(checksText));
    assert.ok(/overhaul_static_audit\.mjs/.test(checksText));
    assert.ok(/ci_pipeline\.test\.mjs/.test(checksText));
    assert.ok(/npx playwright test/.test(checksText));
    assert.ok(/npm audit --audit-level=high/.test(checksText));
  });

  it('uploads hidden report directories (upload-artifact v4 skips dot-paths by default)', () => {
    const e2e = checks.jobs.e2e.steps.find((s) => (s.uses || '').startsWith('actions/upload-artifact'));
    assert.ok(e2e, 'playwright report upload missing');
    assert.equal(e2e.with['include-hidden-files'], true);
  });
});
