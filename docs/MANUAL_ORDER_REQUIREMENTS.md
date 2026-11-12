# Manual-order requirements before Phase 3

Owner requirements recorded 12 November 2026 following the code/plan review. These are launch acceptance criteria, not implemented features. Build them with the real order workflow after catalogue/admin foundations; do not add a fake order-success screen to the current placeholders.

## 1. Saved order, WhatsApp handoff and customer record

After the server saves an order and its unread dashboard entry, show its reference and a main **Send this order to us on WhatsApp** button. Use the configured business number and a URL-encoded message containing only the reference and public item/price summary from the server-confirmed snapshot. No address, private contact details, order-access credential or guessed shipping total belongs in the message.

The button opens a prefilled chat; **the customer must press Send**. Do not display "Staff notified on WhatsApp" or claim delivery/read status from a click. An unavailable app, closed chat or skipped button must not lose the saved order. The dashboard queue remains the source of truth; staff look up the reference there and confirm the actual saved details. No provider/API or automatic outbound message is introduced. See [WhatsApp's click-to-chat documentation](https://faq.whatsapp.com/5913398998672934).

Persist a minimal **Your recent order** record on the same browser/device after saving: reference, timestamp and public item/price summary. Offer a way to dismiss it on a shared device. Never store the phone/address/private order payload or turn a local record into authorisation to fetch an order. Blocked/unavailable browser storage must not turn a successful saved order into a failure. The record is not cross-device history and may disappear when browser data is cleared. Private details still require the submitter's authorised session or a secure credential.

Acceptance: server success precedes the button/record; retry creates one order; skipping WhatsApp preserves the queue; the prefill has the correct reference/summary and no private data; reopened same-browser site shows the summary; storage failure preserves the on-page reference. Staff agree an explicit queue-review routine for customers who do not send a message. No response time is invented.

## 2. Available → Requested → Reserved → Sold

The owner confirmed **reserve at staff confirmation**. An unverified request must not lock a unique garment. Publish only a safe aggregate availability projection, never customer/order IDs, phone numbers or private request data.

| Public state | Meaning and ordering behaviour |
| --- | --- |
| Available | No active request, reservation or completed sale. Requests can be placed. |
| Requested | At least one active request, with no confirmed allocation. Show "Requested, awaiting confirmation" and explain that another request is welcome, with confirmation handled in order received. The label does not disable ordering. |
| Reserved | Staff atomically allocated the piece to one confirmed order. Further allocation is blocked. |
| Sold | The trusted sale/stock workflow completed allocation according to the agreed payment/fulfilment transitions. Purchasing is disabled; the archive remains visible. |

Save the order, unread queue state, private active-request accounting and public Requested projection in the same trusted transaction. No public client writes. Status priority is Sold, then Reserved, then Requested, then Available. When all requests are declined/cancelled/spam, return to Available only if no reservation or sale remains. Repeated submissions and repeated cancellation/spam actions must not increment/decrement counters twice. A single request limit cannot be bypassed through a different cart payload containing the same piece.

Group competing requests by piece, oldest first. Confirming one uses a transaction that allocates it at most once and prompts staff to decline/contact the others. For multi-item orders, handle the affected piece explicitly; do not silently cancel unrelated items or change a customer's agreed total. The "in order received" promise needs staff handling of earlier requests before later confirmation; any exception must be recorded and communicated.

Show an overdue flag when a pending request exceeds an owner-configured threshold. **Do not auto-cancel it.** The threshold and any separate expiry of a confirmed reservation are still owner inputs; no duration has been selected. The final Sold/payment/fulfilment transition must also be defined before coding, particularly where cash is collected at delivery.

Acceptance: first request changes Available to Requested atomically; subsequent valid requests remain allowed; concurrent staff confirmations yield at most one allocation; decline/cancel/spam recomputes the correct state; a Reserved/Sold piece cannot be reset by clearing an unrelated request; overdue only flags work for staff.

## 3. Concrete server-side form limits and staff spam control

| Control | Required behaviour |
| --- | --- |
| Per normalised phone | At most **3 open order requests**, and at most **one active request per piece** across those orders. Define open states with the order transition table; terminal declined/cancelled/spam/completed requests do not remain active. |
| Per trusted connection source | At most **5 new submissions in a rolling hour**. Identify the source through the deployed platform's trusted proxy/connection information, not a client-provided field or arbitrary forwarded header. Document shared-network behaviour and limit-key retention. |
| Phone format | Server validates recognised international phone format. Normalise valid Ugandan local forms to **+256**; retain valid foreign country codes using the selected country. Formatting does not prove the customer owns the number. |
| Bot checks | Enforce Firebase App Check on the order function and validate a honeypot that is inaccessible to keyboard/screen-reader users and excluded from autofill. Missing/invalid proof and a filled honeypot cannot create an order. Production debug tokens are not accepted. |
| Staff spam action | Authorised **Mark as spam** records an audit event, blocks the normalised number for future submissions and removes affected requests from active accounting. Recompute each piece's public state; retain Requested if another legitimate request exists, and preserve Reserved/Sold. Provide an authorised audited unblock/correction path. |

Trusted server pricing/availability checks, submission ownership, idempotency and these limits must work together under concurrency. A legitimate retry with the same submission identity returns the same saved order without consuming another slot; never return someone else's order/reference based on a matching phone alone. New attempts over the limits are rejected with a useful, non-leaking explanation and retain the customer's form/bag. Counters/blocks and contact details are private; staff changes use privileged server operations. Exact production App Check/provider integration and trusted connection-source handling must be tested before launch.

Acceptance: simultaneous calls cannot exceed either limit or create duplicate phone/piece requests; equivalent local/+256 phone forms share the same limits; malformed numbers, missing App Check, honeypots and blocked numbers fail server-side; staff spam/unblock operations require permissions and cannot incorrectly clear other customers' interest or stock allocations.

## Implementation entry checks

Update the order-received/mobile product/admin-queue designs for the above states before Phase 3. The Phase 3 task breakdown must include persistence, state/counter transactions, limits, App Check, staff spam controls and their behaviour tests. Business WhatsApp number, staff queue-review routine, overdue threshold, confirmed-hold policy, Sold transition and cash/collection/delivery terms remain concrete inputs to resolve before real ordering.
