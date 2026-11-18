# Team review gate — 18 November 2026

**Setup recovery add-on:** the latest combined local gate is now 195 tests, with replacement setup links and Forgot password deployed. See [add-on evidence and current review version](../setup-recovery/README.md). The 181-test results below are the earlier Team foundation gate; owner combined review still blocks launch.

**Launch remains on hold.** Work is on dev. No cloud launch-cleanup execution, ORDER_IDENTITY_KEY regeneration, merge, push or production Hosting release has been run. The owner must complete the Team checks below before replying **approved for launch**.

## What was built

Owner-only Admin → Team lists names, emails, roles, statuses and Auth last sign-in, with paginated loading and refresh. It adds staff or owners without choosing passwords, explicitly handles an existing account, changes roles, suspends and reactivates. Suspended/historical names remain listed. One-time setup links exist only in the response/dialog; the client requests Firebase's built-in setup email. Role changes require sign-in again. An unchanged role does not end the session.

`staffMembers/{uid}` is server-owned and claims match the recorded role and access version. Private Firestore and Storage require an active synchronized member and matching claim/version. Staff callables also check token revocation; cloud adapters enforce App Check. The owner-only order preview check uses the same guard. The session listener hides cached/unverified membership and signs a connected suspended user out. Partial Auth failures remain blocked; Reactivate is the recovery action. Global serialization, self guards and a last-owner guard prevent owner lock-out races.

[Managing your team](../../MANAGING_YOUR_TEAM.md) explains the normal flow and the private-link handling. The break-glass script remains available and now updates membership as well as claims. Launch cleanup retains all membership records and real accounts. Its dry run also lists membershipChanges: before a disposable Auth account is eventually deleted, the retained membership is suspended, its access version increases and refresh tokens are revoked. Known real accounts are protected even if accidentally marked as test. This follow-up was exercised only on emulators; no cloud cleanup was run.

## Local verification

`npm run check`: **181 passing tests** — 112 app, 17 metadata/staff guard, 7 deployment, 11 rules, 27 emulator HTTP and 6 cleanup/role/migration, plus 1 secret-scan test. Lint and build pass. [Machine-readable result](local-gate.json).

| Check | Result | Evidence |
| --- | --- | --- |
| Suspended token → private Firestore | PASS, emulator | Existing valid staff/version context loses draft access immediately after membership suspension |
| Suspended token → private Storage | PASS, emulator | The same stale context cannot read a draft photo |
| Reactivation → old token | PASS, emulator | Old version remains denied by both rule sets and callables |
| Reactivation → fresh session | PASS, emulator | New version reads private Firestore/Storage and calls staffAccess successfully |
| Still-valid JWT → callable after record-only suspension | PASS, emulator | Admin verification succeeds before Auth disable/revoke; staffAccess returns permission-denied |
| Revoked/disabled Auth session | PASS, emulator | Explicit revoked-token verification and callable rejection, then fresh-session restoration |
| Staff/non-owner Team functions | PASS, emulator | All five Team endpoints reject non-owner staff; anonymous requests rejected too |
| Cloud App Check boundary | PASS, live negative check | Five Team endpoints and staffAccess return SDK UNAUTHENTICATED without App Check/Auth; cloud-app-check.json |
| Invite → choose password → sign in | PASS, emulator | Admin creates no-password account, setup OOB code is consumed on local Auth, new password signs in |
| Existing email | PASS, emulator | No grant or duplicate until explicit consent; same UID and unrelated claims retained |
| Invite limit | PASS, emulator | 20th accepted, 21st rejected without creating an account |
| Self / last-owner / concurrency guards | PASS, emulator | Self-demotion/suspension denied; break-glass last-owner demotion denied; competing owners cannot remove each other |
| Partial Auth failure | PASS, emulator | Injected provider failure blocks the member; audited Reactivate recovers safely |
| Cleanup retention and old-token safety | PASS, emulator | Membership/history retained; disposable account membership is suspended/versioned before Auth removal; permanent real accounts protected |
| Link handling | PASS, unit/integration | No setup URL in membership/audit/browser storage; closing dialog clears it; earlier email completion cannot affect a newer invite |
| Keyboard/focus/labels | PASS, component tests | Named confirmation, focus return, focus after invite-step transitions, focused errors, axe A/AA structural rules |
| Phone layout | SOURCE REVIEW + PENDING OWNER | Token-based wrapping, narrow-screen card layout and long-heading wrapping; native browser screenshot/device inspection was not available in this Team task |
| Full assistive-technology matrix | NOT RUN | No complete screen-reader/zoom/device conformance claim |
| Real setup email/private-link and suspended browser | PENDING OWNER | No real account was invited/suspended as an agent test; the owner performs this on review |

Tests ran only against demo emulators. Cloud checks were the specifically authorized migration, review deployment, domain prerequisite and read-only/unauthenticated verification. No real account password was created, changed, reset or requested by the agent.

## Cloud rollout

The dry run found exactly the permanent owner and real staff account, with no blockers. Confirmed migration ran **before** enforcing guards to avoid persistent lock-out. [migration.json](migration.json) verifies both retained UIDs/roles, active status, matching accessVersion/staffVersion 1, no test marker and no disabled Auth account. No Auth user was created by migration and neither password was changed. Refreshing the review page lets the new client fetch updated claims automatically.

Only the exact review hostname was added to Firebase Auth's authorized-domain list for the setup continue URL. [auth-domain.json](auth-domain.json) records before/after. Browser keys and console App Check enforcement were not changed. The existing Function runtime account already has its project Editor role; no new project/runtime IAM roles were granted. Firebase's normal callable deployment handles invocation transport; application access remains behind App Check and the active-owner guard.

Firestore and Storage rules and all 22 affected Functions were deployed in europe-west1. A final renderSharedLink template update keeps raw share pages on the same app filename as Hosting. Review Hosting **1d7413761399e91d** is released at https://night-in-kampala--review-jrrv7tp2.web.app, expiring **25 November 2026** (07:37 UTC / 10:37 Africa/Kampala). [hosting.json](hosting.json) verifies 200 responses with noindex on root/admin/shop/cart/delivery, exact served root/AdminShell hashes matching the final build, Team UI text in the admin chunk, and the hidden test-product 404 bootstrapping the same app. No browser screenshot is claimed; native Team/device checks remain the owner handoff. The review catalogue accepts genuine drafts, shopper ordering stays paused and noindex stays on. This is the single shared Firebase backend; live Hosting was not released. Build/deploy operations use billable services; actual charges were not measured.

## Owner review — required before launch approval

Open the review `/admin`, refresh it, choose **Team**, then:

1. Add one person. Confirm the email or copied private link lets **that person** choose their password and sign in. Keep passwords and links private; report only whether it worked.
2. Change that person's role. Suspend them while their dashboard is open and confirm they are signed out and private access is blocked. Reactivate, then confirm fresh sign-in works.
3. Confirm fahkerahmed@nightinkampala.com still has staff access.
4. Review the result and wording. Only then reply **approved for launch**.

The original Step 4 then applies: cleanup and re-inventory, new secret version, reviewed production profile, no-FF merge, guarded live release and owner-selected real order. On live, after the owner ticks Wording reviewed, verify that the public review label disappears. Indexing still stays off until separately approved.

## Focused commits

| Commit | Change |
| --- | --- |
| 065257e | Record Team launch hold and acceptance checks |
| 79b83c0 | Migration, break-glass membership and retained history |
| 411b773 | Active membership/version/revocation guards and immediate access tests |
| 4cf56be | Owner Team server actions, quota, audit and fail-closed concurrency |
| 3bcb0c6 | Owner Team screen, live session handling and accessibility tests |
| e75e23f | Preserve sessions on an unchanged role |
| b692ffe | Dialog wrapping and stale email-completion handling |
| e284e03 | Overlapping invitation email regression |
| 30e46f1 | Owner guide, permissions model and rollout instructions |
| c16a682 | Focus during invitation-step transitions |
| 44cbcf6 | Invalidate disposable memberships before future Auth cleanup; protect real accounts |

The final evidence commit follows this list. No history rewrite or push occurred.
