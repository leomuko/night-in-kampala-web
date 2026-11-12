# Design foundations before P1.01

Status: the owner approved the numeric spacing/type values below. P1.01–P1.08 are implemented; `src/styles/tokens.css` was created first. Board approval remains intact. See [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) for the verified build, font/asset provenance and remaining scope.

## Named fonts

| Role | Family / requested weights | Use |
| --- | --- | --- |
| Display | Anton 400 | NIGHT IN KAMPALA wordmark and headings; use the supplied regular face without synthetic bold. |
| Interface | Inter 400, 500, 600 | Navigation, buttons, inputs, product names, prices, body and helper text. |
| Editorial | Newsreader 400 | Short serif sublines and editorial sentences. |

All three families' upstream licence files identify SIL Open Font License 1.1: [Anton](https://raw.githubusercontent.com/google/fonts/main/ofl/anton/OFL.txt), [Inter](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt), [Newsreader](https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt). P1.03 now self-hosts the needed Latin WOFF2 files and retains each OFL licence. Source package/version/checksum are recorded in public/asset-provenance.json. Swap behaviour and fallbacks are configured; only Anton and regular Inter are preloaded. No third-party font request is needed.

## Approved responsive measurements

Values are design choices derived from the roomier boards, not measurements claimed to have been embedded in them. CSS should express typography and spacing in rem where appropriate; pixel equivalents below assume the default 16px root. Preserve browser text scaling.

| Property | Phone: below 640px | Tablet: 640–1023px | Desktop: 1024px and above |
| --- | --- | --- | --- |
| Minimum page gutter, each side | 20px | 32px | 48px |
| Content max width, excluding gutters | 1280px cap | 1280px cap | 1280px cap |
| Major section gap | 48px | 72px | 96px |
| Hero text/image gap | 32px | 48px | 64px |
| Product grid gap | 12px | 24px | 32px |
| Header height | 72px | 72px | 88px |
| Wordmark size | 28px | 28px | 36px |
| Hero heading size | 40px | 56px | 72px |
| Section heading size | 28px | 32px | 36px |
| Editorial subline size | 20px | 22px | 24px |
| Body / input / price size | 16px | 16px | 16px |
| Desktop navigation size | Collapsed menu | Collapsed menu | 14px |
| Small label / helper size | 12px / 14px | 12px / 14px | 12px / 14px |
| Button/input minimum height | 48px | 48px | 48px |
| Homepage and shop columns | 2 | 2 | 3 |

At 1440px viewport width, the 1280px content cap yields 80px effective side gutters. At 390px, 20px side gutters leave 350px, with two 169px cards and a 12px gap. Below 360px, or where enlarged text needs it, allow a single product column. Use content-driven wrapping rather than clipping at a breakpoint. Product pages can stack earlier than desktop when the details no longer fit comfortably.

Supporting tokens: spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 72, 96, 128px; heading line-height 1.05; body/UI line-height 1.5; editorial line-height 1.35. Controls have 16px horizontal padding, 1px borders and 0px radius; icon hit areas are at least 44px. Focus uses a 2px ink outline with 3px offset. Card image fields use fog grey and contain the whole garment. P1.01 records these values as CSS variables. Under 390px the header uses the approved compact two-line mobile wordmark to prevent a collision while keeping its 28px size and 44px icon targets.

## Fixed visual and behaviour decisions

- Colours: paper `#FFFFFF`, ink `#0B0B0C`, fog `#F1F1EF`, hairline `#E2E2DF`. No amber accent. Hairline is decorative and must not be the sole way to identify a control or focus state.
- Desktop wordmark is left aligned on one line; mobile wordmark is centred. One header row, no announcement bar, and no customer-account icon at launch.
- Navigation: Shop, Drops, Our process, Lookbook, Events. On phone/tablet it belongs in the collapsed menu.
- The shop and homepage use three desktop product columns, two phone/tablet columns, with an accessibility fallback to one. Four desktop columns are no longer an unresolved alternative.
- A one-of-one garment shows a read-only size such as **Waist 32**, with measurements. It has no size dropdown or quantity above one. A future repeatable item may expose only variants with real inventory.
- White theme and roomy placement are approved. Exact font rendering will differ from generated lettering; spacing approval makes the implementation values reviewable before code.

## Standalone image source

[Development image assets](implementation-assets/placeholders/README.md) provide a separate campaign photograph and three isolated product photographs. All are generated placeholders. The manifest requires a visible AI-generated-placeholder label in the application and excludes them from real purchasable stock. Real product photos, motifs and measurements must replace them before real catalogue publication. These images resolve the missing local image source; they do not finalise the brand's actual garment designs.

## P1.01 acceptance gate

The owner approved the measurement table before application code started. P1.01 created the tokens file first, P1.03 installed and verified the fonts, and the local shell has had initial responsive checks. Full P1.12 review remains a later task.
