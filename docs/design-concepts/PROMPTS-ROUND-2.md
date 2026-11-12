# Night in Kampala: image prompts, round 2

Drafted 12 November 2026 for handoff to the image agent. Historical prompt set: the owner later selected the roomier white theme and approved boards 06–09. These original prompts build on round 1 and explore "day shop, night story". They remain unchanged below as a record; current fonts, spacing proposals and implementation corrections are in [DESIGN_FOUNDATIONS.md](../DESIGN_FOUNDATIONS.md) and the [current concept index](README.md).

If the owner keeps the all-white theme instead, remove the sentences marked `[NIGHT]` and the amber accent from the shared block.

## How to use

1. Paste the **shared style block** at the start of every prompt, unchanged, so all boards match.
2. Attach `01-minimal-shop.png` and `02-editorial-home.png` as style references where the tool allows it.
3. Generate one board per prompt, landscape, about 3:2.
4. All products, prices, models and events are illustrative. Do not add dates, venues, reviews, statistics or third-party logos.

## Shared style block

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
```

## 04 / Style frame

```text
[shared style block]
Caption above: "04 / STYLE FRAME".
A single brand and UI reference sheet arranged in a tidy grid, not a website page.
Row 1: the wordmark "NIGHT IN KAMPALA" shown twice, black on white and white on near-black, plus a compact stacked two-line version for mobile headers.
Row 2: five labelled colour swatches with hex codes: Paper #FFFFFF, Ink #0B0B0C, Fog #F1F1EF, Hairline #E2E2DF, Streetlight #F2A93B.
Row 3: type specimens labelled "Display", "Heading", "Body", "Editorial", "Label", each showing the sample line "Reworked in Kampala."
Row 4: components at real size: primary black button "ADD TO BAG", secondary outlined button "SAVE DRAFT", disabled button "SOLD", the three labels "ONE OF ONE", "NEW", "SOLD", a text input "Email address", a dropdown "Sort: Newest", the icon set, and one product card with fog-grey image field, name "Painted denim" and "UGX 160,000".
Row 5: two photography tiles side by side labelled "Day: product" (isolated garment on fog grey, soft even light) and "Night: campaign" (model in reworked denim on a Kampala street after dark, lit by warm amber streetlight, deep shadows, no neon).
```

## 05 / Home, day and night

```text
[shared style block]
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

## 06 / Product detail

```text
[shared style block]
Caption above: "06 / THE PIECE".
Desktop product page at about 75 percent width, mobile product page at right. White page throughout.
Desktop left two-thirds: a gallery for one garment, hand-painted blue denim trousers, as a large main image on fog grey with four thumbnails below: front flat-lay, back flat-lay, close-up of brushwork and mended knee, and the piece worn by a model.
Desktop right third, top to bottom: breadcrumb "Shop / Denim"; label "ONE OF ONE"; name "Painted denim"; small grey item code "NK-0142"; price "UGX 160,000" with a small grey "≈ USD estimate" line; a single size chip "Waist 32" with link "Measurements"; a compact measurement table with rows "Waist", "Rise", "Inseam", "Leg opening" in cm; full-width black button "ADD TO BAG"; one line under it "Only one exists. Adding to bag does not reserve it."; then four accordion rows "Condition", "How it was reworked", "Care", "Delivery and returns", with "Condition" open and reading "Very good. Faded at knees, small repair at left pocket."
Below the fold: heading "MORE FROM THIS DROP" and four product cards, one carrying a "SOLD" label with its image slightly dimmed.
Mobile: full-width swipeable image with dots, then the same information stacked, and a sticky bottom bar showing "UGX 160,000" and a black "ADD TO BAG" button.
```

## 07 / Bag and checkout, mobile first

```text
[shared style block]
Caption above: "07 / BAG TO PAYMENT".
Four tall mobile viewports in a row, equal size, labelled beneath in small caps "Bag", "Delivery", "Payment", "Pending". White screens.
Bag: header "Your bag (2)", two line items with small fog-grey thumbnails, names, "ONE OF ONE" labels, prices and "Remove" links; note "Pieces are not reserved until checkout."; subtotal row; black button "CHECKOUT".
Delivery: step indicator "1 Delivery · 2 Payment"; fields "Full name", "Phone number", "Country" set to "Uganda", "District", "Area", "Nearest landmark"; two delivery options as radio rows, "Kampala delivery" and "Upcountry delivery", each with an illustrative UGX fee; black button "CONTINUE".
Payment: order summary with items, delivery and total in UGX; payment method rows "Mobile money" selected, with plain text sub-options "MTN" and "Airtel" and a phone number field, and "Card" unselected; line "You will be charged in UGX."; black button "PAY UGX 255,000".
Pending: centered thin amber progress ring, heading "Approve on your phone", line "We sent a payment prompt to your number. Enter your PIN to finish.", small countdown "Your pieces are held for 09:42", text links "Resend prompt" and "Change payment method".
Do not draw telecom logos; use plain text names only.
```

## 08 / Events

```text
[shared style block]
Caption above: "08 / EVENTS".
Desktop events page at about 75 percent width, mobile at right.
[NIGHT] The whole page uses the near-black background with white text; header inverted to white wordmark and icons on black.
Top: large condensed heading "EVENTS" with serif subline "Runways, pop-ups and nights for the community."; two tabs "Upcoming" and "Past", "Upcoming" underlined in amber.
Featured event: a wide documentary photograph of a runway in a warehouse-style venue at night, models in reworked denim, audience in shadow, warm amber practical lights. Beside it: a small label "KAMPALA", placeholder title "EVENT TITLE", placeholder rows "Date to be announced" and "Venue to be announced", and a white rectangular button "GET UPDATES".
Below: a three-column grid of past-event tiles, each a photograph with a city label "KAMPALA" or "NAIROBI" and placeholder title "Past event", no dates.
Bottom band on white, returning to the shop: heading "WORN AT THE SHOW" and four product cards.
Mobile: same order, single-column event tiles.
```

## 09 / Our process

```text
[shared style block]
Caption above: "09 / OUR PROCESS".
Desktop story page at about 75 percent width, mobile at right. White page with one near-black closing band.
Top: condensed heading "FROM FOUND TO REWORKED" and a two-line serif introduction about giving discarded clothing a second life in Kampala.
Then four numbered steps in an alternating image-and-text layout, each with a documentary workshop photograph in natural daylight:
"01 FOUND": hands sorting through a bale of secondhand denim at a market stall.
"02 REPAIRED": a tailor at a sewing machine mending a jacket seam.
"03 REWORKED": hands painting white brushwork onto denim laid on a table, and a screen-print frame nearby.
"04 YOURS": the finished jacket on a hanger against a fog-grey wall with a small handwritten swing tag.
Each step has one short serif sentence, no statistics and no claims about quantities saved.
[NIGHT] Closing band on near-black: line "Every piece exists once." and a white button "SHOP THE DROP".
Mobile: steps stacked, image above text.
```

## 10 / Admin: orders (optional)

```text
[shared style block, but ignore the navigation line and the night treatment]
Caption above: "10 / ORDERS". Matches the existing dashboard concept: narrow black left sidebar with "NIGHT IN KAMPALA", "ADMIN" and items "Overview", "Products", selected "Orders", "Inventory", "Collections", "Lookbooks", "Events", "Content", "Settings"; white and pale grey canvas.
Main area left two-thirds: heading "Orders", tabs "To pack", "Dispatched", "All"; table columns "Order", "Items", "Destination", "Total", "Payment", "Fulfilment". Four demo rows using order codes like "NK-1042", destinations "Kampala", "Gulu", "Nairobi", "London", payment states "Paid" in green or "Pending" in amber, fulfilment states "Unfulfilled", "Packing", "Dispatched". No customer names, phone numbers or addresses.
Right third: order detail panel "NK-1042" with item thumbnails, a payment line "Paid · Mobile money · Verified", a "Courier and tracking" input, buttons "Print packing slip" and black "Mark dispatched".
```
