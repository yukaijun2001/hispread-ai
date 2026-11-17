// Usage: node i18n.mjs [--apply]  — report t('...') keys missing from the dictionary;
// with --apply, add keys whose only difference from an existing key is surrounding whitespace.
import fs from 'node:fs'; import path from 'node:path';
const root = '/sessions/youthful-inspiring-hypatia/mnt/hispread-ai/frontend/';
const dictPath = root + 'src/i18n/en-US.js';
const { default: dict } = await import(dictPath + '?' + Date.now());
const files = []; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!['recovered', 'runtime', 'i18n'].includes(f)) walk(p); } else if (/\.(ts|vue)$/.test(f)) files.push(p); } }; walk(root + 'src');
const keys = new Set();
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1]); for (const m of s.matchAll(/\bt\(\s*\w+ \? '((?:[^'\\]|\\.)*)' : '((?:[^'\\]|\\.)*)'/g)) { keys.add(m[1]); keys.add(m[2]); } }
const missing = [...keys].filter((k) => /[一-龥]/.test(k) && !Object.hasOwn(dict, k));
const byTrim = new Map(Object.keys(dict).map((k) => [k.trim(), k]));
const auto = []; const manual = [];
for (const k of missing) { const twin = byTrim.get(k.trim()); if (twin) auto.push([k, dict[twin].trim()]); else manual.push(k); }
if (process.argv.includes('--apply') && auto.length) {
  let s = fs.readFileSync(dictPath, 'utf8').trimEnd();
  s = s.slice(0, -2).trimEnd(); if (!s.endsWith(',')) s += ',';
  s += '\n' + auto.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n') + '\n};\n';
  fs.writeFileSync(dictPath, s);
}
console.log('auto', auto.length, process.argv.includes('--apply') ? '(applied)' : '');
console.log('manual', manual.length); console.log(JSON.stringify(manual));
