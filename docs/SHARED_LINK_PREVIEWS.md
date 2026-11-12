# Shared-link previews: P1.09–P1.10

Implemented and verified locally on 12 November 2026. These are HTML previews inside the existing React/Vite architecture, not completed catalogue pages. The existing cloud Firestore database (`night-in-kampala`, `eur3`) was not changed. No deployment, cloud provisioning, customer data or live payment was involved.

## Request and build flow

Firebase Hosting sends `/products/**`, `/collections/**`, `/events/**` and `/lookbooks/**` to `renderSharedLink` before the SPA fallback. The Function accepts one slug segment, reads the matching Firestore document, explicitly checks `status === 'published'`, and replaces the marked head block in the built Vite HTML. Other shell routes retain the static SPA fallback; static assets take precedence over rewrites.

Browsers and crawlers receive the same title, description, canonical URL, Open Graph title/description/URL/image/alt text and unchanged React bootstrap. No JavaScript is required to discover the preview. Sold published products return 200. Missing, draft and archived documents return generic 404s; Firestore failures or incomplete published metadata return a generic 503, without document/error details. Only GET and HEAD are accepted.

React preserves the server title and shows server 404/503 screens. Navigation away removes stale item tags; browser Back restores the original route's head. Phase 2 must add current metadata during client-side catalogue navigation; this phase does not fetch live catalogue data in React.

`npm run build` builds Vite, validates the unique head markers and root-relative built assets, and copies that exact HTML to ignored `functions/generated/index.html`. Functions packages only include their own source directory, so relying on root `dist/` at function runtime would fail. Rebuild after frontend changes and restart the emulators if an already-loaded template remains cached. The later staging release must deploy the matching Function/template and Hosting assets together and verify the served script hashes.

All pages still contain `noindex, nofollow` while the store is in development. Launch indexing, structured product data and sitemap work remain separate.

## Public metadata contract for Phase 2

Document IDs are stable lowercase slugs, one to 120 characters, composed of letters/numbers with single separating hyphens. Paths with an optional trailing slash share a canonical URL without it; query parameters never enter canonical URLs. Do not silently rename published slugs without a redirect policy.

| Field | Required on a published shareable document |
| --- | --- |
| `status` | Exactly `published` for public rendering. Draft/archived documents never provide preview metadata. |
| `name` / `title` | Products use `name`; collections, events and lookbooks use `title`. Non-empty string, at most 200 characters. The renderer appends ` — Night in Kampala`. |
| `share.description` | Non-empty plain text, at most 500 characters. |
| `share.imageUrl` | Root-relative public asset path or public HTTPS image URL, at most 2,048 characters. No protocol-relative URL, credentials, fragment, backslash or script/data URL. It is made absolute using the configured origin. |
| `share.imageAlt` | Non-empty plain text, at most 300 characters. |

All inserted values are HTML-escaped. The renderer only selects these fields; it never serializes the document into HTML or fetches the image URL. The publisher must validate the photograph's actual public accessibility/type and metadata before publication. Current images are static, visibly illustrative assets; Storage uploads/publication remain closed until Phase 2.

Published documents are entirely public under the existing Firestore read rules. Keep private notes, supplier information and other private records in protected documents/collections; selecting fields for HTML does not make other fields in a published Firestore document private.

The three existing homepage product links are seeded from `src/data/previewProducts.js` alongside the published/draft/sold fixtures. They remain `isRealCatalogueStock: false` and `purchasable: false`. Nothing here makes generated clothing available to buy.

## Origin and environment boundaries

The Function currently refuses startup unless all three match: `FUNCTIONS_EMULATOR=true`, `GCLOUD_PROJECT=demo-night-in-kampala`, and `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`. Its trusted local origin is explicitly `http://127.0.0.1:5500`; `us-central1` in the Function and Hosting rewrites is only an emulator convention. Incoming Host/forwarded-host headers never choose canonical URLs.

Before P1.14, complete P1.13, confirm the staging project and HTTPS public origin, replace the local-only adapter with reviewed cloud configuration (including required `SITE_ORIGIN`), and update Function/rewrite regions together. The existing Firestore stays in `eur3`; `europe-west1` is the documented corresponding Functions candidate, still subject to the placement decision. The current guard intentionally prevents cloud deployment. No implicit region or origin is selected for staging.

## Cache and publication contract

| Response | Policy |
| --- | --- |
| Published HTML | `public, max-age=0, s-maxage=60, must-revalidate` — browsers revalidate; shared caches may reuse a response for 60 seconds. No application-level document/HTML response cache. |
| Missing/unpublished HTML, read/render errors, rejected methods | `no-store`. Explicitly overrides Hosting's default negative-cache behaviour. |
| Vite JS/CSS with the current eight-character content hash | `public, max-age=31536000, immutable`. |
| Stable-name images/fonts and known static shell paths | `no-cache`, allowing conditional revalidation rather than a long immutable lifetime. |

The Phase 2 publisher must validate and commit all required public fields together, then confirm the resulting URL through Hosting. Metadata edits become visible at the origin on the next request; a previously cached published page may remain at an edge for up to 60 seconds. Unpublishing returns 404 on the next origin request, with the same maximum remaining lifetime for an earlier cached 200. Uncached 404s mean republishing needs no negative-cache purge. Do not claim an immediate global purge or build a fake refresh action: this contract uses bounded expiry. Preview-only changes to public images should use versioned filenames/URLs.

The Functions HTML template may be cached in-process because it is a build artifact; Firestore metadata is read anew on each invocation. A matching code/assets deployment replaces that template. WhatsApp/Instagram maintain their own caches outside this HTTP contract; P1.15 still needs the owner's actual WhatsApp preview confirmation.

The Hosting emulator has no production CDN. Local checks verify origin freshness, the exact delivered headers and publish/unpublish transitions. The actual edge-expiry check remains a staging acceptance check in P1.14; local tests do not prove global CDN behaviour.

## Reproduce the checks

```sh
npm run build
npm run test:metadata
npm run test:hosting
npm test
npm run lint
npm run test:rules
```

`test:hosting` reuses running loopback emulators or starts/stops an isolated Firestore/Functions/Hosting run with explicit demo project configuration. It creates and removes only its own `http-fixture-*` records. Java 21+ is required. Build first; a missing or stale Functions HTML template fails the checks.

For a browser preview, run `npm run emulators`, then `npm run emulators:seed`. Open `http://127.0.0.1:5500/products/preview-painted-denim` or `/products/fixture-published`. `/products/fixture-draft` must show the not-found screen. These are loopback URLs, not shareable staging links.

Evidence: 13 metadata tests, 11 real Hosting/Function/Firestore HTTP integration tests, 36 application/SDK tests and five Firestore/Storage rule tests. The integration tests verify all four route families, escaped content, reachable WebP images, exact built scripts/styles/fonts, sold pieces, safe 404s, HEAD/POST behaviour and edit/unpublish/republish without restarting the process. Browser checks confirmed preserved title, cleared metadata on Shop navigation, restored title on Back, draft not-found screen and the homepage preview product's title. Local screenshot: ignored `artifacts/shared-link-draft-404.png`. Full P1.12 responsive shell review remains separate.

## Primary references

- [Firebase Hosting with Functions](https://firebase.google.com/docs/hosting/functions): rewrites, explicit regions, local testing and deployment coupling.
- [Firebase Hosting cache behaviour](https://firebase.google.com/docs/hosting/manage-cache): shared-cache lifetimes and explicit headers for 404 responses.
- [Hosting configuration](https://firebase.google.com/docs/hosting/full-config): route priority, headers and rewrite configuration.

Checked during implementation on 12 November 2026. The HTTP integration tests caught and removed a general static cache rule that initially overrode the Function's status-specific cache headers.
