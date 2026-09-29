/**
 * ci_pipeline.test.mjs — contract tests for the delivery pipeline (UX-C0-001).
 *
 * The contract, in one sentence: there is one path to production — a PR runs
 * the gates and gets a preview channel; a squash-merge to main runs the same
 * gates, deploys the gated export live, proves build-hash parity, smokes
 * production and reverts itself on failure. Nothing merges branches on its own,
 * nothing deploys more often than the hourly heartbeat, and the long or
 * hardware-bound checks report from nightly.yml without ever gating a deploy.
 *
 * Usage:  node --test tests/ci_pipeline.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

const ROOT = process.cwd();
const WORKFLOWS = join(ROOT, '.github', 'workflows');
const shipText = readFileSync(join(WORKFLOWS, 'deploy.yml'), 'utf8');
const nightlyText = readFileSync(join(WORKFLOWS, 'nightly.yml'), 'utf8');
const ship = yaml.load(shipText);
const nightly = yaml.load(nightlyText);
// js-yaml reads the bare `on:` key as boolean true.
const triggersOf = (doc) => doc.on ?? doc[true];
const runsOf = (job) => (job.steps ?? []).map((s) => s.run || '').join('\n');
const usesStep = (job, prefix) => (job.steps ?? []).find((s) => (s.uses || '').startsWith(prefix));

// A cron more frequent than hourly has a minute field that is not a single
// literal minute: "*/10", "*", "0,30", "0-59" all fire more than once an hour.
const firesMoreThanHourly = (cron) => !/^\d{1,2}\s/.test(String(cron).trim());

describe('there is exactly one path to production', () => {
  it('has exactly two workflows: ship (deploy.yml) and nightly', () => {
    const files = readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml')).sort();
    assert.deepEqual(files, ['deploy.yml', 'nightly.yml']);
    assert.equal(ship.name, 'ship');
    assert.ok(!/action-hosting-deploy|firebase deploy|firebase-tools/.test(nightlyText), 'nightly.yml must not deploy');
  });

  it('runs on PRs to main, pushes to main, an hourly heartbeat and on demand', () => {
    const on = triggersOf(ship);
    assert.deepEqual(on.pull_request.branches, ['main']);
    assert.deepEqual(on.push.branches, ['main']);
    assert.ok('workflow_dispatch' in on, 'workflow_dispatch missing');
    assert.ok(Array.isArray(on.schedule) && on.schedule.length > 0, 'the hourly heartbeat is missing');
  });

  it('never schedules anything more often than hourly, in any workflow', () => {
    for (const [file, doc] of [['deploy.yml', ship], ['nightly.yml', nightly]]) {
      for (const entry of triggersOf(doc).schedule ?? []) {
        assert.ok(!firesMoreThanHourly(entry.cron), `${file} cron "${entry.cron}" fires more than once an hour`);
      }
    }
  });

  it('never merges other branches into main on its own', () => {
    for (const [file, text] of [['deploy.yml', shipText], ['nightly.yml', nightlyText]]) {
      assert.ok(!/-X theirs/.test(text), `${file} must not force-resolve merges (-X theirs)`);
      assert.ok(!/checkout --theirs/.test(text), `${file} must not take conflicting hunks from a branch`);
      assert.ok(!/for-each-ref[^\n]*refs\/remotes/.test(text), `${file} must not enumerate and merge remote branches`);
      assert.ok(!/git merge/.test(text), `${file} must not merge anything`);
      assert.ok(!/git push origin --delete/.test(text), `${file} must not delete branches`);
    }
  });

  it('queues runs per ref and never cancels a deploy in flight; can push a revert', () => {
    assert.equal(ship.concurrency['cancel-in-progress'], false);
    assert.ok(/^ship-/.test(String(ship.concurrency.group)), 'concurrency group is per ref (ship-<ref>)');
    assert.equal(ship.permissions.contents, 'write');
    assert.equal(ship.permissions['pull-requests'], 'write');
  });
});

describe('the gates job is the single quality gate', () => {
  const gates = ship.jobs.gates;

  it('exists and every deploying job needs it', () => {
    assert.ok(gates, 'deploy.yml must carry a "gates" job');
    for (const name of ['preview', 'deploy', 'functions']) {
      const job = ship.jobs[name];
      assert.ok(job, `deploy.yml must carry a "${name}" job`);
      assert.ok([].concat(job.needs ?? []).includes('gates'), `"${name}" must need "gates"`);
    }
  });

  it('checks types, lint, the static audit, the node contract tests, builds, runs @smoke + axe e2e and the Lighthouse budget', () => {
    const runs = gates.steps.map((s) => (s.run || '').trim());
    const joined = runs.join('\n');
    assert.ok(runs.includes('npm ci'), 'gates must run "npm ci"');
    assert.ok(runs.includes('npm ci --prefix functions'), 'gates must install the functions tree before the node tests');
    assert.ok(runs.indexOf('npm ci') < runs.indexOf('npm ci --prefix functions'));
    assert.ok(runs.indexOf('npm ci --prefix functions') < runs.findIndex((r) => /^node --test /.test(r)));
    assert.ok(/tsc --noEmit/.test(joined));
    assert.ok(/npm run lint/.test(joined));
    assert.ok(/overhaul_static_audit\.mjs/.test(joined));
    assert.ok(/ci_pipeline\.test\.mjs/.test(joined));
    assert.ok(/npm run build:static/.test(joined));
    assert.ok(/playwright install --with-deps chromium/.test(joined));
    assert.ok(/PLAYWRIGHT_BASE_URL=[^\n]*npx playwright test --grep "@smoke\|A11Y-"/.test(joined), 'e2e on out/ runs the @smoke and axe (A11Y-) specs');
    assert.ok(/@lhci\/cli[^\n]* autorun --config=lighthouserc\.json/.test(joined), 'Lighthouse budget missing');
    // The build precedes the e2e, and the e2e precedes the Lighthouse run.
    assert.ok(joined.indexOf('npm run build:static') < joined.indexOf('npx playwright test'));
    assert.ok(joined.indexOf('npx playwright test') < joined.indexOf('@lhci/cli'));
  });

  it('serves the export on a port lighthouserc.json points at, waiting for it without wait-on', () => {
    const lhrc = JSON.parse(readFileSync(join(ROOT, 'lighthouserc.json'), 'utf8'));
    const urls = lhrc.ci.collect.url;
    assert.ok(Array.isArray(urls) && urls.length > 0);
    for (const u of urls) assert.ok(/^http:\/\/127\.0\.0\.1:5599\//.test(u), `lighthouserc url ${u} must target the served export`);
    assert.ok(!urls.some((u) => /performance-benchmark/.test(u)), 'no route that the static export does not contain');
    const runs = runsOf(gates);
    assert.ok(/python3 -m http\.server "\$STATIC_PORT"/.test(runs), 'the export is served by python3 http.server');
    assert.equal(ship.env.STATIC_PORT, '5599');
    assert.ok(/curl -fsS "http:\/\/127\.0\.0\.1:\$STATIC_PORT\/"/.test(runs), 'readiness is polled with curl');
    assert.ok(!/wait-on/.test(shipText), 'wait-on is not a dependency of this project');
  });

  it('uploads the export it tested for the deploying jobs, with hidden files, short-lived', () => {
    const upload = gates.steps.find((s) => (s.uses || '').startsWith('actions/upload-artifact') && s.with?.name === 'out');
    assert.ok(upload, 'gates must upload the "out" artifact');
    assert.equal(upload.with.path, 'out');
    assert.equal(upload.with['include-hidden-files'], true);
    assert.ok(Number(upload.with['retention-days']) <= 3);
    for (const name of ['preview', 'deploy']) {
      const dl = usesStep(ship.jobs[name], 'actions/download-artifact');
      assert.ok(dl && dl.with.name === 'out' && dl.with.path === 'out', `"${name}" must download the gated "out" artifact`);
    }
  });

  it('never weakens itself', () => {
    assert.ok(!/continue-on-error/.test(shipText), 'no continue-on-error anywhere in the ship path');
    assert.ok(!/\|\|\s*true\b/.test(shipText), 'no "|| true" after a command');
    assert.ok(!/npm install/.test(shipText), 'a lockfile that does not resolve is a red gate, not a fallback');
    for (const [name, job] of Object.entries(ship.jobs)) {
      assert.ok(!('continue-on-error' in job), `ship job "${name}" cannot fail, so it proves nothing`);
    }
  });
});

describe('preview and deploy ship the gated export', () => {
  const preview = ship.jobs.preview;
  const deploy = ship.jobs.deploy;

  it('preview runs only for pull requests and deploys a short-lived channel', () => {
    assert.match(String(preview.if), /pull_request/);
    const fb = usesStep(preview, 'FirebaseExtended/action-hosting-deploy');
    assert.ok(fb, 'preview must deploy a Firebase preview channel');
    assert.equal(fb.with.projectId, 'forgotten-mistory');
    assert.equal(fb.with.firebaseServiceAccount, '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}');
    assert.equal(fb.with.repoToken, '${{ secrets.GITHUB_TOKEN }}');
    assert.equal(fb.with.channelId, undefined, 'preview must never target the live channel');
    assert.match(String(fb.with.expires), /^\d+d$/);
  });

  it('deploy runs only on main and never for a pull request', () => {
    assert.match(String(deploy.if), /refs\/heads\/main/);
    assert.match(String(deploy.if), /!= 'pull_request'/);
    assert.equal(deploy.environment, 'production');
  });

  it('both drop the predeploy rebuild so what was gated is what ships (D-002)', () => {
    const firebase = JSON.parse(readFileSync(join(ROOT, 'firebase.json'), 'utf8'));
    assert.ok(Array.isArray(firebase.hosting.predeploy), 'firebase.json still carries predeploy for hand deploys');
    for (const [name, job] of [['preview', preview], ['deploy', deploy]]) {
      assert.ok(/jq 'del\(\.hosting\.predeploy\)' firebase\.json/.test(runsOf(job)), `"${name}" must strip hosting.predeploy from its workspace copy`);
      assert.ok(/test -f out\/index\.html/.test(runsOf(job)), `"${name}" must refuse to deploy an empty export`);
    }
  });

  it('deploy ships to the live channel with the existing secret', () => {
    const fb = usesStep(deploy, 'FirebaseExtended/action-hosting-deploy');
    assert.ok(fb, 'live deploy step missing');
    assert.equal(fb.with.channelId, 'live');
    assert.equal(fb.with.projectId, 'forgotten-mistory');
    assert.equal(fb.with.firebaseServiceAccount, '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}');
    assert.ok(!/secrets\.FIREBASE_TOKEN/.test(shipText), 'no invented secret names');
  });

  it('is idempotent for the hourly heartbeat: skips when live already serves HEAD', () => {
    const skip = deploy.steps.find((s) => s.id === 'skip');
    assert.ok(skip, 'the skip step must exist with id: skip');
    assert.ok(/build-commit/.test(skip.run));
    assert.ok(/skip=true/.test(skip.run) && /skip=false/.test(skip.run));
    const fb = usesStep(deploy, 'FirebaseExtended/action-hosting-deploy');
    assert.equal(fb.if, "steps.skip.outputs.skip != 'true'");
  });

  it('proves build-hash parity after deploying, from a downloaded file, twelve times ten seconds', () => {
    const parity = deploy.steps.find((s) => s.name === 'Build-hash parity');
    assert.ok(parity, 'parity step missing');
    const run = parity.run;
    assert.ok(/set -euo pipefail/.test(run));
    assert.ok(!/curl[^\n]*\|/.test(run), 'curl must not pipe into a parser (EPIPE / exit 23)');
    assert.ok(/curl -fsS --max-time 20 [^\n]*-o "\$tmp"/.test(run), 'curl writes the live page to a file');
    assert.ok(/tmp="?\$\(mktemp\)"?/.test(run));
    assert.ok(/grep -m1 -o 'name="build-commit" content="\[0-9a-f\]\*"' "\$tmp"/.test(run), 'reads the build-commit meta from the file');
    assert.ok(/for _ in \$\(seq 1 12\); do/.test(run));
    assert.ok(/sleep 10/.test(run));
    assert.ok(/\[\[ "\$expected" == "\$live"\* \]\]/.test(run), 'exact prefix match of HEAD against the live short sha');
    assert.ok(/exit 0/.test(run) && /exit 1/.test(run));
    assert.ok(!/\|\|\s*(true|:)\b/.test(run) && !/\bset \+e\b/.test(run), 'a real mismatch is never masked');
    // Order: deploy → parity → live smoke → rollback.
    const names = deploy.steps.map((s) => s.name || s.uses || '');
    const iDeploy = names.findIndex((n) => /action-hosting-deploy/.test(n) || n === 'Deploy to Firebase Hosting (live)');
    assert.ok(iDeploy < names.indexOf('Build-hash parity'));
    assert.ok(names.indexOf('Build-hash parity') < names.indexOf('Live smoke'));
    assert.ok(names.indexOf('Live smoke') < names.indexOf('Auto-rollback on failure'));
  });

  it('smokes production with the @smoke subset and rolls back with a revert on failure', () => {
    const smoke = deploy.steps.find((s) => s.name === 'Live smoke');
    assert.ok(/PLAYWRIGHT_BASE_URL="\$PROD_URL" npx playwright test --grep @smoke/.test(smoke.run));
    assert.equal(ship.env.PROD_URL, 'https://forgotten-mistory.web.app');
    const rollback = deploy.steps[deploy.steps.length - 1];
    assert.equal(rollback.name, 'Auto-rollback on failure');
    assert.match(String(rollback.if), /^failure\(\)/);
    assert.match(String(rollback.if), /steps\.skip\.outputs\.skip != 'true'/, 'a heartbeat that deployed nothing has nothing to revert');
    assert.ok(/git revert --no-edit HEAD/.test(rollback.run));
    assert.ok(/git push origin HEAD:main/.test(rollback.run));
    assert.ok(!/--force/.test(rollback.run) && !/push -f/.test(rollback.run), 'never force-push');
    assert.ok(/\^Revert /.test(rollback.run), 'a failing revert must not revert the revert (no rollback chain)');
  });
});

describe('Cloud Functions deploy only when functions/** changed', () => {
  const fn = ship.jobs.functions;

  it('runs only on pushes to main and is path-filtered inside the job', () => {
    assert.match(String(fn.if), /refs\/heads\/main/);
    assert.match(String(fn.if), /== 'push'/);
    const detect = fn.steps.find((s) => s.id === 'changed');
    assert.ok(detect, 'change detection step missing');
    assert.ok(/git diff --name-only [^\n]* -- functions firebase\.json/.test(detect.run));
    const deployStep = fn.steps.find((s) => s.name === 'Deploy functions');
    assert.equal(deployStep.if, "steps.changed.outputs.changed == 'true'");
    assert.ok(/deploy --only functions/.test(deployStep.run));
    assert.ok(!/echo[^\n]*FIREBASE_SERVICE_ACCOUNT/.test(shipText), 'the service account is never echoed');
  });
});

describe('nightly reports and never gates', () => {
  it('runs on a daily schedule and on demand, carries no deploy, and its jobs do not chain', () => {
    const on = triggersOf(nightly);
    assert.ok(Array.isArray(on.schedule) && on.schedule.length === 1);
    assert.ok('workflow_dispatch' in on);
    assert.equal(on.push, undefined, 'nightly must not run on push');
    assert.equal(on.pull_request, undefined, 'nightly must not run on pull requests');
    for (const [name, job] of Object.entries(nightly.jobs)) {
      assert.equal(job.needs, undefined, `nightly job "${name}" must not chain`);
      const optional = typeof job.if === 'string' && /vars\.E2E_RUNNER_LABELS/.test(job.if);
      if (optional) {
        assert.equal(job['continue-on-error'], true, `"${name}" is gated on a self-hosted runner and must carry continue-on-error: true`);
      } else {
        assert.ok(!('continue-on-error' in job), `nightly job "${name}" cannot fail, so it proves nothing`);
      }
    }
  });

  it('covers the full Playwright suite and npm audit, uploading hidden report directories', () => {
    assert.ok(/npx playwright test\s*$/m.test(nightlyText), 'the whole suite runs nightly, ungrepped');
    assert.ok(/npm audit --audit-level=high/.test(nightlyText));
    const upload = usesStep(nightly.jobs['e2e-full'], 'actions/upload-artifact');
    assert.ok(upload, 'playwright report upload missing');
    assert.equal(upload.with['include-hidden-files'], true);
  });
});

// ── Generated artifacts stay out of the tree ────────────────────────────────
// scripts/validate/overhaul_static_audit.mjs rewrites reports/static-audit.json on every
// run. Nothing reads the committed copy — tests/static_audit_fail.test.mjs runs the
// audit itself and then reads what that run wrote — so the file is a build artifact
// and belongs outside git.
describe('the generated static-audit report is a build artifact, not a tracked file', () => {
  const REPORT = 'reports/static-audit.json';
  const git = (...args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });

  it('is not tracked', () => {
    assert.notEqual(git('ls-files', '--error-unmatch', REPORT).status, 0, `${REPORT} is tracked`);
    assert.equal(git('ls-files', '--', REPORT).stdout.trim(), '', `git ls-files still lists ${REPORT}`);
  });

  it('is ignored, so running the audit never dirties the working tree', () => {
    assert.equal(git('check-ignore', '-q', '--no-index', REPORT).status, 0, `${REPORT} is not covered by .gitignore`);
    assert.ok(readFileSync(join(ROOT, '.gitignore'), 'utf8').includes(REPORT));
  });

  it('is still written by the audit, which creates reports/ first', () => {
    const audit = readFileSync(join(ROOT, 'scripts', 'validate', 'overhaul_static_audit.mjs'), 'utf8');
    const mkdir = audit.indexOf('mkdirSync(REPORT_DIR, { recursive: true })');
    const write = audit.indexOf("writeFileSync(join(REPORT_DIR, 'static-audit.json')");
    assert.ok(mkdir !== -1 && write !== -1 && mkdir < write);
  });

  it('is uploaded tolerantly if CI uploads it at all', () => {
    for (const [file, doc] of [['deploy.yml', ship], ['nightly.yml', nightly]]) {
      for (const [name, job] of Object.entries(doc.jobs)) {
        for (const step of job.steps ?? []) {
          if (!(step.uses || '').startsWith('actions/upload-artifact')) continue;
          if (!/\breports\b/.test(step.with?.path ?? '')) continue;
          assert.notEqual(step.with['if-no-files-found'], 'error', `${file} job "${name}" fails when reports/ is missing`);
        }
      }
    }
  });
});

// ── The GPU-class frame-rate confirmation (SIGNATURE-SCENES-v1 D7) ──────────
// The job is skipped unless the self-hosted labels are configured, can never
// fail the workflow, is capped at fifteen minutes, and nothing in any workflow
// waits on it — PR#4 once gated a deploy on the Owner's Mac and production went
// stale while it was off.
describe('the GPU-class scene frame-rate job is optional signal and can never gate a deploy (D7)', () => {
  const JOB = 'scene-fps-gpu';
  const job = nightly.jobs?.[JOB];

  it('exists in nightly.yml and is unknown to deploy.yml', () => {
    assert.ok(job, `nightly.yml must carry a "${JOB}" job`);
    assert.ok(!shipText.includes(JOB), `deploy.yml must never mention "${JOB}"`);
  });

  it('is skipped entirely unless the self-hosted runner labels are configured', () => {
    assert.equal(typeof job.if, 'string');
    assert.ok(/vars\.E2E_RUNNER_LABELS/.test(job.if));
    assert.ok(/!=\s*''/.test(job.if));
    assert.ok(/fromJSON\(\s*vars\.E2E_RUNNER_LABELS/.test(String(job['runs-on'])));
  });

  it('cannot fail the workflow and cannot sit in the queue indefinitely', () => {
    assert.equal(job['continue-on-error'], true);
    const cap = job['timeout-minutes'];
    assert.ok(Number.isInteger(cap) && cap > 0 && cap <= 15, `timeout-minutes must be a positive integer <= 15, got ${cap}`);
  });

  it('is in no needs: chain in either workflow', () => {
    for (const [file, doc] of [['nightly.yml', nightly], ['deploy.yml', ship]]) {
      for (const [name, other] of Object.entries(doc.jobs)) {
        const needs = other.needs === undefined ? [] : [].concat(other.needs);
        assert.ok(!needs.includes(JOB), `${file} job "${name}" waits on "${JOB}"`);
      }
    }
  });

  it('builds the export, serves it on a port it discovers, and runs the harness single-worker', () => {
    const steps = job.steps ?? [];
    const runs = runsOf(job);
    assert.ok(steps.some((s) => (s.uses || '').startsWith('actions/checkout')));
    const setup = usesStep(job, 'actions/setup-node');
    assert.equal(setup.with['node-version-file'], '.node-version');
    assert.equal(setup.with.cache, 'npm');
    assert.ok(/\bnpm ci\b/.test(runs));
    assert.ok(/npm run build:static/.test(runs));
    assert.ok(/scene-framerate\.spec\.ts/.test(runs));
    assert.ok(/--workers=1/.test(runs));
    assert.ok(/SCENE_FPS_ARTEFACT_DIR=/.test(runs));
    assert.ok(!/\b(5599|8080)\b/.test(runs), 'this job discovers a free port');
  });

  it('uploads the per-scene JSON on every outcome, and tolerates its absence', () => {
    const upload = usesStep(job, 'actions/upload-artifact');
    assert.equal(upload.if, 'always()');
    assert.equal(upload.with['if-no-files-found'], 'warn');
    assert.ok(/artifacts\/scene-fps/.test(upload.with.path));
  });
});
