import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { boundedText } from './catalogue-drafts.js';
import { defaultOrderSettings } from './order-model.js';

export const orderSettingsPath = 'orderSettings/config';

function integer(value, max, label) {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new HttpsError('invalid-argument', `${label} must be a whole number from 1 to ${max}.`);
  }
  return value;
}

export async function saveOrderSettings(db, data, actor) {
  if (actor.role !== 'owner') throw new HttpsError('permission-denied', 'Owner access is required.');
  const whatsappNumber = boundedText(data?.whatsappNumber, 16, 'WhatsApp number');
  if (whatsappNumber && !/^\+[1-9][0-9]{7,14}$/.test(whatsappNumber)) {
    throw new HttpsError('invalid-argument', 'Use an international number beginning with +, or leave it blank.');
  }
  const copy = Object.fromEntries(Object.keys(defaultOrderSettings.copy).map(key => [
    key, boundedText(data?.copy?.[key], 500, `${key} wording`),
  ]));
  if (Object.values(copy).some(value => !value)) throw new HttpsError('invalid-argument', 'Enter wording for collection, delivery and payment.');
  if (typeof data.copyReviewed !== 'boolean') throw new HttpsError('invalid-argument', 'Choose a wording review state.');
  const fields = {
    whatsappNumber, copy, copyReviewed: data.copyReviewed,
    overdueHours: integer(data.overdueHours, 720, 'Overdue hours'),
    openPerPhone: integer(data.openPerPhone, 20, 'Open requests per phone'),
    activePerPiece: integer(data.activePerPiece, 20, 'Active requests per phone and piece'),
    submissionsPerHour: integer(data.submissionsPerHour, 100, 'Submissions per source per hour'),
  };
  if (fields.activePerPiece > fields.openPerPhone) throw new HttpsError('invalid-argument', 'Requests per piece cannot exceed open requests per phone.');
  return db.runTransaction(async tx => {
    const path = db.doc(orderSettingsPath);
    const current = (await tx.get(path)).data() ?? defaultOrderSettings;
    if (data.revision !== current.revision) throw new HttpsError('aborted', 'Settings changed. Reopen the screen before saving.');
    const revision = current.revision + 1;
    tx.set(path, { ...fields, revision });
    tx.set(db.doc('orderPolicy/current'), { copy, copyReviewed: fields.copyReviewed });
    tx.create(db.collection('auditLogs').doc(), {
      action: 'order-settings-update', actorUid: actor.uid, revision,
      changedFields: Object.keys(fields).filter(key => JSON.stringify(fields[key]) !== JSON.stringify(current[key])),
      at: FieldValue.serverTimestamp(),
    });
    return { ...fields, revision };
  });
}
