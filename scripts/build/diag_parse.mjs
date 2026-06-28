// Diagnostic: test SWC parsing on one of the failing files
import { readFileSync } from 'fs';

const file = process.argv[2] || '/Users/vic/claude/forgotten-mistory/components/fx/CardFlipCanvas.tsx';
const source = readFileSync(file, 'utf8');

console.log('File:', file);
console.log('Size:', source.length, 'bytes');

// Count braces
let braces = 0, parens = 0, brackets = 0, backticks = 0;
let inTemplate = false, inString = false, stringChar = '';

for (let i = 0; i < source.length; i++) {
  const ch = source[i], prev = i > 0 ? source[i-1] : '';
  
  if (inString) {
    if (ch === '\\') { i++; continue; }
    if (ch === stringChar) inString = false;
    continue;
  }
  if (inTemplate) {
    if (ch === '\\') { i++; continue; }
    if (ch === '`') { backticks++; inTemplate = false; }
    continue;
  }
  
  if (ch === '`' && prev !== '\\') { backticks++; inTemplate = true; continue; }
  if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
  
  if (ch === '{') braces++;
  if (ch === '}') braces--;
  if (ch === '(') parens++;
  if (ch === ')') parens--;
  if (ch === '[') brackets++;
  if (ch === ']') brackets--;
}

console.log('Braces:', braces, parens ? 'UNBALANCED' : 'OK');
console.log('Parens:', parens, parens ? 'UNBALANCED' : 'OK');
console.log('Brackets:', brackets, brackets ? 'UNBALANCED' : 'OK');
console.log('Backticks:', backticks, backticks % 2 !== 0 ? 'UNBALANCED (odd)' : 'OK');
console.log('In template at end:', inTemplate);
console.log('In string at end:', inString);
