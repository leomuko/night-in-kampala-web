# Night in Kampala: visual concepts

Generated 11 November 2026 using the built-in image generation tool. These are visual proposals, not screenshots of an implemented website. Product designs, model imagery, text, prices and stock are illustrative. Generated mockups were reviewed for overall layout, legibility and consistency with the plan; final UI details will be resolved in implementation.

1. [Clean shop](01-minimal-shop.png): desktop and mobile catalogue, closest to the supplied reference.
2. [Editorial homepage](02-editorial-home.png): desktop and mobile, campaign photography, product discovery, reworking story and events.
3. [Admin dashboard](03-admin-dashboard.png): catalogue table and product-upload/editing panel.

Current direction: **all-white with the roomier homepage layout**, selected by the owner after the theme comparison and spacing revision. Use the heavy condensed wordmark and fixed navigation from round 2. The owner has approved boards 06–09 below. The [Phase 1 task breakdown](../PHASE_1_TASKS.md) is prepared for presentation before implementation; no application code has been written.

### Follow-up review corrections

Fonts are now named **Anton / Inter / Newsreader**. [DESIGN_FOUNDATIONS.md](../DESIGN_FOUNDATIONS.md) lists exact proposed gutters, gaps and type sizes for approval before tokens are written. Shop layout is three desktop columns/two mobile columns; desktop wordmark is left aligned, with no announcement bar or account icon.

Use the new [standalone generated placeholders](../implementation-assets/placeholders/README.md) during development, visibly labelled and excluded from real sales. Earlier sunburst/face motifs remain placeholders, not final brand designs. Missing shop/mobile product views, the read-only one-of-one size correction, required online-checkout email, and success/failure/international checkout screens are tracked in [the Phase 2/3 design checks](../PRE_PHASE_2_3_DESIGN_CHECKS.md). Approval of the old pictures does not override these follow-up corrections.

## Chosen white theme — boards 06–09

The owner approved the increased breathing room, then selected the white version. The approved spacing reference is [05-home-white-spacious.png](05-home-white-spacious.png), with the white mobile direction shown in [05-mobile-spacious-comparison.png](05-mobile-spacious-comparison.png). The earlier [white style frame](04-style-frame-white.png) supplies the monochrome palette and type direction; any final style-frame refinements must preserve the approved roomier spacing before tokens are built.

| Board | White variant | Review status |
| --- | --- | --- |
| 06 / Product detail | [06-product-detail.png](06-product-detail.png) | Approved by owner |
| 07 / Bag to payment | [07-bag-to-payment.png](07-bag-to-payment.png) | Approved by owner |
| 08 / Events | [08-events.png](08-events.png) | Approved by owner |
| 09 / Our process | [09-our-process.png](09-our-process.png) | Approved by owner |

Generated with the built-in image tool using both round-1 references plus the roomier white homepage. Exact prompts and every variation from the original round-2 brief are recorded in [PROMPTS-WHITE-PAGES.md](PROMPTS-WHITE-PAGES.md). Products, measurements, shipping rates, countdowns and event content remain illustrative. No names, actual contact details, dates or named venues were supplied or invented. Board 10 has not been requested or generated.

Board approval is complete and the [Phase 1 tasks](../PHASE_1_TASKS.md) have been presented and reviewed. Before building, obtain approval of the numerical layout proposal and record the requested baseline commit. The first application file remains `src/styles/tokens.css`. No application code or Firebase resources have been created; pushing has not been requested.

## Round 2

Review on 12 November 2026 found the round-1 concepts disagree on wordmark, navigation and price range, and that none of them reflects the "night" in the brand name. [PROMPTS-ROUND-2.md](PROMPTS-ROUND-2.md) fixes those with a shared style block and adds boards 04 to 10 (style frame, home, product detail, bag to payment, events, our process, admin orders).

### Theme comparison — generated 12 November 2026

**Historical theme comparison.** The owner subsequently chose the white theme and approved the roomier layout; see the current selection above. These original four comparison boards are retained as exploration material. Board 10 remains optional and has not been generated.

| Board | Day shop, night story | All-white |
| --- | --- | --- |
| 04 / Style frame | [04-style-frame-night.png](04-style-frame-night.png) | [04-style-frame-white.png](04-style-frame-white.png) |
| 05 / Home — desktop and mobile | [05-home-night.png](05-home-night.png) | [05-home-white.png](05-home-white.png) |

Generated with the built-in image tool. Both round-1 images `01-minimal-shop.png` and `02-editorial-home.png` were attached as style references to every generation. Each saved board is a 1536 × 1024 PNG (3:2). Products, prices, photography and editorial copy are illustrative.

Visual review checked wordmark spelling, fixed navigation, legibility, price range, theme treatment and page order. The first white style-frame attempt omitted the navigation specimen and was regenerated; only the corrected version is saved here. The inverse white-on-ink wordmark in the white style frame demonstrates logo contrast; the white homepage retains white hero, events and footer sections.

### Spacing revision — owner feedback, 12 November 2026

The owner found the original round-2 boards too crowded. New homepage views reduce the amount shown at once, separate desktop from mobile presentation, use one campaign model and three desktop product cards, and increase visual space. Process, events, newsletter and footer continue below the shown viewport. The owner subsequently approved this roomier layout and selected the white version. Earlier images are retained for comparison.

- [Roomier night desktop](05-home-night-spacious.png)
- [Roomier white desktop](05-home-white-spacious.png)
- [Roomier mobile comparison: night and white](05-mobile-spacious-comparison.png)

**White theme and roomier spacing selected; boards 06–09 approved.** The Phase 1 task breakdown is now recorded. Any final style-frame refinements must reflect the approved spacing before design tokens are built.

Generated using the built-in image tool with both round-1 style references attached. Exact prompts and all differences from the original composition are recorded in [PROMPTS-SPACING-REVISION.md](PROMPTS-SPACING-REVISION.md). All images remain illustrative. No commit or push was made during that generation stage; a local baseline was subsequently requested in the pre-build review.

### Exact round-2 prompts used

The shared style block is expanded in full below. The night prompts match PROMPTS-ROUND-2.md unchanged after expansion. White prompts remove the amber accent sentence, use four monochrome swatches and daylight campaign photography for board 04, and replace the tagged night sections with white/daylight equivalents for board 05. The white style-frame regeneration adds an explicit navigation/daylight correction, recorded verbatim below.

<details>
<summary>04-style-frame-night.png — Night variant</summary>

```text
Use case: ui-mockup. High-fidelity website design board for NIGHT IN KAMPALA, a Ugandan fashion brand that reworks secondhand clothing with original hand-painted and screen-printed designs, sells one-of-one pieces to Uganda and international shoppers, and runs fashion events. Proposed interface, illustrative content only.
Board: wide landscape, neutral off-white ground, flat front-facing viewports, no perspective, no device hardware, no decorative scene. All UI text large, sharp and correctly spelled.
Identity: wordmark "NIGHT IN KAMPALA" set in a heavy condensed grotesque, all caps, tight tracking, always on one line on desktop. Headings in the same condensed face. Body and UI labels in a clean neutral grotesque. Short editorial sublines in a quiet serif.
Palette: paper white #FFFFFF, ink near-black #0B0B0C, fog grey #F1F1EF for product image fields, hairline grey #E2E2DF for borders. One accent only: warm streetlight amber #F2A93B, used sparingly for a single highlight per screen, never for body text or large fills.
Components: square corners, thin 1px borders, rectangular black buttons with white caps text, small rectangular labels "ONE OF ONE", "NEW", "SOLD". Thin-line icons for menu, search, account, bag. Market control "UG / UGX".
Navigation, identical on every board: "Shop", "Drops", "Our process", "Lookbook", "Events".
Garments: original photorealistic reworked pieces, washed black tees, blue denim, off-white camp shirts, olive workwear, with bold hand-painted white or black abstract brushwork (suns, wavy lines, linework faces, geometric blocks). Visible fabric texture, mended seams and patching. No recognisable brand logos.
People: young adult Black East African models, dignified contemporary fashion photography, natural skin texture.
Prices in Ugandan shillings between UGX 85,000 and UGX 220,000.
Avoid: gradients, glassmorphism, rounded SaaS cards, neon, nightclub imagery, skyline clichés, stock-photo smiles, fake reviews, impact statistics, invented dates or venues.
Tiny footer outside the UI: "DESIGN CONCEPT · ILLUSTRATIVE CONTENT".
Caption above: "04 / STYLE FRAME".
A single brand and UI reference sheet arranged in a tidy grid, not a website page.
Row 1: the wordmark "NIGHT IN KAMPALA" shown twice, black on white and white on near-black, plus a compact stacked two-line version for mobile headers.
Row 2: five labelled colour swatches with hex codes: Paper #FFFFFF, Ink #0B0B0C, Fog #F1F1EF, Hairline #E2E2DF, Streetlight #F2A93B.
Row 3: type specimens labelled "Display", "Heading", "Body", "Editorial", "Label", each showing the sample line "Reworked in Kampala."
Row 4: components at real size: primary black button "ADD TO BAG", secondary outlined button "SAVE DRAFT", disabled button "SOLD", the three labels "ONE OF ONE", "NEW", "SOLD", a text input "Email address", a dropdown "Sort: Newest", the icon set, and one product card with fog-grey image field, name "Painted denim" and "UGX 160,000".
Row 5: two photography tiles side by side labelled "Day: product" (isolated garment on fog grey, soft even light) and "Night: campaign" (model in reworked denim on a Kampala street after dark, lit by warm amber streetlight, deep shadows, no neon).
```

</details>

<details>
<summary>04-style-frame-white.png — White variant</summary>

```text
Use case: ui-mockup. High-fidelity website design board for NIGHT IN KAMPALA, a Ugandan fashion brand that reworks secondhand clothing with original hand-painted and screen-printed designs, sells one-of-one pieces to Uganda and international shoppers, and runs fashion events. Proposed interface, illustrative content only.
Board: wide landscape, neutral off-white ground, flat front-facing viewports, no perspective, no device hardware, no decorative scene. All UI text large, sharp and correctly spelled.
Identity: wordmark "NIGHT IN KAMPALA" set in a heavy condensed grotesque, all caps, tight tracking, always on one line on desktop. Headings in the same condensed face. Body and UI labels in a clean neutral grotesque. Short editorial sublines in a quiet serif.
Palette: paper white #FFFFFF, ink near-black #0B0B0C, fog grey #F1F1EF for product image fields, hairline grey #E2E2DF for borders.
Components: square corners, thin 1px borders, rectangular black buttons with white caps text, small rectangular labels "ONE OF ONE", "NEW", "SOLD". Thin-line icons for menu, search, account, bag. Market control "UG / UGX".
Navigation, identical on every board: "Shop", "Drops", "Our process", "Lookbook", "Events".
Garments: original photorealistic reworked pieces, washed black tees, blue denim, off-white camp shirts, olive workwear, with bold hand-painted white or black abstract brushwork (suns, wavy lines, linework faces, geometric blocks). Visible fabric texture, mended seams and patching. No recognisable brand logos.
People: young adult Black East African models, dignified contemporary fashion photography, natural skin texture.
Prices in Ugandan shillings between UGX 85,000 and UGX 220,000.
Avoid: gradients, glassmorphism, rounded SaaS cards, neon, nightclub imagery, skyline clichés, stock-photo smiles, fake reviews, impact statistics, invented dates or venues.
Tiny footer outside the UI: "DESIGN CONCEPT · ILLUSTRATIVE CONTENT".
Caption above: "04 / STYLE FRAME".
A single brand and UI reference sheet arranged in a tidy grid, not a website page.
Row 1: the wordmark "NIGHT IN KAMPALA" shown twice, black on white and white on near-black, plus a compact stacked two-line version for mobile headers.
Row 2: four labelled colour swatches with hex codes: Paper #FFFFFF, Ink #0B0B0C, Fog #F1F1EF, Hairline #E2E2DF.
Row 3: type specimens labelled "Display", "Heading", "Body", "Editorial", "Label", each showing the sample line "Reworked in Kampala."
Row 4: components at real size: primary black button "ADD TO BAG", secondary outlined button "SAVE DRAFT", disabled button "SOLD", the three labels "ONE OF ONE", "NEW", "SOLD", a text input "Email address", a dropdown "Sort: Newest", the icon set, and one product card with fog-grey image field, name "Painted denim" and "UGX 160,000".
Row 5: two photography tiles side by side labelled "Day: product" (isolated garment on fog grey, soft even light) and "Day: campaign" (model in reworked denim on a Kampala street in natural daylight, soft shadows, no neon).
Required correction for this regenerated board: include a full-width navigation specimen directly below the wordmark row, with exactly "Shop", "Drops", "Our process", "Lookbook", "Events", followed by thin-line search, account and bag icons and "UG / UGX". Keep all five sections of the style frame and the four monochrome swatches. The daylight campaign photograph must show a model in reworked denim in natural daylight. Keep the wordmark exactly "NIGHT IN KAMPALA", all UI text correctly spelled, and the wide landscape board approximately 3:2.
```

</details>

<details>
<summary>05-home-night.png — Night variant</summary>

```text
Use case: ui-mockup. High-fidelity website design board for NIGHT IN KAMPALA, a Ugandan fashion brand that reworks secondhand clothing with original hand-painted and screen-printed designs, sells one-of-one pieces to Uganda and international shoppers, and runs fashion events. Proposed interface, illustrative content only.
Board: wide landscape, neutral off-white ground, flat front-facing viewports, no perspective, no device hardware, no decorative scene. All UI text large, sharp and correctly spelled.
Identity: wordmark "NIGHT IN KAMPALA" set in a heavy condensed grotesque, all caps, tight tracking, always on one line on desktop. Headings in the same condensed face. Body and UI labels in a clean neutral grotesque. Short editorial sublines in a quiet serif.
Palette: paper white #FFFFFF, ink near-black #0B0B0C, fog grey #F1F1EF for product image fields, hairline grey #E2E2DF for borders. One accent only: warm streetlight amber #F2A93B, used sparingly for a single highlight per screen, never for body text or large fills.
Components: square corners, thin 1px borders, rectangular black buttons with white caps text, small rectangular labels "ONE OF ONE", "NEW", "SOLD". Thin-line icons for menu, search, account, bag. Market control "UG / UGX".
Navigation, identical on every board: "Shop", "Drops", "Our process", "Lookbook", "Events".
Garments: original photorealistic reworked pieces, washed black tees, blue denim, off-white camp shirts, olive workwear, with bold hand-painted white or black abstract brushwork (suns, wavy lines, linework faces, geometric blocks). Visible fabric texture, mended seams and patching. No recognisable brand logos.
People: young adult Black East African models, dignified contemporary fashion photography, natural skin texture.
Prices in Ugandan shillings between UGX 85,000 and UGX 220,000.
Avoid: gradients, glassmorphism, rounded SaaS cards, neon, nightclub imagery, skyline clichés, stock-photo smiles, fake reviews, impact statistics, invented dates or venues.
Tiny footer outside the UI: "DESIGN CONCEPT · ILLUSTRATIVE CONTENT".
Caption above: "05 / HOME".
Large desktop homepage at about 75 percent width, tall mobile homepage at right. Show the full page length in both.
Header: white, wordmark left on desktop and centered on mobile, navigation, search, "UG / UGX", bag.
[NIGHT] Hero: full-width near-black campaign band. Night photograph of two models in reworked blue denim and printed tops on a Kampala roadside, warm amber streetlight from above, a passing motorcycle taxi as soft blurred light in the background, deep natural shadows. Headline in white condensed caps "A SECOND LIFE." with serif subline "Reworked in Kampala." and a white rectangular button "SHOP THE DROP". Keep the hero no taller than 60 percent of the first screen so products are visible beneath it.
Below, on white: heading "THE LATEST PIECES", a row of four product cards on fog-grey fields with labels, names and UGX prices, and a text link "View all".
Then a white split section "FROM FOUND TO REWORKED": close-up of hands pulling a screen-print squeegee across a tee, with two lines of serif copy and a link "See our process".
[NIGHT] Then a near-black events band: heading "KAMPALA / NAIROBI", one line "Our fashion events bring the community together.", link "Explore events" with a small amber arrow, and a dim documentary photograph of a runway audience seen from behind.
Then a white newsletter row: "Be first to the next drop.", email input, black button "JOIN".
[NIGHT] Footer: near-black with white wordmark and three link columns "Shop", "Help", "Brand".
Mobile: same order, hero cropped to the models' upper bodies, two-column product grid.
```

</details>

<details>
<summary>05-home-white.png — White variant</summary>

```text
Use case: ui-mockup. High-fidelity website design board for NIGHT IN KAMPALA, a Ugandan fashion brand that reworks secondhand clothing with original hand-painted and screen-printed designs, sells one-of-one pieces to Uganda and international shoppers, and runs fashion events. Proposed interface, illustrative content only.
Board: wide landscape, neutral off-white ground, flat front-facing viewports, no perspective, no device hardware, no decorative scene. All UI text large, sharp and correctly spelled.
Identity: wordmark "NIGHT IN KAMPALA" set in a heavy condensed grotesque, all caps, tight tracking, always on one line on desktop. Headings in the same condensed face. Body and UI labels in a clean neutral grotesque. Short editorial sublines in a quiet serif.
Palette: paper white #FFFFFF, ink near-black #0B0B0C, fog grey #F1F1EF for product image fields, hairline grey #E2E2DF for borders.
Components: square corners, thin 1px borders, rectangular black buttons with white caps text, small rectangular labels "ONE OF ONE", "NEW", "SOLD". Thin-line icons for menu, search, account, bag. Market control "UG / UGX".
Navigation, identical on every board: "Shop", "Drops", "Our process", "Lookbook", "Events".
Garments: original photorealistic reworked pieces, washed black tees, blue denim, off-white camp shirts, olive workwear, with bold hand-painted white or black abstract brushwork (suns, wavy lines, linework faces, geometric blocks). Visible fabric texture, mended seams and patching. No recognisable brand logos.
People: young adult Black East African models, dignified contemporary fashion photography, natural skin texture.
Prices in Ugandan shillings between UGX 85,000 and UGX 220,000.
Avoid: gradients, glassmorphism, rounded SaaS cards, neon, nightclub imagery, skyline clichés, stock-photo smiles, fake reviews, impact statistics, invented dates or venues.
Tiny footer outside the UI: "DESIGN CONCEPT · ILLUSTRATIVE CONTENT".
Caption above: "05 / HOME".
Large desktop homepage at about 75 percent width, tall mobile homepage at right. Show the full page length in both.
Header: white, wordmark left on desktop and centered on mobile, navigation, search, "UG / UGX", bag.
Hero: full-width white campaign band. Daylight photograph of two models in reworked blue denim and printed tops on a Kampala roadside, natural daylight and soft shadows. Headline in black condensed caps "A SECOND LIFE." with serif subline "Reworked in Kampala." and a black rectangular button "SHOP THE DROP" with white text. Keep the hero no taller than 60 percent of the first screen so products are visible beneath it.
Below, on white: heading "THE LATEST PIECES", a row of four product cards on fog-grey fields with labels, names and UGX prices, and a text link "View all".
Then a white split section "FROM FOUND TO REWORKED": close-up of hands pulling a screen-print squeegee across a tee, with two lines of serif copy and a link "See our process".
Then a white events band: heading "KAMPALA / NAIROBI", one line "Our fashion events bring the community together.", link "Explore events" with a small black arrow, and a daylight documentary photograph of a runway audience seen from behind.
Then a white newsletter row: "Be first to the next drop.", email input, black button "JOIN".
Footer: white with black wordmark and three link columns "Shop", "Help", "Brand".
Mobile: same order, hero cropped to the models' upper bodies, two-column product grid.
```

</details>

## Generation prompts

### 01-minimal-shop

```text
Use case: ui-mockup.
Generate one high-fidelity website design presentation image for NIGHT IN KAMPALA, a Ugandan fashion brand reworking secondhand clothing with new prints and designs, serving Uganda and international shoppers. This is a proposed interface mockup, all products and prices illustrative.
Composition: wide landscape design board, clean neutral background, a large front-facing desktop browser viewport occupying about 75 percent of the width and a tall mobile viewport at the right occupying 22 percent, both flat, crisp, no perspective, no physical devices, no decorative scene. Small caption above: "01 / THE CLEAN SHOP". Make the actual UI large and readable.
Primary direction: refined monochrome streetwear e-commerce, closely based on a mobile shop with a white header, centered bold wordmark, thin black menu/search/account/bag icons; pale grey product image fields and white compact captions. Black and white palette with true garment colour. Minimal borders, square buttons, plenty of breathing room, practical retail hierarchy.
Desktop: small top line "REWORKED IN KAMPALA"; white header exact wordmark "NIGHT IN KAMPALA"; navigation "New arrivals", "Shop", "Collections", "Our process", "Events"; market control "UG / UGX", search and bag. Modest heading "One piece. A new story." and tiny sentence "Reworked clothing from Kampala." no enormous hero. Heading "NEW ARRIVALS", a small filter/sort row, four-column product grid, two rows partly visible. Product imagery must be original photorealistic flat-lay or isolated garments with detailed fabric: washed black graphic tee, distressed blue denim with original hand-painted white abstract motifs, off-white printed shirt, olive reworked jacket. No recognisable brand logos. Small labels "ONE OF ONE" and "NEW". Names and UGX prices below, e.g. "Reworked graphic tee" / "UGX 85,000", "Painted denim" / "UGX 160,000". A discreet sold piece may show "SOLD".
Mobile viewport: same matching store identity, centered wordmark, menu search and bag icons, two equal garment columns with pale grey image tiles and short titles/prices, compact filter controls. Keep mobile and desktop design consistent.
Constraints: polished realistic implementable React store, legible typography, no gradients, no generic SaaS cards, no third-party names, no fake reviews, no unrelated graphics, no giant rounded containers. Include a tiny board-level footer outside the UI "DESIGN CONCEPT · ILLUSTRATIVE PRODUCTS".
```

### 02-editorial-home

```text
Use case: ui-mockup.
Generate one high-fidelity website design presentation image for the fashion e-commerce brand NIGHT IN KAMPALA. Brand refurbishes discarded clothing in Uganda, adds original prints and designs, resells unique pieces, and organises fashion events in Kampala and Nairobi. This is an alternative homepage direction, not an existing website.
Composition: wide landscape, neutral off-white presentation ground, a large flat desktop homepage occupying about 75 percent of width with a narrow flat mobile homepage at right. No angled screens, no device hardware, all text and imagery sharply readable. Top outside UI caption "02 / THE EDITORIAL DROP".
Direction: art-directed fashion magazine meets accessible clothing store. White and black UI, assertive editorial typography, generous space, photographic warmth and blue denim as colour. Original photography of young adult Black East African models wearing reworked garments with abstract painted/printed designs. Real Kampala urban texture, warm concrete courtyard, natural daylight; dignified contemporary fashion photography. No nightclub clichés, no neon skyline.
Desktop header: exact wordmark "NIGHT IN KAMPALA", compact navigation "Shop", "Drops", "Our process", "Lookbook", "Events"; search, "UG / UGX", bag.
Hero: asymmetrical split composition, a bold oversized headline "A SECOND LIFE." with smaller line "Reworked in Kampala." and rectangular black "SHOP THE DROP" button; adjacent large campaign photo of two young adult fashion models wearing original reworked blue denim and black/off-white printed tops. Under hero, "THE LATEST PIECES" and a neat row of four original isolated garments on pale grey backgrounds with concise names and UGX prices. At lower edge, smaller editorial teaser "FROM FOUND TO REWORKED" with a close-up of hands screen-printing a tee, and a restrained events teaser "KAMPALA / NAIROBI" with "Explore events". Do not invent dates or venues.
Mobile: same white header and wordmark; a strong crop of same campaign photograph, compact "A SECOND LIFE." headline, shop button, and two-column product grid, maintaining a usable store.
Constraints: clearly working-store layout instead of art poster, no copied brand graphics or logos, all garments and models original, no fabricated testimonials or impact statistics. Tiny outside-UI footer "DESIGN CONCEPT · ILLUSTRATIVE PRODUCTS".
```

### 03-admin-dashboard

```text
Use case: ui-mockup.
Generate one high-fidelity front-facing desktop web admin-dashboard mockup for NIGHT IN KAMPALA, a Ugandan reworked-clothing fashion store with Kampala/Nairobi fashion events. Wide landscape image, practically implementable React dashboard, crisp readable text, no perspective or device hardware. Outside-UI top caption "03 / THE STORE DASHBOARD" and tiny bottom caption "DESIGN CONCEPT · DEMO DATA".
Design: calm white and pale grey working canvas, narrow black left sidebar, sharp restrained typography, subtle grey borders, square or very slightly rounded buttons. Product thumbnails provide muted denim blue and olive colour, subtle green status text only. This must feel like a usable everyday clothing administration tool.
Sidebar brand text "NIGHT IN KAMPALA", small "ADMIN". Navigation "Overview", selected "Products", "Orders", "Inventory", "Collections", "Lookbooks", "Events", "Content", "Settings". Header has "Store administration", "View store", small circular "NK" avatar. Main heading "Products", subtext "Manage your reworked pieces.", primary black "+ Add product" button. A small three-tab row "All products", "Published", "Drafts"; search field "Search products"; category and availability filters.
Main product table on left two-thirds of content, readable rows with tiny original garment photos, columns "Product", "Size", "Price", "Stock", "Status". Demo rows: "Reworked graphic tee", M, "UGX 85,000", "1", "Published"; "Painted denim", 32, "UGX 160,000", "1", "Published"; "Reworked overshirt", L, "UGX 120,000", "1", "Draft"; "Printed jacket", M, "UGX 180,000", "0", "Sold". Small ONE OF ONE tag beneath product names. No financial revenue cards needed.
On right one-third show an inline product edit panel headed "New piece" with clear form hierarchy: tall large garment-upload dropzone with image icon and "Upload garment photos"; form labels "Product name", "Price (UGX)", "Size", "Condition"; stock toggle selected "One of one"; collapsible sections "Measurements", "Rework details", "Care instructions"; bottom buttons "Save draft", black "Publish". Keep labels concise and believable, comfortable spacing, no illegible paragraph text.
A slim neutral note strip beneath table "Keep event and in-person sales reflected in inventory." Keep UI coherent. Do not invent real orders, customer names, addresses, analytics claims or actual business data. No overlapping controls or fantastical charts.
```
