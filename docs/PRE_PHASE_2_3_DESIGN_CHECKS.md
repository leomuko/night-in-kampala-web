# Design checks before Phases 2 and 3

The approved white boards remain references. The review identified additional views and two corrections needed before the corresponding feature work. These are now explicit tasks; they have not been generated or approved by implication.

## Before Phase 2 feature implementation

| ID | Task | Acceptance check |
| --- | --- | --- |
| D2.01 | Generate and review the shop grid in the chosen white theme, with the new fonts and approved spacing. | Fixed wordmark/navigation, three desktop columns and two mobile columns; category/size/availability filters are visible and usable. Round-1 board 01 is no longer the sole layout specification. |
| D2.02 | Generate and review a mobile product-detail view, plus correct the desktop one-of-one size control. | Read-only size text, no dropdown for a one-of-one garment; complete garment image, readable measurements, Add to bag and Order on WhatsApp, reservation note, accessible condition/care/delivery accordions. No fictitious size options. |
| D2.03 | Replace illustrative stock content as real inputs become available. | Photos, print/design ownership, prices, measurements and condition describe the exact piece. A generated fixture is clearly labelled and cannot be purchased as real stock. |

## Before Phase 3 commerce implementation

**Checkout contact decision:** online guest checkout requires an email address for the receipt and secure order-status link, alongside a delivery phone number. Show its purpose next to the field and allow correction before paying. A customer account is not required. An authenticated/secure link still protects order data; an email string or predictable order ID alone does not grant access. Marketing consent is separate and optional. Automated SMS/WhatsApp delivery is not silently added. Customers using the manual Order on WhatsApp path can agree details with staff without being forced through online checkout; staff still record the sale and inventory change.

| ID | Task | Acceptance check |
| --- | --- | --- |
| D3.01 | Revise the delivery screen to collect required email and phone. | Purpose is visible; missing/invalid email has useful validation; details survive navigation and recoverable failure; no account-signup requirement or bundled marketing consent. |
| D3.02 | Generate and review payment-success and payment-failed states. | Success follows server verification and shows a secure next step. Failure has a useful retry/change-method route without double charging. Pending remains distinct and never asks for a website PIN. |
| D3.03 | Generate and review international addressing and delivery. | Country-specific address, city/region/postcode requirements; exact charge currency and supported destination/rate before payment; import-charge wording. Uganda retains district/area/landmark inputs without a required postcode. Unsupported countries have an enquiry path. |
| D3.04 | Verify contact and payment edge cases. | Email correction, notification failure/retry, stock loss, reservation expiry, failed/retried payment and reconciliation are checked without duplicate orders or leaked order information. |

These tasks belong at the design entry to their feature phases. They do not delay the local Phase 1 shell after its spacing approval and baseline commit. Board 10 remains optional and unrequested.
