# Preview verification and pause

The review URL is https://night-in-kampala--review-jrrv7tp2.web.app. The latest owner amendments passed the full local gate with **129 tests**, lint, secret scanning and the build. The tests comprise 69 app tests, 15 metadata tests, six deployment tests, ten rules tests, 24 emulator HTTP tests and four cleanup/role tests, plus one secret-scan test.

## Check results

| Check | Result | Evidence and limits |
| --- | --- | --- |
| Home and shop rendering | PASS | Chrome loaded all three marked pieces. Screenshots `home.jpg` and `shop.jpg` |
| Product and event rendering | PASS | Expected title, illustrative labels and imagery visible. Screenshots `product.jpg` and `event.jpg` |
| Fonts, JS, CSS and images | PASS | HTTP 200 asset checks, loaded browser fonts and product image dimensions |
| Matching Hosting/Function app bundle | PASS | Both product and event raw HTML reference the current app bundle, which returns HTTP 200 |
| Noindex | PASS | `robots.txt` disallows `/`. All nine HTML route checks contain noindex metadata and `X-Robots-Tag` |
| Published-only Firestore access | PASS | Published pieces/event return 200. Draft documents and an unconstrained product query return 403 |
| Private orders and owner settings | PASS | Anonymous reads of `orders/preview-private-check` and `orderSettings/config` return 403. These are denial probes. Public category and policy projections remain intentionally readable |
| Storage-to-Firestore lookup | PASS | Published version media returns 200. Raw draft media and unpublished version media return 403 after the service-agent role grant |
| Composite indexes | PASS | All 24 committed definitions are deployed and READY. Every corresponding public query returned 200 |
| Versioned media cache | PASS | `Cache-Control: public, max-age=31536000, immutable`. Repeated requests returned `X-Cache: HIT` |
| Product share HTML | PASS | WhatsApp-like curl returns the expected title, description and reachable 1200×630 JPEG |
| Event share HTML | PASS | WhatsApp-like curl returns the fixture title, description and reachable 1200×630 campaign JPEG |
| Permanent owner role | PASS | Dry run and confirmed role update succeeded for the existing account. No test marker |
| Staff login on preview | FAIL | Auth returned 403 because requests from the preview hostname are blocked by the API key referrer restriction |
| Staff create/upload/publish/withdraw/availability flow | NOT RUN | Requires the preview hostname to be allowed and successful owner login. No password or account changes were made |
| Staff JPEG and WebP upload | NOT RUN | Blocked by owner login. Local staff/photo integration tests pass |
| Staff audit entries from hosted edits | NOT RUN | No hosted staff edits were submitted |
| Unauthenticated staff callable | PASS | `staffAccess` returned HTTP 401 |
| Ordering opens soon | PASS | Product purchase control disabled. `/checkout` displays the paused state without a contact form. Screenshot `ordering-paused.jpg` |
| App Check token verification | NOT RUN | The public site key is configured. Owner must add the preview hostname and say “continue” before Part C |
| Proxy-hop and spoofed-header checks | NOT RUN | Proxy hops remain null. Scheduled for Part C with two networks |
| Complete hosted order and moderation flows | NOT RUN | Scheduled for Part C. WhatsApp number remains unset |
| WhatsApp link preview on a physical phone | NOT RUN | Owner check in Part C. Automated raw HTML and image checks passed |
| HEIC upload on a physical phone | NOT RUN | Owner check in Part C |
| TTL policy on `orderSources.expiresAt` | FAIL | Metadata has no active TTL configuration. Owner action is documented below |
| Actual billing amount | NOT RUN | Billable services were exercised. Usage and artifact retention are described in `RELEASE.md` |

The final automated hosted verification recorded 25 passing checks and one failure for the absent TTL policy. The public response evidence is in `verification.json`. Source commands ran through the ignored local verification worker, using anonymous REST for access checks and authenticated metadata reads for indexes/TTL. Cloud checks preserve test markers and genuine records. App Check enforcement for Firestore and Storage was not changed.

## Reproduce public checks

```sh
curl -i 'https://night-in-kampala--review-jrrv7tp2.web.app/robots.txt'
curl -i -A 'WhatsApp/2.24.1 A' 'https://night-in-kampala--review-jrrv7tp2.web.app/products/preview-painted-denim'
curl -i -A 'WhatsApp/2.24.1 A' 'https://night-in-kampala--review-jrrv7tp2.web.app/events/preview-test-event'
curl -I 'https://night-in-kampala--review-jrrv7tp2.web.app/media/products/preview-painted-denim/preview-test-v1/share.jpg'
```

For TTL, open Firestore in the Google Cloud console, select the `(default)` database, and open Time-to-live. Create a policy for collection group `orderSources` and timestamp field `expiresAt`, then wait for its ACTIVE status. TTL deletion is asynchronous. The server already enforces the rolling limit independently. [Firestore TTL instructions](https://cloud.google.com/firestore/native/docs/ttl).

## Owner step before continuing

Add `night-in-kampala--review-jrrv7tp2.web.app` to the reCAPTCHA Enterprise website key's domain list and add `https://night-in-kampala--review-jrrv7tp2.web.app/*` to the browser API key's allowed referrers. Keep Firestore and Storage App Check enforcement off. Say “continue” after saving those changes.

Part C then verifies attestation and proxy hops with two networks, tests the full order and moderation flow on marked stock, checks the hidden WhatsApp buttons, and records the owner's physical-phone checks. Staff B4 checks resume once login works. A merge decision remains with the owner.

## Focused commits

| Task | Commit |
| --- | --- |
| A1 cleanup preservation | `9db5649` |
| A2 existing-user role tooling | `6c71a62` |
| A3 initial ordering pause | `4f498c7` |
| A4 initial 127-test gate | `dd0bfc1` |
| B1–B2 first release record | `3504ebd` |
| Permanent owner cleanup regression | `378cf83` |
| App Check and proxy-hop amendment | `4c0f6ca` |
| B3 seed manifest and owner identity | `6e09672` |
