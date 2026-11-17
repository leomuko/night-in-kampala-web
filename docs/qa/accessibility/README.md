# Soft-launch accessibility review — 17 November 2026

Scope: storefront, bag/checkout, staff sign-in, product editing and order controls. Target is [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/). This is a scoped engineering review, not a complete conformance certification. No cloud records or real credentials were used in these checks.

## Corrections

- Server checkout errors now focus their heading rather than leaving focus inside the hidden form. Returning to the form focuses Full name and preserves the entered details.
- A saved order focuses its confirmation heading, bringing the reference into view and making the change discoverable to keyboard and assistive-technology users.
- Successful staff sign-in focuses the dashboard heading. Opening a product editor focuses its named region; closing it restores the triggering table/add button. Opening an order focuses its reference without refocusing on every live state update.
- The multi-photo gallery names its keyboard controls, announces the active photo position and exposes only the current full-size photo to assistive technology. Thumbnails retain descriptive button names.
- Photo descriptions are required for new uploads and saved edits. Blank descriptions get associated error text, and empty edits cannot be saved. The server still validates alt text independently.
- Textarea borders now use the existing muted token instead of the low-contrast decorative hairline. Focus targets have scroll margins/padding. Existing reduced-motion rules disable animation, transitions and smooth scrolling.

## Evidence

| Check | Result | Method / limits |
| --- | --- | --- |
| Structural A/AA rules | PASS | axe-core 4.14.1, six representative route/editor/modal checks, zero applicable violations. Colour contrast disabled in jsdom; separately calculated and inspected |
| Desktop skip link | PASS | Tab then Enter focused main; visible 2px ink outline with 3px offset |
| Mobile menu | PASS | Chrome at 390×844, keyboard-only open; Shift+Tab wrapped to the last control, Tab returned to Close; Escape restored Open menu |
| Product → bag → checkout | PASS | Local marked synthetic piece; Tab/Enter-only navigation and entry |
| Checkout error and recovery | PASS | Invalid phone rejected by the local server; heading focused; Back to form restored Full name; corrected phone retained other details |
| Receipt focus | PASS | Local saved order focused the confirmation heading; `receipt-focus.jpg` |
| Staff navigation/editor | PASS | Disposable Auth-emulator owner only. Keyboard sign-in, named editor focus and Close return; `staff-keyboard-focus.jpg` and `staff-editor-desktop.jpg` |
| Form labels and error associations | PASS | axe checks, Field behaviour tests, required photo-description regression |
| Gallery keyboard and announcements | PASS | Component test switches views with controls/ArrowLeft, checks current image and status |
| Token contrast | PASS | `contrast.json`: body 19.67:1, muted text 6.25:1 on white / 5.52:1 on fog, control borders 6.25:1; outline/sidebar contrast 19.67:1 |
| Reflow | PASS for inspected views | 390px mobile menu/checkout and 1456px staff editor; desktop document width equalled viewport. Empty-state views are reviewed separately in the soft-launch evidence |
| Reduced motion | PASS — source review | Global prefers-reduced-motion rule disables transitions/animation and smooth scroll. A physical reduced-motion device check was not run |
| Screen readers / full device matrix | NOT RUN | No full VoiceOver/TalkBack, switch control or every zoom/browser combination. Automated tests cannot replace that coverage |

The full `npm run check` gate passed **144 tests**: 84 app, 15 metadata, 6 deployment, 10 rules, 24 emulator HTTP, 4 cleanup/role and 1 secret-scan test. Lint and offline production build passed. Axe is development-only. Native browser keyboard checks supplement jsdom, whose dialog top layer and colour/layout support are limited.

The local data/account are disposable demo-emulator records. They do not grant access to the cloud. Temporary viewport overrides were reset. Physical iPhone HEIC and the speed audit remain outside this task. No new images, test statistics or fabricated policy claims were used as genuine catalogue data.
