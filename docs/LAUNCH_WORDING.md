# Soft-launch wording — owner review copy

Recorded 17 November 2026. Launch address is https://night-in-kampala.web.app. A custom domain, indexing and automated payments/messages are not part of this release.

## Owner-supplied facts

- Collection area: Muyenga. Collection is by appointment.
- Customer contact and WhatsApp: +256759334383.
- Payment: cash or MTN/Airtel Mobile Money on collection or delivery.
- Returns contact window: 10 days for now.
- Existing account requested for standard staff access: fahkerahmed@nightinkampala.com. Keep it free of a testAccount claim. The permanent owner account is unchanged.

## Text awaiting the Step 3 approval

All fallback Help pages and the unreviewed checkout/receipt policy show “Launch wording · awaiting owner review”. This is proposed customer copy, not a published policy approval.

| Text | Status / owner decision needed |
| --- | --- |
| Collect from Muyenga, by appointment. | Uses supplied facts; review final wording |
| Pay by cash or MTN/Airtel Mobile Money on collection or delivery. | Uses supplied facts; no payment-provider integration is implied |
| Delivery within Kampala by boda, with the fee agreed by phone. Outside Kampala and international delivery by quote. | NEEDS OWNER APPROVAL: the prompt gave this as an example. Confirm scope and the quote process; no delivery fee is invented |
| Each piece is one of a kind. Contact us within 10 days of receiving your piece to discuss a return. | NEEDS OWNER APPROVAL: 10 days was supplied; “of receiving your piece” is a proposed starting point. No automatic refund, exchange entitlement or return-shipping fee is promised |
| Choose pieces, add to bag, send request; reference means received, staff confirm stock/collection/delivery/payment. | NEEDS OWNER APPROVAL of new wording; describes the implemented journey |
| Call the team about a piece or order; have your reference ready if available. | NEEDS OWNER APPROVAL of new wording; contact number is supplied |
| Check each piece's measurements, condition and care before requesting. | NEEDS OWNER APPROVAL of new wording |
| Privacy text: submitted contact/delivery details are kept with orders for staff follow-up; order/payment/fulfilment/audit/anti-abuse records are kept; Firebase supplies infrastructure; this browser stores a bag/recent summary. | NEEDS OWNER APPROVAL of a short factual notice. No retention period, blanket deletion promise, sharing policy or legal-compliance guarantee is invented |

## Editing without a code release

Collection, delivery and payment wording live in owner Settings; saving validates and audits changes. Unreviewed exact old development defaults are displayed using the new proposed defaults, but custom or previously reviewed wording is preserved. Review and save the wording rather than assuming a new default changed the stored document.

The owner Settings save has now recorded +256759334383 and the proposed collection/delivery/payment copy at revision 3. The supplied phone is shown as a call contact and public Contact/Help WhatsApp links are enabled. The saved-order handoff uses that validated business number. `copyReviewed` remains false pending the Step 3 approval. No message is sent automatically. See [the verified Settings evidence](qa/soft-launch/settings-saved.json).

Staff can override fallback Help pages with approved Site pages using slugs how-to-order, delivery, collection, payment, returns, privacy, sizing or contact. The page editor and owner content approval already exist. The defaults are a small launch fallback, not fabricated published editorial records.

## Stop point

Release to the review channel and list the cleanup inventory first. Wait for the exact owner reply **approved for launch**. Until then: no cleanup execution, new ORDER_IDENTITY_KEY version, merge or production release. Public indexing remains disabled even after launch until separately approved.
