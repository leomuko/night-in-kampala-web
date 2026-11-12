# Design checks before Phases 2 and 3

The approved white boards remain visual references. The review identified additional views/corrections needed before feature work. The owner's sales-first revision now prioritises on-site orders, cash/manual payment and dashboard alerts, with email/gateway integration deferred. See [SALES_FIRST_LAUNCH.md](SALES_FIRST_LAUNCH.md). These entry checks have not been generated or approved by implication.

## Before Phase 2 feature implementation

| ID | Task | Acceptance check |
| --- | --- | --- |
| D2.01 | Generate and review the shop grid in the chosen white theme, with the new fonts and approved spacing. | Fixed wordmark/navigation, three desktop columns and two mobile columns; category/size/availability filters are visible and usable. Round-1 board 01 is no longer the sole layout specification. |
| D2.02 | Generate and review a mobile product-detail view, plus correct the desktop one-of-one size control. | Read-only size text, no dropdown for a one-of-one garment; complete garment image, readable measurements, Add to bag and Order on WhatsApp, reservation note, accessible condition/care/delivery accordions. No fictitious size options. |
| D2.03 | Replace illustrative stock content as real inputs become available. | Photos, print/design ownership, prices, measurements and condition describe the exact piece. A generated fixture is clearly labelled and cannot be purchased as real stock. |

## Before Phase 3 commerce implementation

**Revised order/contact decision:** guest ordering requires name and reachable phone/WhatsApp contact; email is optional. Collect country and relevant collection/delivery details. The submit action places an order request with an on-page reference; it does not collect or confirm payment. Explain availability and any unknown delivery/final total await staff follow-up. No account or automated receipt is required. A private order-status view still needs a secure session/credential; a reference/phone/email alone never grants access. Dashboard-only staff alerts are approved; no SMS/WhatsApp API or background push is implied. Earlier required-email and gateway success/failure behaviour is superseded for launch.

| ID | Task | Acceptance check |
| --- | --- | --- |
| D3.01 | Adapt the form to name, required phone/WhatsApp contact, optional email and collection/delivery preference. | Useful phone validation; relevant address only; retained form data on recoverable failure; "Place order" and manual-payment/follow-up wording; no forced email or account. |
| D3.02 | Review order-received, submitting, failed-submit and unavailable states. | Show success only after a saved server order, with reference and "Awaiting confirmation". Safe retry does not duplicate the order. Never display "Paid" or a gateway PIN prompt. Gateway payment-success/failure screens are deferred. |
| D3.03 | Review domestic collection/delivery and international enquiry. | Known approved charges are explicit; unknown delivery/final total is clearly awaiting staff confirmation. No required Uganda postcode, implied worldwide shipping or international cash on delivery. Additional country address details are collected only when relevant. |
| D3.04 | Verify contact, stock and submit edge cases. | Contact correction, duplicate submissions, uncertain network result/retry, unavailable pieces, concurrent staff confirmations, cancellation/release and private order access are tested. Confirm stock hold/expiry policy before implementation. |
| D3.05 | Review the minimal admin order queue/detail and alert states. | Persistent new/unread badge, live alert while open, seen versus contacted states, reconnect/reopen recovery, customer follow-up details, separate manual-payment/fulfilment controls and authorised access. No order is lost if the live alert fails; closed-dashboard alerts are outside launch. |

These tasks belong at the design entry to their feature phases. They do not delay the local Phase 1 shell after its spacing approval and baseline commit. Board 10 remains optional and unrequested.
