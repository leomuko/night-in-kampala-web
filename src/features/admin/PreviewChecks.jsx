import { useState } from 'react';
import { getFirebaseRuntime } from '../../services/firebaseApp.js';
import { Button, Field } from '../../components/UI.jsx';
import { runPreviewCheck } from './previewCheckClient.js';

export default function PreviewChecks() {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const runtime = getFirebaseRuntime();
  if (runtime.mode !== 'cloud' || runtime.target !== 'preview') return null;

  async function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try { setResult(await runPreviewCheck({ slug: fields.get('slug').trim(), phone: fields.get('phone').trim(), spoof: fields.has('spoof') })); }
    catch (error) { setResult({ error: error.message }); }
    finally { setBusy(false); }
  }
  return <section className="staff-panel stack">
    <h2>Preview connection checks</h2>
    <p>Owner verification on test stock. Leave the piece ID blank to check attestation while ordering is paused.</p>
    <form className="stack staff-form" onSubmit={submit}>
      <Field label="Test piece ID" name="slug" />
      <Field label="Test phone" name="phone" defaultValue="+447700900100" />
      <label className="radio-row"><input type="checkbox" name="spoof" />Add spoofed forwarding prefix</label>
      <Button disabled={busy} type="submit">{busy ? 'Checking…' : 'Run preview check'}</Button>
    </form>
    {result && <output className="stack" aria-live="polite">
      {result.appCheckTokenIssued && <p>App Check token issued.</p>}
      {result.appVerified && <p>Server verified the app.</p>}
      {result.reference && <p>Test order {result.reference}</p>}
      {result.source && <p>Source {result.source.fingerprint} · {result.source.count} submissions</p>}
      {(result.error || result.message) && <p>{result.error || result.message}</p>}
    </output>}
  </section>;
}
