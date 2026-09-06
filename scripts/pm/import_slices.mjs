// PM protocol helper (docs/prompt.md §4): import CINEMATIC-VFX-TASKS.json slices onto the file-backed board as
// analyst-programmer tasks with the full task body. Usage: node scripts/pm/import_slices.mjs <tasks.json> <parentTaskId> [--only w3-s01,w3-s02]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const [file, parent, ...rest] = process.argv.slice(2);
if (!file || !parent) throw new Error('usage: import_slices.mjs <tasks.json> <parentTaskId> [--only ids]');
const only = (rest.find((a) => a.startsWith('--only')) || '').split('=')[1]?.split(',').filter(Boolean);
const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const slices = j.slices || j;
const board = JSON.parse(fs.readFileSync('/root/forgotten-mistory/artifacts/kanban/board.json', 'utf8'));
const idOf = (s) => 't_' + String(s.id).replace(/[^a-z0-9]/gi, '').toLowerCase();
let n = 0;
for (const s of slices) {
  if (only && only.length && !only.includes(s.id)) continue;
  const tid = idOf(s);
  if (board.tasks.find((t) => t.id === tid)) { console.log(`skip ${tid} (exists)`); continue; }
  const deps = (s.depends_on || []).map((d) => 't_' + String(d).replace(/[^a-z0-9]/gi, '').toLowerCase());
  const files = (s.files || []).join(', ');
  const tests = (s.tests || []).join(', ');
  const spec = {
    id: tid, slug: `w3-slice-${s.id}`,
    title: `WAVE-3 SLICE ${s.id} (analyst-programmer, xhigh) — ${s.title}${s.replaces && s.replaces.length ? ' — replaces: ' + s.replaces.join(', ') : ''} — visible result: ${s.visible_result || '(see spec)'} — ≤ ${s.minutes || 30} min`,
    assignee: 'analyst-programmer', priority: 100, parents: deps.length ? deps : [parent], status: 'todo',
    summary: `Binding spec: docs/architecture/CINEMATIC-VFX-v1.md (read §0–§8 in full, then this slice's row in docs/architecture/CINEMATIC-VFX-TASKS.json). The Owner's words (artifacts/kanban/INBOX/OWNER-DIRECTIVE-20260906T0529Z.md, both entries) are the bar. Immovables: every effect chroma 0 (gold only as the sourced-claim mark); every word from app/data/portfolio/*.ts unchanged; LCP < 2.5 s, CLS < 0.05, no asset > 500 kB; nothing plays by default; reduced-motion = a static composition passing the static gates; ?gl=off fully readable; keyboard + contrast ≥ 4.5:1 per pixel over any plane; G-MV1; six section ids in order; every superseded test replaced in the same commit; ?gl=force probe 0 pageerrors + canvases ≥ 1 before push; hard NOs from the judge (no troika/postprocessing/GSAP/Text3D, no single WebGLRenderer). Files: ${files}. Tests to turn green: ${tests}. Fresh worktree .claude/worktrees/${s.id} on branch worktree-${s.id} from origin/main (npm ci if node_modules is missing); one heavy job at a time; port assigned in the brief; wait on PIDs; never pgrep -f your own command text; never git checkout/reset/stash in /root/forgotten-mistory. Ledger row before the commit; push the branch, never main.`,
    order: [
      'S-1 Read the spec sections named above, the slice row, docs/architecture/INTERIM-FRAME.md, the current files this slice touches, the tests it names, and the prototype file the spec §9 names as lineage (read-only reference — port the mechanism, do not import the file).',
      'S-2 TDD first: write or extend the tests the slice row names (Playwright + node instruments; expose window.__fm hooks the spec requires) and run them red on the current export.',
      'S-3 Implement exactly the slice row: the replacement and the removal of what it replaces in one commit; nothing outside the listed files except tests, CSS modules for those components, and app/globals.css tokens if the spec adds one.',
      'S-4 Verify: npx tsc --noEmit · npm run lint · npm run build:static · node scripts/validate/overhaul_static_audit.mjs (10/10) · serve out/ on your port · the slice tests + tests/overhaul/interim-frame.spec.ts (or its successor named in the spec) + tests/e2e/hero-fold.spec.ts + MiniVic first-fold suites + tests/a11y + tests/content · ?gl=force probe (0 pageerrors, canvases ≥ 1 where the slice mounts one) · ?gl=off readability · reduced-motion still · the CQ instruments this slice owns, measured and saved; full logs + screenshots at 1440/1280/834/390 → docs/delivery/evidence/v10-20260905T0515Z/W3-' + String(s.id).toUpperCase() + '/.',
      'S-5 Ledger row (scripts/pm/ledger_append.mjs --task ' + tid + ' …); conventional commit naming the slice and the CQ numbers; push origin HEAD:refs/heads/worktree-' + s.id + '. ≤ ' + (s.minutes || 30) + ' min: if you would overrun, ship the smallest green, pushed, visible part and report the rest. Return {task_id:\'' + tid + '\', branch, sha, pushed, files_changed, cq:{id:number…}, gates:{tsc,lint,build,audit,playwright,glforce}, evidence:[…], remaining:[…], goal_complete}.',
    ],
    gates: (s.gates && s.gates.length ? s.gates : ['Slice tests red-then-green; interim-frame/hero-fold/MiniVic/a11y/content suites green or consciously superseded with reasons']).concat(['tsc/lint/build clean; audit 10/10; ?gl=force 0 pageerrors', 'Chroma 0 outside gold marks; words unchanged; ledger row; branch pushed; visible on the live URL after consolidation']),
    verify: [`git -C /root/forgotten-mistory/.claude/worktrees/${s.id} diff --stat origin/main..HEAD | tail -1`, `ls /root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/W3-${String(s.id).toUpperCase()}/ | wc -l`],
  };
  const out = execFileSync('node', ['/root/forgotten-mistory/scripts/pm/kanban.mjs', 'create'], { input: JSON.stringify(spec), encoding: 'utf8' });
  console.log(out.trim(), '←', s.id, s.minutes + 'min', s.heavy ? 'heavy' : 'light'); n++;
}
console.log(`${n} slices imported under ${parent}`);
