import { useEffect, useState } from 'react';
import { defaultOrderSettings } from '../../../functions/order-model.js';
import { Button, ErrorState, Field, LoadingState } from '../../components/UI.jsx';
import { getFirebaseServices } from '../../services/firebase.js';
import { callStaff, staffError } from './catalogueAdmin.js';

const limits = [
  ['overdueHours', 'Overdue threshold (hours)', 720],
  ['openPerPhone', 'Open requests per phone', 20],
  ['activePerPiece', 'Active requests per phone and piece', 20],
  ['submissionsPerHour', 'Submissions per source per hour', 100],
];

export default function OrderSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    Promise.all([getFirebaseServices(), import('firebase/firestore')]).then(async ([{ db }, sdk]) => {
      const snapshot = await sdk.getDocFromServer(sdk.doc(db, 'orderSettings', 'config'));
      if (alive) setSettings(snapshot.data() ?? defaultOrderSettings);
    }).catch(() => { if (alive) setError('Could not load order settings. Reopen Settings to retry.'); });
    return () => { alive = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setSaved(false);
    setError('');
    try {
      setSettings(await callStaff('orderSettingsSave', {
        revision: settings.revision,
        ...Object.fromEntries(limits.map(([key]) => [key, Number(form.get(key))])),
        whatsappNumber: form.get('whatsappNumber'),
        copy: Object.fromEntries(Object.keys(settings.copy).map(key => [key, form.get(key)])),
        copyReviewed: form.has('copyReviewed'),
      }));
      setSaved(true);
    } catch (failure) { setError(staffError(failure)); }
    finally { setBusy(false); }
  }

  return <section className="staff-panel stack">
    <h2>Order settings</h2>
    {error && <ErrorState>{error}</ErrorState>}
    {!settings && !error && <LoadingState />}
    {settings && <form className="stack staff-form" onSubmit={save} key={settings.revision}>
      <Field label="WhatsApp business number" name="whatsappNumber" type="tel" defaultValue={settings.whatsappNumber}
        maxLength={16} hint="Use international format. Leave blank to hide WhatsApp order buttons." />
      {limits.map(([key, label, max]) => <Field key={key} label={label} name={key} type="number" min="1" max={max}
        step="1" defaultValue={settings[key]} required />)}
      <p className="helper">Overdue flags pending work for staff. People on the same mobile network or Wi-Fi can share a connection address and its hourly allowance.</p>
      <h3>Customer-facing wording</h3>
      <p>{settings.copyReviewed ? 'Owner reviewed' : 'Provisional · owner review needed'}</p>
      {Object.entries(settings.copy).map(([key, value]) => <label key={key} className="field content-fields">
        {key[0].toUpperCase() + key.slice(1)} wording<textarea name={key} defaultValue={value} rows={3} maxLength={500} required />
      </label>)}
      <label className="radio-row"><input name="copyReviewed" type="checkbox" defaultChecked={settings.copyReviewed} />Wording reviewed</label>
      <Button type="submit" disabled={busy}>Save settings</Button>
      {saved && <p role="status">Order settings saved.</p>}
    </form>}
  </section>;
}
