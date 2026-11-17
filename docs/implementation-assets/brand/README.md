# Wordmark share card

`public/share/brand.jpg` is a 1200×630 white card containing the approved condensed NIGHT IN KAMPALA wordmark. It replaces generated campaign photography as the default shared-link fallback. It makes no claim about a garment, event or person.

The Anton Regular source is from the official Google Fonts repository under SIL Open Font License 1.1. `manifest.json` records its exact URL and SHA-256; `OFL.txt` is retained. Main application typography continues to use the existing self-hosted WOFF2 files.

Regenerate with `node scripts/prepare-brand-share.mjs` or `npm run assets`. Rendering explicitly uses Fontconfig, the bundled licensed font and a cache under this repository so macOS does not silently substitute a system font. The card's ink and paper colours come from the approved tokens. Review the result if the font or renderer changes; the JPEG is committed so a deployment does not depend on platform-specific font rasterisation.
