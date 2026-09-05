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
  case 'comment': { const t = find(id); const text = rest.join(' '); (t.comments ||= []).push({ at: now, by: 'orchestrator', text }); t.updated = now; appendMd(id, 'COMMENT', text); save(); console.log(`${id}: comment`); break; }
  case 'decision': { const t = find(id); const text = rest.join(' '); (t.decisions ||= []).push({ at: now, text }); t.updated = now; appendMd(id, 'DECISION', text); save(); console.log(`${id}: decision`); break; }
  case 'complete': { const t = find(id); const result = rest.join(' '); t.status = 'done'; t.result = result; t.updated = now; appendMd(id, 'COMPLETE', result); save(); console.log(`${id} → done`); break; }
  case 'block': { const t = find(id); const kind = rest[0]; const reason = rest.slice(1).join(' '); t.status = 'blocked'; t.blocker = { kind, reason, at: now }; t.updated = now; appendMd(id, 'BLOCKED', `${kind}: ${reason}`); save(); console.log(`${id} → blocked (${kind})`); break; }
  case 'unblock': { const t = find(id); t.status = rest[0] || 'ready'; t.blocker = null; t.updated = now; appendMd(id, 'UNBLOCKED', rest.slice(1).join(' ')); save(); console.log(`${id} → ${t.status}`); break; }
  case 'create': { // kanban_create: JSON on stdin {id?, slug, title, assignee, priority, parents, summary, order[], gates[], verify[], skills?, status?, migrated?, blocked_by?}
    const spec = JSON.parse(fs.readFileSync(0, 'utf8'));
    const crypto = await import('node:crypto');
    const tid = spec.id || ('t_' + crypto.createHash('sha1').update(spec.slug).digest('hex').slice(0, 8));
    if (board.tasks.find((t) => t.id === tid)) throw new Error(`exists ${tid}`);
    const H = { orchestrator: ['feedback_refactor_loop', 'orchestrator', 'ultracode', 'claude-fable-5-1 (ultracode) · Max OAuth'], reviewer: ['3rd_party_independent_adversarial_review', 1, 'max', 'claude-opus · Max OAuth'], 'solutions-architect': ['architecture / requirements_analysis', 1, 'max', 'claude-opus · Max OAuth'], 'analyst-programmer': ['coding', 2, 'xhigh', 'claude-opus · Max OAuth'], tester: ['testing / qa', 2, 'xhigh', 'claude-opus · Max OAuth'], 'cleanup-agent': ['cleanup', 4, 'medium', 'claude-sonnet · Max OAuth'], researcher: ['research', 3, 'high', 'perplexity/sonar-reasoning-pro · OpenRouter → Anthropic OAuth (§0.4 failover)'], coder: ['coding / documentation', 4, 'medium (xhigh when coding)', 'deepseek · OpenRouter → Anthropic OAuth (§0.4 failover)'] }[spec.assignee];
    if (!H) throw new Error(`assignee ${spec.assignee} is not a §5 profile`);
    const or = spec.assignee === 'researcher' || spec.assignee === 'coder';
    const provider = or ? 'OpenRouter (OPENROUTER_API_KEY) — balance negative (402), so this task runs on Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli session). Never ANTHROPIC_API_KEY.' : 'Anthropic via OAuth (CLAUDE_CODE_OAUTH_TOKEN / claude-cli Max session). Never ANTHROPIC_API_KEY.';
    const status = spec.status || (spec.blocked_by ? 'blocked' : 'todo');
    const body = `# ${tid} — ${spec.title}\n\n**Status:** ${status} · **Priority:** ${spec.priority} · **Parents:** ${spec.parents.length ? spec.parents.join(', ') : '—'} · **Created:** ${now}\n${spec.migrated ? `\n> Continuity: ${spec.migrated}\n` : ''}${spec.blocked_by ? `\n> Owner-blocked by: ${spec.blocked_by}\n` : ''}\n## YOUR ROLE\n${spec.assignee} — ${H[0]} (docs/prompt.md §5). ${spec.summary}\n\n## PROJECT ROOT\n/root/forgotten-mistory (VPS srv1356245). Evidence: docs/delivery/evidence/${board.run_id}/. Live: ${board.live_url}. Static servers already bound by other tenants: :5599 and :8080 — never reuse them; council batteries use :5601 / :5602.\n\n## MANDATORY\nCall kanban_complete() when ALL gates pass — i.e. return structured output {task_id, gates:{...}, files_changed:[...], evidence:[...], goal_complete:true}; the orchestrator writes it to the board. Never self-approve; never weaken a check to pass it; every claim cites a command or a path. No secrets in output — read keys by name from /root/.claude/.env.production with a \`grep -E '^[A-Z][A-Z0-9_]*='\` reader, never \`source\` it, never print values.\n\n## EXECUTION ORDER\n${spec.order.map((x) => `- ${x}`).join('\n')}\n\n## QUALITY GATES\n${spec.gates.map((x) => `- ${x}`).join('\n')}\n\n## VERIFICATION\n\`\`\`bash\n${spec.verify.join('\n')}\n\`\`\`\n\n## HIERARCHY\nrole_matrix: ${H[0]} → level ${H[1]} → effort **${H[2]}** (effort_cascade.yaml; depth_cap 4). Model: ${H[3]}. max_runtime_seconds 1800 (O1) · goal_max_turns 20.\n\n## PROVIDER\n${provider}\n`;
    fs.writeFileSync(path.join(K, 'tasks', `${tid}.md`), body);
    board.tasks.push({ id: tid, title: spec.title, status, assignee: spec.assignee, priority: spec.priority, parents: spec.parents, skills: spec.skills || [], hierarchy: { role: H[0], level: H[1], effort: H[2] }, provider: or ? 'openrouter→anthropic-oauth' : 'anthropic-oauth', created: now, updated: now, summary: spec.summary, decisions: [], comments: [], blocker: spec.blocked_by ? { kind: 'hard_fail', reason: spec.blocked_by, at: now } : null });
    save(); console.log(tid); break; }
  case 'ready-check': { // promote todo → ready when every parent is done
    let n = 0; for (const t of board.tasks) if (t.status === 'todo' && t.parents.every((p) => (board.tasks.find((x) => x.id === p) || {}).status === 'done')) { t.status = 'ready'; t.updated = now; n++; console.log(`ready: ${t.id} ${t.title.slice(0, 70)}`); } save(); console.log(`${n} promoted`); break; }
  default: throw new Error('verb?');
}
