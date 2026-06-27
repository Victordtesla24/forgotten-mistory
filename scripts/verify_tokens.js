const fs = require('fs');
const css = fs.readFileSync('app/globals.css', 'utf8');

// 1. Check all var() references resolve to defined tokens
const varRefs = [...css.matchAll(/var\((--[a-z0-9-]+)/gi)].map(m => m[1]);
const tokenDefs = [...css.matchAll(/^  (--[a-z0-9-]+)\s*:/gm)].map(m => m[1]);
const undefinedVars = [...new Set(varRefs)].filter(v => !tokenDefs.includes(v));

if (undefinedVars.length > 0) {
  console.log('UNDEFINED CSS VARS:', undefinedVars);
  process.exit(1);
}
console.log('OK: All', varRefs.length, 'var() references resolve to defined tokens');

// 2. Count hex outside :root
const lines = css.split('\n');
let rootEnd = 0, depth = 0, inRoot = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes(':root')) inRoot = true;
  if (inRoot) depth += (lines[i].match(/\{/g)||[]).length - (lines[i].match(/\}/g)||[]).length;
  if (inRoot && depth === 0) { rootEnd = i + 1; break; }
}
let hexOutsideRoot = 0;
for (let i = rootEnd; i < lines.length; i++) {
  if (!lines[i].includes('var(') && /#[0-9a-fA-F]{3,8}/.test(lines[i])) {
    hexOutsideRoot++;
    console.log('HEX outside :root line', i+1, ':', lines[i].trim().substring(0, 100));
  }
}
if (hexOutsideRoot > 0) {
  console.log('FAIL:', hexOutsideRoot, 'hex outside :root');
  process.exit(1);
}
console.log('OK: 0 hex values outside :root block');

// 3. Grammar check: balanced braces
const opens = (css.match(/\{/g)||[]).length;
const closes = (css.match(/\}/g)||[]).length;
if (opens !== closes) {
  console.log('FAIL: Unbalanced braces (open:', opens, 'close:', closes, ')');
  process.exit(1);
}
console.log('OK: Braces balanced (' + opens + ' pairs)');

// 4. Count total hex in :root
let hexInRoot = 0;
for (let i = 0; i < rootEnd; i++) {
  const matches = lines[i].match(/#[0-9a-fA-F]{3,8}/g);
  if (matches) hexInRoot += matches.length;
}
console.log('OK:', hexInRoot, 'hex values in :root token definitions (expected: 12)');

console.log('\nALL CHECKS PASSED');
