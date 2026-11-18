# Explicit release preparation before P1.14

The owner approved the single-project model on **16 November 2026**. Both profiles target `night-in-kampala`; Functions use `europe-west1`, Firestore stays in `eur3`, and the existing bucket stays in `US-EAST1`. The owner authorized the first preview release after the Part A local gate passes. The owner registered the reCAPTCHA Enterprise key and will add the preview hostname before attestation testing.

## Approved release model

- The `preview` profile uses a temporary Hosting channel. The `production` profile uses the live channel and requires explicit typed confirmation.
- Firestore, Storage, Authentication, rules and callable Functions are project-wide. Preview data remains until cleanup, and backend deploys can affect the live project. Clear reviewed test data before launch.
- Media operations between the US bucket and European Functions can incur cross-region latency or network charges. Check image delivery and publication times during preview verification.
- Ordinary development uses loopback emulators. The default build remains offline. Real build values belong in ignored local configuration; no real profile is committed.

[Firebase preview channels](https://firebase.google.com/docs/hosting/test-preview-deploy).

## Prepare locally

Copy the example to ignored `deployments.local.json`, fill the approved project’s public web config and exact HTTPS origins, and set each intended profile to `approved: true`. Choose a non-live channel ID for preview. The preview origin is the exact Hosting URL Firebase assigns to that channel. Record it after the owner authorizes channel creation.

- `npm run build` makes the offline build. `npm run prepare:deployment -- preview` prepares ignored cloud artifacts locally.
- `npm run prepare:deployment -- production --confirm "DEPLOY LIVE night-in-kampala"` prepares the live build locally with typed confirmation.
- After separate owner authorization, `npm run release:firebase -- preview` deploys Functions, Firestore rules/indexes and Storage rules, then invokes `firebase hosting:channel:deploy` for the named channel. The preview uses the shared Function deployment and never selects the live Hosting channel. Auth-domain synchronization is disabled in the command. Review and add approved domains in the console.
- `npm run release:firebase -- production --confirm "DEPLOY LIVE night-in-kampala"` is reserved for an owner-authorized launch after cleanup. The live configuration pins Hosting rewrite Functions. Generated predeploy hooks check the target project and release stage. The checked-in configuration rejects release hooks without a profile.

The release command is project-wide for backend services. Review functions, rules, indexes, and cleanup scope before authorizing it. [Hosting with Functions](https://firebase.google.com/docs/hosting/functions) and [preview channel behaviour](https://firebase.google.com/docs/hosting/test-preview-deploy).

## Gates

P1.13 records the approved topology. P1.14 requires the console checks, a reviewed local preparation, explicit owner authorization, and verification against the actual preview URL. P1.15 requires the owner to verify a WhatsApp product preview on a phone. The owner-authorized preview releases and cloud changes are recorded in [the hosted QA report](qa/preview-orders/README.md); production remains unapproved.

### Owner checklist before the first preview deploy

- [x] Owner confirmed `night-in-kampala` is on Blaze. Set a project budget and alert recipients. Alerts notify the team about spending. [Firebase budget alerts](https://firebase.google.com/docs/projects/billing/budget-alerts).
- [x] Owner confirmed deny-all Firestore and Storage client rules. In Firebase Storage → Rules, close test mode on `night-in-kampala.firebasestorage.app`. Confirm client reads and writes are denied until the reviewed rules release. During P1.14, enable and verify the permissions that let Storage Rules look up Firestore documents. [Storage rule conditions](https://firebase.google.com/docs/storage/security/rules-conditions).
- [x] Owner confirmed the browser key is restricted. In Google Cloud → APIs & Services → Credentials, restrict the exposed browser API key to the APIs and web origins this app needs, or create a restricted replacement and retire the old key after verifying the replacement. Put the active key in the ignored deployment profile. [Firebase API key restrictions](https://firebase.google.com/docs/projects/api-keys).
- [ ] Create a score-based reCAPTCHA Enterprise website key for the approved preview hostname and register the Firebase web app under App Check. Confirm the actual preview hostname, pass the public site key as `order.appCheckSiteKey`, and verify an attested order call on preview. Include the approved live domain before production. [App Check for web](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).
- [x] Owner confirmed `ORDER_IDENTITY_KEY` exists in Secret Manager for Functions, following [the order identity instructions](#order-identity-trusted-source-and-retention). Keep the generated value in Secret Manager.

The first preview proceeded under the owner’s Part B authorization. The ignored preview profile contains the owner-supplied public App Check site key. Before calibration, null/unverified proxy settings kept shopping controls paused. The canonical callable is now verified at hops 1 and ordering is enabled on the preview for test-stock checks. Production remains unapproved. Firestore and Storage console App Check enforcement remains unchanged. P1.14 evidence includes all 24 deployed composite indexes, ACTIVE orderSources.expiresAt TTL, reviewed rules and the hosted staff flow. See [the final preview report](qa/preview-orders/README.md), including physical-device limitations.

## Indexing at launch

Preview and pre-launch production remain `noindex, nofollow`. For a reviewed production launch only, set that profile's `indexPublicPages: true` and prepare/release again. This controls the built root HTML, robots.txt and shared-link HTML together. Raw private-route responses keep an `X-Robots-Tag: noindex, nofollow` header; React maintains noindex on private/unknown routes during navigation; shared-link 404/503s stay noindex. Indexing is not an access-control mechanism. Keep staff/customer information protected independently.

The generated configuration removes only the development-wide noindex header when indexing is enabled; private-route headers remain. Direct public/private URLs, robots.txt, error statuses, real catalogue content and launch sitemap/structured-data work still require release verification. The flag is deliberately off now because the site contains development placeholders.

## Order identity, trusted source and retention

- `ORDER_IDENTITY_KEY` is a Functions Secret Manager secret. Generate 32 random bytes, for example by piping `openssl rand -hex 32` to the Firebase CLI secret setter for this project after authorization. The CLI form is `firebase functions:secrets:set ORDER_IDENTITY_KEY --data-file=- --project night-in-kampala`. Keep the value out of the terminal output, profiles, source and Git. The example profile records the secret name. Regenerate the key at launch **after** test-data cleanup, then include the new secret version in the authorized Functions release. Stop if retained orders or blocks still depend on the old key.
- `ORDER_TRUSTED_PROXY_HOPS` is configured as `order.trustedProxyHops` in each profile. It is the one-based position from the right of `X-Forwarded-For`. The initial null value disables submission. Review the deployed ingress and forwarding chain for the direct callable, including any proxies and alternate endpoints. Set a candidate hop count in a controlled preview release with test stock and attested clients. Compare repeated requests from one known network with requests from a second network. Verify in Firestore that each network accumulates a separate source count and a client-supplied prefix leaves that count unchanged. Confirm that alternate ingress cannot evade the hop. Copy the verified value to production only after those checks. [Cloud Run function request headers](https://docs.cloud.google.com/functions/docs/reference/headers), [Google Cloud load balancer headers](https://docs.cloud.google.com/load-balancing/docs/https).
- The default hourly allowance is **50** per verified source. Mobile carriers and shared Wi-Fi can place many shoppers behind one address. The owner can edit the limit in Settings. An already-saved override remains in effect.
- Add a Firestore TTL policy on collection group `orderSources`, field `expiresAt`. Verify the policy and its timestamp type during preview. TTL deletion can lag, so the server enforces the rolling hour regardless. [Firestore TTL](https://cloud.google.com/firestore/native/docs/ttl).

## Launch cleanup

Before launch, close preview access and pause staff edits and test order submissions to the shared backend. Keep the permanent owner account and intended settings. Review the test accounts and keep genuine launch stock out of the test catalogue. See [prelaunch data markers](CATALOGUE_DATA.md#prelaunch-data-in-the-shared-project).

The following commands are for the separately authorized launch window. The first produces a read-only inventory. Review the Firestore paths, Auth UIDs, Storage object names and any blockers in the ignored report at `.cache/launch-cleanup-night-in-kampala.json`.

```sh
node scripts/launch-cleanup.mjs --project night-in-kampala
```

After reviewing that inventory, execute cleanup with the typed phrase. Execution rechecks the candidates and stops if it finds links to retained stock, shared size or phone counters, or other reported blockers. It uses the operator’s authorized application default credentials. Keep the write pause in place. Firestore, Auth and Storage are cleaned separately, so after an interrupted execution run a new dry run before retrying.

```sh
node scripts/launch-cleanup.mjs --project night-in-kampala --execute --confirm "DELETE TEST DATA FOR night-in-kampala"
```

Unmarked unpublished drafts, photo-source records and media are retained. The report lists them under `keptUnpublished` for owner review. Only explicitly marked test records or assets belonging to test stock or test content are eligible for deletion.

Run the dry run again to verify that the deletion lists are empty. Review categories and order settings, then rotate `ORDER_IDENTITY_KEY` before the production release. If genuine orders still exist, review the old key dependencies before rotating it.

## Automatic checks and evidence

`npm run check` runs the secret scan, ESLint, application tests, metadata tests, deployment-boundary/build tests, the offline build, security-rule tests, Hosting HTTP tests and launch cleanup tests on isolated emulators. GitHub Actions runs that command on main-branch pushes and pull requests with Node 24 and Java 21, read-only repository permissions and no Firebase credentials. The updated workflow is in the local review commits. No deployment is part of CI.

The single-project release preparation passed `npm run check` with **137 tests** on 17 November 2026. The run covered 77 app tests, 15 metadata tests, six deployment tests, ten rules tests, 24 emulator HTTP tests, four cleanup and role-tool tests and one secret-scan test. Deployment tests build synthetic preview and production artifacts and inspect Function metadata locally. Cleanup tests use only the dedicated demo project. Cloud IAM, billing, ingress, CDN expiry and device behaviour still require the actual preview.

## References

- [Firebase CLI hooks](https://firebase.google.com/docs/cli#predeploy_and_postdeploy_hooks) and [Hosting with Functions](https://firebase.google.com/docs/hosting/functions).
- [Functions environment configuration](https://firebase.google.com/docs/functions/config-env).
- [Google robots meta/X-Robots-Tag guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Official CI actions: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [setup-java](https://github.com/actions/setup-java).

## Owner and staff access

The owner creates their account in Firebase Console → Authentication → Users → Add user and keeps the password. On a machine with authorized application default credentials, run the script with the existing account's email and the explicit project. It defaults to a dry run and prints the account UID and confirmation phrase.

```sh
node scripts/grant-staff-role.mjs --project night-in-kampala --email OWNER_EMAIL --role owner
node scripts/grant-staff-role.mjs --project night-in-kampala --email OWNER_EMAIL --role owner --execute
```

Type the displayed phrase at the prompt. For non-interactive operation, supply it through `--confirm`. Use `--role staff --test-account` for a disposable test staff account. Existing unrelated claims and a prior test marker are preserved. The script updates an existing login and uses the operator's application default credentials. Sign out and sign in again after changing the role. The owner's account creation, role assignment and password entry are owner steps. Local emulator tests cover the tooling.

Part A passed locally on 16 November 2026 before cloud access. The cleanup regression retains unmarked unpublished work, the role tool uses existing accounts, and cloud ordering remains paused. The owner has authorized Part B preview preparation and deployment after this gate.

The permanent account `superadmin@nightinkampala.com` must be retained during launch cleanup. Grant it the owner role and keep it free of the `testAccount` claim. Its password is controlled by the owner. Only disposable staff logins receive the test claim.

The preview is deployed. [Hosted evidence](qa/preview-orders/README.md) records App Check verification, retention policies and the owner phone checks. The verified canonical callable proxy count is 1. The ignored preview profile enables ordering on marked test stock. Production remains unapproved.


## Private staff photo previews

On 17 November the owner approved and the operator applied GET-only bucket CORS for the exact review-channel, web.app and firebaseapp.com origins. [The saved configuration](qa/preview-orders/storage-cors.json) records the change. Private image reads still require the staff/owner Storage rule. A new preview hostname needs corresponding CORS, reCAPTCHA and browser-key origin updates before testing; do not use wildcard bucket origins.

## Soft-launch review mode

For the owner-approved real-draft review, set `preview.catalogueTestData` false in the ignored profile. Keep `preview.order.proxyVerified` false while the owner reviews wording and the cleanup inventory. This pauses new shopper orders in the shared backend while allowing staff to prepare real drafts. Preview orders remain test-marked; do not use them to accept real sales. The production profile will use catalogueTestData false, the verified hop count 1, proxyVerified true and indexPublicPages false only after “approved for launch”.

The cleanup dry run protects unpublished actual-photo drafts. Review every keptUnpublished path and resolve every blocker; do not erase an old test marker without explicit owner classification. No cleanup execution, secret version change, merge or production release is authorized before the approval stop. The soft-launch prompt authorizes those later steps only after the stop is satisfied.


## Team rollout while launch is on hold

First run the local gate. Run the reviewed membership migration as a read-only dry run, inspect every role holder, then execute with `MIGRATE TEAM IN night-in-kampala`. This precedes the tightened rules/callables to avoid locking out current owners. The migration preserves both real accounts and passwords. New clients refresh version claims only after reading a server-confirmed active membership.

Deploy the reviewed Firestore/Storage rules and all staff callable adapters (including the owner-only order preview check and new Team functions), then only the review Hosting channel. Keep indexPublicPages false and shopper ordering paused. The runtime already has the required existing permissions; adding only the exact review hostname to Auth's authorized domains enables the requested setup continue URL. Do not change browser keys or console App Check enforcement.

The owner tests invitation email/private setup, role change, immediate suspension, fresh-session reactivation and existing real staff access on review before replying **approved for launch**. Live release remains the original separately gated Step 4, with the additional live check that ticking Wording reviewed removes the public review marker. [Team guide](MANAGING_YOUR_TEAM.md).
