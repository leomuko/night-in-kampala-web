# Soft-launch review — 17 November 2026

Status: local preparation and hosted review checks passed; owner Settings sign-in/save and launch approval are pending. **Not approved for production.** This report will be completed before the Step 3 owner stop. Work stays on dev; no merge or push.

## Local gate

`npm run check` passed **166 tests**: 103 application, 16 metadata, 7 deployment, 10 rules, 24 emulator HTTP, 5 cleanup/role and 1 secret-scan test. ESLint has no warnings/errors and the offline production build passed. See [local-gate.json](local-gate.json). Vite still reports the existing large staff-library chunk; the mobile speed audit is explicitly deferred.

The first repeated check could not bind loopback ports inside the sandbox. A later check collided with the separately prepared cloud build's output and failed four local image assertions. No application failure was hidden: the final sequential check used its own offline artifacts and passed all 165. A subsequent Help-query correction passed the final 166-test gate. Cloud build preparation is now run after that gate.

## Accessibility and sparse layouts

[Accessibility evidence](../accessibility/README.md) records axe checks, token contrast calculations and manual desktop/mobile keyboard checks. Corrections cover form/receipt focus, staff-editor focus return, gallery keyboard access, required photo descriptions and control boundaries. This is a scoped WCAG 2.2 AA engineering review. Full screen-reader coverage, physical iPhone HEIC and a complete browser/zoom matrix were not run.

Local Chrome screenshots cover empty home at desktop and phone width, one and two cards, empty drops/lookbook/events, delivery and returns. No horizontal overflow was found in those inspected views. The one/two-piece screenshots use **synthetic local-only UI fixtures**, unpurchasable, solely to check layout; they are not real catalogue stock or cloud seed data. The Help page uses a bounded, published-only cursor query so a missing optional page does not trigger a Firestore permission warning. Guest rule regressions cover published, draft and absent slugs without granting any additional access. The real-piece hero contains the whole garment instead of cropping it. Help text uses the prose-width token.

The cloud presentation hides test/illustrative/non-real catalogue records; cloud builds omit generated placeholder images. With no real published stock the home is text-only, and empty sections have deliberate copy. Legacy prelaunch browser receipts are ignored under the launch storage namespace, without deleting the old record.

## Staff access

[staff-access.json](staff-access.json): the existing fahkerahmed@nightinkampala.com account was dry-run, granted **staff**, then re-read from Auth. It has no testAccount claim. The permanent superadmin@nightinkampala.com retains owner access and has no testAccount claim. No account was created and neither password was handled. Refresh the staff login to obtain updated claims. The reviewed role script already supports a separately authorised later promotion to owner.

## Wording

[LAUNCH_WORDING.md](../../LAUNCH_WORDING.md) contains the supplied facts and exact approval list. Collection is Muyenga by appointment; payment is cash or MTN/Airtel Mobile Money on collection/delivery; contact/WhatsApp is +256759334383; the proposed returns text uses the supplied 10-day contact window. Delivery scope/quote wording, the returns-window starting point and newly written Help/privacy text still await owner approval. The review marker remains visible until approval. No delivery fee or automatic refund promise was invented.

The supplied number is displayed as a call contact. **Owner Settings save is PENDING:** the current browser is at the sign-in screen, and the owner has been asked to sign in privately. WhatsApp links remain hidden until +256759334383 is saved through the validated, audited screen. Keep Wording reviewed unchecked until the launch-copy approval. No WhatsApp message was sent.

## Hosted review release

Review: https://night-in-kampala--review-jrrv7tp2.web.app — version **2cc59a3bc66a7250**, expires 24 November 2026. Published from dev through explicit preview hooks; live Hosting was not released. Seven affected Functions were updated in europe-west1; renderSharedLink was refreshed again for the final app filename. No rules/index deployment, secret version change, console enforcement change, browser-key deletion or push occurred. Production remains unapproved in the local profile.

`preview.catalogueTestData` is false so staff can prepare genuine drafts. `preview.order.proxyVerified` is false so new shopper orders are paused in both the browser and trusted server, while the previously verified hop count remains 1. These are deliberate review-window settings, not a claim that the earlier two-network check failed.

[hosted-http.json](hosted-http.json) records 11 successful route responses with noindex in both headers and HTML; the served JS equals the final build hash, contains the current browser key and excludes the old T6M key. The brand share JPEG matches the built asset; two known test-product URLs return uncached 404. The omitted campaign placeholder URL returns SPA HTML rather than an image. No key value is stored in the report.

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Local full gate | PASS | 166 tests, lint, secret scan, build; local-gate.json |
| Accessibility | PASS within reviewed scope | See scoped evidence; not complete WCAG certification |
| 0 / 1 / 2 piece layouts | PASS locally | Synthetic, unpurchasable UI fixtures only; screenshots |
| Hosted empty home and shop | PASS | No product cards or main images; 375px document/client width on phone |
| Hosted empty drops/lookbooks/events | PASS | Deliberate empty copy and shop link; zero main images |
| Hosted final delivery/returns copy | PASS | Supplied phone/Muyenga/10 days and explicit review marker; mobile screenshots |
| Missing Help documents | PASS | Final hosted delivery read has no application warning; unchanged rule regressions include missing/private pages |
| Raw HTML, noindex and current assets | PASS | hosted-http.json; no indexing approval assumed |
| Real staff / permanent owner claims | PASS | Server re-read in staff-access.json; no test marker or password handling |
| Current owner UI sign-in / Settings save | PENDING OWNER | Sign-in form is ready; no password requested or entered |
| WhatsApp number enabled | NOT YET | Intentionally remains hidden until audited Settings save |
| New App Check / full live sales flow | NOT RUN in this review | Prior preview test-stock checks are in ../preview-orders/README.md; production end-to-end check is Step 4 after approval |
| Physical iPhone HEIC, complete screen-reader matrix | NOT RUN | iPhone unavailable; manual device/assistive-technology gaps remain |
| Cleanup execution / key regeneration / merge / production release | NOT RUN | Explicit approval stop; dry run only |

Browser extension warnings were present in Chrome. The initial expected missing-Help Firestore warning was fixed; the final home/delivery pass had no application warnings/errors. The speed audit, backups/rollback/monitoring, custom domain and indexing remain deferred by the owner. Review deploys/reads use billable Firebase services; actual charges were not measured. No additional IAM grant or API enablement was requested beyond the reviewed staff role and normal deployment prerequisite checks.

## Cleanup inventory (read only)

See [cleanup-inventory.json](cleanup-inventory.json), a timestamped snapshot. The executable script defaults to dry run and the operator wrapper additionally refuses execution during this review. No deletion or secret regeneration has occurred. Re-run after approval before deletion; document-update and object-generation preconditions protect changed records.

A photographed unapproved draft is retained. Ambiguous old preview test markers block execution rather than silently deleting genuine work. The new preview catalogue mode retains genuine staff drafts; shopper orders stay paused during review. Existing test markers are never silently removed.

### Candidate counts

| Firestore collection/group | Documents |
| --- | ---: |
| auditLogs | 23 |
| catalogueSizeCounts | 1 |
| catalogueSizes | 1 |
| collections | 1 |
| events | 1 |
| inventory | 7 |
| orderPhoneBlocks | 1 |
| orderPhones | 6 |
| orderQueue | 8 |
| orderRequests requests | 4 |
| orders | 8 |
| productDrafts | 9 |
| productPhotoSources photos | 2 |
| products | 11 |
| **Firestore total** | **83** |

Storage: **31 objects** (3 product-drafts, 20 product-media, 8 product-processed). Auth: **0 test users**. **All keptUnpublished items: none** (empty Firestore and Storage arrays). **Blockers: none** in this snapshot. Keep both real accounts, owner/business settings and other non-candidate records. A new genuine draft or edit after this snapshot requires a fresh inventory before execution.

## Required owner stop

Review the updated channel, wording and inventory, then reply **approved for launch**. Until then: no cleanup execution, no new ORDER_IDENTITY_KEY version, no merge, no live Hosting release. Indexing stays off. Real product photos/details/prices and an owner-selected piece for the later real order check are still needed.

## Focused commits on dev

| Commit | Change |
| --- | --- |
| 104a493 | Keyboard access, focus, required photo alt text and accessibility tests/evidence |
| ed336f4 | Genuine cloud content, sparse layouts, branded share card and placeholder removal |
| 2a98c02 | Owner-supplied wording, Help pages, Settings/public policy behaviour and tests |
| e0c9223 | Genuine preview drafts and cleanup retention/blocker regressions |
| b61877f | Ignore legacy prelaunch browser receipts; preserve the old record |
| 2848acb | Whole-garment hero framing and Help prose width |
| 7abe8f5 | Separate Help headings; clean lint |
| 8f1b62b | Verified standard staff access evidence |
| cf991f1 | Bounded optional Help queries and guest-rule regressions |

This evidence commit follows those focused changes. Git history was not rewritten. Everything remains local on dev; nothing was merged or pushed.
