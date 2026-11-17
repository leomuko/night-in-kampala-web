import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const directory = path.resolve('.cache/brand-fontconfig');
await mkdir(path.join(directory, 'cache'), { recursive: true });
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const configuration = path.join(directory, 'fonts.conf');
await writeFile(configuration, `<?xml version="1.0"?><fontconfig><dir>${escape(path.resolve('docs/implementation-assets/brand'))}</dir><cachedir>${escape(path.join(directory, 'cache'))}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = configuration;
process.env.PANGOCAIRO_BACKEND = 'fontconfig';
const { default: sharp } = await import('sharp');
const fontfile = path.join(root, 'docs/implementation-assets/brand/Anton-Regular.ttf');
const font = await readFile(fontfile);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
if (hash(font) !== 'a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab') throw new Error('Brand font checksum differs.');
const tokens = await readFile('src/styles/tokens.css', 'utf8');
const colour = name => tokens.match(new RegExp(`--color-${name}: (#[a-fA-F0-9]{6});`))[1];
const wordmark = await sharp({ text: { text: `<span foreground="${colour('ink')}">NIGHT IN KAMPALA</span>`, font: 'Anton 110', fontfile, rgba: true } }).png().toBuffer();
const fitted = await sharp(wordmark).resize({ width: 1024, withoutEnlargement: true }).toBuffer();
const { width, height } = await sharp(fitted).metadata();
const image = await sharp({ create: { width: 1200, height: 630, channels: 3, background: colour('paper') } })
  .composite([{ input: fitted, left: Math.round((1200 - width) / 2), top: Math.round((630 - height) / 2) }])
  .jpeg({ quality: 90, mozjpeg: true }).toBuffer();
await mkdir('public/share', { recursive: true });
await writeFile('public/share/brand.jpg', image);
const provenance = JSON.parse(await readFile('public/asset-provenance.json', 'utf8'));
provenance.assets = [...provenance.assets.filter(asset => asset.file !== 'share/brand.jpg'), {
  file: 'share/brand.jpg', kind: 'brand_typography', width: 1200, height: 630, bytes: image.length, sha256: hash(image),
}];
await writeFile('public/asset-provenance.json', JSON.stringify(provenance, null, 2) + '\n');
await writeFile('docs/implementation-assets/brand/manifest.json', JSON.stringify({
  file: 'public/share/brand.jpg', kind: 'brand_typography', text: 'NIGHT IN KAMPALA', width: 1200, height: 630,
  sha256: hash(image), font: 'Anton', fontSource: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf',
  fontSha256: hash(font), license: 'OFL.txt', command: 'node scripts/prepare-brand-share.mjs',
  note: 'Approved wordmark rendered from open-licence glyphs. No generated photography or invented garment.'
}, null, 2) + '\n');
console.log('Prepared the typography-only brand share card.');
