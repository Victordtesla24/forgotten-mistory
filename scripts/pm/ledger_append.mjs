// PM bookkeeping: append one delegation-ledger row per changed file (docs/prompt.md §4).
// usage: node ledger_append.mjs --task <id> --role <role> --model <model> --prompt <taskPromptPath> --range <git diff range or "--cached"> [--cwd <repo>] -- <file>...
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
const a = process.argv.slice(2); const opt = {}; const files = [];
for (let i = 0; i < a.length; i++) { if (a[i] === '--') { files.push(...a.slice(i + 1)); break; } if (a[i].startsWith('--')) { opt[a[i].slice(2)] = a[++i]; } }
const cwd = opt.cwd || '/root/forgotten-mistory';
const ledger = '/root/forgotten-mistory/artifacts/delegation-ledger.jsonl';
const stamp = new Date().toISOString();
for (const f of files) {
  const diff = execSync(`git diff ${opt.range} -- "${f}"`, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });
  const hash = crypto.createHash('sha256').update(diff).digest('hex');
  const row = { changeId: `${opt.task}:${crypto.createHash('sha1').update(f + hash).digest('hex').slice(0, 10)}`, file: f, agentRole: opt.role, agentModel: opt.model, taskId: opt.task, taskPrompt: opt.prompt, returnedDiffHash: `sha256:${hash}`, at: stamp };
  fs.appendFileSync(ledger, JSON.stringify(row) + '\n');
}
console.log(`ledger: +${files.length} rows`);
