# Explicit release preparation before P1.14

The owner approved the single-project model on **16 November 2026**. Both profiles target `night-in-kampala`; Functions use `europe-west1`, Firestore stays in `eur3`, and the existing bucket stays in `US-EAST1`. The first preview release awaits the owner’s go-ahead.

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

P1.13 records the approved topology. P1.14 requires the console checks, a reviewed local preparation, explicit owner authorization, and verification against the actual preview URL. P1.15 requires the owner to verify a WhatsApp product preview on a phone. Work on these gates has made no cloud changes.

## Indexing at launch

Preview and pre-launch production remain `noindex, nofollow`. For a reviewed production launch only, set that profile's `indexPublicPages: true` and prepare/release again. This controls the built root HTML, robots.txt and shared-link HTML together. Raw private-route responses keep an `X-Robots-Tag: noindex, nofollow` header; React maintains noindex on private/unknown routes during navigation; shared-link 404/503s stay noindex. Indexing is not an access-control mechanism. Keep staff/customer information protected independently.

The generated configuration removes only the development-wide noindex header when indexing is enabled; private-route headers remain. Direct public/private URLs, robots.txt, error statuses, real catalogue content and launch sitemap/structured-data work still require release verification. The flag is deliberately off now because the site contains development placeholders.

## Order identity, trusted source and retention

- `ORDER_IDENTITY_KEY` is a Functions Secret Manager secret. Generate 32 random bytes, for example by piping `openssl rand -hex 32` to the Firebase CLI secret setter for this project after authorization. The CLI form is `firebase functions:secrets:set ORDER_IDENTITY_KEY --data-file=- --project night-in-kampala`. Keep the value out of the terminal output, profiles, source and Git. The example profile records the secret name. Regenerate the key at launch **after** test-data cleanup, then include the new secret version in the authorized Functions release. Stop if retained orders or blocks still depend on the old key.
- `ORDER_TRUSTED_PROXY_HOPS` is configured as `order.trustedProxyHops` in each profile. The generated Functions manifest carries that approved setting. Leave it null until the forwarding path is verified. The value is the one-based position from the right of `X-Forwarded-For` and applies only to the verified, restricted ingress path. Review the deployed ingress and forwarding chain for the direct callable from the preview app, including any proxies or alternate endpoints. With test stock and attested clients, compare requests from two known networks and repeated requests from one network. In Firestore, check that the same network accumulates one source count, the second network uses a different source record, and an arbitrary client-supplied prefix does not create another source. Confirm that alternate ingress cannot evade the verified hop. Use the tested value only after those checks. [Cloud Run function request headers](https://docs.cloud.google.com/functions/docs/reference/headers), [Google Cloud load balancer headers](https://docs.cloud.google.com/load-balancing/docs/https).
- The default hourly allowance is **50** per verified source. Mobile carriers and shared Wi-Fi can place many shoppers behind one address. The owner can edit the limit in Settings. An already-saved override remains in effect.
- Add a Firestore TTL policy on collection group `orderSources`, field `expiresAt`. Verify the policy and its timestamp type during preview. TTL deletion can lag, so the server enforces the rolling hour regardless. [Firestore TTL](https://cloud.google.com/firestore/native/docs/ttl).

## Automatic checks and evidence

`npm run check` runs the secret scan, ESLint, application tests, metadata tests, deployment-boundary/build tests, the offline build, security-rule tests and Hosting HTTP tests. GitHub Actions runs that command on main-branch pushes and pull requests with Node 24 and Java 21, read-only repository permissions and no Firebase credentials. The updated workflow is in the local review commits. No deployment is part of CI.

The Phase 3 gate passed **121 tests** before the release changes. The current run is reported with the release work. Deployment tests build synthetic preview and production artifacts and inspect Function metadata locally. Cloud IAM, billing, ingress, CDN expiry and device behaviour still require the actual preview. [Phase 3 gate](PHASE_3_TASKS.md#p312-local-gate).

## References

- [Firebase CLI hooks](https://firebase.google.com/docs/cli#predeploy_and_postdeploy_hooks) and [Hosting with Functions](https://firebase.google.com/docs/hosting/functions).
- [Functions environment configuration](https://firebase.google.com/docs/functions/config-env).
- [Google robots meta/X-Robots-Tag guidance](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Official CI actions: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node), [setup-java](https://github.com/actions/setup-java).
