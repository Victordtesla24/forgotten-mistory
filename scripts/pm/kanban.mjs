// PM protocol verbs for the file-backed Kanban board (docs/prompt.md §4). Usage: node scripts/pm/kanban.mjs <list|show|status|comment|decision|complete|block|unblock|ready-check> [id] [args…]
// PM protocol verbs over the file-backed board (docs/prompt.md §4): status | comment | complete | block | unblock | list | show
import fs from 'node:fs';
import path from 'node:path';
const K = '/root/forgotten-mistory/artifacts/kanban';
const B = path.join(K, 'board.json');
const board = JSON.parse(fs.readFileSync(B, 'utf8'));
const [verb, id, ...rest] = process.argv.slice(2);
const now = new Date().toISOString();
const find = (i) => { const t = board.tasks.find((t) => t.id === i); if (!t) throw new Error(`no task ${i}`); return t; };
const appendMd = (i, section, text) => { const f = path.join(K, 'tasks', `${i}.md`); fs.appendFileSync(f, `\n## ${section} (${now})\n${text}\n`); };
const save = () => { board.updated = now; fs.writeFileSync(B, JSON.stringify(board, null, 2) + '\n'); };
switch (verb) {
  case 'list': {
    const by = {}; for (const t of board.tasks) (by[t.status] ||= []).push(t);
    for (const c of board.columns) if (by[c]) { console.log(`\n${c.toUpperCase()} (${by[c].length})`); for (const t of by[c]) console.log(`  ${t.id} p${String(t.priority).padStart(3)} ${t.assignee.padEnd(20)} ${t.title.slice(0, 96)}`); }
    break; }
  case 'show': { const t = find(id); console.log(JSON.stringify(t, null, 2)); console.log(fs.readFileSync(path.join(K, 'tasks', `${id}.md`), 'utf8')); break; }
  case 'status': { const t = find(id); const s = rest[0]; if (!board.columns.includes(s)) throw new Error(`bad status ${s}`); t.status = s; t.updated = now; appendMd(id, 'STATUS', `${s}${rest[1] ? ' — ' + rest.slice(1).join(' ') : ''}`); save(); console.log(`${id} → ${s}`); break; }
  case 'comment': { const t = find(id); const text = rest.join(' '); t.comments.push({ at: now, by: 'orchestrator', text }); t.updated = now; appendMd(id, 'COMMENT', text); save(); console.log(`${id}: comment`); break; }
  case 'decision': { const t = find(id); const text = rest.join(' '); t.decisions.push({ at: now, text }); t.updated = now; appendMd(id, 'DECISION', text); save(); console.log(`${id}: decision`); break; }
  case 'complete': { const t = find(id); const result = rest.join(' '); t.status = 'done'; t.result = result; t.updated = now; appendMd(id, 'COMPLETE', result); save(); console.log(`${id} → done`); break; }
  case 'block': { const t = find(id); const kind = rest[0]; const reason = rest.slice(1).join(' '); t.status = 'blocked'; t.blocker = { kind, reason, at: now }; t.updated = now; appendMd(id, 'BLOCKED', `${kind}: ${reason}`); save(); console.log(`${id} → blocked (${kind})`); break; }
  case 'unblock': { const t = find(id); t.status = rest[0] || 'ready'; t.blocker = null; t.updated = now; appendMd(id, 'UNBLOCKED', rest.slice(1).join(' ')); save(); console.log(`${id} → ${t.status}`); break; }
  case 'ready-check': { // promote todo → ready when every parent is done
    let n = 0; for (const t of board.tasks) if (t.status === 'todo' && t.parents.every((p) => (board.tasks.find((x) => x.id === p) || {}).status === 'done')) { t.status = 'ready'; t.updated = now; n++; console.log(`ready: ${t.id} ${t.title.slice(0, 70)}`); } save(); console.log(`${n} promoted`); break; }
  default: throw new Error('verb?');
}
