# Night in Kampala: website delivery plan

Prepared 11 November 2026. Scope of this stage: research, product planning and repository organisation. Stack requirement: React JavaScript and Firebase. The Nairobi name refers to the same brand, and fashion events are part of its activities, as confirmed by the owner.

**Revised 12 November 2026 after review.** Changes: a narrower launch scope and reordered phases (section 9), a decided approach to shared-link previews and a transactional email service (section 6), payment onboarding moved to start immediately and a WhatsApp order path added (section 5), design tokens required before scaffolding and one fixed navigation (section 2). Where sections 3 and 4 describe more than the launch scope in section 9, they describe the full product; section 9 governs what is built first.

## 1. Product direction

Build a fashion store where customers can discover reworked garments, understand the condition and fit of the exact piece, buy securely, and follow delivery. Give staff a dashboard to publish clothing, run drops, manage orders, and maintain the brand's stories and fashion events.

Suggested positioning for review: **“Reworked in Kampala. Worn everywhere.”** This is proposed copy, not an existing brand slogan. Lead with desirable clothing and craftsmanship, supported by an honest account of reuse and transformation.

Serve shoppers in Uganda and selected international destinations from one catalogue. Launch English first. Keep market, currency and shipping choices visible and editable. Design for browsing on a phone with limited bandwidth as well as desktop shopping.

## 2. Visual direction

The supplied MONOIC screenshot is the primary shop-layout reference:

- White background and header, black type and controls, pale grey garment photography fields.
- Night in Kampala wordmark left aligned on one line on desktop and centred on mobile, with menu/search and bag controls arranged without crowding. No customer-account icon at launch.
- Two product columns on phones/tablets, one where necessary for readable content, and three on desktop for both the homepage and shop grid.
- Consistent image proportions and garment scale; short product names, clear prices, and small New / One of one / Sold labels.
- Quiet borders and square or subtly rounded controls. Reserve expressive typography and optional accent colour for campaign imagery and editorial sections.
- Modelled photographs, detail views and workshop imagery on product/story pages. Use real brand material with permission.

Home page order: one white header → current drop/campaign → products → reworking story → lookbook → next event → newsletter and service footer. There is no announcement bar in the approved layout. Keep the opening view roomy and naturally scrollable rather than compressing every section into one screen.

**Theme selected and boards approved by the owner:** use the all-white direction with the roomier homepage layout. Board 04's white style frame supplies palette/type/control references; the approved spacious white homepage and boards 06–09 govern the page layouts. Keep hero, events and footer white, use daylight photography, and omit the amber UI accent. The opening view should have breathing room rather than compressing a full page into one screen. Historical theme prompts remain in [design-concepts/PROMPTS-ROUND-2.md](design-concepts/PROMPTS-ROUND-2.md); the current approved references and exact generation prompts are linked from [design-concepts/README.md](design-concepts/README.md).

**Settled for consistency across concepts and build:**

- Wordmark: the heavy condensed style from concept 02, on one line on desktop. This is a stand-in until the owner supplies an approved logo.
- Primary navigation: Shop, Drops, Our process, Lookbook, Events. "Drops" is the customer-facing name for collections and uses the `/collections/:slug` routes.
- Illustrative prices in mockups stay between UGX 85,000 and UGX 220,000 until real prices are supplied.
- The painted motifs in the concepts are generated placeholders. Replace them with photographs of real pieces as early as possible, before the look is finalised.
- Fonts are now named: Anton 400 for wordmark/headings, Inter 400/500/600 for UI/body, and Newsreader 400 for serif sublines. Self-host required WOFF2 assets and retain their OFL licences. [DESIGN_FOUNDATIONS.md](DESIGN_FOUNDATIONS.md) records verified licence sources and numerical spacing/type proposals, which await owner approval before P1.01.
- Standalone campaign and product [placeholder assets](implementation-assets/placeholders/README.md) are available for local integration, visibly marked as generated and excluded from real purchasable stock. They do not finalise brand motifs.

**Design tokens before scaffolding:** board approval is complete. Obtain approval of the measured proposal in DESIGN_FOUNDATIONS.md, then record colours, named fonts, type scale, spacing, borders and buttons in `src/styles/tokens.css` as the first application file. Components read from it; no hard-coded colours or font sizes elsewhere. Commit the reviewed docs/assets as the requested baseline before code starts.

Use Stüssy's direct navigation, The Laughing Geisha's category clarity, and Punk and Saint's individual-piece storytelling as functional references. Create original branding and composition. Source details and limits are recorded in [RESEARCH.md](RESEARCH.md).

## 3. Customer experience

| Area | Launch behaviour |
| --- | --- |
| Discover | Home, new arrivals, shop all, garment categories, collections/drops, editorial lookbooks and an archive of sold pieces. |
| Find a piece | Search by name/category/tags; filters for availability, garment type, actual fit/size, price and colour; sorting by newness and price. URL-based filters survive refresh and sharing. |
| Product detail | Multiple zoomable images; unique item ID; price/currency; availability; labelled size plus actual measurements in cm/in; material when known; condition and visible flaws; rework technique; care; shipping and returns summary. |
| Choose | One-of-one pieces show read-only size text and measurements, with no size dropdown. Repeatable designs select only real variants with stock; clear sold state; optional later wishlist; related available pieces. |
| Bag | Persistent bag, quantity editing where stock permits, removal, shipping estimate and a clear explanation that bag contents do not reserve stock. |
| Checkout | Guest checkout with required email for receipt/secure order-status link and a delivery phone number; address, delivery option, final summary and payment. Allow email correction, preserve valid data on recoverable failure, and separate optional marketing consent. Accounts are after launch. |
| Payment | Uganda mobile money and international cards through the selected provider. Show pending, failed, cancelled and successful states, with safe retry and status recovery. |
| After purchase | Confirmation and receipt, secure order-status view, dispatch/tracking updates, support contact and return/exchange request. |
| Account | Optional email/password or Google login; password reset; own order history, saved addresses and wishlist. Guest order access requires verified email or another secure credential. |
| Brand and events | About, garment transformation story, lookbooks, upcoming/past fashion events, event details, venue/city/timezone and external registration links when supplied. |
| Help | Contact, sizing, garment care, delivery, returns, FAQs, privacy and terms. Clearly explain the nature of reworked garments. |

Suggested routes: `/`, `/shop`, `/collections/:slug`, `/products/:slug`, `/archive`, `/lookbooks/:slug`, `/about`, `/events`, `/events/:slug`, `/contact`, `/cart`, `/checkout`, `/orders/:id`, `/account`, and `/help/:slug`. Secure order URLs must require authorisation; a predictable ID alone never grants access.

Sold unique pieces stay visible in the archive with purchasing disabled. A repeatable print is a different stock model from a single reworked garment; do not offer sizes that do not exist.

## 4. Admin dashboard

Use a separate, lazy-loaded `/admin` area with staff authentication and server-enforced permissions.

| Module | Staff tasks |
| --- | --- |
| Overview | Paid sales by currency, order queue, available stock, low-stock repeatable items and upcoming drops. Exclude failed payments from revenue and account for refunds. |
| Products | Draft, preview, publish, edit and archive; upload/reorder photos and alt text; set item ID, category, price, condition, size, measurements, materials, care, rework notes, weight and stock model. |
| Collections and drops | Group pieces, choose cover images and order, feature collections, schedule launch using an explicit timezone. |
| Inventory | Stock by exact item/variant, reservations, sold status, adjustment history, and immediate stock removal for an in-person or event sale. |
| Orders | Search/filter, inspect verified payment, print packing information, enter courier/tracking, update fulfilment, record returns and initiate authorised refunds. |
| Content | Homepage sections, announcements, About, lookbooks, FAQs, care guides and policy text, with draft/preview/publish behaviour. |
| Events | Create upcoming/past events, set title, city, venue, date/time/timezone, programme, cover/gallery, registration link and cancelled/postponed state. |
| Customers | View information needed for fulfilment and support; handle requests; export only for authorised staff. |
| Promotions | Controlled discount codes with validity, limits and eligible pieces; validate and redeem on the server. |
| Settings and access | Delivery zones/rates, enabled countries, display currencies, contacts, staff permissions, audit history and integration status. Provider secrets stay in server configuration. |

Proposed roles: owner (access and business settings), store manager (catalogue and fulfilment), content editor (stories/events). The customer role has no staff permissions. Keep refunds and role assignment restricted to explicitly permitted staff.

Product publishing flow: draft → images/details → measurements/condition → price/stock/weight → preview → publish or schedule. Validate mandatory fields before publishing; distinguish failed uploads from saved images and make unfinished drafts recoverable.

Native paid event ticketing, seat/capacity management and QR admission are a later extension. Launch events with information and supplied registration links; garment commerce remains the first transaction system.

## 5. Uganda and international operation

**Market and currency:** default to Uganda/UGX as a reasonable starting choice, allow manual destination selection, and remember it. Add USD display for international browsing; label conversions as estimates unless a verified provider and pricing policy support actual USD checkout. The final checkout must state the exact charge currency, items, delivery, discounts and applicable taxes before authorisation. Use integer minor units according to the chosen currency/provider conventions.

**Delivery:** support configurable Kampala/local zones, other supported Uganda zones, and a deliberately limited set of international destinations with known rates. Domestic forms can use phone, district, area and landmarks; international forms adapt postcode/region requirements to the country. Do not require a Ugandan postcode. Collect garment/package weights and price delivery from server-controlled rates. Unsupported destinations get a clear enquiry path before payment.

**Duties and returns:** agree who pays import charges and explain it at checkout. Provide dispatch estimates separately from delivery estimates. Staff need a documented process for lost parcels, exchanges, refunds and returned unique pieces; returned pieces re-enter stock only after inspection.

**Payment onboarding starts now.** Merchant approval is the slowest dependency and does not wait for design. The owner submits applications to both shortlisted providers in parallel with Phase 1, using the business's registration and settlement account details. The dev work only needs sandbox keys to proceed.

**WhatsApp order path:** every product page and the bag offer "Order on WhatsApp", opening a prefilled message with the item code, name and price to the brand's WhatsApp number. Staff confirm payment manually (mobile money to the business number) and record the sale in the dashboard, which removes the piece from stock through the same server path as an in-person sale. This is the fallback that lets the shop open if gateway approval is late, and it stays afterwards as a second way to buy. A WhatsApp order holds no stock until staff record it.

**Receipt delivery:** online checkout requires email and explains its receipt/order-link purpose. The manual WhatsApp route does not force the online email form. Automated SMS/WhatsApp receipt delivery is outside launch scope. Knowing an email or order ID alone is not authorisation to view an order.

**Payments:** run a short feasibility comparison of Flutterwave and Pesapal. Select one after merchant eligibility, Uganda mobile money, international cards, settlement, refunds and notification security are verified. This plan does not assume an approved merchant account. See the primary-source findings in [RESEARCH.md](RESEARCH.md).

## 6. React and Firebase architecture

Proposed frontend: React with JavaScript/JSX, Vite, React Router, reusable accessible UI components, and a small shared design system. Keep feature logic organised around catalogue, bag, checkout, account, events and administration. P1.02 also sets up ESLint and Vitest with React Testing Library/DOM support and runnable lint/test commands. Pin compatible versions and choose a supported Node release when scaffolding begins.

| Service | Responsibility |
| --- | --- |
| Firebase Authentication | Customer/guest identity and staff sign-in. Use anonymous identity behind guest checkout where useful, without requiring customer account creation. |
| Cloud Firestore | Catalogue, content, events, customers, orders, inventory and operational records. Public and private data live in separate documents. |
| Cloud Storage | Product and editorial media with validated uploads and generated responsive formats. |
| Cloud Functions | Trusted pricing, inventory reservation, payment initiation/verification, fulfilment operations, refunds and notifications. |
| Firebase Hosting | Candidate hosting for the React build, HTTPS and appropriate route handling. |
| Transactional email | Firebase does not send email itself. Send receipts, payment-pending reminders and dispatch updates from Cloud Functions through an email delivery service (choose one with a free tier and a verified sending domain during Phase 1). Keep it separate from marketing email. |
| Emulator Suite | Local development and meaningful tests for permissions, checkout and stock behaviour. |
| App Check and server controls | Reduce abusive requests; combine with input validation and rate limits. App Check does not replace authorisation. |

Use development and production Firebase projects separately; add a staging environment before live integration testing. Choose Firestore, Functions and Storage locations together based on availability and measured access from Uganda and target markets before provisioning production data.

**Location gate:** P1.13 completes [FIREBASE_REGION_DECISION.md](FIREBASE_REGION_DECISION.md), including existing resources and Hosting rewrite compatibility, before any cloud database/bucket creation. P1.14 staging cannot choose locations implicitly. Local emulators do not provision a real database. No region has been selected.

Firebase's current Storage requirements call for the billed Blaze plan. Set budget alerts, monitor image downloads and database usage, constrain function scaling and paginate catalogue reads. Alerts are notifications, not a spending cap. [Firebase Storage requirements](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024).

Suggested layout for the later implementation:

```text
night-in-kampala-web/
  docs/
  public/
  src/
    app/
    components/
    features/{catalogue,cart,checkout,account,events,admin}/
    services/
    styles/
  functions/
  firestore.rules
  firestore.indexes.json
  storage.rules
  firebase.json
```

These application files are proposed, not yet generated. No Firebase resources are provisioned in this planning stage.

**Discovery and sharing:** include canonical product URLs, product metadata/structured data, sitemap, robots controls and Open Graph images. Do not index checkout, accounts or admin. **Shared-link previews (decided, build in Phase 1):** most customers will arrive from links shared on WhatsApp and Instagram, whose preview fetchers do not run JavaScript. Keep the Vite single-page app. Route `/products/:slug`, `/collections/:slug`, `/events/:slug` and `/lookbooks/:slug` through a Firebase Hosting rewrite to a small Cloud Function that returns the app's `index.html` with the title, description, canonical URL and Open Graph image for that item filled in from Firestore, cached at the CDN and refreshed on publish. All other routes are served as static files. Unknown or unpublished slugs return a proper not-found status. Always revalidate live availability at checkout. Revisit full prerendering only if search traffic later justifies it.

Start search with documented name/category/tag matching and indexed queries. Evaluate a dedicated or Firebase-native full-text option against the chosen edition if the catalogue needs fuzzy search; avoid making broad unverified assumptions about search support or downloading the whole catalogue for each query.

## 7. Initial data model and access

| Collection | Purpose / access |
| --- | --- |
| `products` | Public published garment descriptions, media, slugs, measurements and display prices; drafts require staff access. |
| `inventory` | Exact item/variant quantities and reservations; trusted server writes. Expose only safe availability projections publicly. |
| `collections`, `lookbooks`, `pages`, `events` | Public published content; staff manage drafts. |
| `users` and private subcollections | Own profile, addresses and wishlist; scoped reads/writes. Never accept role fields as authority. |
| `orders` | Owner/staff reads as appropriate; trusted creation and financial/fulfilment updates. Snapshot purchased item details and prices. |
| `paymentAttempts`, `paymentEvents`, `reservations` | Private server records for payment references, deduplication, stock ownership and expiry. |
| `promotions`, `shippingRules`, `settings` | Staff-managed configuration; server-controlled calculation and safe public projections. |
| `subscribers` | Explicit marketing consent with date/source; no public list access. |
| `auditLogs` | Append-only server records for sensitive changes; restricted staff reads. |

Each unique garment has one inventory unit and its own measurements, condition and images. Repeatable designs have variant stock. Store all timestamps consistently and display event/drop times with their timezone. Order snapshots preserve the purchase record after later catalogue edits.

Use role claims assigned through privileged server tooling, Firestore/Storage rules, and explicit authorisation in every privileged function. Server SDK access requires its own validation because it is not protected by client rules. Customers cannot change paid status, prices, discounts, stock or their own roles. [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims).

## 8. Safe checkout for unique pieces

1. The browser sends item IDs, quantities and delivery details. The server loads authoritative prices, promotion rules and eligible delivery rates, then calculates a time-limited quote.
2. A Firestore transaction checks all requested inventory and creates an order plus a reservation atomically. Only one checkout can hold the last unit. Merely adding to the bag creates no reservation.
3. Create the provider payment attempt after the transaction, using stable references and idempotency. Do not call payment APIs inside a transaction that may retry. Recover safely if the external call times out.
4. Show pending payment until a trusted server process verifies provider status, amount, currency, merchant account and order reference. Browser redirects cannot mark an order paid.
5. Handle authenticated/verified notifications and deduplicate events. A transaction finalises inventory and the order once. A reconciliation job recovers missed notifications and stuck attempts.
6. Align reservation expiry with the provider's pending-payment behaviour. Before releasing a pending reservation, reconcile or cancel the payment where supported. Use server expiry checks and a scheduled worker; background document deletion is not the reservation mechanism.
7. If a late successful payment arrives after release, fulfil only if the inventory can still be allocated atomically. Otherwise create a paid exception for refund/support; never promise a piece already sold to someone else.
8. Cancellation/refund processing is idempotent. Failed or abandoned attempts release eligible stock. Refunding does not automatically make a dispatched/returned garment available again.

Keep payment status and fulfilment status separate: `awaiting_payment / paid / failed / refund_pending / refunded` versus `unfulfilled / packing / dispatched / delivered / returned`. Record exceptions explicitly. Transaction semantics are supported by [Firestore's atomic operations](https://firebase.google.com/docs/firestore/manage-data/transactions).

## 9. Delivery phases and completion gates

### Launch scope

| At launch | After launch |
| --- | --- |
| Home, shop grid with category/size/availability filters, product detail, drops, sold archive. | Wishlist, richer search, colour and price filters. |
| Persistent bag, guest checkout, delivery quote, one payment provider, WhatsApp order path. | Customer accounts, saved addresses, order history, Google login. |
| Receipt and dispatch emails, secure order-status link. | In-dashboard returns and refund workflow. Until then, refunds are issued in the provider's dashboard and recorded on the order by staff. |
| Admin: products (draft, photos, publish), drops, orders (pack, dispatch, tracking), record an in-person or WhatsApp sale, delivery rates. | Promotions and discount codes, customer export, dashboard reporting, scheduled content publishing. |
| Two staff roles: owner and staff. Server-side audit records for order, payment and stock changes, with no dashboard screen yet. | Content editor role, audit history screen. |
| Events, Our process, lookbook and help pages built as simple editable pages. | Full content management with draft/preview for every page; native ticketing. |

The checkout safety rules in section 8 and the security requirements in section 7 apply in full at launch. Nothing in the right-hand column is a reason to weaken them.

### Phases

| Phase | Deliverable | Completion gate |
| --- | --- | --- |
| 0. Research and organisation | Brand/reference research, this plan, corrected repository location. | Done. History and remote preserved; assumptions and unanswered inputs documented. |
| 1. Design and foundations | Theme chosen; round-2 concept boards; tokens file; React scaffold with routes and responsive shell; emulator configuration; shared-link preview function; email service chosen. In parallel, owner submits payment merchant applications. | A shared product link shows the right title and image in a WhatsApp preview from a staging URL; shell matches the approved style frame at phone and desktop sizes; merchant applications submitted. |
| 2. Catalogue and publishing | Catalogue reads, filters, product detail, drops, archive, admin product drafts/uploads/publish, simple events and story pages. | Staff can publish a measured, photographed piece and an event; shoppers see only published content. |
| 3. Commerce and fulfilment | Bag, guest checkout, delivery quote, stock reservations, provider sandbox integration, WhatsApp order path, receipts, order-status link, admin orders and manual sale recording. | Domestic and international sandbox purchases complete; concurrency and failure scenarios in section 10 pass; staff can take an order from paid to dispatched and record a WhatsApp sale. |
| 4. Launch | Real catalogue, approved policies, production integrations, accessibility/performance verification and deployment. | Merchant account live or WhatsApp path confirmed as the opening payment route; shipping coverage, live payment checks and launch criteria below complete. |
| 5. After launch | The right-hand column above, in an order agreed with the owner from real usage. | Each addition ships separately without changing checkout safety. |

Additional design entry checks for Phases 2/3 are in [PRE_PHASE_2_3_DESIGN_CHECKS.md](PRE_PHASE_2_3_DESIGN_CHECKS.md): white shop-grid board with three desktop columns, mobile product detail/read-only one-of-one size, checkout email, payment success/failure and international address/delivery. Resolve each before its corresponding feature work. They do not add commerce work to the local Phase 1 shell.

Before development starts, break each phase into tasks small enough to review individually, each with a stated acceptance check.

**Phase 1 breakdown:** [PHASE_1_TASKS.md](PHASE_1_TASKS.md) records the ordered tasks and individual acceptance checks following board approval. The first build task is `src/styles/tokens.css`; the list is presented to the owner before implementation starts.

Deliver in these increments rather than treating a visual prototype as a working shop. Calendar estimates follow the initial catalogue/content volume and provider onboarding; no delivery date is assumed here.

## 10. Verification and launch criteria

- Core journey works at phone and desktop sizes: browse → filter → exact garment → bag → checkout → verified payment → receipt → tracking.
- Two simultaneous buyers of one garment produce at most one paid allocation; repeated, delayed and out-of-order payment notifications do not duplicate orders, inventory changes or receipts.
- Test tampered prices, currency mismatch, expired reservations, failed payment initiation, pending mobile money, retries, missed notifications, refunds and late payments after resale.
- Emulator tests prove that customers cannot read another person's orders or drafts, promote themselves, edit prices/stock, or bypass staff permissions through direct API calls.
- Staff can upload valid images, recover interrupted drafts, publish a drop and an event, record an in-person or WhatsApp sale, dispatch an order and record a refund.
- A product link pasted into WhatsApp shows that piece's name and photograph; a sold piece's link still resolves and shows it as sold.
- Keyboard access, visible focus, labelled controls, readable contrast, accessible drawers/dialogs, reduced motion and usable validation. Target WCAG 2.2 AA.
- Responsive images, modern formats, lazy loading below the fold, stable image dimensions and lazy-loaded admin. Target good Core Web Vitals; measure representative pages on mobile rather than claiming a score in advance.
- Product sharing previews, indexable public pages, useful sold-product pages, sitemap and canonical URLs behave correctly. Test stale page/bag stock against live checkout.
- Supported-country shipping/rates, exact charge currency, duties wording, returns, contacts, stock counts and photography are approved and accurate.
- Production monitoring, budget alerts, backup/restore procedure, payment reconciliation and a rollback path are in place. Transactional email is separated from optional marketing consent.

Prioritise meaningful checkout, security-rule and inventory tests. Add focused UI/end-to-end checks around the primary journey and staff publishing workflow.

## 11. Next implementation inputs

Proceed with the visual shell and local Firebase setup using explicit placeholders where needed. Before publishing factual content or taking real payments, obtain the approved logo and brand links, product images and measurements, live prices and stock, merchant account details, initial delivery countries/rates, staff accounts and policy text. Obtain event dates, venue/timezone and registration links for the events section. The theme decision is complete: all-white with roomier spacing. Still needed from the owner: the WhatsApp business number, the mobile money number for manual payments, staging Firebase access, a domain and sender address for emails, and the business documents the payment providers ask for.

Later enhancements: native event ticketing, custom rework requests, richer search, additional currencies/languages, loyalty, and automated courier labels. They should follow a reliable garment purchase and fulfilment system.
