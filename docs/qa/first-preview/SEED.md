# Marked preview catalogue

The preview uses the three generated products from `src/data/previewProducts.js` and editorial copy from `fixtures/emulator-data.json`. Names, illustrative prices and images were preserved. All public pieces are labelled AI-generated placeholders and remain unpurchasable.

| Firestore path | Purpose |
| --- | --- |
| `products/preview-graphic-tee` | Published illustrative tee at UGX 85,000 |
| `products/preview-painted-denim` | Published illustrative denim at UGX 160,000 |
| `products/preview-workwear-jacket` | Published illustrative jacket at UGX 220,000 |
| `collections/preview-test-drop` | Illustrative collection of the three pieces |
| `events/preview-test-event` | Existing event fixture with date, venue and photography still awaiting owner input |
| `products/preview-test-private` | Unpublished fixture for anonymous-access denial checks |
| `productDrafts/preview-test-private` | Marked draft for private-read and unpublished-media checks |

Every seeded document has `isTestData: true`. Products also have `isRealCatalogueStock: false` and `purchasable: false`. All 14 uploaded objects have `nikTestData=true` metadata. The 12 public renditions use `product-media/<slug>/preview-test-v1/`. Two unpublished objects exercise raw and versioned media denial. The existing 960px product rendition is used for the largest preview image, retaining its original resolution. Social JPEGs are 1200×630.

The seeding worker refused to overwrite existing unmarked records or objects and used document/object preconditions. A CLI-authenticated REST worker ran from the ignored `.cache/` folder after the Admin SDK rejected the initial credential adapter. No Auth accounts, orders or genuine inventory were seeded. Live verification found the three public pieces and denied the unpublished one. The seed manifest was verified against the cloud and is found by the tested cleanup markers.

The permanent owner login is retained and has no test-account claim. Its role was granted through the reviewed script after a dry run and the account-specific confirmation. The script used a temporary ADC file derived from the authenticated CLI operator. That file was removed immediately after the run. Credentials and web profiles remain outside Git.
