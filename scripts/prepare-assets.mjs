import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const hash = data => createHash('sha256').update(data).digest('hex');
const imageSource = path.join(root, 'docs/implementation-assets/placeholders');
const sourceManifest = JSON.parse(await readFile(path.join(imageSource, 'manifest.json'), 'utf8'));
const assets = [];
await mkdir('public/assets', { recursive: true });
await mkdir('public/fonts', { recursive: true });
await mkdir('public/share', { recursive: true });
for (const item of sourceManifest.assets) {
  const original = await readFile(path.join(imageSource, item.file));
  if (hash(original) !== item.sha256) throw new Error(`Source checksum mismatch: ${item.file}`);
  const name = item.file.replace('-placeholder.png', '');
  // Dedicated JPEG social renditions; storefront images remain responsive WebP.
  const shareFile = `share/${name}.jpg`;
  const shareData = await sharp(original).resize({ width: 1200, height: 630, fit: name === 'campaign' ? 'cover' : 'contain', background: '#F1F1EF' }).flatten({ background: '#F1F1EF' }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  await writeFile(path.join('public', shareFile), shareData);
  assets.push({ file: shareFile, width: 1200, height: 630, bytes: shareData.length, sha256: hash(shareData), kind: 'ai_generated_placeholder', requiresVisibleLabel: true, isRealCatalogueStock: false });
  const widths = name === 'campaign' ? [480, 960, 1440] : [320, 640, 960];
  for (const width of widths) {
    const output = `assets/${name}-${width}.webp`;
    const data = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    await writeFile(path.join('public', output), data);
    assets.push({ file: output, width, bytes: data.length, sha256: hash(data), kind: 'ai_generated_placeholder', requiresVisibleLabel: true, isRealCatalogueStock: false });
  }
}
const fonts = [];
for (const [family, weights] of [['anton', [400]], ['inter', [400, 500, 600]], ['newsreader', [400]]]) {
  const source = `node_modules/@fontsource/${family}`;
  const pkg = JSON.parse(await readFile(`${source}/package.json`, 'utf8'));
  await copyFile(`${source}/LICENSE`, `public/fonts/${family}-OFL.txt`);
  for (const weight of weights) {
    const filename = `${family}-latin-${weight}-normal.woff2`;
    const data = await readFile(`${source}/files/${filename}`);
    await writeFile(`public/fonts/${filename}`, data);
    fonts.push({ file: `fonts/${filename}`, source: `@fontsource/${family}@${pkg.version}`, weight, license: `fonts/${family}-OFL.txt`, bytes: data.length, sha256: hash(data) });
  }
}
await writeFile('public/asset-provenance.json', JSON.stringify({ status: 'development_only', assets, fonts }, null, 2) + '\n');
console.log(`Prepared ${assets.length} responsive images and ${fonts.length} local font files.`);
