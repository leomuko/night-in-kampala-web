# P1.12 storefront shell review

Verified on 13 November 2026 in the in-app browser using the local Vite server. P1.12 passed its local acceptance check.

| Viewport | Homepage capture | Grid | Section gap | Header / hero type |
| --- | --- | --- | --- | --- |
| 360 px | [Phone](home-360.jpg) | 2 columns, 12 px gap | 48 px | 72 px / 40 px |
| 390 px | [Phone](home-390.jpg) | 2 columns, 12 px gap | 48 px | 72 px / 40 px |
| 768 px | [Tablet](home-768.jpg) | 2 columns, 24 px gap | 72 px | 72 px / 56 px |
| 1440 px | [Desktop](home-1440.jpg) | 3 columns, 32 px gap | 96 px | 88 px / 72 px |

All four widths and the 1024 px breakpoint had no horizontal overflow. Body text measured 16 px. Hero gaps matched the approved 32/48/64 px values. The wordmark is centered on mobile and tablet and wraps when the available space calls for it. On desktop it is left aligned. The captures exclude the browser's 15 px scrollbar. White surfaces, photo scale, the section rhythm and navigation were checked against the approved home and style boards.

Keyboard checks covered opening the menu, search and region dialogs with Enter, Tab order and wrapping, reverse Tab wrapping in menu and region, radio arrow keys, and Escape. Focus returned to the originating header control. Opening region from the mobile menu replaces that dialog and returns focus to the menu button on close. Cancelling a changed region now discards the unsaved selection. Keyboard activation of a product link moved focus to main content, and Back returned to the homepage. The [390 px menu capture](menu-390.jpg) records the open dialog. The final browser session reported zero console warnings or errors.

`npm run check` passed with 79 tests plus build and lint. This includes the regression test for a cancelled region selection and the secret scan's planted-credential test.

Remaining gaps include real product imagery, the shop and product detail layouts, live catalogue content and staff access. The homepage has placeholder copy where later content is planned. This browser pass covered the local shell and its dialogs. Separate browser and physical-device coverage, a full accessibility audit, staging CDN behavior and the phone WhatsApp preview remain outside this result.
