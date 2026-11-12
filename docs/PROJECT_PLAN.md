# Night in Kampala: website delivery plan

Prepared 11 November 2026. Scope of this stage: research, product planning and repository organisation. Stack requirement: React JavaScript and Firebase. The Nairobi name refers to the same brand, and fashion events are part of its activities, as confirmed by the owner.

**Revised 12 November 2026 after review.** Changes: a narrower launch scope and reordered phases (section 9), a decided approach to shared-link previews and a transactional email service (section 6), payment onboarding moved to start immediately and a WhatsApp order path added (section 5), design tokens required before scaffolding and one fixed navigation (section 2). Where sections 3 and 4 describe more than the launch scope in section 9, they describe the full product; section 9 governs what is built first.

**Owner scope revision, 12 November 2026: sales with manual follow-up first.** Defer transactional email selection and payment-provider integration. Launch a working catalogue, bag and on-site order submission, with a persistent admin order queue, live dashboard alerts/unread badges, and staff follow-up by phone/WhatsApp to arrange payment and delivery. The owner confirmed dashboard alerts are sufficient for the first release; no closed-dashboard push, email, SMS or WhatsApp API alert is promised. Cash/manual payment is supported where the owner agrees the collection/delivery arrangement; do not advertise universal cash on delivery. This revision and section 9 supersede earlier email/gateway launch gates. See [SALES_FIRST_LAUNCH.md](SALES_FIRST_LAUNCH.md) for the current journey and acceptance checks.

## 1. Product direction

Build a fashion store where customers can discover reworked garments, understand the condition and fit of the exact piece, place an order and receive staff follow-up to arrange payment and delivery. Give staff a dashboard to publish clothing, run drops, receive/manage orders, and maintain the brand's stories and fashion events. Online payment automation follows the working manual-sales journey.

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
- Fonts are Anton 400 for wordmark/headings, Inter 400/500/600 for UI/body, and Newsreader 400 for serif sublines. P1.03 self-hosts the needed WOFF2 files and licences. [DESIGN_FOUNDATIONS.md](DESIGN_FOUNDATIONS.md) records the approved measurements and font sources.
- Standalone campaign and product [placeholder assets](implementation-assets/placeholders/README.md) are available for local integration, visibly marked as generated and excluded from real purchasable stock. They do not finalise brand motifs.

**Design tokens before scaffolding:** the owner approved the measurements; baseline `873bc7f` precedes implementation. `src/styles/tokens.css` was created as the first application file. Component colours/font sizes use its variables. The local shell and emulator work P1.01–P1.08 are now complete; see [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md).

Use Stüssy's direct navigation, The Laughing Geisha's category clarity, and Punk and Saint's individual-piece storytelling as functional references. Create original branding and composition. Source details and limits are recorded in [RESEARCH.md](RESEARCH.md).

## 3. Customer experience

| Area | Launch behaviour |
| --- | --- |
| Discover | Home, new arrivals, shop all, garment categories, collections/drops, editorial lookbooks and an archive of sold pieces. |
| Find a piece | Search by name/category/tags; filters for availability, garment type, actual fit/size, price and colour; sorting by newness and price. URL-based filters survive refresh and sharing. |
| Product detail | Multiple zoomable images; unique item ID; price/currency; availability; labelled size plus actual measurements in cm/in; material when known; condition and visible flaws; rework technique; care; shipping and returns summary. |
| Choose | One-of-one pieces show read-only size text and measurements, with no size dropdown. Repeatable designs select only real variants with stock; clear sold state; optional later wishlist; related available pieces. |
| Bag | Persistent bag, quantity editing where stock permits, removal, shipping estimate and a clear explanation that bag contents do not reserve stock. |
| Checkout | Guest order form: name, required reachable phone/WhatsApp contact, country, collection/delivery preference and the relevant delivery details. Email is optional and does not block ordering. Show an item subtotal and either an approved delivery charge or clearly state that delivery/final total awaits staff confirmation. Submit with "Place order"; prevent duplicate submissions. No account required. |
| Payment | Cash or another owner-enabled manual method agreed with staff. Submitting an order does not collect payment or mark it paid. Cash on collection/delivery is offered only for approved arrangements. Gateway mobile money/cards are after launch. |
| After order submission | On-page "Order received — awaiting confirmation" with a reference and clear follow-up instructions. Staff confirm availability, delivery costs and payment arrangements, then update order/payment/fulfilment states separately. No automatic email receipt or public lookup by order ID. A private status view requires a secure credential if included. |
| Account | After launch: optional login, own order history, saved addresses and wishlist. Order references alone never grant access to customer information. |
| Brand and events | About, garment transformation story, lookbooks, upcoming/past fashion events, event details, venue/city/timezone and external registration links when supplied. |
| Help | Contact, sizing, garment care, delivery, returns, FAQs, privacy and terms. Clearly explain the nature of reworked garments. |

Suggested routes: `/`, `/shop`, `/collections/:slug`, `/products/:slug`, `/archive`, `/lookbooks/:slug`, `/about`, `/events`, `/events/:slug`, `/contact`, `/cart`, `/checkout`, `/orders/:id`, `/account`, and `/help/:slug`. Secure order URLs must require authorisation; a predictable ID alone never grants access.

Sold unique pieces stay visible in the archive with purchasing disabled. A repeatable print is a different stock model from a single reworked garment; do not offer sizes that do not exist.

## 4. Admin dashboard

Use a separate, lazy-loaded `/admin` area with staff authentication and server-enforced permissions.

| Module | Staff tasks |
| --- | --- |
| Overview | New/unread order badge and live alert while the dashboard is open, persistent order queue on return, available stock and upcoming drops. Sales reporting is after launch; an unpaid request is not revenue. |
| Products | Draft, preview, publish, edit and archive; upload/reorder photos and alt text; set item ID, category, price, condition, size, measurements, materials, care, rework notes, weight and stock model. |
| Collections and drops | Group pieces, choose cover images and order, feature collections, schedule launch using an explicit timezone. |
| Inventory | Stock by exact item/variant, reservations, sold status, adjustment history, and immediate stock removal for an in-person or event sale. |
| Orders | Receive new orders; inspect items and contact/delivery details; mark seen/contacted; confirm or decline availability; arrange cash/manual payment and delivery; record payment actually received with method/time/staff audit; update fulfilment or cancel/release stock. Later: gateway verification and automated refunds. |
| Content | Homepage sections, announcements, About, lookbooks, FAQs, care guides and policy text, with draft/preview/publish behaviour. |
| Events | Create upcoming/past events, set title, city, venue, date/time/timezone, programme, cover/gallery, registration link and cancelled/postponed state. |
| Customers | View information needed for fulfilment and support; handle requests; export only for authorised staff. |
| Promotions | Controlled discount codes with validity, limits and eligible pieces; validate and redeem on the server. |
| Settings and access | Delivery zones/rates, enabled countries, display currencies, contacts, staff permissions, audit history and integration status. Provider secrets stay in server configuration. |

Proposed roles: owner (access and business settings), store manager (catalogue and fulfilment), content editor (stories/events). The customer role has no staff permissions. Keep refunds and role assignment restricted to explicitly permitted staff.

Product publishing flow: draft → images/details → measurements/condition → price/stock/weight → preview → publish or schedule. Validate mandatory fields before publishing; distinguish failed uploads from saved images and make unfinished drafts recoverable.

Native paid event ticketing, seat/capacity management and QR admission are a later extension. Launch events with information and supplied registration links; garment commerce remains the first transaction system.

## 5. Uganda and international operation

**Market and currency:** default to Uganda/UGX, allow manual destination selection, and remember it. Launch uses clear UGX prices and a server-calculated item subtotal. Show an exact final total only when approved delivery charges are known; otherwise label the order as awaiting a delivery/final-total quote before the customer agrees to pay. Additional currencies and gateway-specific charge handling are later work.

**Delivery:** begin with owner-approved collection/local delivery arrangements. Domestic forms use phone, district, area and landmarks as relevant, without a required Ugandan postcode. International shoppers can submit an order enquiry with their country/contact; staff confirm shipping feasibility, costs and payment before accepting it. Do not imply international cash on delivery or worldwide shipping. Add exact automated rates only where approved; otherwise show "Delivery to be confirmed" and no invented final total.

**Duties and returns:** agree who pays import charges and explain it at checkout. Provide dispatch estimates separately from delivery estimates. Staff need a documented process for lost parcels, exchanges, refunds and returned unique pieces; returned pieces re-enter stock only after inspection.

**Payment onboarding deferred.** Merchant applications, provider selection and gateway sandbox integration are no longer Phase 1 or launch gates. Revisit them after the manual-sales workflow works. Keep the earlier provider research for that later decision.

**Website ordering is the primary path.** Save the order and its unread admin queue entry together before showing success. Dashboard alerts are the first-release notification channel, with persistent unread state and a full queue when staff return. They do not alert staff while the dashboard is closed. Staff use the supplied phone/WhatsApp contact to follow up manually.

**WhatsApp assistance:** product pages and the bag may also offer "Order on WhatsApp" once the owner's business number is supplied. Opening a chat does not create an on-site order, reserve stock, send an automatic admin alert or prove a sale. Staff must record any resulting order/sale in the same dashboard and trusted inventory workflow.

**Confirmation and payment records:** show the saved order reference and follow-up expectations on the website. Email selection, automated receipts and automated SMS/WhatsApp messages are deferred. Staff record cash/manual payment only after receipt; customers cannot set paid status. A reference, phone number or email alone is not authorisation to read an order. Later gateway selection can use [RESEARCH.md](RESEARCH.md).

## 6. React and Firebase architecture

Proposed frontend: React with JavaScript/JSX, Vite, React Router, reusable accessible UI components, and a small shared design system. Keep feature logic organised around catalogue, bag, checkout, account, events and administration. P1.02 also sets up ESLint and Vitest with React Testing Library/DOM support and runnable lint/test commands. Pin compatible versions and choose a supported Node release when scaffolding begins.

| Service | Responsibility |
| --- | --- |
| Firebase Authentication | Customer/guest identity and staff sign-in. Use anonymous identity behind guest checkout where useful, without requiring customer account creation. |
| Cloud Firestore | Catalogue, content, events, customers, orders, inventory and operational records. Public and private data live in separate documents. |
| Cloud Storage | Product and editorial media with validated uploads and generated responsive formats. |
| Cloud Functions | Trusted pricing and idempotent order creation, stock allocation/release, staff order/payment/fulfilment operations and a durable admin unread-order queue. Gateway operations and outbound messages are later extensions. |
| Firebase Hosting | Candidate hosting for the React build, HTTPS and appropriate route handling. |
| Transactional email | Deferred by the owner. Neither provider selection nor a sender domain blocks launch. Choose and integrate later if automated customer messages are needed. |
| Admin order alerts | Authenticated live dashboard updates and persistent unread state; the saved order queue remains the source of truth if the live connection fails. No background/out-of-dashboard alert in the first release. |
| Emulator Suite | Local development and meaningful tests for permissions, checkout and stock behaviour. |
| App Check and server controls | Reduce abusive requests; combine with input validation and rate limits. App Check does not replace authorisation. |

Use development and production Firebase projects separately; add a staging environment before live integration testing. Choose Firestore, Functions and Storage locations together based on availability and measured access from Uganda and target markets before provisioning production data.

**Location gate:** retain the owner's existing Firestore database in `eur3`. P1.13 completes [FIREBASE_REGION_DECISION.md](FIREBASE_REGION_DECISION.md), including remaining Functions/Storage placement and Hosting rewrite compatibility, before any new cloud resource creation. P1.14 staging cannot choose locations implicitly. Local emulators do not provision a real database.

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

The local React scaffold, styles, Functions emulator foundation and Firebase configuration are now generated through P1.08. No cloud Firebase resources have been provisioned. The directory illustration remains an architectural guide, not a claim that later feature folders are complete.

**Discovery and sharing:** include canonical product URLs, product metadata/structured data, sitemap, robots controls and Open Graph images. Do not index checkout, accounts or admin. **Shared-link previews (decided, build in Phase 1):** most customers will arrive from links shared on WhatsApp and Instagram, whose preview fetchers do not run JavaScript. Keep the Vite single-page app. Route `/products/:slug`, `/collections/:slug`, `/events/:slug` and `/lookbooks/:slug` through a Firebase Hosting rewrite to a small Cloud Function that returns the app's `index.html` with the title, description, canonical URL and Open Graph image for that item filled in from Firestore, cached at the CDN and refreshed on publish. All other routes are served as static files. Unknown or unpublished slugs return a proper not-found status. Always revalidate live availability at checkout. Revisit full prerendering only if search traffic later justifies it.

Start search with documented name/category/tag matching and indexed queries. Evaluate a dedicated or Firebase-native full-text option against the chosen edition if the catalogue needs fuzzy search; avoid making broad unverified assumptions about search support or downloading the whole catalogue for each query.

## 7. Initial data model and access

| Collection | Purpose / access |
| --- | --- |
| `products` | Public published garment descriptions, media, slugs, measurements and display prices; drafts require staff access. |
| `inventory` | Exact item/variant quantities and reservations; trusted server writes. Expose only safe availability projections publicly. |
| `collections`, `lookbooks`, `pages`, `events` | Public published content; staff manage drafts. |
| `users` and private subcollections | Own profile, addresses and wishlist; scoped reads/writes. Never accept role fields as authority. |
| `orders` | Private trusted order creation; snapshot item details/prices, customer contact/delivery data, idempotency identity, separate order/payment/fulfilment states and persistent staff seen/contacted state. Authorised staff access; no public reference lookup. |
| `reservations` / inventory allocations | Private trusted stock ownership for confirmed manual orders, cancellation/release and any explicit hold deadline. Bag contents and unconfirmed requests do not silently reserve stock. |
| `paymentAttempts`, `paymentEvents` | Deferred until gateway integration; private server-only provider verification/deduplication records. |
| `promotions`, `shippingRules`, `settings` | Staff-managed configuration; server-controlled calculation and safe public projections. |
| `subscribers` | Explicit marketing consent with date/source; no public list access. |
| `auditLogs` | Append-only server records for sensitive changes; restricted staff reads. |

Each unique garment has one inventory unit and its own measurements, condition and images. Repeatable designs have variant stock. Store all timestamps consistently and display event/drop times with their timezone. Order snapshots preserve the purchase record after later catalogue edits.

Use role claims assigned through privileged server tooling, Firestore/Storage rules, and explicit authorisation in every privileged function. Server SDK access requires its own validation because it is not protected by client rules. Customers cannot change paid status, prices, discounts, stock or their own roles. [Firebase custom claims](https://firebase.google.com/docs/auth/admin/custom-claims).

## 8. Safe manual orders for unique pieces

The launch journey is an order request followed by staff confirmation. An order received is neither a paid sale nor a promise that the piece has been allocated.

1. The browser submits item IDs/quantities, name, contact and relevant collection/delivery details with an idempotency key. The server validates published availability and loads authoritative prices; it never trusts submitted totals.
2. Atomically save the order snapshot and durable unread admin queue state, then show a reference and "Awaiting confirmation". Retries must return the same order rather than create duplicates. A broken live alert must not lose the saved order.
3. Proposed initial stock policy: new requests do not hold a garment. Tell shoppers staff must confirm availability. At staff confirmation, a server transaction allocates the one-of-one piece to at most one order, updates its public availability and records an audit event. Concurrent requests can exist, but concurrent confirmations cannot both allocate the same piece. Confirm the hold/release policy before Phase 3 implementation.
4. Staff contact the customer to agree delivery/final costs and payment. International requests remain enquiries until shipping and payment are agreed. Never offer unsupported cash-on-delivery arrangements.
5. Only authorised staff can record actual cash/manual payment with method, amount, currency, time and audit history. Keep payment separate from order acceptance and fulfilment. Submitting or confirming an order must not set it paid.
6. Cancellation/rejection and release of any allocation are authorised, audited and idempotent. In-person and WhatsApp sales use the same trusted inventory path. Returned garments re-enter stock only after inspection. If a timed hold is introduced, enforce it on the server rather than relying on a browser timer or document deletion.
7. Confirmation is visible on the website. Private order data is never accessible by predictable reference alone; any persistent customer status view requires an authorised session or secure credential. Email is not a launch prerequisite.

Use separate states such as order `new / contacted / confirmed / cancelled / completed`, payment `unpaid / paid` (with manual adjustments/refunds recorded), and fulfilment `unfulfilled / ready_for_collection / dispatched / delivered / returned`. Final allowed transitions and cancellation rules are a Phase 3 task. These are planned states, not existing implementation.

### Later gateway integration requirements

The following original gateway safeguards are retained for the later feature; they no longer block the manual-sales launch.

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
| Persistent bag, guest order submission, on-page reference/confirmation, collection/delivery enquiry, cash/manual payment arranged with staff. WhatsApp assistance once the business number is supplied. | Payment-provider selection/onboarding and automated mobile money/cards; customer accounts, saved addresses, order history, Google login. |
| Required name/contact phone, optional email; staff follow-up. Secure session/credential required for any customer order-status access. | Transactional email selection, automated receipts/dispatch messages and automatically delivered secure order links; SMS/WhatsApp API and background push alerts. |
| Admin: products (draft, photos, publish), drops, persistent orders/unread badge/live dashboard alerts, follow-up/contacted state, confirm/allocate, record cash/manual payment, fulfil/cancel, record in-person/WhatsApp sales. Approved delivery settings or manual quotes. | Promotions, customer export, reporting, scheduled publishing, richer returns/refund automation and courier integrations. |
| Two staff roles: owner and staff. Server-side audit records for order, payment and stock changes, with no dashboard screen yet. | Content editor role, audit history screen. |
| Events, Our process, lookbook and help pages built as simple editable pages. | Full content management with draft/preview for every page; native ticketing. |

The manual-order safety rules in section 8 and the security requirements in section 7 apply at launch. Gateway-specific safeguards apply when that integration is added. Deferring automation does not relax permissions, trusted prices, duplicate prevention or one-of-one allocation safety.

### Phases

| Phase | Deliverable | Completion gate |
| --- | --- | --- |
| 0. Research and organisation | Brand/reference research, this plan, corrected repository location. | Done. History and remote preserved; assumptions and unanswered inputs documented. |
| 1. Design and foundations | Approved white theme/boards/tokens; React routes and responsive shell; emulators; shared-link previews; shell QA and remaining cloud placement/staging work. Email selection and merchant onboarding are deferred. | Shell matches the approved boards on phone/desktop; safe staging/direct links work and the owner confirms a WhatsApp preview. Email/provider readiness is not a completion gate. |
| 2. Catalogue and publishing | Catalogue reads, filters, product detail, drops, archive, admin product drafts/uploads/publish, simple events and story pages. | Staff can publish a measured, photographed piece and an event; shoppers see only published content. |
| 3. Manual orders and fulfilment | Persistent bag, guest order form, trusted/idempotent order submission, on-page reference, persistent admin queue/live alerts, staff follow-up, safe stock allocation, manual cash/payment recording and fulfilment. | A customer submits an order; authorised staff see its unread alert/queue entry, contact the buyer, confirm one-of-one allocation, record payment and fulfil/cancel it. Retry/concurrency/private-data tests pass. International enquiries do not promise unapproved shipping/payment. |
| 4. Sales-first launch | Real catalogue, approved contact/payment/delivery arrangements and policies, secure staff access, monitoring, accessibility/performance checks and deployment. | Real ordering and staff follow-up work end to end; dashboard-alert coverage and operating routine are understood; cash/manual payment and stock handling are tested. No email service or gateway account is required. |
| 5. After launch | The right-hand column above, in an order agreed with the owner from real usage. | Each addition ships separately without changing checkout safety. |

Additional design entry checks for Phases 2/3 are in [PRE_PHASE_2_3_DESIGN_CHECKS.md](PRE_PHASE_2_3_DESIGN_CHECKS.md): white shop grid, mobile product detail/read-only one-of-one size, phone-led manual order form, received/error states, admin unread-order view and international delivery enquiry. Earlier gateway/payment-success boards are visual references only; adapt their behaviour to the revised launch. Resolve checks before the corresponding feature work.

Before development starts, break each phase into tasks small enough to review individually, each with a stated acceptance check.

**Phase 1 breakdown:** [PHASE_1_TASKS.md](PHASE_1_TASKS.md) records the ordered tasks and individual acceptance checks following board approval. The first build task is `src/styles/tokens.css`; the list is presented to the owner before implementation starts.

Deliver in these increments rather than treating a visual prototype as a working shop. Calendar estimates follow the initial catalogue/content volume and provider onboarding; no delivery date is assumed here.

## 10. Verification and launch criteria

- Core journey works at phone and desktop sizes: browse → exact garment → bag → submit order → saved reference → admin unread queue/alert → staff contact → confirm availability/payment/delivery → record payment → fulfil.
- Repeated submissions/reconnection do not duplicate orders. Two staff confirmations of competing requests for one garment allocate it at most once; an unconfirmed request is never displayed as paid or guaranteed stock.
- Test tampered prices, unavailable pieces, invalid contact details, rejected requests, uncertain submit/retry, lost live connections, unread state after reopening the dashboard, competing in-person sales and authorised cancellation/release.
- Emulator tests prove that customers cannot read another person's orders or drafts, promote themselves, edit prices/stock, or bypass staff permissions through direct API calls.
- Staff can publish real garments, recover drafts, see new orders, follow up using customer contact details, confirm/reject, record actual manual payment, fulfil/cancel an order and record an in-person or WhatsApp sale. Order, payment and fulfilment states and audit records stay distinct.
- A product link pasted into WhatsApp shows that piece's name and photograph; a sold piece's link still resolves and shows it as sold.
- Keyboard access, visible focus, labelled controls, readable contrast, accessible drawers/dialogs, reduced motion and usable validation. Target WCAG 2.2 AA.
- Responsive images, modern formats, lazy loading below the fold, stable image dimensions and lazy-loaded admin. Target good Core Web Vitals; measure representative pages on mobile rather than claiming a score in advance.
- Product sharing previews, indexable public pages, useful sold-product pages, sitemap and canonical URLs behave correctly. Test stale page/bag stock against live checkout.
- Collection/delivery coverage, manual-payment terms, staff contact, duties/returns wording, stock and photography are owner-approved. Unknown shipping costs are clearly awaiting confirmation, with no invented final total; international requests are not advertised as cash on delivery.
- Production monitoring, budget alerts, backup/restore and rollback are ready. Staff have an order-review routine: dashboard-only alerts do not reach a closed dashboard. Email/gateway launch checks are deferred until those features are scheduled.

Prioritise meaningful checkout, security-rule and inventory tests. Add focused UI/end-to-end checks around the primary journey and staff publishing workflow.

## 11. Next implementation inputs

Next local task is P1.12 shell QA; P1.11 email selection is deferred. Resolve remaining cloud placement/staging work separately, then break Phase 2 catalogue/admin publishing into small tasks with acceptance checks before implementation. The first sales milestone is the complete on-site order → dashboard queue → staff follow-up journey.

For real sales, obtain product photos, measurements, conditions, prices and stock; staff accounts; the business phone/WhatsApp contact; approved collection/delivery areas, costs or manual-quote policy; which cash/manual payment arrangements to offer; the confirmation/hold/release policy; and customer-facing follow-up/policy wording. The dashboard-only notification channel is owner-approved. Obtain event facts before publishing them. Staging access, public origin and remaining Firebase topology still apply. Sender-domain access, merchant paperwork, gateway accounts and online-payment secrets are deferred rather than prerequisites.

Later enhancements: native event ticketing, custom rework requests, richer search, additional currencies/languages, loyalty, and automated courier labels. They should follow a reliable garment purchase and fulfilment system.
