# Firebase web SDK setup

The owner supplied the registered web app configuration for project **night-in-kampala**. The existing pinned `firebase@12.19.0` installation already contains the modular products required here, so no dependency or lockfile update was needed.

## What is installed and wired

- `src/services/firebaseConfig.js` records the supplied web configuration, including app ID `1:1097680313454:web:d17294460797935ec8da7f`, Storage bucket name and optional Analytics measurement ID. Firebase web config identifies the client; it is not an Admin/service-account credential. [Official setup](https://firebase.google.com/docs/web/setup), [Firebase API-key guidance](https://firebase.google.com/docs/projects/api-keys).
- `src/services/firebaseApp.js` provides idempotent initialization for explicitly configured cloud builds or local emulator development. The default built preview returns no Firebase app; all data/Functions getters reject offline preview access. Repeated configured calls reuse the matching named app; changed config requires reload.
- `src/services/firebase.js` provides lazy Auth, Firestore and Storage clients. Core initialization alone does not read or write the database or create cloud resources. The homepage still uses labelled, non-purchasable preview fixtures.
- Cloud Functions are obtained separately with `getFirebaseFunctions()`, which requires `VITE_FIREBASE_FUNCTIONS_REGION`. It refuses to silently select a cloud region. The existing local Functions emulator remains usable.
- `.firebaserc` registers the neutral alias `connected` for `night-in-kampala`. There is intentionally no default cloud project, and the emulator scripts still pass their synthetic demo project explicitly.

## Environment behaviour

| Situation | App target |
| --- | --- |
| Default local Vite development | `demo-night-in-kampala` on loopback; no real project data |
| Development with `VITE_USE_EMULATORS=false` only | Offline preview; this flag alone no longer opts into the real project |
| Default `npm run build` | Optimised offline preview, no Firebase app or cloud clients |
| Explicit staging/production build | Requires `VITE_FIREBASE_TARGET` and complete `VITE_FIREBASE_CONFIG`, with no registered-project fallback; staging rejects `night-in-kampala` and mismatched Auth/Storage settings |
| Production build with emulator flag true | Configuration error; emulator builds cannot accidentally become a deployed storefront |
| Emulator mode on a non-loopback hostname | Rejected |

No `.env` file is required for the default local setup. For overrides, copy `.env.example` to **`.env.development.local`**, not `.env.local`, so development-only flags are not automatically loaded by production builds. Restart Vite after changing an environment file.

```sh
cp .env.example .env.development.local
npm run dev
```

Leave `VITE_USE_EMULATORS` unset for default local development. To deliberately use cloud locally, set it false and supply the explicit target/full public config. Target-specific cloud build overrides belong in `.env.staging.local` / `.env.production.local`; approved release preparation instead supplies matching browser/server configuration from `deployments.local.json`. See [DEPLOYMENT_PREPARATION.md](DEPLOYMENT_PREPARATION.md). No cloud profiles have been filled or deployed. The seed scripts remain demo-only regardless of frontend flags.

## Optional Analytics

`firebaseAnalytics.js` implements optional, lazy Analytics setup using `isSupported()`, `getAnalytics()` and SDK consent/collection controls. Analytics is **disabled by default**. Initializing the app in main does not call Analytics.

Enabling it requires all of: a production browser context, cloud app mode, `VITE_ENABLE_ANALYTICS=true`, and an explicit call to `enableFirebaseAnalytics({ consentGranted: true })` from a future consent control. Marketing/ad consent remains denied. `disableFirebaseAnalytics()` withdraws consent and disables collection if it was started. Unsupported contexts or optional Analytics initialization failures return null instead of breaking the store. No consent banner or tracking-event integration has been added yet. [Analytics API reference](https://firebase.google.com/docs/reference/js/analytics).

## Verified and not yet verified

The initial SDK setup passed 32 app tests. After review fixes, `npm run check` passes lint, builds and 78 tests, including 40 app/SDK tests and six deployment-boundary/build tests. Real Firebase core tests verify identity/reuse; mocks verify data/Analytics boundaries without live data calls. Isolated synthetic cloud-build tests verify matching artifacts without deploying. The five emulator rule tests still pass; public access rules have not been loosened.

After the owner confirmed database creation, read-only CLI inspection verified the existing `(default)` Firestore database in **eur3**, Native mode, Standard edition. It is retained as-is. The web config itself does not reveal sign-in providers, billing, deployed rules or Storage placement; those settings have not been inspected or changed. [FIREBASE_REGION_DECISION.md](FIREBASE_REGION_DECISION.md) now records the confirmed Firestore location and the remaining Functions/Storage work. No cloud resources were created by this agent, and no document contents, Analytics collection, deployment or Git push were involved.

Subsequent P1.09–P1.10 work is now implemented locally: see [shared-link previews](SHARED_LINK_PREVIEWS.md) for raw-HTML rendering, Hosting rewrites, the cache contract and additional tests. The owner has deferred P1.11 email selection and gateway integration; next is P1.12 shell QA, with remaining staging/placement work still required. [Sales-first launch](SALES_FIRST_LAUNCH.md) prioritises on-site orders, dashboard alerts and staff follow-up for cash/manual payment. SDK installation and local previews do not close the staging/WhatsApp acceptance gates or implement that order workflow.
