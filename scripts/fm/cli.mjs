// fm/cli.mjs — argument parsing, help, interactive menu, and command dispatch.
import * as ui from './ui.mjs';
import * as cmd from './commands.mjs';

const { C, sym } = ui;

const VERSION = '1.0.0';

const COMMANDS = {
  start: { fn: cmd.start, help: 'start the dev server (clean port + .next, health-check)', alias: ['dev', 'up'] },
  stop: { fn: cmd.stop, help: 'stop the managed dev server (+ free its port)', alias: ['down'] },
  restart: { fn: cmd.restart, help: 'restart the dev server', alias: ['reload'] },
  status: { fn: cmd.status, help: 'show servers, strays, git & production health', alias: ['st', 'ps'] },
  doctor: { fn: cmd.doctor, help: 'diagnose env, ports, tools; clean stray servers', alias: ['dr', 'fix'] },
  logs: { fn: cmd.logs, help: 'show / follow (-f) the dev server log', alias: ['log'] },
  metrics: { fn: cmd.metrics, help: 'website metrics dashboard (lighthouse + live probes)', alias: ['m', 'perf'] },
  push: { fn: cmd.push, help: 'stage, commit & push (use --main to push to main)', alias: ['commit'] },
  ci: { fn: cmd.ci, help: 'GitHub Actions: ci [status|run|watch]', alias: [] },
  deploy: { fn: cmd.deploy, help: 'build static export & deploy to Firebase, then verify', alias: ['ship'] },
  agents: { fn: cmd.agents, help: 'connect sub-agents (gates, tests, ralphy, cinematic)', alias: ['agent', 'a'] },
  gates: { fn: cmd.gates, help: 'run quality gates (tsc + lint + audit)', alias: ['check', 'qa'] },
};

const ALIAS = {};
for (const [name, def] of Object.entries(COMMANDS)) {
  for (const a of def.alias) ALIAS[a] = name;
}

function parseArgs(argv) {
  const opts = { _: [] };
  let command = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--version' || a === '-V') opts.version = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--main') opts.toMain = true;
    else if (a === '--run') opts.run = true;
    else if (a === '--follow' || a === '-f') opts.follow = true;
    else if (a === '--no-fresh') opts.fresh = false;
    else if (a === '--bail') opts.bail = true;
    else if (a === '-m' || a === '--message') opts.message = argv[++i];
    else if (a === '--port' || a === '-p') opts.port = Number(argv[++i]);
    else if (a === '--url') opts.url = argv[++i];
    else if (a === '--ref') opts.ref = argv[++i];
    else if (a === '--task') opts.task = argv[++i];
    else if (a === '--action') opts.action = argv[++i];
    else if (a === '--limit') opts.limit = Number(argv[++i]);
    else if (a === '--lines') opts.lines = Number(argv[++i]);
    else if (a.startsWith('-')) opts[a.replace(/^-+/, '')] = true;
    else if (!command) command = ALIAS[a] || a;
    else opts._.push(a);
  }
  return { command, opts };
}

function helpText() {
  const rows = Object.entries(COMMANDS).map(([name, def]) => {
    const aliases = def.alias.length ? C.faint(` (${def.alias.join(', ')})`) : '';
    return `  ${C.accent(ui.pad(name, 9))} ${def.help}${aliases}`;
  });
  return [
    ui.banner(`v${VERSION}`),
    '',
    `${C.bold('Usage')}  ${C.white('fmctl')} ${C.faint('<command> [options]')}`,
    `       ${C.white('fmctl')} ${C.faint('            # interactive menu')}`,
    '',
    C.bold('Commands'),
    ...rows,
    '',
    C.bold('Common options'),
    `  ${C.faint('--json')}          machine-readable output (status)`,
    `  ${C.faint('--port <n>')}      override dev port`,
    `  ${C.faint('-m <msg>')}        commit message (push)`,
    `  ${C.faint('--main')}          push to main (push)`,
    `  ${C.faint('--run')}           collect fresh Lighthouse (metrics)`,
    `  ${C.faint('-y, --yes')}       skip confirmation prompts`,
    `  ${C.faint('-f, --follow')}    follow log output (logs)`,
    '',
    C.bold('Examples'),
    `  ${C.faint('fmctl start')}                 ${C.faint('# boot dev server on :8080')}`,
    `  ${C.faint('fmctl status')}                ${C.faint('# dashboard')}`,
    `  ${C.faint('fmctl metrics --run')}         ${C.faint('# fresh lighthouse + charts')}`,
    `  ${C.faint('fmctl push -m "fix: x"')}      ${C.faint('# commit & push branch')}`,
    `  ${C.faint('fmctl ci watch')}              ${C.faint('# watch latest CI run')}`,
    `  ${C.faint('fmctl deploy -y')}             ${C.faint('# build + firebase deploy')}`,
    '',
  ].join('\n');
}

async function interactiveMenu() {
  const items = [
    { label: 'Start dev server', value: 'start', hint: 'clean boot + health check' },
    { label: 'Restart dev server', value: 'restart', hint: 'recycle' },
    { label: 'Stop dev server', value: 'stop', hint: 'free the port' },
    { label: 'Status dashboard', value: 'status', hint: 'servers · git · prod' },
    { label: 'Website metrics', value: 'metrics', hint: 'lighthouse + live probes' },
    { label: 'Doctor / cleanup', value: 'doctor', hint: 'diagnose & clean strays' },
    { label: 'Sub-agents', value: 'agents', hint: 'gates · tests · ralphy' },
    { label: 'Commit & push', value: 'push', hint: 'git' },
    { label: 'CI runs', value: 'ci', hint: 'github actions' },
    { label: 'Deploy to production', value: 'deploy', hint: 'firebase' },
    { label: 'Quit', value: 'quit', hint: '' },
  ];

  // Non-interactive: ui.menu prints the options and returns null — show banner + list once.
  if (!ui.isTTY || !process.stdin.isTTY) {
    console.log(ui.banner('interactive console'));
    await ui.menu('what would you like to do?', items);
    console.log(C.faint('\nRun `fmctl --help` for the full command list.'));
    return 0;
  }

  // TTY loop.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(ui.banner('interactive console'));
    const choice = await ui.menu('what would you like to do?', items);
    if (!choice || choice.value === 'quit') {
      console.log(C.faint('bye.'));
      return 0;
    }
    try {
      await COMMANDS[choice.value].fn({ _: [] });
    } catch (e) {
      console.log(C.poor(`error: ${e.message}`));
    }
    console.log('');
    const again = await ui.confirm('back to menu?', true);
    if (!again) return 0;
    console.log('\n');
  }
}

export async function main(argv) {
  const { command, opts } = parseArgs(argv);

  if (opts.version) {
    console.log(`fmctl v${VERSION}`);
    return 0;
  }
  if (opts.help || command === 'help') {
    console.log(helpText());
    return 0;
  }
  if (!command) {
    return interactiveMenu();
  }

  const def = COMMANDS[command];
  if (!def) {
    console.log(`${C.poor(sym.fail)} unknown command: ${C.bold(command)}`);
    console.log(C.faint('run `fmctl --help` for usage.'));
    return 1;
  }

  try {
    const code = await def.fn(opts);
    return code || 0;
  } catch (e) {
    console.error(`${C.poor(sym.fail)} ${command} failed: ${e.message}`);
    if (process.env.FMCTL_DEBUG) console.error(e.stack);
    return 1;
  }
}
