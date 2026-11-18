# Setup-link recovery review — 18 November 2026

**Launch stays on hold.** Work is on dev. No cloud cleanup, secret regeneration, merge, production Hosting release or push was run. The combined Team and recovery checks still require owner review and the exact reply **approved for launch**.

## Changes and boundaries

- Owner-only `staffSetupLink` uses the existing active-owner/revoked-token guard and cloud App Check. It checks the target's recorded status is active, including an active `accessPending` record, and serializes against suspension. It returns a fresh Firebase-generated setup link with this site's `/admin` continue URL. It does not enable Auth, change claims, clear pending access or alter a password.
- The server enforces **5 requests per member per UTC day** using private `staffSetupLimits/{uid}/days/{date}` documents. An attempt that reaches the provider can consume an allowance even if the provider fails. The audit records actor, target, time and outcome, never the URL. Suspended members are rejected before quota/generation.
- Team adds **Send new setup link** per row. Suspended members see a disabled action described by **Reactivate first**. Existing-member reinvites offer this action instead of a dead end. The one-time dialog uses the existing private-copy action, requests Firebase's built-in reset email and clears the URL on close/unmount. Passwords and links never enter browser storage or logs.
- `/admin` sign-in adds **Forgot password?**. Its labelled dialog starts with the entered email and always gives the exact same neutral response for success, missing/disabled users and provider errors. It never looks up staff membership or exposes provider error text. A best-effort browser/site cooldown permits one email request per 60 seconds; storage contains only its next-allowed timestamp and falls back to memory if unavailable. Firebase's own rate limits remain independent.

The previous accessPending field is an access-synchronization guard, not proof a person chose a password. Reset links are available for active records with that flag, as requested, but do not repair unfinished permissions. Reactivate remains the access-sync recovery route. Suspended access never becomes active through reset.

## Local verification

`npm run check` passes **195 tests**: 124 app, 17 metadata/staff guard, 7 deployment, 11 rules, 29 emulator HTTP, 6 cleanup/role/migration and 1 secret-scan test. Lint has no warnings and the build passes. [Machine-readable gate](local-gate.json).

| Check | Result | Method |
| --- | --- | --- |
| Owner-only setup endpoint | PASS — emulator | Non-owner staff receive 403; unauthenticated requests rejected |
| Active + accessPending eligibility | PASS — emulator/UI | Five fresh links returned while pending remains unchanged; no claims or status update |
| Per-member quota | PASS — emulator/UI | Fifth accepted, sixth rejected with clear quota text; UI focuses the quota error |
| Suspended member gets no new link | PASS — emulator/UI | Server failed-precondition says Reactivate first, even after quota reached; row action disabled with accessible hint |
| Reset cannot reactivate suspended account | PASS — emulator | Generate while active, suspend, consume the prior reset code: reset succeeds but Auth stays disabled, membership stays suspended and sign-in returns USER_DISABLED |
| One-time code | PASS — emulator | Reusing the consumed reset code is rejected |
| URL privacy / audit | PASS — emulator/UI | Actor/target/time audits present; no action URL in membership/audits/localStorage/sessionStorage; closing dialog removes it |
| Existing member recovery | PASS — UI | Reinvite offers new setup action; same UID used without changing roles or duplicating the account |
| Email handoff | PASS — mocked SDK | Replacement link also requests the built-in email with `/admin` continue URL; real inbox delivery unverified |
| Neutral Forgot password response | PASS — UI | Same full sentence for success, user-not-found, user-disabled and network errors; provider detail never rendered |
| Browser cooldown | PASS — UI/unit | Spans email changes, dialog/page/module reload and storage errors; exactly 60 seconds permits another attempt |
| Accessibility | PASS within component scope | Labelled dialogs/fields, email and status focus, trigger focus return, disclosure state and axe structural A/AA checks |
| Physical phone / native browser / real email | PENDING OWNER | Native browser control was unavailable; no device screenshot or real inbox success is claimed |
| Approximate one-hour / older-link lifecycle | NOT ELAPSED-TIME TESTED | Requested guidance is shown; lifetime/invalidation are Firebase-managed, not simulated by an hour-long cloud test |

All password changes in tests used isolated demo Auth accounts. Neither real account's password or setup link was requested, changed or reset by the agent. Public native reset behaviour is covered without enumerating accounts. The [Firebase Auth REST reference](https://firebase.google.com/docs/reference/rest/auth#section-confirm-password-reset) documents rejection of expired/already-used codes; it does not replace the owner's real-provider check.

## Review release

Only staffSetupLink (new), staffInvite (existing-member metadata) and renderSharedLink (matching app template) are affected Functions. Rules are unchanged and are not redeployed. The existing Auth action-domain configuration, browser keys, runtime permissions and console App Check enforcement remain unchanged. Review indexing stays off and shopper ordering stays paused. Review: https://night-in-kampala--review-jrrv7tp2.web.app/admin, Hosting version **8a1da99cd70e0def**, expires **25 November 2026** (08:29 UTC / 11:29 Africa/Kampala). [hosting.json](hosting.json) confirms noindex, 200 page responses and exact served root/AdminShell hashes matching the tested build; the admin chunk contains both recovery actions and the complete neutral response. The test-product route remains 404 and bootstraps the same app. [cloud-guard.json](cloud-guard.json) confirms the new callable returns SDK UNAUTHENTICATED without App Check/Auth credentials; it does not generate a real link. Deployment/build usage may incur Firebase charges; actual charges were not measured.

## Owner combined check and stop

Refresh review `/admin`, open Team, and complete the previous invitation/role/suspension/reactivation check plus:

1. For an active member, choose **Send new setup link**. Confirm the setup email or private copied link works; keep links and passwords private. Also check the existing-member reinvite offers that action.
2. On signed-out `/admin`, try **Forgot password?**, confirm the neutral response and check the recipient's inbox/spam folder.
3. For a suspended test member, confirm the new-link action is disabled; resetting a password must not restore sign-in. Reactivate explicitly, then verify a fresh sign-in. Confirm fahkerahmed still has staff access.
4. Report the results and only then reply **approved for launch**. The original live checklist, including the Wording reviewed label check, still applies afterwards.

## Commits

| Commit | Part |
| --- | --- |
| 6e21eb3 | Server/Team setup-link recovery, quota, audit and suspended-reset tests |
| 587d872 | Neutral Forgot password, browser cooldown and accessibility/privacy tests |
| 8494897 | Plain-language recovery guide |

The final review-evidence commit follows these changes. No Git history was rewritten.
