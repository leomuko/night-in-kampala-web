# Sales-first launch: manual orders and staff follow-up

Owner direction recorded 12 November 2026: defer email service selection; prioritise a working shop where customers place orders, staff are notified and follow up, with cash/manual payment where appropriate. The owner explicitly chose **dashboard alerts for the first release**. This changes planning scope; no order, admin or payment feature is implemented by this document.

The subsequent owner review adds [mandatory manual-order requirements](MANUAL_ORDER_REQUIREMENTS.md): a customer-sent WhatsApp handoff after saving, a same-browser recent-order record, Available/Requested/Reserved/Sold states and explicit server limits/spam controls. Dashboard-only automated alerts remain the notification implementation; the WhatsApp button is a customer-controlled handoff, not an automatic API message.

## Customer and staff journey

1. Staff sign in, upload photographs/details of real garments, set prices and publish available pieces. Generated development placeholders remain unpurchasable.
2. A shopper browses, inspects the exact one-of-one piece and adds it to a persistent bag. The bag does not reserve stock.
3. The shopper enters name, reachable phone/WhatsApp contact, country and collection/delivery details as relevant. Email is optional. No customer account or online payment is required.
4. The server validates items/prices, App Check, phone/request/network limits and honeypot, then atomically saves an idempotent order, unread queue state and the public Requested projection. Only then show **Order received — awaiting confirmation**, reference, item subtotal and the **Send this order to us on WhatsApp** handoff. Remember a minimal recent-order summary in the same browser. If delivery is not priced, show **Delivery and final total to be confirmed**, not an invented total or free shipping.
5. Authenticated staff see a live new-order alert/unread badge while the dashboard is open. Unseen orders remain in the queue after reload, reconnect or a closed session. A failed live alert does not discard an order. The dashboard is the notification channel; there is no closed-dashboard alert in this release.
6. Staff contact the customer by phone/WhatsApp, confirm availability, delivery/final costs and payment arrangements, then confirm or decline the order. Staff record cash/manual payment only when actually received and track fulfilment separately.
7. Completed or cancelled orders retain an audit trail. Cancellation/release and in-person/WhatsApp sales use the same trusted stock operations.

The owner's exact cash arrangement remains to be supplied: collection, approved local delivery, or another agreed method. Do not assume universal cash on delivery. International visitors can browse and submit an enquiry; staff must agree shipping and payment before confirming it.

## One-of-one stock policy

Owner-confirmed policy: **reserve at staff confirmation**. New requests set the safe public Requested label without blocking further valid requests. Staff see competing requests grouped by piece, oldest first. A server transaction permits at most one confirmed allocation and changes it to Reserved. Sold remains a separate trusted transition. Decline/cancel/spam returns it to Available only when no active requests or allocation remain.

Staff can cancel/release through an audited operation. Confirm the hold/expiry and Sold/payment/fulfilment transition rules before implementing them; do not invent a duration. Pending requests past an owner-configured threshold are flagged overdue, not auto-cancelled. The review approved reserve-at-confirmation, not a specific hold/overdue period.

## State and access requirements

- Keep acceptance, payment and fulfilment separate. Planned order states are `new/contacted/confirmed/declined/cancelled/spam/completed`; `new/contacted/confirmed` consume open-request slots. Payment is `unpaid/paid`, separate from fulfilment `unfulfilled/ready_for_collection/dispatched/delivered/returned`; validate the full transition table before coding.
- Unread/seen and contacted are separate: opening an order does not mean staff have contacted the buyer. Define team-wide seen state for the initial owner/staff team; avoid silently losing uncontacted work when a badge clears.
- Only authorised staff can view all customer details, confirm/release stock, record payment or fulfil an order. Server functions validate role and inputs; customers cannot change prices, paid status or staff roles.
- Customer references are not access credentials. Display a submission result within the submitter's authorised session; any later private status view needs a secure session/credential. No public phone/reference search or order-ID-only access.
- Server controls: at most 3 open requests per normalised phone and one active request per piece, at most 5 new submissions/hour per trusted connection source, server phone normalisation (+256 for valid Ugandan forms), enforced App Check, honeypot and audited staff spam/block/unblock actions. Idempotent retries do not consume another slot. See the detailed requirements for concurrency and privacy checks.
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
| Phase 3: customer order | Persistent bag, limited/validated idempotent server order creation, reference, WhatsApp handoff and recent-order summary. | Limits and bot checks are enforced server-side; retry returns one saved order; the handoff carries no private details and does not claim message delivery; skipping it loses no order; same-browser summary survives reload. |
| Phase 3: admin follow-up | Persistent unread queue/live alerts, oldest-first competing requests, overdue flags, contacted and spam/block actions. | Reopen/reconnect loses no orders; overdue does not auto-cancel; staff review the queue even if customers skip WhatsApp; spam handling preserves other active requests/allocations; customer details stay private. |
| Phase 3: allocation and fulfilment | Confirm/reject, allocate/release, actual cash/manual payment recording, fulfil/cancel and manual sales. | Competing confirmations allocate a unique piece at most once; payment requires authorised staff and an audit record; cancellation is idempotent and cannot silently re-list dispatched stock. |
| Launch | Real end-to-end order and staff operating routine. | Customer can submit, staff see it, contact the buyer, arrange agreed payment/delivery and fulfil or cancel. Real stock/contact/policies are supplied; staff understand alerts require an open dashboard and check the persistent queue regularly. |

## Explicitly deferred

Transactional email/provider choice and sender DNS, gateway/provider applications and sandbox work, automated mobile money/cards, automatic receipts/dispatch messages, background/push alerts, customer accounts, wishlist and promotions. Retain earlier research/security requirements for their later feature work; they are not sales-first launch blockers.

## Owner inputs before real orders

Real garment details/photos/prices/stock; business phone/WhatsApp number; authorised staff identities; collection/local delivery and cash/manual payment arrangements; whether other destinations use a manual quote; confirmation/hold/release policy; follow-up expectations and customer-facing terms. No sender domain or merchant gateway account is required for this launch model.
