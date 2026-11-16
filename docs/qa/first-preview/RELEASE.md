# First Hosting preview release

The owner authorized this release after Part A passed on 16 November 2026. The deployed code is commit `4f498c7`; gate evidence is `dd0bfc1`. All work is on `dev`.

The preview is https://night-in-kampala--review-jrrv7tp2.web.app. Hosting version `9b9f9a12f2875764` expires on 23 November 2026 at 21:42 Africa/Kampala. The preview shares the `night-in-kampala` project backend. Functions are in `europe-west1`, Firestore is in `eur3`, and the existing Storage bucket remains in `US-EAST1`.

## Commands and outcomes

| Command | Outcome |
| --- | --- |
| `npm run check` | PASS, 127 tests, lint, secret scan and production build before cloud access |
| `firebase apps:sdkconfig WEB --project night-in-kampala --out .cache/preview-web-config.json --non-interactive` | PASS, registered app config read into an ignored file |
| `firebase hosting:channel:create review --project night-in-kampala --expires 7d --non-interactive --json` | PASS, exact preview origin obtained |
| `npm run release:firebase -- preview` | First attempt failed on an adminSdkConfig network request. Retry deployed all 18 Functions, both rulesets and 24 composite indexes, then exited with a missing Artifact Registry cleanup-policy error |
| `NIK_RELEASE_STEP=preview-hosting firebase hosting:channel:deploy review --config firebase.preview.generated.json --project night-in-kampala --no-authorized-domains` | PASS, resumed the guarded Hosting step after verifying backend success |

Commands used the repository's pinned Firebase CLI through `node node_modules/firebase-tools/lib/bin/firebase.js`. Both profiles and all web configuration remain in ignored `deployments.local.json`. Preview has an empty App Check site key and null proxy hops, which keeps ordering closed.

## APIs and permission changes

The CLI enabled the following required APIs during deployment.

- `cloudfunctions.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `firebaseextensions.googleapis.com`
- `run.googleapis.com`
- `eventarc.googleapis.com`

Firestore, Firebase Storage, Cloud Storage, Pub/Sub and Secret Manager were already enabled when checked. The CLI generated Pub/Sub and Eventarc service identities. App Check enforcement for Firestore and Storage was not changed.

The release granted `roles/secretmanager.secretAccessor` on the existing `ORDER_IDENTITY_KEY` secret to `1097680313454-compute@developer.gserviceaccount.com`. The value was neither read nor changed.

The Storage service agent `service-1097680313454@gcp-sa-firebasestorage.iam.gserviceaccount.com` lacked cross-service rule access. The operator added `roles/firebaserules.firestoreServiceAgent` on this project, using an etag-protected IAM policy update. Anonymous reads of published revision media and denials for unpublished media verify the lookup behaviour.

The deployed HTTP/callable services have `roles/run.invoker` for `allUsers`, as required for browser calls. Each staff callable checks its Firebase Auth token and role in the server handler. An unauthenticated call to `staffAccess` returned HTTP 401. The final Function and service-agent IAM metadata is retained in the release evidence.

## Billing and remaining operations

This release ran Cloud Builds, stored Artifact Registry images, uploaded Hosting and Storage content, wrote Firestore test documents and issued verification reads and Function requests. These can incur charges on Blaze, including US-to-Europe media transfer. The owner confirmed a budget alert. Actual billed amounts were not measured.

Artifact Registry currently has no cleanup policy for the Functions repository in `europe-west1`. The CLI's post-deployment policy setup failed in this non-interactive run. The owner can choose an image retention period and run `firebase functions:artifacts:setpolicy --project night-in-kampala --location europe-west1 --days DAYS`, reviewing its prompt. Retention was left for the owner to decide.

The owner still creates their Auth account and grants its role through the reviewed script before authenticated staff QA. App Check registration, attested order tests, proxy-hop verification, physical-phone WhatsApp checks and any merge decision belong to the next owner-directed step.
