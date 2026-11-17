# Preview order verification

Work uses `dev` and the Hosting review channel at https://night-in-kampala--review-jrrv7tp2.web.app.

## Browser key replacement

The full new key was retrieved from the authenticated API Keys service using the key resource created on 16 November 2026. Its prefix matches the owner's masked value. Both ignored profiles now contain that key. Neither full key is in this report.

An initial file-name-only scan found the retiring key in `deployments.local.json`, `.cache/preview-web-config.json` and the previous generated bundle in `dist/assets/`. Profiles and cached SDK configuration were updated, and the preview was rebuilt. The final recursive scan included ignored files and found no remaining occurrences outside `.git`. Git history was excluded as instructed.

Only Hosting was deployed for this step. Version `83f9760afacaebb4` was released on the review channel. Existing product/event Function HTML points to the previous hashed app entry, so the generated Hosting configuration redirects that entry to the current module. HTTP checks confirmed the root, product and event bundles contain the new key and exclude the retiring key. See `key-replacement.json`. The redirect generation and path validation passed the six deployment tests, lint and the secret scan. Implementation commit is `0def621`.

Previously downloaded client bundles and historical Git/deployment versions were outside the current-file scan. The owner controls key deletion. The permanent owner account was not changed during this step.

## Authorized retention policies

Both policies are verified in `policies.json`. Firestore TTL on `(default)/orderSources/expiresAt` reached ACTIVE. The authenticated Firestore Admin REST API was used because gcloud is absent. It patched only `ttlConfig`, preserving field indexes. Artifact Registry has the non-dry-run DELETE policy for images older than `86400s`, applied with the pinned Firebase CLI's `functions:artifacts:setpolicy --project night-in-kampala --location europe-west1 --days 1 --force --non-interactive`. These were the two policy changes authorized by the owner. Console App Check enforcement was left untouched.

## Owner phone confirmation

On 16 November 2026 the owner confirmed that WhatsApp on an Android phone shows the expected title and denim image for `/products/preview-painted-denim`. No iPhone is available, so a physical iPhone HEIC upload remains not run.

## App Check and verified proxy count

The registered Enterprise key now includes the preview domain. The owner saved that entry after the first attestation attempts failed. A subsequent owner probe issued an App Check token and returned a successful server verification. `app-check-logs.json` records `app: VALID` and `auth: VALID` on `orderCreate`. No debug provider or debug token was used.

The verified `ORDER_TRUSTED_PROXY_HOPS` value is **1** for the tested canonical callable endpoint. Desktop request `NK-B8C7701CDEB82F12` used source fingerprint `0c1ff553aad0f3ec` with count 1. Adding the spoofed prefix `198.51.100.77` produced `NK-7D44C4ECBF5C7F37` on the same fingerprint with count 2. The owner's Android mobile-data request `NK-353E930CA119BF13` used the different fingerprint `5e40f8d36d349046` with count 1. All three saved orders were confirmed marked test data. See `proxy-verification.json` and the source screenshots.

The initial reserved UK test number was rejected by the server's phone validator. It created no order. The probe default was corrected to the Ugandan test format and covered by a regression test. The successful mobile screenshot uses the corrected number.

The owner preview controls kept the public storefront closed during calibration. Enabling the verified preview profile is the next release step. Production remains unapproved. Uploads still require a successful cloud verification after the reported authorization failure.
