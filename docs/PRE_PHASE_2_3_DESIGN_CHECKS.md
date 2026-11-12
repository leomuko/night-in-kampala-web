# Design checks before Phases 2 and 3

The approved white boards remain visual references. The review identified additional views/corrections needed before feature work. The owner's sales-first revision now prioritises on-site orders, cash/manual payment and dashboard alerts, with email/gateway integration deferred. See [SALES_FIRST_LAUNCH.md](SALES_FIRST_LAUNCH.md). These entry checks have not been generated or approved by implication.

## Before Phase 2 feature implementation

| ID | Task | Acceptance check |
| --- | --- | --- |
| D2.01 | Generate and review the shop grid in the chosen white theme, with the new fonts and approved spacing. | Fixed wordmark/navigation, three desktop columns and two mobile columns; category/size/availability filters are visible and usable. Round-1 board 01 is no longer the sole layout specification. |
| D2.02 | Review mobile product detail and correct the desktop one-of-one size control. | Read-only size; Available/Requested/Reserved/Sold states; Requested remains orderable with the awaiting-confirmation explanation. Complete imagery, measurements and condition/care/delivery details; no fictitious size options or stock reservation in the bag. |
| D2.03 | Replace illustrative stock content as real inputs become available. | Photos, print/design ownership, prices, measurements and condition describe the exact piece. A generated fixture is clearly labelled and cannot be purchased as real stock. |

## Before Phase 3 commerce implementation

**Revised order/contact decision:** guest ordering requires name and reachable phone/WhatsApp contact; email is optional. Collect country and relevant collection/delivery details. The submit action places an order request with an on-page reference; it does not collect or confirm payment. Explain availability and any unknown delivery/final total await staff follow-up. No account or automated receipt is required. A private order-status view still needs a secure session/credential; a reference/phone/email alone never grants access. Dashboard-only staff alerts are approved; no SMS/WhatsApp API or background push is implied. Earlier required-email and gateway success/failure behaviour is superseded for launch.

| ID | Task | Acceptance check |
| --- | --- | --- |
| D3.01 | Adapt the form to name, required phone/WhatsApp contact, optional email and collection/delivery preference. | Useful phone validation; relevant address only; retained form data on recoverable failure; "Place order" and manual-payment/follow-up wording; no forced email or account. |
| D3.02 | Review received/submitting/failed/unavailable states and same-browser recent order. | After server save show reference and "Send this order to us on WhatsApp" with a public item summary only. Explain the customer must Send; never imply delivery/read confirmation. Skipping WhatsApp or blocked local storage loses no saved order. Recent summary stores no address/phone/credential and grants no private access. No "Paid" claim or gateway PIN. |
| D3.03 | Review domestic collection/delivery and international enquiry. | Known approved charges are explicit; unknown delivery/final total is clearly awaiting staff confirmation. No required Uganda postcode, implied worldwide shipping or international cash on delivery. Additional country address details are collected only when relevant. |
| D3.04 | Verify limits, bot checks, stock and submit edge cases. | Server enforces 3 open requests/normalised phone, one per piece, 5 new submissions/rolling hour/trusted connection source, phone format/+256 handling, App Check and honeypot. Idempotent retry consumes no extra slot and reveals no other order. Test concurrent confirmations/cancellation and atomic Requested state changes. Resolve hold/overdue/Sold policy inputs. |
| D3.05 | Review admin queue/detail, alerts, overdue and spam controls. | Persistent unread/contacted states, grouped oldest-first competing requests, overdue flag without auto-cancel, audited spam/block/unblock and separate manual-payment/fulfilment controls. Spam clears Requested only if no other request/allocation remains. Live disconnect loses no order; staff routine covers skipped WhatsApp; automated closed-dashboard alerts remain outside launch. |

Detailed required behaviour and acceptance checks: [MANUAL_ORDER_REQUIREMENTS.md](MANUAL_ORDER_REQUIREMENTS.md). The owner confirmed reserve-at-staff-confirmation; the confirmed-hold duration and pending overdue threshold are not yet selected.

These tasks belong at the design entry to their feature phases. They do not delay the local Phase 1 shell after its spacing approval and baseline commit. Board 10 remains optional and unrequested.
