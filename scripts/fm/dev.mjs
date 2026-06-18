// fm/dev.mjs — robust foreground dev launcher used by `npm run dev`.
//
// Fixes the recurring "dev server broken" failure mode: stale next-server /
// `next dev` zombies (from other jobs, worktrees, or crashed runs) squatting on
// the dev port, plus a `.next` cache corrupted by two servers running `rm -rf
// .next` against the same directory. This launcher frees the port FIRST, cleans
// `.next`, then execs `next dev` in the foreground so HMR logs stream and Ctrl-C
// works exactly like before.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import * as core from './core.mjs';

const root = core.repoRoot();
const port = core.devPort(root);

// 1. Free the port of any stray listener.
const strays = await core.listenersOnPort(port);
if (strays.length) {
  process.stderr.write(
    `[fmctl-dev] port ${port} held by ${strays.map((s) => `${s.command}/${s.pid}`).join(', ')} — freeing…\n`,
  );
  await core.freePort(port);
}

// 2. Clean the build cache (parity with the original dev script).
try {
  fs.rmSync(path.join(root, '.next'), { recursive: true, force: true });
} catch {
  /* ignore */
}

// 3. Exec next dev in the foreground.
const bin = path.join(root, 'node_modules', '.bin', 'next');
const hasBin = fs.existsSync(bin);
const cmd = hasBin ? bin : 'npx';
const args = hasBin ? ['dev', '-p', String(port)] : ['next', 'dev', '-p', String(port)];

const child = spawn(cmd, args, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
});

for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {
      /* already gone */
    }
  });
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
