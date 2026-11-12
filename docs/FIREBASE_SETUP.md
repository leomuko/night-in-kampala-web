# Firebase web SDK setup

The owner supplied the registered web app configuration for project **night-in-kampala**. The existing pinned `firebase@12.19.0` installation already contains the modular products required here, so no dependency or lockfile update was needed.

## What is installed and wired

- `src/services/firebaseConfig.js` records the supplied web configuration, including app ID `1:1097680313454:web:d17294460797935ec8da7f`, Storage bucket name and optional Analytics measurement ID. Firebase web config identifies the client; it is not an Admin/service-account credential. [Official setup](https://firebase.google.com/docs/web/setup), [Firebase API-key guidance](https://firebase.google.com/docs/projects/api-keys).
- `src/services/firebaseApp.js` provides idempotent app initialization. `src/main.jsx` initializes the app before rendering React; repeated calls reuse the matching named app. A changed config requires a page reload rather than silently retaining another target.
- `src/services/firebase.js` provides lazy Auth, Firestore and Storage clients. Core initialization alone does not read or write the database or create cloud resources. The homepage still uses labelled, non-purchasable preview fixtures.
- Cloud Functions are obtained separately with `getFirebaseFunctions()`, which requires `VITE_FIREBASE_FUNCTIONS_REGION`. It refuses to silently select a cloud region. The existing local Functions emulator remains usable.
- `.firebaserc` registers the neutral alias `connected` for `night-in-kampala`. There is intentionally no default cloud project, and the emulator scripts still pass their synthetic demo project explicitly.

## Environment behaviour

| Situation | App target |
| --- | --- |
| Default local Vite development | `demo-night-in-kampala` on loopback; no real project data |
| Development with `VITE_USE_EMULATORS=false` | The owner's registered app, explicitly opted into |
| Production build, flag unset or false | `night-in-kampala` |
| Production build with emulator flag true | Configuration error; emulator builds cannot accidentally become a deployed storefront |
| Emulator mode on a non-loopback hostname | Rejected |

No `.env` file is required for the default local setup. For overrides, copy `.env.example` to **`.env.development.local`**, not `.env.local`, so development-only flags are not automatically loaded by production builds. Restart Vite after changing an environment file.

```sh
cp .env.example .env.development.local
npm run dev
```

The example documents `VITE_USE_EMULATORS`; leave it unset for the safe development default. Only set it false when deliberately exercising the real project. Service getters are ready for later features, but no catalogue queries or staff sign-in flows have been added in this installation step. The fixture-seeding scripts never use the real project, regardless of frontend flags.

## Optional Analytics

`firebaseAnalytics.js` implements optional, lazy Analytics setup using `isSupported()`, `getAnalytics()` and SDK consent/collection controls. Analytics is **disabled by default**. Initializing the app in main does not call Analytics.

Enabling it requires all of: a production browser context, cloud app mode, `VITE_ENABLE_ANALYTICS=true`, and an explicit call to `enableFirebaseAnalytics({ consentGranted: true })` from a future consent control. Marketing/ad consent remains denied. `disableFirebaseAnalytics()` withdraws consent and disables collection if it was started. Unsupported contexts or optional Analytics initialization failures return null instead of breaking the store. No consent banner or tracking-event integration has been added yet. [Analytics API reference](https://firebase.google.com/docs/reference/js/analytics).

## Verified and not yet verified

Lint, 32 application/SDK tests and the production build passed. Tests use real Firebase core initialization for app identity/reuse, and mocks for data clients and Analytics to verify routing, region and consent boundaries without live service calls. The existing five emulator rule tests remain part of P1.08; the rules were not changed by this SDK setup.

After the owner confirmed database creation, read-only CLI inspection verified the existing `(default)` Firestore database in **eur3**, Native mode, Standard edition. It is retained as-is. The web config itself does not reveal sign-in providers, billing, deployed rules or Storage placement; those settings have not been inspected or changed. [FIREBASE_REGION_DECISION.md](FIREBASE_REGION_DECISION.md) now records the confirmed Firestore location and the remaining Functions/Storage work. No cloud resources were created by this agent, and no document contents, Analytics collection, deployment or Git push were involved.

Subsequent P1.09–P1.10 work is now implemented locally: see [shared-link previews](SHARED_LINK_PREVIEWS.md) for raw-HTML rendering, Hosting rewrites, the cache contract and additional tests. The owner has deferred P1.11 email selection and gateway integration; next is P1.12 shell QA, with remaining staging/placement work still required. [Sales-first launch](SALES_FIRST_LAUNCH.md) prioritises on-site orders, dashboard alerts and staff follow-up for cash/manual payment. SDK installation and local previews do not close the staging/WhatsApp acceptance gates or implement that order workflow.
