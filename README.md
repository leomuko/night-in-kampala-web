# Night in Kampala

A planned React JavaScript storefront and Firebase backend for reworked clothing, brand stories, and fashion events, serving Uganda and selected international markets.

## Planning documents

- [Project plan](docs/PROJECT_PLAN.md): design, shopping journey, administration, architecture, delivery phases, and launch criteria.
- [Research](docs/RESEARCH.md): brand evidence, reference-store observations, sources, and outstanding questions.
- [Phase 1 tasks](docs/PHASE_1_TASKS.md): ordered foundations work with an acceptance check for each task.
- [Design foundations](docs/DESIGN_FOUNDATIONS.md): approved Anton/Inter/Newsreader and measured layout values.
- [Local development](docs/LOCAL_DEVELOPMENT.md): commands, completed P1.01–P1.08 checks and remaining limits.
- [Firebase SDK setup](docs/FIREBASE_SETUP.md): registered project configuration, emulator/cloud behaviour and optional Analytics.
- [Shared-link previews](docs/SHARED_LINK_PREVIEWS.md): local P1.09–P1.10 implementation, public metadata schema, cache contract and staging limits.
- [Standalone placeholder images](docs/implementation-assets/placeholders/README.md): generated development assets and their provenance.
- [Firebase location decision](docs/FIREBASE_REGION_DECISION.md): explicit gate before cloud resource creation/staging.
- [Phase 2/3 design checks](docs/PRE_PHASE_2_3_DESIGN_CHECKS.md): missing views and checkout/product corrections.

- [Visual concepts](docs/design-concepts/README.md): round-1 mockups and the [round-2 image prompts](docs/design-concepts/PROMPTS-ROUND-2.md).

Status: P1.01–P1.10 are implemented locally; shared-link HTML and Hosting rewrites now work against demo Firestore. Build, lint, 36 application/SDK tests, 13 metadata tests, 11 HTTP integration tests and five emulator rule tests pass. The owner's `night-in-kampala` SDK configuration is installed; development defaults to demo emulators and Analytics is off. Catalogue/checkout remain placeholders. P1.11–P1.15, actual CDN expiry and owner-confirmed WhatsApp previews remain unfinished. The existing cloud Firestore database was not changed. Work is recorded in small feature/file-scoped commits after baseline `873bc7f`.

## Run locally

```sh
npm ci
npm run assets
npm run dev
```

Use Node 24.x. Firebase emulators additionally need Java 21+. See the local-development guide for emulator, test and asset commands. Images are generated development placeholders, visibly labelled and unavailable for purchase.

## Repository

The existing Git repository and tracked README were relocated from the parent directory into this folder. The original commit history, `main` branch, and `origin` remote were retained.

The owner requested a local baseline commit of the reviewed docs and assets before application code. Keep that starting point in history; pushing has not been requested.

Commit completed work promptly in small, coherent groups by feature or file. Keep dependency manifests and their lockfile together, include relevant tests with their feature where practical, avoid mixing unrelated changes, and share the resulting hashes. Push only when requested.

Run future project and Git commands from this directory:

```sh
cd /Users/kezileo/Desktop/Night_in_kampala/night-in-kampala-web
```
