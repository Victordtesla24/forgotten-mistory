import { rmSync } from 'fs';
const dirs = ['node_modules', '.next', 'out', '.babelrc'];
for (const d of dirs) {
  const path = new URL(`../../${d}`, import.meta.url);
  try { rmSync(path, { recursive: true, force: true }); console.log('Removed:', d); }
  catch(e) { console.log('Skip:', d, e.message); }
}
