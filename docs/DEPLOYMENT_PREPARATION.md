# Explicit release preparation before P1.14

Status on 12 November 2026: preparation code is implemented and tested locally; no real cloud profile, resource, seed or deployment has been created. P1.13 and P1.14 are still open. The existing `night-in-kampala` Firestore database in `eur3` is retained. Its intended production role and a distinct staging project still require owner confirmation.

## Build targets

| Command / mode | Behaviour |
| --- | --- |
| `npm run dev` | Demo emulators on loopback by default. |
| `npm run build` | Optimised offline preview; initializes no Firebase app and refuses cloud service getters. No cloud env file is required. |
| `npm run build:staging` | Requires explicit staging target/public web config in `.env.staging.local` or the process environment. The registered project is rejected as staging; Auth/Storage must match the chosen project. |
| `npm run build:production` | Requires explicit production target/public web config in `.env.production.local` or the process environment; there is no registered-project fallback. |

Cloud configuration requires `VITE_FIREBASE_TARGET` (`staging` or `production`) and JSON `VITE_FIREBASE_CONFIG` containing apiKey, projectId, authDomain, storageBucket, appId and messagingSenderId. Cloud Functions also require `VITE_FIREBASE_FUNCTIONS_REGION`. The current validation permits the standard project Firebase Auth domain and Storage bucket; a later custom Auth domain needs an explicit validation change. API keys/web app config are public client identification, not server credentials.

Do not enable cloud access in ordinary preview builds. Development needs `VITE_USE_EMULATORS=false` plus the explicit target/config to opt into a cloud project. Neither changing a frontend flag nor using a Hosting preview channel isolates a shared Firestore database. Staging and production require distinct project IDs and public origins. All existing seed scripts remain demo-only; there is deliberately no automatic cloud seed command.

## Concrete steps remaining

1. Confirm which project is production and supply/select a distinct staging project. Inspect existing resources/permissions/billing and finish the supported Functions/Storage placement decision. No new resources are implied by this document.
2. Copy `deployments.example.json` to ignored `deployments.local.json`. Fill both roles with their real project IDs, complete public web-app config, HTTPS origin and approved Functions region. Set `approved: true` only after the recorded project/location review. Keep `indexPublicPages: false` for staging and pre-launch production.
3. Run `npm run prepare:deployment -- staging`. This only builds locally. It validates separation, web/server project agreement, explicit region/origin and, when called by Firebase CLI, the CLI's target project. It generates ignored `firebase.staging.generated.json` and `functions/generated/deployment.json`, and packages the matching built HTML.
4. Inspect the generated target/project/origin/region and finish the release checks. Any later authorised release must use the generated config and explicit project together, for example `firebase deploy --config firebase.staging.generated.json --project THE_CONFIRMED_STAGING_ID --only functions,hosting`. This example has **not** been executed. The default `firebase.json` blocks cloud deploys; it remains the emulator configuration.
5. Both generated Functions and Hosting predeploy hooks rerun the selected build before packaging. All four rewrites take their region from the same profile as the Function. `pinTag` ties the second-generation Function version to Hosting assets. Verify real deployed bootstrap hashes, CDN expiry and all four route families on staging; local packaging tests do not prove a cloud release works.
6. Seed only synthetic staging content using a separately reviewed staging-only process that verifies the target and cannot choose production. Such a seeder is not implemented here. Never point the demo seeder at cloud endpoints. Perform the owner's real-phone WhatsApp preview check on a staging URL before P1.15 closes.

The Function starts in an emulator only with the explicit demo/loopback settings. Cloud startup requires the prepared approved artifact and matching platform project identity, with no emulator endpoints. There is no default cloud region or canonical origin; the origin never comes from request headers. `localHealth` is not exported as a cloud endpoint. Function request/scale limits currently include 15 seconds and at most three instances; verify these with the real release/cost requirements.

## Indexing at launch

Preview, staging and pre-launch production remain `noindex, nofollow`. For a reviewed production launch only, set that profile's `indexPublicPages: true` and prepare/release again. This controls the built root HTML, robots.txt and shared-link HTML together. Raw private-route responses keep an `X-Robots-Tag: noindex, nofollow` header; React maintains noindex on private/unknown routes during navigation; shared-link 404/503s stay noindex. Indexing is not an access-control mechanism. Keep staff/customer information protected independently.

The generated configuration removes only the development-wide noindex header when indexing is enabled; private-route headers remain. Direct public/private URLs, robots.txt, error statuses, real catalogue content and launch sitemap/structured-data work still require release verification. The flag is deliberately off now because the site contains development placeholders.

## Automatic checks and evidence

`npm run check` runs ESLint, application tests, metadata tests, deployment-boundary/build tests, the offline build, security-rule tests and Hosting HTTP tests. GitHub Actions runs that command on main-branch pushes and pull requests with Node 24 and Java 21, read-only repository permissions and no Firebase credentials. The workflow is committed locally; it cannot have a remote run until pushed. No deployment is part of CI.

The local pipeline passes **78 tests**: 40 app/SDK, 15 metadata, six deployment, five security-rule and 12 HTTP integration tests. The deployment integration test uses an isolated temporary checkout and synthetic profiles to build staging and production, validate region/asset matching and indexing, and load the cloud Function module without reading cloud data. It does not deploy or verify real IAM, billing, locations or a CDN. Browser checks verified missing-share fallback/default JPEG and updated manual-order wording with no console errors. Full P1.12 shell QA remains separate.

## References

- [Firebase CLI hooks](https://firebase.google.com/docs/cli#predeploy_and_postdeploy_hooks) and [Hosting with Functions](https://firebase.google.com/docs/hosting/functions).
- [Functions environment configuration](https://firebase.google.com/docs/functions/config-env).
- [Google robots meta/X-Robots-Tag guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Official CI actions: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [setup-java](https://github.com/actions/setup-java).
