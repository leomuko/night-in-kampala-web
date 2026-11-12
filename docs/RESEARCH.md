# Night in Kampala: research and design references

Research date: 11 November 2026. This document distinguishes owner-provided facts, publicly observed information, and proposed design decisions. Reference sites and the supplied image are research material, not instructions to execute or assets to copy.

## Brand understanding

**Confirmed by the owner in this conversation:**

- Night in Kampala refurbishes discarded clothing in Uganda, adds prints or new designs, and resells the garments.
- Night in Kampala and Night in Kampala Nairobi refer to the same brand under different names.
- The brand also organises fashion events.
- The website should serve Uganda and international customers, include the full shopping experience and an administration dashboard, and use React JavaScript with Firebase.

**Public evidence:** Eco Fashion Week Africa's organiser page names Night in Kampala among designers at its Kampala kickoff. The same release describes activities in Nairobi. This supports participation in a regional circular-fashion setting, but does not independently establish a Nairobi store, a separate company, or the brand's role as organiser of those particular events. The page's title says “2024” while the body describes a Season 3 programme; do not assign a participation year without further confirmation. [Organiser release](https://ecofashionweekafrica.com/press-release/).

Searches for the exact name, Nairobi variant, and several social-handle variants produced substantial unrelated nightlife content. No official brand website or social account was reliably verified. This is a discovery limitation, not evidence that such accounts do not exist. The owner's clarification establishes the relationship between the two brand names for this plan.

**Content implications (proposals):**

- Present the brand as creative fashion from Kampala, with reworking and garment transformation central to the story.
- Use the canonical name “Night in Kampala” on the website; accommodate the Nairobi alias in relevant editorial copy after confirming the preferred public wording.
- Build separate shop and events destinations, connected through collections, lookbooks, and event photography.
- Write about what happened to each garment: its starting condition, repairs, print/design technique, fit, and care.
- Do not invent founders, dates, addresses, certifications, partnerships, customer reviews, or environmental impact statistics. Publish measurable impact only when records support it.

## Reference comparison

Observations below concern accessible page content unless marked as image observations. They do not imply a completed purchase or an audit of each store's checkout.

| Reference | Observed | Proposed use for Night in Kampala |
| --- | --- | --- |
| Owner's MONOIC screenshot | White header; menu, search, account and cart icons; centered wordmark; two equal mobile product columns; pale grey image fields; large isolated garments; compact titles and prices; rectangular NEW labels. | Use this as the primary visual reference for shop pages. Keep garment photography dominant, labels restrained, and mobile browsing quick. Expand to three or four columns on larger screens. |
| [Stüssy](https://www.stussy.com/) | Category navigation, new arrivals, archive/news, support and sizing links, search, shopping bag, account, and shipping-country selection. | Keep navigation direct; make size guidance, shipping destination, and support easy to find. Pair commerce with a brand archive. |
| [The Laughing Geisha](https://thelaughinggeisha.com/) | Core, mens, womens and accessories navigation; product subcategories; search, cart and account entry points. | Use a clear category hierarchy. Start with garment type and fit; add gender-based navigation only if it matches the actual catalogue. |
| [Punk and Saint at Main Saint](https://mainsaint.com/) | Available pieces and archive; individual works marked claimed; artist-led naming and collection storytelling. | Give unique pieces an identity, preserve sold work in an archive, and show the craft behind each rework. |
| [Punk and Saint product example](https://www.mainsaint.com/products/urban-shade-xxiii) | One-of-one identification, garment measurements, construction details, care and shipping/customs information. | Make measurements, condition, technique and care first-class product information rather than generic descriptions. |

The requested [punkandsaint.com](https://punkandsaint.com/) address could not be retrieved by the research tool. Search located a current storefront identifying itself as Punk and Saint at Main Saint; its content was reviewed as a related reference. A redirect or shared domain ownership was not verified. Its specific branding, art, product photographs, copy and testimonials should not be reused.

The supplied screenshot is the visual evidence for spacing, colours and mobile card composition; no live MONOIC audit was performed.

## Payments and Firebase feasibility

**Payment shortlist:** evaluate Flutterwave and Pesapal against the actual Ugandan merchant account before selecting one. Flutterwave documents Uganda mobile-money collection in UGX with MTN and Airtel; its payment-channel guide lists Uganda cards and mobile money. Pesapal's Uganda payment portal displays card, Airtel Money and MTN options. These establish useful capabilities to investigate, not merchant approval or guaranteed availability for this business. [Flutterwave Uganda documentation](https://developer.flutterwave.com/docs/uganda), [payment channels](https://flutterwave.com/us/support/payment-methods/payment-channels), [Pesapal Uganda portal](https://ugpayonline.pesapal.com/).

Selection depends on onboarding eligibility, international card acceptance, permitted charge and settlement currencies, fees, refund support, webhook verification, and payout timing. Confirm these commercially and in a sandbox. A displayed USD equivalent must not silently become a promise of USD charging. Flutterwave's Uganda pricing page states that international cards are charged and settled locally by default. [Uganda pricing](https://flutterwave.com/ug/pricing).

**Firebase:** Authentication custom claims can support staff roles when assigned from a privileged server. Firestore transactions provide atomic stock/order changes. Firebase Hosting is a candidate for the React build. [Custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Hosting](https://firebase.google.com/docs/hosting).

Plan for a billed Firebase project: Cloud Storage for Firebase requires the Blaze plan under the current requirements. Usage costs still depend on traffic and storage; no fixed monthly total is assumed. [Storage billing requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024), [Firestore billing](https://firebase.google.com/docs/firestore/pricing).

## Items to resolve during implementation

1. Official social links, preferred logo/wordmark, public brand biography, and preferred use of the Nairobi alias.
2. Product photography, actual catalogue, price ranges, garment measurements, and which pieces are unique versus repeatable.
3. Payment merchant eligibility and supported charge/settlement currencies.
4. Dispatch location, domestic delivery zones, initial international countries, couriers, package weights and rates.
5. Returns/exchange rules, customer service contacts, and approved shipping, duties and privacy wording.
6. Event types, cities, schedules, venues, image rights, and whether events need external registration links or later native ticketing.

These inputs need not delay design and local development; they gate publishing factual copy and enabling live commerce.
