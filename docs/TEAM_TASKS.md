# Team management — launch hold

Owner instruction, 18 November 2026. Work on dev. Launch approval has not been given. Do not run cleanup, regenerate secrets, merge, push or release production.

| Sub-feature | Acceptance check |
| --- | --- |
| T1 — migration and break-glass | Dry run makes no changes; confirmed migration keeps both real accounts, creates membership records for all current claim holders and preserves unrelated claims/passwords. Role tool also maintains membership. Cleanup retains all membership records and real accounts. |
| T2 — live access boundary | Firestore and Storage require active membership, a matching role claim and access version. All staff callables verify active membership and revoked tokens; owner preview checks use the same guard. A still-valid suspended token fails rules and callables; reactivation requires fresh authentication. |
| T3 — trusted Team operations | Owner-only, cloud App Check, validated names/emails/roles, existing-account consent, 20 invites per UTC day, no passwords. All changes record actor/target/before/after. Serialized access changes prevent concurrent last-owner removal; incomplete Auth/Firestore updates fail closed. Setup links are returned once and never persisted/logged. |
| T4 — owner Team screen | Responsive list including last sign-in; accessible add/role/suspend/reactivate dialogs, named suspension confirmation, focus return, one-time private link and built-in Firebase reset email. Staff never get the screen. Membership listener signs suspended users out promptly. |
| T5 — owner documentation and review gate | Full check passes; migration dry run and confirmed migration precede enforcing the new boundary to avoid locking out existing owners. Deploy only reviewed rules/affected Functions and the review Hosting channel. Record evidence and wait for owner invitation/email, role, suspension/reactivation and existing-staff checks. |

Membership is the server-owned authority, backed by matching custom claims. An access-version claim prevents old tokens regaining access after reactivation. A brief pending-sync flag denies access during Auth/Firestore updates; failures leave the member blocked and recoverable through Reactivate. Permanent membership records are never deleted by Team or launch cleanup.

The owner must still reply **approved for launch** after reviewing Team on the review site. The original production checklist then applies, including checking that the wording review label disappears after the owner ticks Wording reviewed.


## Local implementation status

T1–T4 are implemented. Migration/retention tests, server/Storage membership guards, one-time invitation setup, existing-account consent, quota, owner concurrency/fail-closed recovery and accessible UI checks are covered locally. Source commits: 79b83c0, 411b773, 4cf56be, 3bcb0c6, e75e23f, b692ffe and e284e03. The final gate and hosted rollout evidence are recorded in docs/qa/team/README.md. T5 closes at the review handoff; real email/password setup and live suspension/reactivation remain owner checks. No production authorization is implied.
