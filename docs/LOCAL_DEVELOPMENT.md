# Local foundations: P1.01–P1.10

Implemented against approved measurements/white boards; baseline `873bc7f` precedes the feature commits. The registered `night-in-kampala` app is recorded, but cloud use now requires explicit target/config; ordinary built previews are offline. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) and [DEPLOYMENT_PREPARATION.md](DEPLOYMENT_PREPARATION.md). No push, cloud provisioning or deployment was performed.

## Requirements and run commands

Use the project root `/Users/kezileo/Desktop/Night_in_kampala/night-in-kampala-web`.

- Node 24.x: verified with 24.6.0 and npm 11.12.1. Package versions are pinned in the lockfile. jsdom 26.1 and Firebase SDK 12.19/rules testing 5.0.2 are compatible choices for this runtime; newer test-package majors require a newer Node patch release.
- Java 21+ for Firebase emulators. On macOS the runner selects an installed compatible JDK with `java_home`; this machine used Java 24. It changes only the child process environment. On other systems provide a compatible Java on PATH.
- First installation and emulator runtime downloads need network access. Subsequent fixture operations are local.

```sh
npm ci
npm run assets
npm run dev
```

The Vite preview is at `http://127.0.0.1:5173/` when running. Per-item raw-HTML previews require the built Hosting emulator at port 5500, not the Vite dev server. `npm run assets` reproducibly creates responsive WebP renditions from the archived generated PNGs and copies self-hosted font files/licences from pinned packages. Original generated source images remain in docs. The asset pipeline is separate from the ordinary build and does not regenerate images or contact an image service. The ordinary build also packages the matching HTML into `functions/generated/index.html`.

To run the emulators, first build Hosting's local files, then use two terminals:

```sh
npm run build
npm run emulators
```

```sh
npm run emulators:seed
npm run test:rules
npm run test:metadata
npm run test:hosting
```

The runner always selects `demo-night-in-kampala`, loopback listeners and project-local caches. It disables cloud metadata-server discovery. `.firebaserc` has a `connected` alias for the owner's project but no default real project. The rules-test project is `demo-night-in-kampala-rules`. P1.13's decision still precedes cloud provisioning; the local health endpoint's `us-central1` path is only an emulator convention.

| Local service | Address |
| --- | --- |
| Emulator UI | `http://127.0.0.1:4000` |
| Auth | `127.0.0.1:9099` |
| Firestore | `127.0.0.1:8080` |
| Storage | `127.0.0.1:9199` |
| Functions | `127.0.0.1:5001` |
| Built-site Hosting | `http://127.0.0.1:5500` |

Hosting uses 5500 because another local service already occupied 5000. Do not stop that other service. If a required port is busy, the emulator command should fail visibly instead of silently selecting a cloud target. Stop owned local servers with Ctrl+C.

## Scope delivered

| Task | Evidence |
| --- | --- |
| P1.01 | `src/styles/tokens.css` was the first application file. It contains the approved four-colour palette, named fonts, responsive type/spacing and control values. |
| P1.02 | React JavaScript/Vite scaffold, exact package versions and lockfile; build, ESLint and Vitest scripts pass. |
| P1.03 | Anton 400, Inter 400/500/600 and Newsreader 400 are self-hosted, with OFL files and package/checksum provenance in `public/asset-provenance.json`. Five font files total 113,480 bytes. |
| P1.04 | Shared buttons, fields, select, badge, accordion, loading/error states and a modal. Local `/components` demonstrates states; it is excluded from production builds. |
| P1.05 | Launch route shell, deep-link SPA fallback, not-found view, route focus and lazy staff area. No account/wishlist/promotions routes added. |
| P1.06 | Fixed five-link navigation, white header/footer, mobile menu, search-to-shop navigation and a remembered region preference. UGX remains the display currency; choosing international does not claim conversion or worldwide delivery. |
| P1.07 | Spacious homepage, three desktop/two phone columns, separate responsive assets and visible generated-placeholder labels. Narrow-phone wordmark uses board 04's compact two-line arrangement without shrinking the approved type size. Below 360px the product grid can use one column. |
| P1.08 | All five emulators started together; synthetic published/draft/sold content and identities seeded; health and Hosting deep link verified; five access-rule tests passed. |
| P1.09 | Published product, collection, event and lookbook metadata is embedded in built HTML; escaped values, explicit origin, sold pieces and safe 404/503 behaviour tested. React preserves server titles and error screens. |
| P1.10 | Hosting routes details to the Function, keeps listings/static assets working, and delivers 60-second shared-cache headers for published HTML with uncached failures/404s. Edits/unpublish/republish verified at the local origin. Actual CDN expiry remains a staging check. |

Twelve image renditions total 641,980 bytes across all responsive sizes, rather than shipping the archived multi-megabyte PNGs. The browser chooses the needed rendition. This is an asset-size record, not a measured Core Web Vitals claim.

The homepage uses read-only fixtures. Startup initializes demo Firebase in development; the default optimised build initializes no Firebase app. Cloud targets/configs and Functions regions must be explicit. `localFirebase.js` still rejects non-development/non-loopback use; offline previews reject all service getters. Analytics is off. Rules expose only published content and deny client writes/private records, including staff claims. Storage remains closed until Phase 2 publication paths exist. Staff editing and ordering remain unimplemented.

## Checks completed

```sh
npm run lint
npm test
npm run build
npm run test:rules
npm run test:deployment
npm run check
```

- 13 behaviour/connection-boundary tests passed: placeholder purchase exclusion, exact menu links, cancel/focus return, route navigation, encoded search, region preference, private order protection, deferred/unknown routes, accessible field errors and the local Firebase boundary.
- Five emulator rules tests passed: published/sold visibility, constrained list queries, blocked financial/role/stock writes, private records and private media/uploads. Expected permission-denied logs are successful negative tests.
- Real browser checks at 360, 390, 768, 1024 and 1440px found no horizontal page overflow. A narrow-header collision was corrected. Native Tab/Shift+Tab wrapping, Escape and focus return were checked. All four images loaded and no browser warnings/errors were observed during the final check. This is initial shell verification, not full P1.12 accessibility/performance certification.
- Local Functions health returned a synthetic local-only response. P1.09–P1.10 now add per-item raw HTML through Hosting: 13 metadata tests and 11 HTTP integration tests pass. The application/SDK suite now has 36 passing tests, including server-title preservation and error screens; the historical 13-test record above describes the original foundation checks. See [SHARED_LINK_PREVIEWS.md](SHARED_LINK_PREVIEWS.md) for schema, cache behaviour and reproduction commands.
- Local browser screenshots are under ignored `artifacts/`, including `home-desktop.jpg`, `home-desktop-1440.jpg`, `home-mobile-360.jpg`, `home-mobile-390.jpg` and `home-tablet-768.jpg`.

## Dependency audit and limits

The installed Firebase SDK pinned an older gRPC transport. A same-major `@grpc/grpc-js` override to 1.14.7 removes the high findings; application and emulator tests pass with it. The post-fix production dependency audit reports **zero advisories**. The full dependency audit still reports **17 moderate advisories**, confined to development tooling paths (Firebase CLI and ESLint, including their transitive dependencies). No forced major-version downgrades or incompatible runtime upgrades were applied. Revisit supported upstream tool updates with the later toolchain maintenance work; a clean production audit is not a claim that all development packages are advisory-free.

Latest review evidence: `npm run check` passes lint/build and 78 tests (40 app, 15 metadata, six deployment, five rules, 12 HTTP). Browser checks confirm optional-share fallback/default JPEG and no old order-email promise, with no console errors. Four 1200×630 JPEG social renditions augment the 12 storefront WebP renditions; store images cache one day, fonts one week, hashed JS/CSS one year. The workflow is committed locally but has not run remotely because no push was requested.

P1.11 email selection is deferred. P1.12–P1.15 still need full shell QA, remaining project/location decisions, real staging readiness/deployment and owner-confirmed WhatsApp preview. Cloud preparation is implemented, but no approved real profile or deployment exists; the actual CDN/phone check remains unverified. Catalogue/orders/admin are placeholders. [Manual-order requirements](MANUAL_ORDER_REQUIREMENTS.md) now govern later WhatsApp handoff/recent-order record, Requested availability, server limits and spam controls. Real stock/contact/cash/delivery terms, overdue threshold and confirmed-hold/Sold transition policy are still needed.
