# Sales-first launch: manual orders and staff follow-up

Owner direction recorded 12 November 2026: defer email service selection; prioritise a working shop where customers place orders, staff are notified and follow up, with cash/manual payment where appropriate. The owner explicitly chose **dashboard alerts for the first release**. This changes planning scope; no order, admin or payment feature is implemented by this document.

## Customer and staff journey

1. Staff sign in, upload photographs/details of real garments, set prices and publish available pieces. Generated development placeholders remain unpurchasable.
2. A shopper browses, inspects the exact one-of-one piece and adds it to a persistent bag. The bag does not reserve stock.
3. The shopper enters name, reachable phone/WhatsApp contact, country and collection/delivery details as relevant. Email is optional. No customer account or online payment is required.
4. The server validates items and prices and saves an order request with a stable submission identity plus durable unread admin queue state. Only then show **Order received — awaiting confirmation**, its reference, the item subtotal and the follow-up explanation. If delivery is not priced, show **Delivery and final total to be confirmed**, not an invented total or free shipping.
5. Authenticated staff see a live new-order alert/unread badge while the dashboard is open. Unseen orders remain in the queue after reload, reconnect or a closed session. A failed live alert does not discard an order. The dashboard is the notification channel; there is no closed-dashboard alert in this release.
6. Staff contact the customer by phone/WhatsApp, confirm availability, delivery/final costs and payment arrangements, then confirm or decline the order. Staff record cash/manual payment only when actually received and track fulfilment separately.
7. Completed or cancelled orders retain an audit trail. Cancellation/release and in-person/WhatsApp sales use the same trusted stock operations.

The owner's exact cash arrangement remains to be supplied: collection, approved local delivery, or another agreed method. Do not assume universal cash on delivery. International visitors can browse and submit an enquiry; staff must agree shipping and payment before confirming it.

## One-of-one stock policy to confirm before Phase 3

Recommended initial policy: **reserve at staff confirmation**. New requests can reference the same piece, with an explicit awaiting-availability message. A server transaction allows at most one request to become the confirmed allocation; competing requests are flagged for staff follow-up. This avoids treating an unpaid request as a completed sale or allowing two staff members to promise the same garment.

Staff can cancel/release a confirmed allocation through an audited operation. Decide the hold period/expiry rules before implementing this transition; do not invent an automatic hold duration. Any timed release must be enforced by the server. This recommendation has not been separately approved by the owner.

## State and access requirements

- Keep order acceptance, payment and fulfilment separate. Planned states include order `new/contacted/confirmed/cancelled/completed`, payment `unpaid/paid`, and fulfilment `unfulfilled/ready_for_collection/dispatched/delivered/returned`; validate the allowed transitions before coding them.
- Unread/seen and contacted are separate: opening an order does not mean staff have contacted the buyer. Define team-wide seen state for the initial owner/staff team; avoid silently losing uncontacted work when a badge clears.
- Only authorised staff can view all customer details, confirm/release stock, record payment or fulfil an order. Server functions validate role and inputs; customers cannot change prices, paid status or staff roles.
- Customer references are not access credentials. Display a submission result within the submitter's authorised session; any later private status view needs a secure session/credential. No public phone/reference search or order-ID-only access.
- Idempotent server submission prevents duplicates on retry/double tap. Basic validation and abuse controls still apply even though the site does not collect online payment.
- No automated email, SMS, WhatsApp API message or background push is included. A WhatsApp link opens a customer-controlled chat; it does not automatically create a saved order or prove an alert was delivered.

## Delivery order and acceptance checks

This is the revised sequence. Break each feature phase into smaller tasks before building; preserve the owner's small-commit workflow.

| Stage | Deliverable | Acceptance check |
| --- | --- | --- |
| Next: P1.12 | Full shell QA at 360/390px, tablet and desktop, plus keyboard/focus checks. | Record screenshots, observed gaps and passing relevant build/test checks. P1.11 email selection is deferred, not marked completed. |
| P1.13–P1.15 | Remaining Firebase placement/staging decision and shared-link verification. | Retain existing Firestore `eur3`; approve remaining topology, verify HTTPS staging and have the owner confirm a real WhatsApp preview. Email/merchant onboarding does not gate closure. Local catalogue work can proceed without provisioning new cloud resources. |
| Phase 2 entry | Review white shop grid/mobile product detail and break catalogue/admin publishing into tasks. | Approved spacing/nav; one-of-one size is read-only; clear stock/condition/measurements; generated fixtures cannot be real stock. |
| Phase 2 | Real Firestore-backed catalogue and authenticated admin product publishing. | Authorised staff can draft/upload/publish a real piece; shoppers only see published content and current safe availability. |
| Phase 3 entry | Adapt order form/received/error screens and review admin order queue. | Phone-led form, optional email, manual-payment wording, clear cost/availability caveats and unread/contacted states. Confirm stock hold/release rules. Existing payment boards are visual references, not gateway behaviour requirements. |
| Phase 3: customer order | Persistent bag, validated server order creation and on-page reference. | Reloaded bags work; server ignores tampered prices; retry returns the same saved order; failure preserves data and offers safe retry; no paid claim. |
| Phase 3: admin follow-up | Persistent unread queue, live dashboard alert, order detail and seen/contacted actions. | An order appears without a dashboard refresh; unseen orders survive reopening; a live disconnect loses no orders; unauthorised users cannot read customer details. |
| Phase 3: allocation and fulfilment | Confirm/reject, allocate/release, actual cash/manual payment recording, fulfil/cancel and manual sales. | Competing confirmations allocate a unique piece at most once; payment requires authorised staff and an audit record; cancellation is idempotent and cannot silently re-list dispatched stock. |
| Launch | Real end-to-end order and staff operating routine. | Customer can submit, staff see it, contact the buyer, arrange agreed payment/delivery and fulfil or cancel. Real stock/contact/policies are supplied; staff understand alerts require an open dashboard and check the persistent queue regularly. |

## Explicitly deferred

Transactional email/provider choice and sender DNS, gateway/provider applications and sandbox work, automated mobile money/cards, automatic receipts/dispatch messages, background/push alerts, customer accounts, wishlist and promotions. Retain earlier research/security requirements for their later feature work; they are not sales-first launch blockers.

## Owner inputs before real orders

Real garment details/photos/prices/stock; business phone/WhatsApp number; authorised staff identities; collection/local delivery and cash/manual payment arrangements; whether other destinations use a manual quote; confirmation/hold/release policy; follow-up expectations and customer-facing terms. No sender domain or merchant gateway account is required for this launch model.
