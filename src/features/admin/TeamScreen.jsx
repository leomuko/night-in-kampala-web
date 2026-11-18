import { useCallback, useEffect, useRef, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button, Field, LoadingState, Select } from '../../components/UI.jsx';
import Dialog from '../../components/Dialog.jsx';
import { getFirebaseServices } from '../../services/firebase.js';
import { callStaff, staffError } from './catalogueAdmin.js';

export default function TeamScreen({ user }) {
  const [rows, setRows] = useState([]), [cursor, setCursor] = useState(null), [owners, setOwners] = useState(0);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null), [error, setError] = useState(''), [status, setStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState(''), [copied, setCopied] = useState(false);
  const errorRef = useRef(null), inviteSequence = useRef(0);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  const load = useCallback(async (after = null) => {
    try {
      const result = await callStaff('staffList', after ? { after } : {});
      setRows(previous => after ? [...previous, ...result.rows] : result.rows);
      setCursor(result.cursor); setOwners(result.activeOwnerCount);
    } catch (failure) { setError(staffError(failure)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    callStaff('staffList', {}).then(result => {
      if (active) { setRows(result.rows); setCursor(result.cursor); setOwners(result.activeOwnerCount); }
    }).catch(failure => { if (active) setError(staffError(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; inviteSequence.current++; };
  }, []);
  function open(value) { setError(''); setStatus(''); setCopied(false); setModal(value); }
  function close() { if (!busy) { inviteSequence.current++; setModal(null); setError(''); setEmailStatus(''); } }
  const errorMessage = error && <p ref={errorRef} tabIndex={-1} role="alert" className="field-error">{error}</p>;

  async function invite(input) {
    const sequence = ++inviteSequence.current;
    setBusy(true); setError('');
    try {
      const result = await callStaff('staffInvite', input);
      if (result.existingMember) { setError('This account is already in your team. Use its role and access actions in the list.'); return; }
      if (result.needsGrant) { setModal({ kind: 'existing', input }); return; }
      setModal({ kind: 'setup', name: input.name, setupLink: result.setupLink });
      setEmailStatus('Sending the setup email…');
      setBusy(false); // The one-time link is available even if email delivery fails.
      setLoading(true); void load();
      try {
        const { auth } = await getFirebaseServices();
        await sendPasswordResetEmail(auth, result.email, { url: new URL('/admin', window.location.origin).href });
        if (sequence === inviteSequence.current) setEmailStatus('Setup email requested. Ask the person to check their inbox and spam folder.');
      } catch { if (sequence === inviteSequence.current) setEmailStatus('The setup email could not be requested. Share the one-time link privately, or use Firebase Authentication to resend a reset email.'); }
      if (result.linkError && sequence === inviteSequence.current) setError(result.linkError);
    } catch (failure) { if (sequence === inviteSequence.current) setError(staffError(failure)); }
    finally { if (sequence === inviteSequence.current) setBusy(false); }
  }
  function add(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void invite({ name: data.get('name').trim(), email: data.get('email').trim(), role: data.get('role') });
  }
  async function change(kind, member, role) {
    setBusy(true); setError('');
    try {
      await callStaff({ role: 'staffSetRole', suspend: 'staffSuspend', reactivate: 'staffReactivate' }[kind], { uid: member.uid, ...(role ? { role } : {}) });
      setModal(null); setStatus(`${member.name}: ${kind === 'role' ? 'role updated; they must sign in again' : kind === 'suspend' ? 'access suspended; they are signed out' : 'access reactivated; they can sign in again'}.`);
      await load();
    } catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(modal.setupLink); setCopied(true); }
    catch { setError('Copy was unavailable. Select the setup link and copy it manually.'); }
  }
  const title = modal?.kind === 'add' ? 'Add team member' : modal?.kind === 'existing' ? 'Grant access to existing account'
    : modal?.kind === 'setup' ? `Set up ${modal.name}` : modal?.kind === 'role' ? `Change role for ${modal.member.name}` : `Suspend ${modal?.member.name}?`;
  return <section className="team-panel stack" aria-labelledby="team-title">
    <div className="staff-table-heading"><div><h2 id="team-title">Team</h2><p>Manage who can work in the store. Only owners can manage the team.</p></div>
      <Button onClick={() => open({ kind: 'add' })} disabled={busy}>Add member</Button></div>
    <p className="helper">Owners can manage people and settings. Staff can manage products, content and orders. Your own owner access is protected.</p>
    {!modal && errorMessage}
    {status && <p role="status">{status}</p>}
    {loading && <LoadingState>Loading team…</LoadingState>}
    {!loading && !rows.length && !error && <p>No team members to show.</p>}
    <ul className="team-list">{rows.map(member => {
      const self = member.uid === user.uid, lastOwner = member.role === 'owner' && member.status === 'active' && owners <= 1;
      return <li key={member.uid}><article className="team-member" aria-labelledby={`member-${member.uid}`}>
        <div><h3 id={`member-${member.uid}`}>{member.name}</h3><p>{member.email}</p>{self && <p className="helper">Your account · protected</p>}</div>
        <dl className="team-member-meta">
          <div><dt>Role</dt><dd>{member.role === 'owner' ? 'Owner' : 'Staff'}</dd></div>
          <div><dt>Status</dt><dd>{member.status === 'active' && !member.accessPending ? 'Active' : 'Suspended'}</dd></div>
          <div><dt>Last sign-in</dt><dd>{member.authMissing ? 'Account unavailable' : member.lastSignInAt ? new Date(member.lastSignInAt).toLocaleString() : 'Not yet signed in'}</dd></div>
        </dl>
        {member.accessPending && <p className="helper">An access update did not finish. This member is blocked. Reactivate to retry safely.</p>}
        {member.authMissing && <p className="helper">The Auth account is unavailable. This record stays here to preserve its history.</p>}
        <div className="staff-actions">
          <Button variant="secondary" aria-label={`Change role for ${member.name}`} disabled={busy || self || lastOwner || member.authMissing || member.accessPending} onClick={() => open({ kind: 'role', member })}>Change role</Button>
          {member.status === 'active' && !member.accessPending
            ? <Button variant="secondary" aria-label={`Suspend ${member.name}`} disabled={busy || self || lastOwner || member.authMissing} onClick={() => open({ kind: 'suspend', member })}>Suspend</Button>
            : <Button variant="secondary" aria-label={`Reactivate ${member.name}`} disabled={busy || member.authMissing} onClick={() => change('reactivate', member)}>Reactivate</Button>}
        </div>
      </article></li>;
    })}</ul>
    {cursor && <Button variant="secondary" disabled={loading || busy} onClick={() => { setLoading(true); void load(cursor); }}>Load more members</Button>}
    <Button variant="secondary" disabled={loading || busy} onClick={() => { setError(''); setLoading(true); void load(); }}>Refresh team</Button>
    {modal && <Dialog key={modal.kind} open onClose={close} title={title} className="team-dialog">
      {errorMessage}
      {modal.kind === 'add' && <form className="stack" onSubmit={add}>
        <Field label="Name" name="name" autoComplete="name" maxLength={100} required />
        <Field label="Email" name="email" type="email" autoComplete="email" maxLength={254} required />
        <Select label="Role" name="role" defaultValue="staff"><option value="staff">Staff</option><option value="owner">Owner</option></Select>
        <p className="helper">No password is created here. They choose their own password using the setup email or private link.</p>
        <Button type="submit" disabled={busy}>Add member</Button>
      </form>}
      {modal.kind === 'existing' && <div className="stack"><p>{modal.input.email} already has an account. Grant it {modal.input.role} access? This uses the same account and asks them to sign in again.</p>
        <Button disabled={busy} onClick={() => invite({ ...modal.input, grantExisting: true })}>Grant access to existing account</Button></div>}
      {modal.kind === 'setup' && <div className="stack"><p role="status">{emailStatus}</p>
        {modal.setupLink && <><p>This link is shown once. Copy it privately before closing. It lets this person choose a password and expires.</p>
          <Field label="One-time setup link" value={modal.setupLink} readOnly autoComplete="off" spellCheck={false} />
          <Button onClick={copyLink} aria-label="Share privately; it expires">Share privately; it expires</Button>
          {copied && <p role="status">Setup link copied. Share it only with this person.</p>}</>}
        <Button variant="secondary" onClick={close}>Done</Button></div>}
      {modal.kind === 'role' && <form className="stack" onSubmit={event => { event.preventDefault(); void change('role', modal.member, new FormData(event.currentTarget).get('role')); }}>
        <p>Change access for {modal.member.name} ({modal.member.email}). They must sign in again after the change.</p>
        <Select label="New role" name="role" defaultValue={modal.member.role}><option value="staff">Staff</option><option value="owner">Owner</option></Select>
        <Button type="submit" disabled={busy}>Save role</Button></form>}
      {modal.kind === 'suspend' && <div className="stack"><p>{modal.member.name} ({modal.member.email}) will be signed out at once and blocked until you reactivate access.</p>
        <Button disabled={busy} onClick={() => change('suspend', modal.member)}>Suspend {modal.member.name}</Button></div>}
      {modal.kind !== 'setup' && <Button variant="secondary" disabled={busy} onClick={close}>Cancel</Button>}
    </Dialog>}
  </section>;
}
