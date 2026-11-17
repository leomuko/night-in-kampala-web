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

The owner preview controls kept the public storefront closed during calibration. After verification, only the preview profile was opened, with hops 1 and proxyVerified true. Production remains unapproved. The upload authorization failure was subsequently resolved and verified below.


## Final hosted checks — 17 November 2026

Final Hosting review version: `1101f4013d3b47a0`, expiring 24 November 2026. The shared backend belongs to the one project, so these Function and rule releases also affect that project's backend. The live Hosting channel was not released.

| Check | Final result | Evidence / limits |
| --- | --- | --- |
| New browser key in both ignored profiles | PASS | `key-replacement-final.json`; no full key is recorded |
| Retiring key absent from current files, including ignored files | PASS | Recursive binary/text filename-only scan excluding `.git` returned no matches |
| Served home/product/event entry uses new key | PASS | All three direct entries returned 200 and contained the new key, without the retiring key |
| TTL / artifact cleanup | PASS | `final-cloud-state.json`: ACTIVE TTL, non-dry-run DELETE after 86400 seconds |
| Staff draft and JPEG/WebP inputs | PASS | `test-audited-jpeg-webp` created through the dashboard, two inputs compressed and saved through the normal browser upload/attachment pipeline |
| Private staff photo previews | PASS | `staff-photos-saved.jpg`, after the approved CORS change |
| Publish, Sold, Available, withdraw | PASS | `hosted-orders.json` has create, two photo attachments, publish, two availability changes and unpublish audit records. Withdrawal returned a public 404 |
| Published two-photo gallery | PASS | `published-two-photo-gallery.jpg`, including selectable desktop thumbnails; illustrative and unpurchasable |
| Anonymous private draft-image read | PASS | `private-media-access.json`: 403 even after CORS. A CORS header on a denied response does not authorize reading the image |
| C1: App Check | PASS | `app-check-logs-final.json` has app VALID, including auth MISSING for signed-out requests. The final shopper tab reported no console errors |
| C2: two networks and spoofed prefix | PASS | `proxy-verification.json`: canonical callable hops **1**, different Android mobile fingerprint, unchanged desktop fingerprint under spoofing |
| C3: full request → completion | PASS | `NK-45624E21F62B4162`: bag, item summary, saved receipt, unread dashboard alert, confirmation/reservation, test payment record, manual Sold, ready for collection, delivered, completed. Audit history in `hosted-orders.json` |
| C3: signed-out international request | PASS | `NK-6228383420686A76`: Kenya delivery form with synthetic address, saved test order and unread queue projection. No account or email required |
| C3: public availability | PASS | Requested accepts another request and explains the queue order; Reserved/Sold disable ordering; released/spam-cleared stock shows Available. Screenshots beside this report |
| C3: decline | PASS | `NK-7772F10DECD0D92C` → declined |
| C3: release | PASS | `NK-EF91FB82AD841CF6` confirmed then released → cancelled; stock Available |
| C3: spam and blocked phone | PASS | `NK-BA1805C807DFE5FD` → spam, stock Available. A later submission on the same phone was rejected after its open requests were cleared |
| C3: per-piece limit 1 | PASS | A second request for test-limit-a from the same phone was rejected; `limit-per-piece.jpg` |
| C3: per-phone limit 3 | PASS | Three distinct requests accepted, fourth rejected; `limit-per-phone.jpg` |
| C3: per-source limit | PASS | Temporarily set 1 while the connection already had four accepted submissions; next new-phone request rejected. Restored **50**, verified from the server. This was not a 51-submission load test |
| C4: WhatsApp buttons hidden | PASS | Business number remains empty. No WhatsApp links on the receipt; no external messages sent |
| Customer recent-order record | PASS | Reference/item summary survives homepage reload; `recent-order-after-reload.jpg`. Local record excludes private contact details |
| C4: Android WhatsApp card | PASS — owner confirmation | Owner reported the correct title and denim image on a physical Android phone |
| C4: physical iPhone HEIC upload | NOT RUN | No iPhone available. Browser decoder/error tests are local evidence, not physical-device verification |
| Manual operating-system file chooser | NOT RUN after fix | Extension file-URL permission was unavailable. Preview-only test JPEG/WebP buttons supplied the files to the same normal compression/upload code. Actual private previews and server processing were verified |
| Alternate direct run.app ingress | NOT RUN | Hops 1 is verified for the canonical callable endpoint used by the client, not every possible ingress |

All eight saved cloud orders are explicitly test data. Requestable fixtures are synthetic and marked isTestData, including those with isRealCatalogueStock true solely to exercise eligibility. The audited upload draft and its generated photos remain illustrative, with real-stock approval disabled. The retained permanent owner still has owner true and no testAccount claim. Launch cleanup was not run. Three original network requests and the anonymous delivery request remain in the test queue for review.

## Resolved failures and deployment details

Empty custom metadata was not reliable in the live Storage rules evaluation. A read-only rules simulation reproduced the missing-field error. A proposed fallback was rejected because it did not preserve the emulator's extra-metadata denial. The final browser sends the exact marker nikDraftUpload=true, and the rules require only that metadata key/value, while retaining staff claims, matching uploader UID, existing draft, create-only, filename/type and 2 MiB checks. Extra metadata remains denied. The cloud simulation also rejected synthetic download-token metadata. Real JPEG and WebP inputs then saved successfully.

The bucket initially had no CORS configuration. With the owner's separate approval, its CORS field now permits GET for the exact preview, web.app and firebaseapp.com origins. No wildcard bucket origin, IAM grant or App Check enforcement change was made. `storage-cors-proposed.json` is the reviewed input; `storage-cors.json` records the before/after values. Private previews subsequently loaded both images.

A cached compatibility redirect could keep an existing product-page tab on an older bundle. Merely adding a no-store header did not change the live redirect response. The final implementation serves a tiny compatibility module instead of redirecting. The live old-entry URL now returns **200 / Cache-Control: no-store**, importing the current hashed module. The shared-link Function was refreshed to the current HTML template, so direct product/event HTML references the current entry too. Historical browser caches cannot be remotely erased.

Targeted releases in this continuation updated orderCreate, catalogueDraftSave, cataloguePhotoAdd and renderSharedLink, released the reviewed Storage rules, and updated only the review Hosting channel. No live Hosting release, merge, branch push, key rotation/deletion, secret rotation or history rewrite occurred.

## Validation and focused commits

The final source passed `npm run check`: **137 tests**, comprising 77 application, 15 metadata, 6 deployment, 10 rules, 24 emulator HTTP, 4 cleanup/role-tool and 1 secret-scan test. Lint, the secret scan and offline production build passed. All automated mutations ran on isolated emulators; separately authorized hosted checks used marked cloud test data. `verification-gate.json` records the totals. Earlier failed experiments were corrected before the final passing gate.

| Change | Commit |
| --- | --- |
| Hosting-only key replacement compatibility | `0def621` |
| Initial key verification | `7a778b9` |
| Attested owner-only proxy calibration | `02d8788` |
| Draft/photo auditing and upload diagnostics | `2b03f31` |
| Retention policies and Android card evidence | `beb49e6` |
| Valid default phone regression | `3274f4f` |
| First explicit-metadata attempt, later superseded | `343482b` |
| Verified two-network proxy count | `d3cc65c` |
| Exact upload-marker contract and tests | `a143f31` |
| Initial no-store redirect configuration, superseded for live delivery | `768deea` |
| Non-cached compatibility module and tests | `4bfda95` |
| Approved CORS and anonymous media-denial evidence | `fc836d0` |

## Cloud changes, costs and remaining owner work

The owner explicitly authorized the ACTIVE TTL and one-day Artifact Registry deletion policies, followed by the exact three-origin CORS change. No additional APIs or IAM roles were enabled/granted during this continuation. The earlier initial-release APIs and permissions remain recorded in `../first-preview/RELEASE.md`. The permanent owner role was granted earlier to the existing account, without changing its password or adding a test marker. Firestore/Storage console App Check enforcement was left unchanged.

Cloud Builds, Function execution, Firestore reads/writes/listeners, Storage/image processing, cross-region transfer, Hosting traffic and reCAPTCHA Enterprise assessments can incur usage charges. No payment provider, real cash movement or paid subscription was used. The billing amount was not measured, and this report does not claim zero cost. TTL/artifact retention deletion itself is asynchronous; eventual execution was not observed.

The owner still supplies real product/brand photos, measurements, condition and prices, reviews the provisional collection/delivery/manual-payment copy, and saves a WhatsApp business number when ready. A physical iPhone HEIC check remains open. Before launch, separately authorize reviewed test-data cleanup, review retained settings and genuine stock, then regenerate ORDER_IDENTITY_KEY as documented. Retire the old browser key through the console when satisfied with the current release. The current repo/ignored-file/served-bundle scan is clean; historical Git/deployments and previously cached bundles were intentionally excluded. No launch or merge approval is implied by this preview report.
