# Night in Kampala

A planned React JavaScript storefront and Firebase backend for reworked clothing, brand stories, and fashion events, serving Uganda and selected international markets.

## Planning documents

- [Project plan](docs/PROJECT_PLAN.md): design, shopping journey, administration, architecture, delivery phases, and launch criteria.
- [Sales-first launch](docs/SALES_FIRST_LAUNCH.md): on-site orders, dashboard alerts and staff follow-up for cash/manual payment; email and gateway integration deferred.
- [Manual-order requirements](docs/MANUAL_ORDER_REQUIREMENTS.md): WhatsApp handoff/recent record, request states, limits and staff spam controls for Phase 3.
- [Research](docs/RESEARCH.md): brand evidence, reference-store observations, sources, and outstanding questions.
- [Phase 1 tasks](docs/PHASE_1_TASKS.md): ordered foundations work with an acceptance check for each task.
- [Design foundations](docs/DESIGN_FOUNDATIONS.md): approved Anton/Inter/Newsreader and measured layout values.
- [Local development](docs/LOCAL_DEVELOPMENT.md): commands, completed local P1.01–P1.10 checks and remaining limits.
- [Firebase SDK setup](docs/FIREBASE_SETUP.md): registered project configuration, emulator/cloud behaviour and optional Analytics.
- [Deployment preparation](docs/DEPLOYMENT_PREPARATION.md): offline/explicit cloud targets, matched build/region hooks, indexing and CI; real staging readiness remains open.
- [Shared-link previews](docs/SHARED_LINK_PREVIEWS.md): local P1.09–P1.10 implementation, public metadata schema, cache contract and staging limits.
- [Standalone placeholder images](docs/implementation-assets/placeholders/README.md): generated development assets and their provenance.
- [Firebase location decision](docs/FIREBASE_REGION_DECISION.md): explicit gate before cloud resource creation/staging.
- [Phase 2/3 design checks](docs/PRE_PHASE_2_3_DESIGN_CHECKS.md): missing views and checkout/product corrections.

- [Visual concepts](docs/design-concepts/README.md): round-1 mockups and the [round-2 image prompts](docs/design-concepts/PROMPTS-ROUND-2.md).

Status: P1.01–P1.10 are implemented locally. Review fixes add resilient metadata/JPEG previews, media caching, offline default builds, explicit cloud/deployment configuration and production indexing controls. `npm run check` passes lint/build and 78 tests (40 app/SDK, 15 metadata, six deployment, 12 HTTP, five rules). Development defaults to demo emulators; built previews initialize no Firebase app. Analytics is off. Catalogue/orders/admin remain placeholders. P1.11 is deferred; P1.12–P1.15 and real project roles/locations, staging/CDN/WhatsApp verification remain open. The existing cloud database is unchanged; nothing has been pushed/deployed.

Current launch priority: publish real garments, let customers place orders on the site, notify staff through the admin dashboard and let staff arrange payment/delivery manually. The owner approved dashboard-only alerts for the first release. P1.11 email selection is deferred; email delivery and merchant/gateway onboarding are not launch gates. Next is P1.12 shell QA, then catalogue/admin publishing and the manual-order workflow. These features remain planned, not implemented by this scope revision.

## Run locally

```sh
npm ci
npm run assets
npm run dev
```

Use Node 24.x. Firebase emulators additionally need Java 21+. See the local-development guide for emulator, test and asset commands. Images are generated development placeholders, visibly labelled and unavailable for purchase.

Run `npm run check` for the full local verification pipeline. The committed GitHub Actions workflow runs it on main pushes and pull requests after the changes are pushed; it does not deploy or use cloud credentials.

## Repository

The existing Git repository and tracked README were relocated from the parent directory into this folder. The original commit history, `main` branch, and `origin` remote were retained.

The owner requested a local baseline commit of the reviewed docs and assets before application code. Keep that starting point in history; pushing has not been requested.

Commit completed work promptly in small, coherent groups by feature or file. Keep dependency manifests and their lockfile together, include relevant tests with their feature where practical, avoid mixing unrelated changes, and share the resulting hashes. Push only when requested.

Run future project and Git commands from this directory:

```sh
cd /Users/kezileo/Desktop/Night_in_kampala/night-in-kampala-web
```
