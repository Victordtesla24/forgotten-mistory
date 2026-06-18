// fm/commands.mjs — command implementations for fmctl.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import * as ui from './ui.mjs';
import * as core from './core.mjs';

const { C, sym } = ui;

const SERVER_NAME = 'dev';

// ── helpers ──────────────────────────────────────────────────────────────────
function nextBin(root) {
  const b = path.join(root, 'node_modules', '.bin', 'next');
  return fs.existsSync(b) ? b : null;
}

function urlFor(port) {
  return `http://localhost:${port}/`;
}

async function probeManaged(srv) {
  const alive = core.isAlive(srv.pid);
  const health = alive ? await core.httpProbe(urlFor(srv.port), { timeout: 2500 }) : { ok: false };
  const info = alive ? await core.pidInfo(srv.pid) : null;
  return { ...srv, alive, health, info };
}

// ── start ────────────────────────────────────────────────────────────────────
export async function start(opts = {}) {
  const root = core.repoRoot();
  const port = opts.port || core.devPort(root);
  console.log(ui.banner(`starting dev server on :${port}`));

  // Already managed & healthy?
  const reg = core.readRegistry(root);
  if (reg[SERVER_NAME] && core.isAlive(reg[SERVER_NAME].pid)) {
    const probe = await core.httpProbe(urlFor(reg[SERVER_NAME].port), { timeout: 2000 });
    if (probe.ok) {
      console.log(`${C.good(sym.ok)} dev server already running — ${C.accent(urlFor(reg[SERVER_NAME].port))} ${C.faint(`(pid ${reg[SERVER_NAME].pid})`)}`);
      console.log(C.faint('  use `fmctl restart` to recycle it.'));
      return 0;
    }
  }

  // Pre-flight: free the port of any stray listeners (the zombie-server fix).
  const pre = new ui.Spinner(`pre-flight: checking port ${port}`).start();
  const strays = await core.listenersOnPort(port);
  if (strays.length) {
    pre.update(`freeing port ${port} held by ${strays.map((s) => `${s.command}/${s.pid}`).join(', ')}`);
    await core.freePort(port);
    pre.warn(`freed port ${port} (${strays.length} stray listener${strays.length > 1 ? 's' : ''} cleared)`);
  } else {
    pre.succeed(`port ${port} is free`);
  }

  // Clean .next to avoid stale-cache corruption (matches `npm run dev`).
  if (opts.fresh !== false) {
    try {
      fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }

  // Fail loud if there is no way to launch Next (CLAUDE.md rule 6 — never a
  // silent degradation): need either node_modules/.bin/next or npx on PATH.
  const bin = nextBin(root);
  if (!bin && !(await core.which('npx'))) {
    console.log(`${C.poor(sym.fail)} cannot launch dev server: neither node_modules/.bin/next nor npx is available — run \`npm ci\`.`);
    return 1;
  }
  const cmd = bin || 'npx';
  const args = bin ? ['dev', '-p', String(port)] : ['next', 'dev', '-p', String(port)];

  const logFile = core.logFileFor(SERVER_NAME, root);
  fs.writeFileSync(logFile, `# fmctl dev log — started ${core.nowStamp()} on :${port}\n`);
  const out = fs.openSync(logFile, 'a');

  let child;
  try {
    child = spawn(cmd, args, {
      cwd: root,
      env: { ...process.env, NODE_ENV: 'development', FORCE_COLOR: '1' },
      detached: true,
      stdio: ['ignore', out, out],
    });
  } catch (e) {
    fs.closeSync(out); // don't leak the log fd on a synchronous spawn throw
    console.log(`${C.poor(sym.fail)} could not start dev server: ${e.message}`);
    return 1;
  }

  // An async spawn 'error' (e.g. ENOENT) bypasses try/catch — capture it so we
  // clean up the fd + registry instead of crashing with an unhandled error.
  let spawnErr = null;
  child.on('error', (e) => {
    spawnErr = e;
  });
  child.unref();
  await core.sleep(150); // give ENOENT a tick to surface before we register

  if (spawnErr) {
    try {
      fs.closeSync(out);
    } catch {
      /* already closed */
    }
    console.log(`${C.poor(sym.fail)} dev server failed to launch (${spawnErr.code || spawnErr.message}).`);
    return 1;
  }

  core.registerServer(
    SERVER_NAME,
    { pid: child.pid, port, logFile, startedAt: Date.now(), cmd: `${cmd} ${args.join(' ')}` },
    root,
  );

  const spin = new ui.Spinner(`booting Next.js dev server (pid ${child.pid})`).start();
  const ready = await core.waitForHttp(urlFor(port), { timeout: 90000, interval: 500 });
  if (ready.ok) {
    spin.succeed(`dev server ready — ${C.accent(urlFor(port))} ${C.faint(`(${ready.ms}ms, pid ${child.pid})`)}`);
    console.log(
      ui.box(
        [
          `${C.grey('url    ')} ${C.accent(urlFor(port))}`,
          `${C.grey('pid    ')} ${child.pid}`,
          `${C.grey('logs   ')} ${C.faint(path.relative(root, logFile))}`,
          `${C.grey('stop   ')} ${C.faint('fmctl stop')}`,
        ],
        { title: 'dev server', pad: 1 },
      ),
    );
    return 0;
  }
  spin.fail(`server did not become healthy within 90s — check ${path.relative(root, logFile)}`);
  printLogTail(logFile, 15);
  return 1;
}

// ── stop ─────────────────────────────────────────────────────────────────────
export async function stop(opts = {}) {
  const root = core.repoRoot();
  const reg = core.readRegistry(root);
  const srv = reg[SERVER_NAME];
  const port = opts.port || (srv && srv.port) || core.devPort(root);

  const spin = new ui.Spinner('stopping dev server').start();
  let killedAny = false;

  if (srv && srv.pid) {
    // Detached server is its own process-group leader → kill the whole group.
    try {
      process.kill(-srv.pid, 'SIGTERM');
      killedAny = true;
    } catch {
      /* may already be gone */
    }
    // Count the single-pid kill too, so a successful kill isn't reported as
    // "nothing was running" when the process wasn't a group leader (pid reuse).
    if (await core.killPid(srv.pid)) killedAny = true;
  }
  // Sweep anything still bound to the port (the next-server child).
  const freed = await core.freePort(port);
  if (freed.length) killedAny = true;
  core.unregisterServer(SERVER_NAME, root);

  if (killedAny) spin.succeed(`stopped dev server on :${port}`);
  else spin.info('no managed dev server was running');
  return 0;
}

// ── restart ──────────────────────────────────────────────────────────────────
export async function restart(opts = {}) {
  await stop(opts);
  await core.sleep(400);
  return start(opts);
}

// ── status ───────────────────────────────────────────────────────────────────
export async function status(opts = {}) {
  const root = core.repoRoot();
  const managed = await Promise.all(core.listServers(root).map(probeManaged));
  const strays = await core.allNodeServers();
  const managedPids = new Set(managed.map((m) => m.pid));
  const orphans = strays.filter((s) => !core.isManagedProc(s, managedPids));
  const git = await core.gitInfo(root);
  const prod = await core.httpProbe(core.PROD_URL, { timeout: 5000 });

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          servers: managed.map((m) => ({
            name: m.name,
            pid: m.pid,
            port: m.port,
            alive: m.alive,
            healthy: !!m.health.ok,
            uptimeMs: m.startedAt ? Date.now() - m.startedAt : null,
          })),
          orphans: orphans.map((o) => ({ pid: o.pid, port: o.port })),
          git: { branch: git.branch, dirty: git.dirtyCount, ahead: git.ahead, behind: git.behind, lastCommit: git.lastCommit },
          prod: { url: core.PROD_URL, ok: prod.ok, status: prod.status ?? null, ms: prod.ms ?? null },
        },
        null,
        2,
      ),
    );
    return 0;
  }

  console.log(ui.banner('status'));

  // Managed servers
  if (managed.length) {
    const rows = managed.map((m) => [
      m.name,
      m.alive ? C.good('running') : C.poor('dead'),
      String(m.port),
      String(m.pid),
      m.startedAt ? core.fmtDuration(Date.now() - m.startedAt) : '—',
      m.health.ok ? C.good(`${sym.ok} ${m.health.status}`) : C.poor(`${sym.fail} down`),
      m.info?.rssKb ? core.fmtBytes(m.info.rssKb * 1024) : '—',
    ]);
    console.log(
      ui.box(
        ui.table(['name', 'state', 'port', 'pid', 'uptime', 'health', 'mem'], rows, { align: [, , 'right', 'right', 'right', , 'right'] }).split('\n'),
        { title: 'managed servers', pad: 1 },
      ),
    );
  } else {
    console.log(ui.box([C.faint('no managed dev server — run `fmctl start`')], { title: 'managed servers', pad: 1 }));
  }

  if (orphans.length) {
    console.log(
      ui.box(
        [
          C.avg(`${sym.warn} ${orphans.length} unmanaged Next process${orphans.length > 1 ? 'es' : ''} detected:`),
          ...orphans.map((o) => C.faint(`  pid ${o.pid}${o.port ? ` :${o.port}` : ''}  ${ui.truncate(o.command, 64)}`)),
          C.faint('  run `fmctl doctor` to clean these up.'),
        ],
        { title: 'strays', pad: 1 },
      ),
    );
  }

  // Git + prod
  const aheadBehind = git.hasUpstream ? `↑${git.ahead} ↓${git.behind}` : C.faint('no upstream');
  console.log(
    ui.box(
      [
        `${C.grey('branch ')} ${C.white(git.branch)}   ${C.grey('changes')} ${git.dirtyCount ? C.avg(git.dirtyCount + ' files') : C.good('clean')}   ${aheadBehind}`,
        `${C.grey('commit ')} ${C.faint(git.lastCommit)}`,
        `${C.grey('prod   ')} ${prod.ok ? C.good(`${sym.ok} ${prod.status}`) : C.poor(`${sym.fail} ${prod.error || prod.status}`)}  ${C.faint(core.PROD_URL)}  ${prod.ms ? C.faint(prod.ms + 'ms') : ''}`,
      ],
      { title: 'repo & production', pad: 1 },
    ),
  );
  return 0;
}

// ── doctor ───────────────────────────────────────────────────────────────────
export async function doctor(opts = {}) {
  const root = core.repoRoot();
  console.log(ui.banner('doctor — environment diagnostics'));

  const checks = [];
  const add = (label, ok, detail) => checks.push({ label, ok, detail });

  // Node
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  add('node runtime', nodeMajor >= 18, `v${process.versions.node}`);

  // CLI tools — including the base utilities the port/stray logic depends on.
  for (const tool of ['gh', 'firebase', 'git', 'npx', 'lsof', 'ps']) {
    const p = await core.which(tool);
    add(`cli: ${tool}`, !!p, p ? C.faint(p) : 'missing');
  }

  // gh auth
  const ghAuth = await core.run('gh', ['auth', 'status']);
  add('github auth', ghAuth.code === 0, ghAuth.code === 0 ? 'logged in' : 'run `gh auth login`');

  // firebase auth
  const fbList = await core.run('firebase', ['projects:list', '--json']);
  add('firebase auth', fbList.code === 0, fbList.code === 0 ? 'authenticated' : 'run `firebase login`');

  // env keys
  const env = core.loadEnvKeys(root);
  const needed = ['GEMINI_API_KEY'];
  const presentNeeded = needed.filter((k) => env.keys.includes(k));
  add('env keys', presentNeeded.length === needed.length, env.file ? `${env.file}: ${env.keys.length} keys (${presentNeeded.length}/${needed.length} required)` : 'no env file');

  // node_modules
  add('dependencies', fs.existsSync(path.join(root, 'node_modules')), fs.existsSync(path.join(root, 'node_modules', '.bin', 'next')) ? 'next installed' : 'run `npm ci`');

  // Port + strays
  const port = core.devPort(root);
  const listeners = await core.listenersOnPort(port);
  const managedPids = new Set(core.listServers(root).map((s) => s.pid));
  const listenersWithPgid = await Promise.all(
    listeners.map(async (l) => ({ ...l, pgid: await core.pgidOf(l.pid) })),
  );
  const strayListeners = listenersWithPgid.filter((l) => !core.isManagedProc(l, managedPids));
  const allStrays = (await core.allNodeServers()).filter((s) => !core.isManagedProc(s, managedPids));
  add(`dev port :${port}`, strayListeners.length === 0, strayListeners.length ? `held by ${strayListeners.map((l) => l.command + '/' + l.pid).join(', ')}` : 'free');
  add('stray next processes', allStrays.length === 0, allStrays.length ? `${allStrays.length} found` : 'none');

  // Render
  const lines = checks.map((c) => {
    const g = c.ok ? C.good(sym.ok) : C.poor(sym.fail);
    return `${g} ${ui.pad(c.label, 22)} ${c.ok ? C.faint(c.detail) : C.avg(c.detail)}`;
  });
  console.log(ui.box(lines, { title: 'diagnostics', pad: 1 }));

  const failed = checks.filter((c) => !c.ok);
  if (allStrays.length) {
    // Cleanup is destructive (kills processes machine-wide). Only auto-proceed
    // with an explicit --yes; in a non-interactive shell never kill silently.
    const interactive = ui.isTTY && process.stdin.isTTY;
    const doClean = opts.yes || (interactive && (await ui.confirm(`Clean up ${allStrays.length} stray Next process(es)?`, true)));
    if (!doClean && !interactive) {
      console.log(C.faint(`\n  ${allStrays.length} stray process(es) left running — re-run \`fmctl doctor --yes\` to clean.`));
    }
    if (doClean) {
      const spin = new ui.Spinner('cleaning stray processes').start();
      let n = 0;
      for (const s of allStrays) {
        if (await core.killPid(s.pid)) n++;
      }
      spin.succeed(`cleaned ${n} stray process${n === 1 ? '' : 'es'}`);
    }
  }

  if (failed.length === 0) console.log(`\n${C.good(sym.ok)} all checks passed — environment is healthy.`);
  else console.log(`\n${C.avg(sym.warn)} ${failed.length} check${failed.length === 1 ? '' : 's'} need attention.`);
  return failed.length === 0 ? 0 : 1;
}

// ── logs ─────────────────────────────────────────────────────────────────────
function printLogTail(logFile, n = 30) {
  try {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n');
    console.log(C.faint('  ── last log lines ──'));
    for (const l of lines.slice(-n)) console.log('  ' + C.faint(l));
  } catch {
    console.log(C.faint('  (no log file yet)'));
  }
}

export async function logs(opts = {}) {
  const root = core.repoRoot();
  const logFile = core.logFileFor(SERVER_NAME, root);
  if (!fs.existsSync(logFile)) {
    console.log(C.faint('no dev log yet — start the server with `fmctl start`.'));
    return 0;
  }
  if (opts.follow) {
    console.log(C.bold(`tailing ${path.relative(root, logFile)} ${C.faint('(Ctrl-C to stop)')}`));
    await core.spawnStream('tail', ['-n', '40', '-f', logFile], { cwd: root }, (line) => console.log(C.faint(line)));
    return 0;
  }
  printLogTail(logFile, opts.lines || 60);
  return 0;
}

// ── git: commit & push ───────────────────────────────────────────────────────
const COAUTHOR = 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>';

export async function push(opts = {}) {
  const root = core.repoRoot();
  console.log(ui.banner('commit & push'));
  const git = await core.gitInfo(root);

  if (git.dirtyCount === 0 && git.ahead === 0) {
    console.log(`${C.good(sym.ok)} working tree clean and nothing to push (branch ${C.white(git.branch)}).`);
    return 0;
  }

  if (git.dirtyCount > 0) {
    console.log(ui.box(git.dirty.slice(0, 30).map((l) => C.faint(l)), { title: `${git.dirtyCount} changed files`, pad: 1 }));
  }

  const target = opts.toMain ? 'main' : git.branch;
  const interactive = ui.isTTY && process.stdin.isTTY;

  // Pushing is an outward, side-effecting action. Never do it silently in a
  // non-interactive shell without an explicit --yes.
  if (!opts.yes && !interactive) {
    console.log(C.avg(`${sym.warn} refusing to commit & push non-interactively without --yes.`));
    console.log(C.faint('  re-run: fmctl push -y -m "message" [--main]'));
    return 1;
  }

  const message = opts.message || (await ui.prompt('commit message', { default: `chore: update via fmctl (${core.nowStamp()})` }));

  if (!opts.yes) {
    const ok = await ui.confirm(`Commit ${git.dirtyCount} change(s) and push to ${C.white(target)}?`, true);
    if (!ok) {
      console.log(C.faint('aborted.'));
      return 1;
    }
  }

  const steps = new ui.Steps(['stage changes', 'commit', `push → ${target}`]).start();
  if (git.dirtyCount > 0) {
    const addR = await core.run('git', ['add', '-A'], { cwd: root });
    if (addR.code !== 0) { steps.set(0, 'failed', addR.stderr.trim()); steps.done(); return 1; }
    steps.set(0, 'done');
    const body = `${message}\n\n${COAUTHOR}`;
    const commitR = await core.run('git', ['commit', '-m', body], { cwd: root });
    if (commitR.code !== 0) {
      steps.set(1, 'failed', commitR.stdout.trim() || commitR.stderr.trim());
      steps.done();
      return 1;
    }
    steps.set(1, 'done', /(\b[0-9a-f]{7,}\b)/.exec(commitR.stdout)?.[1] || '');
  } else {
    steps.set(0, 'skipped', 'nothing to stage');
    steps.set(1, 'skipped', 'no new commit');
  }

  const pushArgs = opts.toMain ? ['push', 'origin', 'HEAD:main'] : ['push', '-u', 'origin', git.branch];
  const pushR = await core.run('git', pushArgs, { cwd: root });
  if (pushR.code !== 0) {
    steps.set(2, 'failed', pushR.stderr.trim().split('\n').pop());
    steps.done();
    console.log(C.poor('\npush failed:\n') + C.faint(pushR.stderr));
    return 1;
  }
  steps.set(2, 'done');
  steps.done();
  console.log(`\n${C.good(sym.ok)} pushed to ${C.white(target)}.`);
  return 0;
}

// ── CI (GitHub Actions via gh) ───────────────────────────────────────────────
export async function ci(opts = {}) {
  const root = core.repoRoot();
  const sub = opts._[0] || 'status';
  const workflow = 'deploy.yml';

  if (sub === 'run') {
    console.log(ui.banner('trigger CI'));
    const git = await core.gitInfo(root);
    const ref = opts.ref || git.branch;
    const spin = new ui.Spinner(`dispatching ${workflow} on ${ref}`).start();
    const r = await core.run('gh', ['workflow', 'run', workflow, '--ref', ref], { cwd: root });
    if (r.code !== 0) {
      spin.fail(`dispatch failed: ${r.stderr.trim().split('\n')[0]}`);
      console.log(C.faint('  (the workflow must declare `on: workflow_dispatch` and the ref must exist on origin)'));
      return 1;
    }
    spin.succeed('workflow dispatched');
    await core.sleep(3000);
    return ciWatchLatest(root, opts);
  }

  if (sub === 'watch') return ciWatchLatest(root, opts);

  // default: status list
  console.log(ui.banner('CI runs'));
  const r = await core.run('gh', ['run', 'list', '--limit', String(opts.limit || 8), '--json', 'databaseId,status,conclusion,name,headBranch,event,createdAt,displayTitle'], { cwd: root });
  if (r.code !== 0) {
    console.log(C.poor('gh run list failed: ') + C.faint(r.stderr.trim()));
    return 1;
  }
  let runs;
  try {
    runs = JSON.parse(r.stdout);
  } catch {
    console.log(C.faint('no runs / unparseable output'));
    return 1;
  }
  if (!runs.length) {
    console.log(C.faint('no workflow runs found.'));
    return 0;
  }
  const rows = runs.map((run) => [
    String(run.databaseId),
    statusGlyph(run.status, run.conclusion),
    ui.truncate(run.displayTitle || run.name, 36),
    run.headBranch,
    run.event,
    core.fmtDuration(Date.now() - new Date(run.createdAt).getTime()) + ' ago',
  ]);
  console.log(ui.box(ui.table(['id', 'state', 'title', 'branch', 'event', 'when'], rows).split('\n'), { title: 'recent runs', pad: 1 }));
  return 0;
}

function statusGlyph(status, conclusion) {
  if (status !== 'completed') return C.accent(`${sym.dot} ${status}`);
  if (conclusion === 'success') return C.good(`${sym.ok} success`);
  if (conclusion === 'failure') return C.poor(`${sym.fail} failure`);
  return C.avg(`${sym.warn} ${conclusion}`);
}

async function ciWatchLatest(root, opts) {
  const r = await core.run('gh', ['run', 'list', '--limit', '1', '--json', 'databaseId'], { cwd: root });
  let id;
  try {
    id = JSON.parse(r.stdout)[0]?.databaseId;
  } catch {
    /* ignore */
  }
  if (!id) {
    console.log(C.faint('no run to watch.'));
    return 1;
  }
  console.log(`${C.accent(sym.arrow)} watching run ${C.white(String(id))} ${C.faint('(Ctrl-C to detach)')}`);
  await core.spawnStream('gh', ['run', 'watch', String(id), '--exit-status'], { cwd: root }, (line) => {
    if (line.trim()) console.log('  ' + line);
  });
  return 0;
}

// ── Firebase deploy ──────────────────────────────────────────────────────────
export async function deploy(opts = {}) {
  const root = core.repoRoot();
  console.log(ui.banner('firebase deploy → production'));

  // Pre-flight: fail fast (and clearly) before prompting or building.
  if (!(await core.which('firebase'))) {
    console.log(`${C.poor(sym.fail)} firebase CLI not found — install it: \`npm i -g firebase-tools\`.`);
    return 1;
  }
  const auth = await core.run('firebase', ['projects:list', '--json']);
  if (auth.code !== 0) {
    console.log(`${C.poor(sym.fail)} firebase is not authenticated — run \`firebase login\`.`);
    return 1;
  }

  if (!opts.yes) {
    const ok = await ui.confirm(`Build static export and deploy to ${C.white(core.PROD_URL)}?`, false);
    if (!ok) {
      console.log(C.faint('deploy cancelled.'));
      return 1;
    }
  }

  const steps = new ui.Steps(['build static export (predeploy)', 'upload to Firebase Hosting', 'release', 'verify production']).start();
  let phase = 0;
  const r = await core.spawnStream(
    'firebase',
    ['deploy', '--only', 'hosting', '--project', 'forgotten-mistory'],
    { cwd: root, env: { FORCE_COLOR: '0' } },
    (line) => {
      const l = ui.stripAnsi(line);
      if (/Running command|build:static|Creating an optimized|Compiled|Route \(app\)/.test(l) && phase === 0) {
        steps.set(0, 'running');
      }
      if (/file[s]? for upload|Uploading|hashing/i.test(l)) {
        if (phase < 1) { steps.set(0, 'done'); phase = 1; }
        steps.set(1, 'running');
      }
      if (/Version finalized|finalizing version|releasing|release complete/i.test(l)) {
        if (phase < 2) { steps.set(1, 'done'); phase = 2; }
        steps.set(2, 'running');
      }
      if (/Deploy complete|Hosting URL/i.test(l)) {
        steps.set(0, 'done');
        steps.set(1, 'done');
        steps.set(2, 'done');
        phase = 3;
      }
    },
  );

  if (r.code !== 0) {
    if (phase <= 0) steps.set(0, 'failed');
    else steps.set(phase, 'failed');
    steps.done();
    const why = r.error ? `: ${r.error.code || r.error.message}` : '';
    console.log(C.poor(`\ndeploy failed (exit ${r.code})${why}. Re-run with verbose firebase output to inspect.`));
    return 1;
  }
  // firebase exited 0 — reconcile ALL build/upload/release steps (some firebase
  // output formats don't emit every phrase the stream watcher keys on).
  steps.set(0, 'done');
  steps.set(1, 'done');
  steps.set(2, 'done');

  // Verify
  steps.set(3, 'running');
  const probe = await core.waitForHttp(core.PROD_URL, { timeout: 30000, interval: 1500 });
  if (probe.ok) {
    steps.set(3, 'done', `${probe.status} · ${probe.ms}ms`);
    steps.done();
    console.log(`\n${C.good(sym.ok)} deployed & verified — ${C.accent(core.PROD_URL)} ${C.faint(`(${probe.status}, ${probe.ms}ms)`)}`);
    return 0;
  }
  steps.set(3, 'failed', probe.error || 'unreachable');
  steps.done();
  console.log(C.avg(`\n${sym.warn} deploy finished but production did not return 200 yet — re-check shortly.`));
  return 1;
}

// ── Metrics (Lighthouse + live probes, rendered as terminal graphics) ─────────
function readLighthouseRuns(root) {
  const dir = path.join(root, '.lighthouseci');
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^lhr-.*\.json$/.test(f))
    .map((f) => path.join(dir, f));
  const runs = [];
  for (const file of files) {
    try {
      const d = JSON.parse(fs.readFileSync(file, 'utf8'));
      // Skip structurally-incomplete reports (e.g. Lighthouse runtimeError runs)
      // rather than silently surfacing them as zeroed scores.
      if (!d.categories || !d.audits) {
        core.warn(`skipping incomplete Lighthouse report ${path.basename(file)} (no categories/audits)`);
        continue;
      }
      const cat = d.categories || {};
      const a = d.audits || {};
      const num = (id) => a[id]?.numericValue ?? null;
      const disp = (id) => a[id]?.displayValue ?? '—';
      runs.push({
        file,
        time: d.fetchTime ? new Date(d.fetchTime).getTime() : 0,
        url: d.finalUrl || d.requestedUrl || '',
        perf: Math.round((cat.performance?.score ?? 0) * 100),
        a11y: Math.round((cat.accessibility?.score ?? 0) * 100),
        bp: Math.round((cat['best-practices']?.score ?? 0) * 100),
        seo: Math.round((cat.seo?.score ?? 0) * 100),
        lcp: { v: num('largest-contentful-paint'), d: disp('largest-contentful-paint') },
        fcp: { v: num('first-contentful-paint'), d: disp('first-contentful-paint') },
        si: { v: num('speed-index'), d: disp('speed-index') },
        cls: { v: num('cumulative-layout-shift'), d: disp('cumulative-layout-shift') },
        tbt: { v: num('total-blocking-time'), d: disp('total-blocking-time') },
        tti: { v: num('interactive'), d: disp('interactive') },
      });
    } catch {
      /* skip bad file */
    }
  }
  return runs.sort((x, y) => x.time - y.time);
}

function bundleSizes(root) {
  const base = path.join(root, 'out', '_next', 'static');
  if (!fs.existsSync(base)) return [];
  const acc = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|css)$/.test(e.name)) {
        const top = path.relative(base, p).split(path.sep)[0];
        acc[top] = (acc[top] || 0) + fs.statSync(p).size;
      }
    }
  };
  try {
    walk(base);
  } catch {
    /* ignore */
  }
  return Object.entries(acc)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export async function metrics(opts = {}) {
  const root = core.repoRoot();
  console.log(ui.banner('website metrics'));

  if (opts.run) {
    await runLighthouse(root, opts);
  }

  const runs = readLighthouseRuns(root);
  const latest = runs[runs.length - 1];

  if (latest) {
    const colorFn = (cls) => ({ good: C.good, avg: C.avg, poor: C.poor }[cls]);
    console.log(
      ui.box(
        [
          ui.gauge('performance ', latest.perf, { width: 30, labelWidth: 14 }),
          ui.gauge('accessibility', latest.a11y, { width: 30, labelWidth: 14 }),
          ui.gauge('best-practice', latest.bp, { width: 30, labelWidth: 14 }),
          ui.gauge('seo         ', latest.seo, { width: 30, labelWidth: 14 }),
        ],
        { title: `lighthouse scores  ${C.faint(ui.truncate(latest.url, 40))}`, pad: 1 },
      ),
    );

    // Core Web Vitals table with thresholds
    const vital = (name, m, goodMax, unit = 'ms') => {
      if (m.v == null) return [name, '—', C.faint('n/a')];
      const ok = m.v <= goodMax;
      return [name, m.d, ok ? C.good(`${sym.ok} good`) : C.avg(`${sym.warn} > ${goodMax}${unit}`)];
    };
    const vitals = [
      vital('LCP (largest contentful paint)', latest.lcp, 2500),
      vital('FCP (first contentful paint)', latest.fcp, 1800),
      vital('Speed Index', latest.si, 3400),
      vital('TBT (total blocking time)', latest.tbt, 200),
      vital('CLS (cumulative layout shift)', { v: latest.cls.v, d: latest.cls.d }, 0.1, ''),
    ];
    console.log(ui.box(ui.table(['metric', 'value', 'verdict'], vitals).split('\n'), { title: 'core web vitals', pad: 1 }));

    // Trend sparklines across historical runs
    if (runs.length > 1) {
      const perfSeries = runs.map((r) => r.perf);
      const lcpSeries = runs.map((r) => r.lcp.v ?? 0);
      console.log(
        ui.box(
          [
            `${C.grey('perf  ')} ${ui.sparkline(perfSeries)}  ${C.faint(`${perfSeries[0]}→${perfSeries[perfSeries.length - 1]}`)}`,
            `${C.grey('LCP   ')} ${ui.sparkline(lcpSeries.map((v) => -v))}  ${C.faint(`${runs.length} runs`)}`,
          ],
          { title: `trend (${runs.length} runs)`, pad: 1 },
        ),
      );
    }
  } else {
    console.log(ui.box([C.faint('no Lighthouse reports in .lighthouseci/ — run `fmctl metrics --run`')], { title: 'lighthouse', pad: 1 }));
  }

  // Bundle sizes
  const bundles = bundleSizes(root);
  if (bundles.length) {
    console.log(
      ui.box(
        ui
          .barChart(bundles.map((b) => ({ label: b.label, value: b.value, suffix: core.fmtBytes(b.value) })), { width: 26 })
          .split('\n'),
        { title: 'static bundle sizes (out/_next/static)', pad: 1 },
      ),
    );
  }

  // Live probes (dev + prod)
  const probes = [];
  const reg = core.readRegistry(root);
  if (reg.dev && core.isAlive(reg.dev.pid)) {
    const p = await core.httpProbe(urlFor(reg.dev.port), { timeout: 3000 });
    probes.push({ label: `local :${reg.dev.port}`, value: p.ms || 0, ok: p.ok, status: p.status, bytes: p.bytes });
  }
  const prod = await core.httpProbe(core.PROD_URL, { timeout: 6000 });
  probes.push({ label: 'production', value: prod.ms || 0, ok: prod.ok, status: prod.status, bytes: prod.bytes });

  console.log(
    ui.box(
      probes.map((p) => {
        const status = p.ok ? C.good(`${sym.ok} ${p.status}`) : C.poor(`${sym.fail} ${p.status || 'down'}`);
        const sizeStr = p.bytes ? `· ${core.fmtBytes(p.bytes)}` : '';
        return `${ui.pad(p.label, 14)} ${status}  ${ui.bar(Math.min(p.value, 1000), 1000, 18, { colorFn: p.value < 300 ? C.good : p.value < 800 ? C.avg : C.poor })}  ${C.faint(`${p.value}ms ${sizeStr}`)}`;
      }),
      { title: 'live response times', pad: 1 },
    ),
  );
  return 0;
}

async function runLighthouse(root, opts) {
  // Collect against a running server (dev or prod). Default to the dev server if managed.
  const reg = core.readRegistry(root);
  const target = opts.url || (reg.dev && core.isAlive(reg.dev.pid) ? urlFor(reg.dev.port) : core.PROD_URL);
  const steps = new ui.Steps([`collect lighthouse → ${ui.truncate(target, 40)}`]).start();
  steps.set(0, 'running');
  const r = await core.spawnStream(
    'npx',
    ['--yes', '@lhci/cli@0.13.0', 'collect', `--url=${target}`, '--numberOfRuns=1', '--settings.preset=desktop'],
    { cwd: root },
    () => {},
  );
  if (r.code === 0) steps.set(0, 'done');
  else steps.set(0, 'failed', `exit ${r.code}`);
  steps.done();
}

// ── Sub-agents (ralphy + QA gates + validation suite) ─────────────────────────
function ralphyPath(root) {
  const local = path.join(root, 'scripts', 'ralphy');
  if (fs.existsSync(local)) return local;
  return null; // may be on PATH; the dispatcher falls back to `ralphy`
}

export async function gates(opts = {}) {
  const root = core.repoRoot();
  console.log(ui.banner('quality gates'));
  const defs = [
    { label: 'tsc --noEmit', cmd: 'npx', args: ['tsc', '--noEmit'] },
    { label: 'eslint (next lint)', cmd: 'npm', args: ['run', '-s', 'lint'] },
    { label: 'static audit (overhaul)', cmd: 'node', args: ['scripts/validate/overhaul_static_audit.mjs'] },
  ];
  const steps = new ui.Steps(defs.map((d) => d.label)).start();
  let failures = 0;
  for (let i = 0; i < defs.length; i++) {
    steps.set(i, 'running');
    const r = await core.run(defs[i].cmd, defs[i].args, { cwd: root });
    if (r.code === 0) steps.set(i, 'done');
    else {
      steps.set(i, 'failed', (r.stdout + r.stderr).trim().split('\n').slice(-1)[0]?.slice(0, 50));
      failures++;
      if (opts.bail) break;
    }
  }
  steps.done();
  console.log(failures === 0 ? `\n${C.good(sym.ok)} all gates green.` : `\n${C.poor(sym.fail)} ${failures} gate(s) failed.`);
  return failures === 0 ? 0 : 1;
}

export async function agents(opts = {}) {
  const root = core.repoRoot();
  const ralphy = ralphyPath(root);
  const items = [
    { label: 'Quality gates (tsc + lint + audit)', value: 'gates', hint: 'fast pre-flight' },
    { label: 'Test suite (Playwright)', value: 'tests', hint: 'npx playwright test' },
    { label: 'Validation phase…', value: 'phase', hint: 'scripts/validate/*' },
    { label: 'Ralphy task', value: 'ralphy', hint: ralphy ? 'autonomous engine loop' : 'ralphy not found' },
    { label: 'Cinematic UI/UX agent', value: 'cinematic', hint: 'dispatch via ralphy/claude' },
  ];
  const choice = opts.action ? items.find((i) => i.value === opts.action) : await ui.menu('connect a sub-agent', items);
  if (!choice) return 0;

  if (choice.value === 'gates') return gates(opts);

  if (choice.value === 'tests') {
    console.log(ui.banner('Playwright test suite'));
    const spin = new ui.Spinner('running playwright tests').start();
    let pass = 0;
    let fail = 0;
    await core.spawnStream('npx', ['playwright', 'test', '--reporter=line'], { cwd: root }, (line) => {
      const l = ui.stripAnsi(line);
      if (/passed/.test(l)) { const m = /(\d+) passed/.exec(l); if (m) pass = Number(m[1]); }
      if (/failed/.test(l)) { const m = /(\d+) failed/.exec(l); if (m) fail = Number(m[1]); }
      spin.update(`playwright… ${C.good(pass + ' passed')} ${fail ? C.poor(fail + ' failed') : ''}`);
    });
    if (fail) spin.fail(`${fail} test(s) failed, ${pass} passed`);
    else spin.succeed(`${pass} test(s) passed`);
    return fail ? 1 : 0;
  }

  if (choice.value === 'phase') {
    const dir = path.join(root, 'scripts', 'validate');
    const phases = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^phase\d+/.test(f)).sort() : [];
    if (!phases.length) {
      console.log(C.faint('no validation phases found.'));
      return 0;
    }
    const pick = await ui.menu('select a validation phase', phases.map((p) => ({ label: p, value: p })));
    if (!pick) return 0;
    console.log(`${C.accent(sym.arrow)} running ${pick.value}`);
    return (await core.spawnStream('bash', [path.join(dir, pick.value)], { cwd: root }, (l) => console.log('  ' + C.faint(l)))).code;
  }

  if (choice.value === 'ralphy' || choice.value === 'cinematic') {
    if (!ralphy && !(await core.which('ralphy'))) {
      console.log(C.avg(`${sym.warn} ralphy is not installed on this branch/PATH.`));
      console.log(C.faint('  ralphy drives the cursor/codex/gemini/claude engines; install it or switch to the branch that ships scripts/ralphy.'));
      return 1;
    }
    const bin = ralphy || 'ralphy';
    let task = opts.task;
    if (choice.value === 'cinematic') {
      const focus = opts.task || (await ui.prompt('UI/UX focus', { default: 'audit and refine all animations to studio-grade, monochrome, restrained' }));
      task = `Act as the cinematic-uiux-vfx-engineer. ${focus}. Test-first, keep monochrome tokens, verify tsc/lint/audit and Playwright, capture screenshots.`;
    } else {
      task = opts.task || (await ui.prompt('ralphy task', { default: '' }));
    }
    if (!task) {
      console.log(C.faint('no task provided.'));
      return 0;
    }
    console.log(`${C.accent(sym.arrow)} dispatching to ralphy ${C.faint(`(${bin})`)}`);
    return (await core.spawnStream(bin, [task], { cwd: root }, (l) => console.log('  ' + l))).code;
  }
  return 0;
}
