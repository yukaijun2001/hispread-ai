import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const compressible = new Set(['.js', '.css', '.svg', '.html', '.json']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (compressible.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = await walk(root);
let written = 0;
let raw = 0;
let compressed = 0;
for (const file of files) {
  const source = await readFile(file);
  raw += source.length;
  if (source.length < 1024) continue;
  const output = gzipSync(source, { level: 9 });
  if (output.length >= source.length) continue;
  await writeFile(`${file}.gz`, output);
  written += 1;
  compressed += output.length;
}
const info = await stat(new URL('../dist/index.html', import.meta.url));
if (info.size === 0) throw new Error('dist/index.html is empty');
console.log(`static gzip assets: ${written} files, ${raw} bytes -> ${compressed} bytes`);
