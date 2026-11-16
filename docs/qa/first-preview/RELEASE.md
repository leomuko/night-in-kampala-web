# First Hosting preview release

The owner authorized this release after Part A passed on 16 November 2026. The first deployed code was `4f498c7`. The preview was then updated from `4c0f6ca` for the owner’s App Check amendment, after the 129-test local gate. All work is on `dev`.

The preview is https://night-in-kampala--review-jrrv7tp2.web.app. Current Hosting version `80f639797471757d` expires on 23 November 2026 at 21:57 Africa/Kampala. The preview shares the `night-in-kampala` project backend. Functions are in `europe-west1`, Firestore is in `eur3`, and the existing Storage bucket remains in `US-EAST1`.

## Commands and outcomes

| Command | Outcome |
| --- | --- |
| `npm run check` | PASS, 127 tests, lint, secret scan and build before initial cloud access. The owner amendment then passed 129 tests |
| `firebase apps:sdkconfig WEB --project night-in-kampala --out .cache/preview-web-config.json --non-interactive` | PASS, registered app config read into an ignored file |
| `firebase hosting:channel:create review --project night-in-kampala --expires 7d --non-interactive --json` | PASS, exact preview origin obtained |
| `npm run release:firebase -- preview` | First attempt failed on an adminSdkConfig network request. Retry deployed all 18 Functions, both rulesets and 24 composite indexes, then exited with a missing Artifact Registry cleanup-policy error |
| `NIK_RELEASE_STEP=preview-hosting firebase hosting:channel:deploy review --config firebase.preview.generated.json --project night-in-kampala --no-authorized-domains` | PASS, resumed the guarded Hosting step after verifying backend success |

Commands used the repository's pinned Firebase CLI through `node node_modules/firebase-tools/lib/bin/firebase.js`. Both profiles and all web configuration remain in ignored `deployments.local.json`. The initial preview used an empty App Check site key. The updated preview uses the owner’s public Enterprise site key and null proxy hops, which keeps ordering closed.

The amendment updated `orderCreate` and `renderSharedLink` through the guarded backend hook with `--only functions:local-foundations:renderSharedLink,functions:local-foundations:orderCreate`, then repeated the guarded Hosting step. Both Function updates succeeded. The same post-deployment Artifact Registry policy error was recorded. All other Functions keep their successful initial release.

## APIs and permission changes

The CLI enabled the following required APIs during deployment.

- `cloudfunctions.googleapis.com`
- `cloudbuild.googleapis.com`
- `artifactregistry.googleapis.com`
- `firebaseextensions.googleapis.com`
- `run.googleapis.com`
- `eventarc.googleapis.com`
- `cloudbilling.googleapis.com` (observed in the CLI audit trail)

Firestore, Firebase Storage, Cloud Storage, Pub/Sub and Secret Manager were already enabled when checked. The CLI generated Pub/Sub and Eventarc service identities. App Check enforcement for Firestore and Storage was not changed.

The release granted `roles/secretmanager.secretAccessor` on the existing `ORDER_IDENTITY_KEY` secret to `1097680313454-compute@developer.gserviceaccount.com`. The value was neither read nor changed.

The Storage service agent `service-1097680313454@gcp-sa-firebasestorage.iam.gserviceaccount.com` lacked cross-service rule access. The operator added `roles/firebaserules.firestoreServiceAgent` on this project, using an etag-protected IAM policy update. Anonymous reads of published revision media and denials for unpublished media verify the lookup behaviour.

The deployed HTTP/callable services have `roles/run.invoker` for `allUsers`, as required for browser calls. Each staff callable checks its Firebase Auth token and role in the server handler. An unauthenticated call to `staffAccess` returned HTTP 401. The service provisioning audit also records Google-managed grants for Functions, Cloud Build, Cloud Run, Artifact Registry and Firebase Extensions, plus Editor grants to the project’s App Engine, Compute and Google APIs service accounts. The account and role pairs are in [the service-role audit](service-role-audit.json). Console-originated changes were excluded from that evidence. These broad defaults were recorded for owner review. A scoped runtime-role redesign was outside this release.

## Billing and remaining operations

This release ran Cloud Builds, stored Artifact Registry images, uploaded Hosting and Storage content, wrote Firestore test documents and issued verification reads and Function requests. These can incur charges on Blaze, including US-to-Europe media transfer. The owner confirmed a budget alert. Actual billed amounts were not measured.

Artifact Registry currently has no cleanup policy for the Functions repository in `europe-west1`. The CLI's post-deployment policy setup failed in this non-interactive run. The owner can choose an image retention period and run `firebase functions:artifacts:setpolicy --project night-in-kampala --location europe-west1 --days DAYS`, reviewing its prompt. Retention was left for the owner to decide.

The permanent owner account now has the owner claim, with no test marker. Sign-in from the preview is blocked by the browser key’s referrer restriction. The owner has registered App Check and supplied the public site key. The updated preview initializes Enterprise App Check while null proxy hops keep ordering closed. After the owner adds the preview hostname to both domain allowlists and says “continue”, Part C can verify attestation, proxy hops, orders and physical-phone checks. The branch remains `dev`.
