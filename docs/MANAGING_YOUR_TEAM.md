# Managing your team

Sign in at `/admin` as an owner and choose **Team**. Staff cannot see this screen or use its server actions.

## Add someone

1. Choose **Add member**, enter their name and email, then choose Staff or Owner. Staff can work on products, content and orders. Owners can also change business settings and manage the team.
2. Choose **Add member**. If that email already has an account, explicitly choose **Grant access to existing account**. This keeps the same account instead of making a duplicate. An account already listed in Team offers **Send new setup link**, without changing its role or creating a duplicate.
3. Firebase is asked to email them a password-setup link. Ask them to check their inbox and spam folder. The screen reports whether the email request succeeded; only the recipient can confirm delivery.
4. A private setup link is also shown once. The **Share privately; it expires** button copies it. Share it only with the named person, then close the dialog. Do not put the link into a Git commit, screenshot, public chat or support report. It lets its recipient choose a password, works once and expires after about an hour. Older links stop working once this one is used. No password is chosen or stored by this screen. After setup, continue to this site's `/admin`.

If the email request fails, use the private link shown in that dialog. If no link can be generated either, access creation is reported separately from email/link failure; ask the owner to check the Auth action-domain configuration before retrying onboarding. Do not assume an email arrived because its request succeeded.

There is a limit of **20 invitation attempts per UTC day** for the whole store. Confirmed grants to existing accounts count too; merely showing the existing-account choice does not. A failed account-creation attempt can consume an allowance. Existing Team members are not duplicated.

## If someone missed or lost their setup link

As an owner, open **Team** and choose **Send new setup link** beside the person. It is available for active members, including those still waiting for first setup. The screen asks Firebase to send a new reset email and shows a fresh private copy link once. Tell the person to check their inbox and spam folder. Share the copy link only with that person; do not send passwords or private links in a test report.

The dialog says: **Works once and expires after about an hour. Older links stop working once this one is used.** Expiry and use are managed by Firebase. There is a limit of **5 new setup-link requests per member per UTC day**, shared across owners. The limit message tells you when to try again. Sending a setup link does not change the person's role or activate pending access.

For suspended members the action is disabled with **Reactivate first**. Reactivate the member before sending a new setup link. Resetting a password never reactivates a suspended account. If an access-synchronization update was interrupted, use Reactivate to repair it; a password reset alone does not repair those permissions.

The person can also open `/admin` and choose **Forgot password?**, enter their email and choose **Send reset email**. The response is always **If this email has staff access, a reset link has been sent. Check your spam folder.** It deliberately does not confirm whether an address exists, has staff access or is suspended, and does not confirm inbox delivery. Allow 60 seconds between attempts on the same browser/site; a timestamp (not the email or link) remembers that cooldown. Firebase also rate-limits reset emails.

If neither route works, the last resort is **Firebase console → Authentication → Users → Reset password**. An owner/project operator should check email delivery and action-domain configuration. The recipient still chooses their own password privately, and a reset does not remove a suspension.

## Change a role

Choose **Change role** beside that person, choose the role and save. A changed role ends their current session; they sign in again to use it. Saving the same role leaves access unchanged. You cannot demote yourself, suspend yourself, or remove the last active owner. The server enforces these checks even if someone alters the page or makes simultaneous requests.

## Suspend and reactivate

**Suspend** names the person in its confirmation and says they will be signed out at once. Confirming blocks their membership, disables their Auth account, removes their staff/owner claims and revokes refresh tokens. A connected dashboard observes the membership change and signs out. Server rules and callables deny the old token without waiting for its normal expiry. An offline browser cannot receive a live update, but cached membership never opens the dashboard and requests still require current server permission.

**Reactivate** restores the recorded role and re-enables sign-in. They must sign in again: an old token does not regain access. If an access update was interrupted, the person stays blocked and **Reactivate** retries the synchronization. Their name and history remain listed; there is no delete action.

The list shows Auth's last sign-in time. Use **Refresh team** to refresh it and **Load more members** for further pages. If an Auth account was removed outside Team, its membership record is retained as unavailable history.

## Account and audit history

Every completed access change and interrupted synchronization records the actor, target and before/after membership state. Setup links and passwords are never written to membership or audit records. The two existing real accounts stay real: `superadmin@nightinkampala.com` is the permanent owner and `fahkerahmed@nightinkampala.com` is real staff. Neither gets a test-account marker. Membership records are always retained by launch cleanup, including suspended and historical test memberships. A disposable account is blocked in its membership before its Auth account can be removed, so its old token cannot keep staff access.

The reviewed `scripts/grant-staff-role.mjs` remains an operator break-glass recovery tool. Normal team management needs neither that script nor the Firebase console. It updates both claims and membership, uses typed confirmation and preserves unrelated claims. Run it only during a controlled recovery window, not while someone else is editing Team.

## Review before launch

Launch is on hold. On the review site, the owner must:

- Add one person through Team and confirm that the setup email or private link lets them choose a password and sign in.
- Verify Send new setup link and Forgot password?, keeping setup links/passwords private.
- Change that person's role, suspend them and confirm their open dashboard signs out and cannot read private staff data, then reactivate them and confirm a fresh sign-in works.
- Confirm `fahkerahmed@nightinkampala.com` still has staff access.
- Review the launch wording and cleanup inventory. Reply **approved for launch** only after Team review is complete. No cleanup, secret regeneration, merge or production release happens before that reply.

The original live release checks then apply. After the owner ticks **Wording reviewed** in Settings, confirm on the live site that the review label disappears. Search indexing remains off until separately approved.
