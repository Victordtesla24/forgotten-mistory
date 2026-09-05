import fs from 'node:fs';
const EV = '/root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures';
const file = process.argv[2];
const keys = process.argv.slice(3);
const d = JSON.parse(fs.readFileSync(`${EV}/${file}`, 'utf8'));
const J = (x) => JSON.stringify(x, null, 1);
for (const k of keys.length ? keys : Object.keys(d)) {
  const r = d[k]; if (!r) { console.log('MISSING', k); continue; }
  const m = r.measure || {};
  console.log('===== ' + k + ' status=' + r.status + ' loadMs=' + r.loadMs);
  if (m.canvases) console.log('canvases ' + J(m.canvases));
  if (m.canvasDetail) console.log('canvasDetail ' + J(m.canvasDetail));
  if (m.tokens) console.log('tokens ' + J(m.tokens));
  if (r.pageerrors) console.log('pageerrors(' + r.pageerrors.length + ') ' + J(r.pageerrors.slice(0, 4)));
  if (r.console) console.log('consoleErrWarn(' + r.console.length + ') ' + J(r.console.slice(0, 6)));
  if (r.failedRequests) console.log('failedRequests ' + J(r.failedRequests.slice(0, 8)));
  if (m.sections) console.log('sections ' + J(m.sections));
  if (m.skills) console.log('skills ' + J(m.skills));
  if (m.about) console.log('about.evidence ' + J(m.about.evidenceColors) + ' anyGold=' + m.about.anyGoldInAbout + ' goldHits=' + J(m.about.goldHits.slice(0, 4)) + ' offTokenChromaCount=' + m.about.offTokenChromaCount + ' sample=' + J(m.about.offTokenChroma.slice(0, 10)));
  if (m.vitrine) console.log('vitrine ' + J({ svgCount: m.vitrine.svgCount, pathCount: m.vitrine.pathCount, plates: m.vitrine.plates.slice(0, 3), engagementCta: m.vitrine.engagementCta, ctas: m.vitrine.ctas.slice(0, 14) }));
  if (m.hero) console.log('hero ' + J(m.hero));
}
