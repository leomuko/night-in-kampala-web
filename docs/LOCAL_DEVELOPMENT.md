# Local foundations: P1.01–P1.08

Implemented against the approved measurements and the spacious white boards. Baseline `873bc7f` precedes feature/file-scoped commits. The owner subsequently supplied project `night-in-kampala`; its SDK setup is documented in [FIREBASE_SETUP.md](FIREBASE_SETUP.md). No push, cloud provisioning by this agent, region selection or production deployment was performed.

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

The Vite preview is at `http://127.0.0.1:5173/` when running. `npm run assets` reproducibly creates responsive WebP renditions from the archived generated PNGs and copies self-hosted font files/licences from pinned packages. Original generated source images remain in docs. The asset pipeline is separate from the ordinary build and does not regenerate images or contact an image service.

To run the emulators, first build Hosting's local files, then use two terminals:

```sh
npm run build
npm run emulators
```

```sh
npm run emulators:seed
npm run test:rules
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

Twelve image renditions total 641,980 bytes across all responsive sizes, rather than shipping the archived multi-megabyte PNGs. The browser chooses the needed rendition. This is an asset-size record, not a measured Core Web Vitals claim.

The homepage uses read-only fixtures. Startup initializes Firebase core: demo by default in development, the registered app in production. Auth/Firestore/Storage clients load on explicit use. `localFirebase.js` continues to reject cloud/non-development/non-loopback use; `firebase.js` supplies separate cloud getters, and cloud Functions needs an explicit region. Analytics remains off. Initial rules expose only published content and deny client writes/private records, including to staff claims. Storage remains closed until Phase 2 publication paths exist. No staff editing or checkout is implemented yet.

## Checks completed

```sh
npm run lint
npm test
npm run build
npm run test:rules
```

- 13 behaviour/connection-boundary tests passed: placeholder purchase exclusion, exact menu links, cancel/focus return, route navigation, encoded search, region preference, private order protection, deferred/unknown routes, accessible field errors and the local Firebase boundary.
- Five emulator rules tests passed: published/sold visibility, constrained list queries, blocked financial/role/stock writes, private records and private media/uploads. Expected permission-denied logs are successful negative tests.
- Real browser checks at 360, 390, 768, 1024 and 1440px found no horizontal page overflow. A narrow-header collision was corrected. Native Tab/Shift+Tab wrapping, Escape and focus return were checked. All four images loaded and no browser warnings/errors were observed during the final check. This is initial shell verification, not full P1.12 accessibility/performance certification.
- Local Functions health returned a synthetic local-only response. A direct `/events/fixture-published` request through Hosting returned the built SPA. This does not implement the per-item raw-HTML metadata function in P1.09.
- Local browser screenshots are under ignored `artifacts/`, including `home-desktop.jpg`, `home-desktop-1440.jpg`, `home-mobile-360.jpg`, `home-mobile-390.jpg` and `home-tablet-768.jpg`.

## Dependency audit and limits

The installed Firebase SDK pinned an older gRPC transport. A same-major `@grpc/grpc-js` override to 1.14.7 removes the high findings; application and emulator tests pass with it. The post-fix production dependency audit reports **zero advisories**. The full dependency audit still reports **17 moderate advisories**, confined to development tooling paths (Firebase CLI and ESLint, including their transitive dependencies). No forced major-version downgrades or incompatible runtime upgrades were applied. Revisit supported upstream tool updates with the later toolchain maintenance work; a clean production audit is not a claim that all development packages are advisory-free.

P1.09–P1.15 remain unfinished: raw-HTML sharing previews, cache/publication contract, email service, full shell QA, cloud region decision, staging and owner-confirmed WhatsApp preview. Catalogue and commerce pages are honest placeholders. Search currently carries the query to the shop shell; newsletter subscription, live catalogue, checkout and staff editing await their planned phases. Real garments/photos, owner contacts, merchant onboarding and shipping details remain necessary.
