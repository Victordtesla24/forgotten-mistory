/**
 * ci_pipeline.test.mjs — contract tests for the delivery pipeline (UX-C0-001).
 *
 * PR39 contract: build and authenticated shipment are required; optional audits
 * and test suites do not block preview, production, or rollback.
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
const shipText = readFileSync(join(WORKFLOWS, 'ship.yml'), 'utf8');
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
  it('has exactly two workflows: ship.yml and nightly', () => {
    const files = readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml')).sort();
    assert.deepEqual(files, ['nightly.yml', 'ship.yml']);
    assert.ok(!files.includes('deploy.yml'), 'legacy deploy.yml must remain absent/disabled; PRs use ship.yml');
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
    for (const [file, doc] of [['ship.yml', ship], ['nightly.yml', nightly]]) {
      for (const entry of triggersOf(doc).schedule ?? []) {
        assert.ok(!firesMoreThanHourly(entry.cron), `${file} cron "${entry.cron}" fires more than once an hour`);
      }
    }
  });

  it('never merges other branches into main on its own', () => {
    for (const [file, text] of [['ship.yml', shipText], ['nightly.yml', nightlyText]]) {
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

describe('the build job is the required shipment dependency', () => {
  const gates = ship.jobs.gates;

  it('exists and every deploying job needs it', () => {
    assert.ok(gates, 'ship.yml must carry a "gates" job');
    for (const name of ['preview', 'deploy', 'functions']) {
      const job = ship.jobs[name];
      assert.ok(job, `ship.yml must carry a "${name}" job`);
      assert.ok([].concat(job.needs ?? []).includes('gates'), `"${name}" must need "gates"`);
    }
  });

  it('installs and builds without optional shipment gates (PR39)', () => {
    const runs = runsOf(gates);
    assert.match(runs, /npm ci/);
    assert.match(runs, /npm run build:static/);
    assert.ok(runs.indexOf('npm ci') < runs.indexOf('npm run build:static'));
    for (const job of Object.values(ship.jobs)) {
      assert.doesNotMatch(runsOf(job), /tsc --noEmit|npm run lint|node --test|playwright|@lhci|overhaul_static_audit|test -d .*node_modules/);
    }
    assert.doesNotMatch(runs, /npm ci --prefix functions/);
    assert.match(runsOf(ship.jobs.functions), /npm ci --prefix functions/);
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

  it('writes and verifies an artifact identity manifest before any preview or live deploy', () => {
    const gateRuns = runsOf(gates);
    assert.ok(/out\/\.artifact-identity\.json/.test(gateRuns), 'gates must write an artifact identity manifest inside out/');
    assert.ok(/GITHUB_SHA/.test(gateRuns), 'artifact identity must include the workflow commit');
    for (const name of ['preview', 'deploy']) {
      const runs = runsOf(ship.jobs[name]);
      assert.ok(/out\/\.artifact-identity\.json/.test(runs), `${name} must inspect the downloaded artifact identity`);
      assert.ok(/GITHUB_SHA/.test(runs), `${name} must compare artifact identity to this run's commit`);
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



describe('every run: block is shell-safe', () => {
  it('bash -n parses every extracted step after replacing GitHub expressions', () => {
    for (const [file, doc] of [['ship.yml', ship], ['nightly.yml', nightly]]) {
      for (const [jobName, job] of Object.entries(doc.jobs)) {
        for (const step of job.steps ?? []) {
          if (!step.run) continue;
          const shell = step.run.replace(/\$\{\{[^}]+\}\}/g, 'GITHUB_EXPR');
          const r = spawnSync('bash', ['-n'], { input: shell, encoding: 'utf8' });
          assert.equal(r.status, 0, `${file}/${jobName}: ${step.name || step.id || 'run'}: ${r.stderr}`);
        }
      }
    }
  });

  it('never wraps node template-literal identity checks in double quotes', () => {
    const forbidden = /node\s+-e\s+"[^"]*`[^`]*\$\{[^}]+\}[^`]*`/s;
    assert.ok(!forbidden.test(shipText), "use a single-quoted heredoc (`node - <<'NODE'`) for template literals");
    assert.ok(!forbidden.test(nightlyText));
    for (const name of ['preview', 'deploy']) {
      const runs = runsOf(ship.jobs[name]);
      assert.ok(/node - <<'NODE'\n\s*const id = require\('\.\/out\/\.artifact-identity\.json'\);/.test(runs), `${name} must use a quoted heredoc identity check`);
    }
  });
});

describe('preview and deploy ship the gated export', () => {
  const preview = ship.jobs.preview;
  const deploy = ship.jobs.deploy;

  it('preview runs only for same-repository pull requests and deploys a short-lived channel', () => {
    assert.match(String(preview.if), /pull_request/);
    const fb = usesStep(preview, 'FirebaseExtended/action-hosting-deploy');
    assert.ok(fb, 'preview must deploy a Firebase preview channel');
    assert.ok(fb.id, 'preview deploy step needs an id so its URL output can be smoked');
    assert.equal(fb.with.projectId, 'forgotten-mistory');
    assert.equal(fb.with.firebaseServiceAccount, '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}');
    assert.equal(fb.with.repoToken, '${{ secrets.GITHUB_TOKEN }}');
    assert.equal(fb.with.channelId, undefined, 'preview must never target the live channel');
    assert.match(String(fb.with.expires), /^\d+d$/);
    assert.match(String(preview.if), /head.repo.full_name == github.repository/);
  });

  it('deploy runs only on main and never for a pull request', () => {
    assert.match(String(deploy.if), /refs\/heads\/main/);
    assert.match(String(deploy.if), /!= 'pull_request'/);
    assert.equal(deploy.environment, 'production');
    assert.ok(Number(deploy['timeout-minutes']) >= 60, 'deploy timeout must cover bounded rollback gates');
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
    assert.ok(names.indexOf('Build-hash parity') < names.indexOf('Auto-rollback on failure'));
  });

  it('rolls back with an installed, rebuilt export and verifies parity on failure', () => {
    assert.equal(ship.env.PROD_URL, 'https://forgotten-mistory.web.app');
    const rollback = deploy.steps[deploy.steps.length - 1];
    assert.equal(rollback.name, 'Auto-rollback on failure');
    assert.match(String(rollback.if), /^failure\(\)/);
    assert.match(String(rollback.if), /steps\.skip\.outputs\.skip != 'true'/, 'a heartbeat that deployed nothing has nothing to revert');
    assert.ok(/git checkout -- firebase\.json/.test(rollback.run), 'rollback must restore only firebase.json before git revert');
    assert.ok(rollback.run.indexOf('git checkout -- firebase.json') < rollback.run.indexOf('git revert --no-edit HEAD'));
    assert.ok(/git fetch origin main/.test(rollback.run), 'rollback must fetch origin/main before reverting');
    assert.ok(/remote_head="\$\(git rev-parse origin\/main\)"/.test(rollback.run));
    assert.ok(/\[ "\$remote_head" != "\$GITHUB_SHA" \]/.test(rollback.run), 'rollback must refuse to revert a stale commit');
    assert.ok(/git revert --no-edit HEAD/.test(rollback.run));
    assert.ok(/git push origin HEAD:main/.test(rollback.run));
    assert.ok(/npm ci\n/.test(rollback.run), 'rollback must install app dependencies before validating the reverted source');
    assert.ok(/npm run build:static/.test(rollback.run), 'rollback must rebuild the reverted commit in this same run');
    assert.ok(/firebase-tools@13 deploy --only hosting/.test(rollback.run), 'rollback must redeploy in this same run, not rely on a GITHUB_TOKEN push event');
    assert.ok(/parity_ok=false/.test(rollback.run) && /parity_ok=true/.test(rollback.run) && /\[ "\$parity_ok" = true \]/.test(rollback.run), 'rollback parity must be an explicit hard assertion after bounded polling');
    assert.ok(/trap 'rm -f "\$cred_file" "\$tmp"' EXIT/.test(rollback.run), 'rollback credential cleanup must be trapped on every outcome');
    assert.ok(/FIREBASE_SERVICE_ACCOUNT/.test(JSON.stringify(rollback)), 'rollback deploy must use the existing Firebase secret only');
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
    for (const [file, doc] of [['ship.yml', ship], ['nightly.yml', nightly]]) {
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

  it('exists in nightly.yml and is unknown to ship.yml', () => {
    assert.ok(job, `nightly.yml must carry a "${JOB}" job`);
    assert.ok(!shipText.includes(JOB), `ship.yml must never mention "${JOB}"`);
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
    for (const [file, doc] of [['nightly.yml', nightly], ['ship.yml', ship]]) {
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
