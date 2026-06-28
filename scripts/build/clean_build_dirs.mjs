import { rmSync } from 'fs';
for (const d of ['.next', 'out']) {
  try { rmSync(new URL(`../../${d}`, import.meta.url), { recursive: true, force: true }); console.log('Removed:', d); }
  catch(e) { console.log('Skip:', d, e.message); }
}
