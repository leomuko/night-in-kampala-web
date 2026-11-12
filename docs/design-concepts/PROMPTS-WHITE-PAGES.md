# Boards 06–09: chosen white theme, exact prompts

Generated 12 November 2026 using the built-in image generation tool. The owner selected the white theme after approving the roomier homepage layout and subsequently approved these four boards. Application implementation has not started. The generation prompts below are historical records, preserved verbatim.

Follow-up review corrections govern implementation: one-of-one size is read-only (despite the pictured dropdown); online checkout requires email; fonts are Anton/Inter/Newsreader. Missing shop/mobile-product and checkout-state views are tracked in [PRE_PHASE_2_3_DESIGN_CHECKS.md](../PRE_PHASE_2_3_DESIGN_CHECKS.md). See [DESIGN_FOUNDATIONS.md](../DESIGN_FOUNDATIONS.md) for the numerical proposal awaiting approval.

## Files

- [Product detail](06-product-detail.png) — all-white variant.
- [Bag to payment](07-bag-to-payment.png) — all-white variant.
- [Events](08-events.png) — all-white variant.
- [Our process](09-our-process.png) — all-white variant.

## References and changes from PROMPTS-ROUND-2.md

Each generation attached `01-minimal-shop.png`, `02-editorial-home.png`, and the spacing-approved `05-home-white-spacious.png`, in that order. Every prompt begins with the original shared style block, removing only its amber-accent sentence for the chosen white variant. The original prompt file remains a historical brief; the exact prompts used below govern these images.

- Spacing: product, events and process boards each show one desktop viewport, with no miniature mobile companion. Additional content can continue below the viewport. Checkout retains the four separate mobile steps for comparison.
- Board 06: roomier gallery/details balance; related products below the viewport; explicit WhatsApp link; the unresolved approximate-USD placeholder becomes a clear UGX label. Garment measurements, condition, photos and item code are illustrative.
- Board 07: monochrome progress indicator; WhatsApp option in the bag; explicit arithmetic (UGX 85,000 + UGX 160,000 = UGX 245,000, plus illustrative UGX 10,000 delivery = UGX 255,000); empty personal-information fields; payment approval stays with the mobile-money provider, with no website PIN field. Countdown and delivery charges are illustrative.
- Board 08: white background, black active-tab underline and button, daylight event photography, and placeholder event title/date/venue. Past-event and product galleries remain farther down the page rather than crowding the shown viewport.
- Board 09: four borderless documentary steps in a horizontal sequence with one short sentence each; white closing section and black button. This replaces the original full-page alternating image/text overview to fit the reviewed spacing direction.

Visual review checked exact wordmark spelling, the fixed desktop navigation, readable UI, white theme, illustrative price range and relevant placeholders. On mobile the same navigation lives in a collapsed menu. Before launch, generated garments, photographs, measurements, condition text and events must be replaced with owner-supplied material.

## Exact prompts

### 06-product-detail.png

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
Caption above: "06 / THE PIECE".
Carry forward the owner-approved spacious white homepage, reference image 3. Pure white page, near-black type, fog-grey image grounds, no amber UI accent, daylight photography. Normal readable viewport scale, generous outer margins and gaps, restrained headings, thin rules only where useful, no miniature full-page squeeze. One landscape 3:2 board; no device hardware. All content illustrative. No dates, venue names, founders, reviews, statistics, customer names, actual contact numbers, or third-party logos.
Generate ONE large desktop product page viewport with comfortable whitespace, no smaller mobile companion. Header: white, heavy condensed one-line wordmark exactly "NIGHT IN KAMPALA", navigation exactly "Shop", "Drops", "Our process", "Lookbook", "Events"; small "UG / UGX", thin search and bag icons. A single airy row.
Below a generous top margin, use a balanced product layout: left about half the content width is ONE large isolated blue denim-trousers image on fog grey, visible repaired seams and original white hand-painted abstract brushwork. Four small, widely spaced gallery thumbnails below: front, back, brushwork/repair detail, model in daylight. Do not add unrelated garment imagery in this viewport.
Right about 38 percent width: breadcrumb "Shop / Denim"; small "ONE OF ONE" label; heading "Painted denim"; quiet item code "NK-0142"; price "UGX 160,000". Small explanatory line "Prices shown in UGX." No fabricated numerical exchange rate.
Size chip "Waist 32" and "Measurements" link. A compact, readable measurement table headed "Measurements (cm)" with four rows "Waist 81", "Rise 30", "Inseam 78", "Leg opening 20". These measurements are illustrative.
A full-width rectangular black "ADD TO BAG" button; below it a quieter text link "Order on WhatsApp", without a third-party logo. One short note "Adding to bag does not reserve this piece."
Four spacious accordion rows: "Condition" open with exactly "Very good. Faded at knees, small repair at left pocket."; then "How it was reworked", "Care", "Delivery and returns" closed.
Keep the title, price, measurements and purchase action clear and uncramped. Related products, newsletter and footer lie below the shown viewport. Fit the visible elements at readable size rather than shrinking a whole long page. Use generous blank space around the product and enough padding between right-column groups.
Reference roles: image 1 garment/product visual reference; image 2 condensed identity reference; image 3 approved white spacing direction. All visible words must be correctly spelled.
```

### 07-bag-to-payment.png

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
Caption above: "07 / BAG TO PAYMENT".
Carry forward the owner-approved spacious white homepage, reference image 3. Pure white page, near-black type, fog-grey image grounds, no amber UI accent, daylight photography. Normal readable viewport scale, generous outer margins and gaps, restrained headings, thin rules only where useful, no miniature full-page squeeze. One landscape 3:2 board; no device hardware. All content illustrative. No dates, venue names, founders, reviews, statistics, customer names, actual contact numbers, or third-party logos.
One landscape board with FOUR equal-height MOBILE screen views side by side, labelled outside below "Bag", "Delivery", "Payment", "Pending". These are separate steps, not one screen crammed with every field. Use almost the full canvas with generous gaps and quiet white backgrounds. Each screen must be large enough for readable text.
Every mobile screen has a simple white header: small menu icon, exact heavy condensed wordmark "NIGHT IN KAMPALA" and small bag icon. The fixed destinations Shop, Drops, Our process, Lookbook, Events live in the collapsed menu; do not draw a tiny desktop link row.
BAG: heading "Your bag (2)". Two simple item rows with small fog-grey photos and ONE OF ONE labels: "Reworked graphic tee" / "UGX 85,000", "Painted denim" / "UGX 160,000". A small "Remove" link for each. Subtotal "UGX 245,000". Note "Pieces are not reserved until checkout." Black button "CHECKOUT", then quiet secondary text link "Order on WhatsApp". Avoid extra badges or recommendation products.
DELIVERY: step line "1 Delivery · 2 Payment"; six empty labelled inputs with simple placeholders, no real personal data: "Full name", "Phone number", "Country" selected "Uganda", "District", "Area", "Nearest landmark". Two radio choices with illustrative rates: selected "Kampala delivery · UGX 10,000"; unselected "Upcountry delivery · UGX 15,000". Black "CONTINUE" button. No postal code required for Uganda.
PAYMENT: a compact order summary "Items UGX 245,000", "Delivery UGX 10,000", "Total UGX 255,000". Selected "Mobile money", two plain-text network choices "MTN" and "Airtel" without logos, an empty "Phone number" field; unselected "Card" radio row. Line "You will be charged in UGX." Black button exactly "PAY UGX 255,000".
PENDING: plenty of blank space, a thin NEAR-BLACK progress ring, title "Approve on your phone". Short line "Approve the payment prompt from your mobile money provider." No PIN field, no suggestion of entering a PIN on this website. Small text "Your pieces are held for 09:42" and quiet links "Resend prompt", "Change payment method". Pending is not success; do not show a paid confirmation.
Keep the typography clean and readable, field spacing comfortable and all arithmetic consistent. Use monochrome controls throughout.
```

### 08-events.png

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
Caption above: "08 / EVENTS".
Carry forward the owner-approved spacious white homepage, reference image 3. Pure white page, near-black type, fog-grey image grounds, no amber UI accent, daylight photography. Normal readable viewport scale, generous outer margins and gaps, restrained headings, thin rules only where useful, no miniature full-page squeeze. One landscape 3:2 board; no device hardware. All content illustrative. No dates, venue names, founders, reviews, statistics, customer names, actual contact numbers, or third-party logos.
ONE large desktop events-page viewport, no mobile companion and no full-page miniature. Header: white, heavy condensed one-line wordmark exactly "NIGHT IN KAMPALA", navigation exactly "Shop", "Drops", "Our process", "Lookbook", "Events"; small "UG / UGX", thin search and bag icons. A single airy row.
Below generous whitespace: modest condensed heading "EVENTS" and quiet serif subline "Runways, pop-ups and nights for the community." Two small tabs "Upcoming" and "Past"; "Upcoming" has a thin black underline.
After a wide vertical gap, ONE featured event section, with an original daylight documentary photograph about half the content width: a generic fashion runway with a young adult Black East African model in reworked denim, spectators softly out of focus, natural light and simple surroundings. The picture is illustrative and must not claim to show an identified actual event or venue. No dark campaign background, no amber accent.
Beside the photograph, a spacious text column with small label "KAMPALA"; obvious placeholder heading "EVENT TITLE"; separate placeholder lines "Date to be announced" and "Venue to be announced"; a modest black rectangular button "GET UPDATES" in white text. No invented date, address, event name, sponsor logos or named venue.
Use generous white margins, light typography hierarchy, a calm composition with only one featured photograph. Past-event cards and "WORN AT THE SHOW" products remain farther down the page, accessible by scroll, outside the shown viewport. Do not squeeze those extra galleries or a newsletter into this image.
Reference roles: image 1 original retail UI, image 2 identity, image 3 approved white spacing. Keep all text correctly spelled.
```

### 09-our-process.png

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
Caption above: "09 / OUR PROCESS".
Carry forward the owner-approved spacious white homepage, reference image 3. Pure white page, near-black type, fog-grey image grounds, no amber UI accent, daylight photography. Normal readable viewport scale, generous outer margins and gaps, restrained headings, thin rules only where useful, no miniature full-page squeeze. One landscape 3:2 board; no device hardware. All content illustrative. No dates, venue names, founders, reviews, statistics, customer names, actual contact numbers, or third-party logos.
ONE large desktop Our process page at natural readable scale, no mobile companion. Header: white, heavy condensed one-line wordmark exactly "NIGHT IN KAMPALA", navigation exactly "Shop", "Drops", "Our process", "Lookbook", "Events"; small "UG / UGX", thin search and bag icons. A single airy row.
A spacious opening: condensed title "FROM FOUND TO REWORKED", with a short quiet serif introduction exactly "We give secondhand clothing a new life through repair, original prints and design in Kampala." Leave substantial whitespace around this opening.
Then a calm horizontal four-step photographic sequence across the page, each with a large documentary image above a short heading and ONE short serif sentence. Four equal-width borderless columns separated by generous white gutters. The photographs have a matching daylight colour treatment and simple focused compositions; they do not contain collaged insets.
Step 1 photo: hands sorting a bale of secondhand denim at a market stall. Heading "01 FOUND". Sentence "Secondhand pieces are selected for reworking."
Step 2 photo: close-up of a tailor at a sewing machine mending a jacket seam. Heading "02 REPAIRED". Sentence "Seams and worn areas are repaired."
Step 3 photo: hands painting original white brushwork onto denim laid on a table with a screen-print frame nearby. Heading "03 REWORKED". Sentence "Original prints and designs give each piece its character."
Step 4 photo: the finished blue denim jacket on a hanger against a fog-grey wall, a plain small swing tag with no extra text or logo. Heading "04 YOURS". Sentence "A one-of-one piece, ready for its next wearer."
Below, after a generous white gap, a minimal WHITE closing section, short line "Every piece exists once." and a black button "SHOP THE DROP". No near-black closing band, no amber accent. The main footer is below the shown area.
Prioritise a quiet layout: restrained headings, only one sentence per step, no boxed cards, no extra badges, no ornamental dividers, no dense paragraphs or full-site miniature. Every visible word must be correctly spelled; no statistics or numerical environmental claims.
```
