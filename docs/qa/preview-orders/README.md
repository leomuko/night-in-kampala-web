# Preview order verification

Work uses `dev` and the Hosting review channel at https://night-in-kampala--review-jrrv7tp2.web.app.

## Browser key replacement

The full new key was retrieved from the authenticated API Keys service using the key resource created on 16 November 2026. Its prefix matches the owner's masked value. Both ignored profiles now contain that key. Neither full key is in this report.

An initial file-name-only scan found the retiring key in `deployments.local.json`, `.cache/preview-web-config.json` and the previous generated bundle in `dist/assets/`. Profiles and cached SDK configuration were updated, and the preview was rebuilt. The final recursive scan included ignored files and found no remaining occurrences outside `.git`. Git history was excluded as instructed.

Only Hosting was deployed for this step. Version `83f9760afacaebb4` was released on the review channel. Existing product/event Function HTML points to the previous hashed app entry, so the generated Hosting configuration redirects that entry to the current module. HTTP checks confirmed the root, product and event bundles contain the new key and exclude the retiring key. See `key-replacement.json`. The redirect generation and path validation passed the six deployment tests, lint and the secret scan. Implementation commit is `0def621`.

Previously downloaded client bundles and historical Git/deployment versions were outside the current-file scan. The owner controls key deletion. The permanent owner account was not changed during this step.
