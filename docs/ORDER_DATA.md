# Manual order data and transitions

| Path | Reads | Data |
| --- | --- | --- |
| `orders/{id}` | Staff and owner by document ID | Immutable public piece and price snapshots, private contact and delivery choice, order/payment/fulfilment states, item decisions, timestamps and owner-scoped submission identity. |
| `orderQueue/{id}` | Staff and owner, bounded lists | Reference, submitted time, order and unread states, public item summary and follow-up flags. Contains no contact details. |
| `orderSettings/config` | Staff and owner by document ID | Business WhatsApp number, overdue hours, limits and provisional copy. Only an owner can save through the audited callable. |
| `orderPolicy/current` | Public by document ID | Customer-facing collection, delivery and payment copy plus review flag. |
| Submission keys, phone/source counters, phone blocks | Trusted server only | Hashed identities, bounded rolling submission accounting and active order/piece accounting. Public order references grant no access. |
| `inventory/{slug}`, `auditLogs/{entry}` | Existing staff stock and owner audit permissions | Per-order allocations, explicit sale records and auditable transitions. |

Guest uses the same browser's random submission identity to retry a saved order. Its digest identifies the submission. Keep it separate from the order reference and the dismissible recent-order summary. Never store contact details in the bag or recent-order record.

| Axis | Transitions |
| --- | --- |
| Order | New can move to Contacted, Confirmed, Declined, Cancelled or Spam. Contacted can move to Confirmed, Declined, Cancelled or Spam. Confirmed can move to Completed or Cancelled through the applicable stock/fulfilment operation. Terminal orders stay closed. |
| Payment | Unpaid becomes Paid through an actual staff payment record. Keep adjustments separate from inventory. |
| Fulfilment | Unfulfilled moves to Ready for collection or Dispatched. Collection can move to Delivered. Dispatched can move to Delivered or Returned. Delivered can move to Returned. Returned stock needs inspection before relisting. |
| Line / stock | A requested line can be reserved, declined, cancelled or cleared as spam. A reserved line can be released before dispatch or explicitly marked Sold. Preserve unrelated items and original snapshots. Recompute safe availability and size labels atomically. |

New, contacted and confirmed orders consume open slots. Requested and reserved lines consume the applicable phone/piece slot. Sold lines remain in the audit record. Releasing a confirmed allocation is an audited decision. Overdue flags use the approved editable default of 24 hours. Payment never changes stock automatically.
