import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { HEAD_START, HEAD_END } from '../functions/shared-links.js';

// Functions deployments include only their source directory, not root dist/.
// Build both from the same Vite output so hashed scripts/styles stay in sync.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const marker of [HEAD_START, HEAD_END]) {
  if (html.split(marker).length !== 2) throw new Error(`Expected one ${marker} in built HTML.`);
}
if (html.includes('/src/main.jsx')) throw new Error('Preview template must use built assets.');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match => match[1]);
if (!assets.length) throw new Error('Missing root-relative Vite assets.');
await Promise.all(assets.map(asset => access(new URL(`../dist${asset}`, import.meta.url))));
const directory = new URL('../functions/generated/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(new URL('index.html', directory), html);
console.log('Prepared Functions HTML from the same Vite build as Hosting.');
