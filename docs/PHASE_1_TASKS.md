# Phase 1: design and foundations

The owner approved the white theme, roomier homepage, boards 06–09 and numerical measurements. Local tasks **P1.01–P1.10 are implemented and verified**; later Phase 1 tasks remain open. Actual CDN expiry and real shared-link previews still require staging and owner verification. Section 9 of [PROJECT_PLAN.md](PROJECT_PLAN.md) governs scope. See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) and [SHARED_LINK_PREVIEWS.md](SHARED_LINK_PREVIEWS.md) for commands, evidence and limitations.

## Pre-build review gates

Pre-build gates are complete: named fonts are **Anton / Inter / Newsreader**, standalone images are in [the placeholder asset record](implementation-assets/placeholders/README.md), and the owner approved [the measurements](DESIGN_FOUNDATIONS.md). Baseline `873bc7f` was committed before tokens/scaffolding. The local foundation work is recorded in small feature/file-scoped commits.

The added region task makes this a 15-task sequence: original P1.13 staging is now P1.14, and original P1.14 preview closure is now P1.15. [FIREBASE_REGION_DECISION.md](FIREBASE_REGION_DECISION.md) must be completed before any cloud database/bucket creation or staging deployment. [Pre-Phase 2/3 design checks](PRE_PHASE_2_3_DESIGN_CHECKS.md) capture the remaining shop, mobile product, size, email and checkout-screen work.

The owner has since created project `night-in-kampala` and its default Firestore database. CLI metadata confirms `eur3`; preserve that database/location. The web SDK is installed and configured, with development defaulting to demo emulators. P1.13 now resolves only the remaining service placement/staging topology, rather than selecting a new Firestore location. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

**Sales-first scope revision:** the owner deferred email selection and gateway integration in favour of on-site orders, dashboard alerts and staff follow-up for cash/manual payment. Dashboard-only alerts are owner-approved. P1.11 is deferred; merchant applications and sender-domain readiness are no longer Phase 1 completion gates. [SALES_FIRST_LAUNCH.md](SALES_FIRST_LAUNCH.md) and the revised section 9 of the project plan govern the subsequent build.

## Approved visual references

- [Board 04: white style frame](design-concepts/04-style-frame-white.png): colour, typography, borders and controls.
- [Roomier white homepage](design-concepts/05-home-white-spacious.png): desktop composition and spacing.
- [Mobile comparison](design-concepts/05-mobile-spacious-comparison.png): use the white version only.
- [Product](design-concepts/06-product-detail.png), [bag to payment](design-concepts/07-bag-to-payment.png), [events](design-concepts/08-events.png), and [Our process](design-concepts/09-our-process.png): approved page direction for the later feature work.

Use paper `#FFFFFF`, ink `#0B0B0C`, fog `#F1F1EF`, and hairline `#E2E2DF`. Keep the heavy condensed wordmark, restrained UI, daylight photography, square controls, generous gaps, three desktop homepage products and two mobile columns. Navigation remains Shop, Drops, Our process, Lookbook, Events. Generated imagery, measurements, shipping charges and prices remain illustrative.

## Ordered build tasks

**Current status:** P1.01–P1.10 complete locally; P1.11 deferred; P1.12–P1.15 not completed. Next is P1.12 shell QA. P1.09–P1.10 have raw-HTML and real-emulator HTTP evidence, not production CDN or WhatsApp verification. Task IDs remain stable; task 13 resolves remaining service placement before cloud work.

| ID | Small task | Acceptance check | Depends on |
| --- | --- | --- | --- |
| P1.01 | Create `src/styles/tokens.css` from board 04 and the approved numerical specification in DESIGN_FOUNDATIONS.md. Define colours, Anton/Inter/Newsreader roles, responsive type sizes, measured spacing, widths, borders and control/focus states. | Owner has approved the listed values; the first application file records them centrally. Later colours/font sizes use these variables. No scaffold precedes this file. | Approved boards, spacing approval, baseline commit |
| P1.02 | Scaffold React with JavaScript/JSX and Vite. Add ESLint, Vitest with React Testing Library/DOM support, package scripts, lockfile and ignored local environment/build outputs. | Dev server/build work; lint and non-interactive test commands are configured. DOM harness is ready for behaviour tests from P1.04; an empty initial suite is not called coverage. Preserve tokens/docs/images and remove starter branding. Select compatible supported versions from current primary docs. | P1.01 |
| P1.03 | Self-host Anton 400, Inter 400/500/600 and Newsreader 400, with base styles and only needed WOFF2 files/coverage. | Record source/version/checksum and retain each OFL licence; fonts load locally with usable fallbacks and swap behaviour. No external font request or synthetic Anton bold. Base rules consume tokens. | P1.02 |
| P1.04 | Build the small shared UI set: buttons/links, input/select, label, garment-image container, accordion and loading/error states. | A local development view demonstrates normal, focus, disabled and error states at readable sizes. Controls have labels, visible keyboard focus and comfortable touch targets. Business/payment actions are not simulated as successful. | P1.03 |
| P1.05 | Set up routes and route-level loading/not-found states for the launch scope. | Every planned launch path opens directly and through navigation, browser back/forward works, and unknown paths show a useful not-found view. Customer-account features remain outside this phase. | P1.02 |
| P1.06 | Build the common white header, responsive navigation and footer. | Desktop shows the exact five links in the approved order; mobile uses a collapsed menu with working close/Escape/focus behaviour. The wordmark reads NIGHT IN KAMPALA; market and bag controls are present without inventing cart contents. | P1.03–P1.05 |
| P1.07 | Assemble the approved spacious white homepage using standalone images in docs/implementation-assets/placeholders and illustrative fixtures. Prepare responsive compressed renditions during integration. | Three desktop/two phone columns, type, whitespace and imagery follow approved tokens/boards. Each generated fixture has a visible AI-generated-placeholder label and cannot be real purchasable stock. Process/events/footer follow below; links work. No flattened website screenshot substitutes for the application. | P1.04, P1.06 |
| P1.08 | Configure local Auth, Firestore, Storage, Functions and Hosting emulators, environment boundaries, minimal fixtures and initial restrictive rules. | A documented local command starts the required services using a synthetic development project. No production access is needed. Published/draft/sold fixtures support preview testing; draft/private data and uploads are not publicly accessible, verified with focused rule checks. No catalogue editing or checkout is built here. | P1.02 |
| P1.09 | Implement the shared-link HTML function for product, collection, event and lookbook slugs. Use the built Vite HTML and public metadata from Firestore. | Raw HTTP responses, without running JavaScript, contain the correct title, description, canonical URL and absolute Open Graph image for all four content types. Values are escaped, the canonical origin is configured, sold pieces still resolve, and unknown/unpublished slugs return 404 without private metadata. The returned app still loads its correct built assets. | P1.05, P1.08 |
| P1.10 | Configure and verify Hosting rewrites and the metadata cache contract. | The four detail-route families reach the function; assets and ordinary SPA routes load correctly on refresh. A fixture metadata change becomes visible within the documented cache window. Define the publication/unpublication refresh behaviour for the Phase 2 publisher; do not claim that the publisher already exists. | P1.09 |
| P1.11 — deferred | Select a transactional email service only when automated customer messages are scheduled after the manual-sales launch. | Not required for Phase 1 closure or initial ordering. On resumption: verify provider terms, domain/DNS, secrets and local previews before sending. Do not mark this task completed merely because it is deferred. | Later messaging requirements |
| P1.12 | Verify responsive shell, navigation and components against the boards. | Capture 360/390px phone, tablet and desktop views; check overflow, keyboard access, focus, readable type and spacing. Build, lint and relevant behaviour/rule/metadata tests pass. Record observed gaps. | P1.07–P1.10 |
| P1.13 | Complete FIREBASE_REGION_DECISION.md before provisioning: inspect resources; compare service compatibility, latency evidence, costs and location needs; record explicit Firestore/Functions/Storage choices and Hosting rewrite support. | Owner approves a concrete supported topology and rationale before a database/bucket is created. No implicit default or presumed proximity result. Record staging and intended production settings. | P1.08; project information; can run alongside local work |
| P1.14 | Finish staging readiness and publish foundations using distinct project roles and approved placement. | Supply actual staging/production profiles/access/billing, prepare matched browser/Function/Hosting artifacts, review a staging-only synthetic seed process, deploy with explicit project/generated config, verify raw HTML/assets/headers/CDN expiry. Current preparation code is tested locally; real readiness/deployment is unfinished. Default config blocks cloud deploys. See DEPLOYMENT_PREPARATION.md. | P1.12, P1.13; confirmed separate staging project/access |
| P1.15 | Verify a real shared-product preview and close Phase 1. | Owner manually confirms the correct title/photograph in a WhatsApp preview of a staging product URL. Check other content types/404s on staging. P1.12–P1.14 must pass; email selection and merchant applications are explicitly deferred and do not keep Phase 1 open. | P1.14; owner preview check |

Only the completion status above claims delivered work. Per-item HTML previews exist locally; no cloud deployment has occurred. P1.14 must test real edge-cache expiry and matching Function/Hosting assets; P1.15 still requires the owner's WhatsApp check.

## Route map for the shell

| Navigation / area | Planned paths |
| --- | --- |
| Home | `/` |
| Shop, product, sold archive | `/shop`, `/products/:slug`, `/archive` |
| Drops | `/collections`, `/collections/:slug` |
| Our process | `/about` |
| Lookbook | `/lookbooks`, `/lookbooks/:slug` |
| Events | `/events`, `/events/:slug` |
| Help and contact | `/help/:slug`, `/contact` |
| Later commerce within launch scope | `/cart`, `/checkout`, `/orders/:id` |
| Staff | `/admin` and its later staff routes, loaded separately |

Phase 1 supplies the shell and placeholders. Live catalogue reads/publishing and simple editable pages are Phase 2; bag, on-site order submission, dashboard alerts, staff follow-up, manual-payment recording and fulfilment are Phase 3. Gateway payment/email automation is deferred. A placeholder order route must never expose an order by ID alone.

The owner's review adds required Phase 3 WhatsApp handoff/recent-order record, four public availability states, reserve-at-confirmation, limits/bot checks and staff spam controls. See [MANUAL_ORDER_REQUIREMENTS.md](MANUAL_ORDER_REQUIREMENTS.md). None is claimed implemented by the Phase 1 review fixes.

## Owner work in parallel

| Owner input / action | Needed for | Completion evidence |
| --- | --- | --- |
| Merchant applications — deferred. | Later gateway integration; no initial launch gate. | Revisit eligibility/provider test access when the owner schedules automated payment. No application has been submitted by this agent. |
| Provide staging project access, existing resource/location information, billing setup and public site origin. | P1.13 location decision and P1.14 staging. Emulators can proceed first. | Location proposal is approved before provisioning; staging project/configuration is confirmed. |
| Sender domain/address and DNS — deferred. | Later transactional email, not initial orders. | Request only when email work resumes. |
| Provide real product imagery/measurements/prices/stock, staff identities, business phone/WhatsApp contact and approved collection/delivery/cash arrangements. Confirm hold/release and follow-up policy. | Phase 2 catalogue and Phase 3 manual orders. | Inputs are separate from fixtures; no invented cash-on-delivery coverage or final shipping cost. Dashboard-only alerts are already approved. |
| Confirm the staging product preview in WhatsApp. | P1.15 external preview gate. | Owner confirms displayed product name/image; automated HTML inspection alone does not close this check. |

Do not request account passwords or paste private provider keys into documentation. Select current provider/library details when each corresponding task starts. Missing real catalogue material need not delay the local shell.

## Review and scope boundary

The list and numerical specification were approved before building. P1.01–P1.08 are recorded in the local-development report; P1.09–P1.10 are recorded in the shared-link preview report. The remaining tasks and Phase 2/3 design checks still apply.

Tooling references for P1.02: [ESLint](https://eslint.org/docs/latest/use/getting-started), [Vitest](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). Check configuration and version compatibility when installing.

Customer accounts, wishlists, promotions, reporting, full content-management workflows, native event ticketing and an additional admin-orders concept remain outside Phase 1. The security and inventory requirements in sections 7 and 8 of the main plan remain required for launch.
