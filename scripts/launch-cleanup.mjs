import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { permanentTeamEmails, memberAudit } from '../functions/team-membership.js';
import { withTeamLock, protectLastOwner } from '../functions/team-lock.js';
import { getStorage } from 'firebase-admin/storage';

const cloudProject = 'night-in-kampala';
const demoProject = 'demo-night-in-kampala';
const cleanupProject = 'demo-night-in-kampala-cleanup';
const localHosts = {
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1:9199',
};
const editorial = ['collections', 'events', 'lookbooks', 'pages'];
const mediaPrefixes = ['product-drafts/', 'product-processed/', 'product-media/'];
const collections = ['products', 'productDrafts', 'inventory', 'contentDrafts', ...editorial,
  'orders', 'orderQueue', 'orderPhones', 'orderPhoneBlocks', 'orderSources', 'manualSales', 'auditLogs',
  'catalogueSizes', 'catalogueSizeCounts'];

function target(args, env) {
  const hosts = Object.entries(localHosts);
  const local = hosts.some(([name]) => env[name] !== undefined) || env.STORAGE_EMULATOR_HOST !== undefined;
  if (local && (!hosts.every(([name, host]) => env[name] === host)
    || (env.STORAGE_EMULATOR_HOST !== undefined && env.STORAGE_EMULATOR_HOST !== 'http://127.0.0.1:9199'))) {
    throw new Error('Cleanup with emulators requires all three approved loopback endpoints.');
  }
  if (!local && !args.project) throw new Error('An explicit --project is required without the emulators.');
  const project = args.project || demoProject;
  if (local ? ![demoProject, cleanupProject].includes(project) : project !== cloudProject) {
    throw new Error('The explicit project does not match this cleanup environment.');
  }
  if ([env.GCLOUD_PROJECT, env.GOOGLE_CLOUD_PROJECT].some(value => value && value !== project)) {
    throw new Error('An ambient project does not match the cleanup project.');
  }
  if (args.execute && args.confirm !== `DELETE TEST DATA FOR ${project}`) {
    throw new Error(`Execution requires --confirm "DELETE TEST DATA FOR ${project}".`);
  }
  if (!args.execute && args.confirm !== undefined) throw new Error('--confirm requires --execute.');
  const bucketName = local ? `${project}.appspot.com` : `${project}.firebasestorage.app`;
  return { project, local, bucketName };
}

function marked(snapshot) {
  const data = snapshot.data();
  return data.isTestData === true || data.fixture === true;
}

async function testAccounts(auth) {
  const accounts = [];
  let next;
  do {
    const page = await auth.listUsers(1000, next);
    const markedUsers = page.users.filter(user => user.customClaims?.testAccount === true);
    if (markedUsers.some(user => permanentTeamEmails.has(user.email?.toLowerCase()))) throw new Error('A permanent real account has a test marker. Cleanup refuses to remove it.');
    accounts.push(...markedUsers.map(user => user.uid));
    next = page.pageToken;
  } while (next);
  return accounts.sort();
}

function editorialKey(draft) {
  const { collection, slug } = draft.data();
  if (editorial.includes(collection) && typeof slug === 'string') return `${collection}/${slug}`;
  return draft.id.replace('--', '/');
}

function sizeIds(products) {
  return new Set(products.flatMap(product => (product.data().requestableSizes ?? []).map(size => size.id)));
}

async function plan(db, auth, bucket) {
  const [snapshots, requestLedger, photoLedger, accounts, media] = await Promise.all([
    Promise.all(collections.map(async name => [name, (await db.collection(name).get()).docs])),
    db.collectionGroup('requests').get(),
    db.collectionGroup('photos').get(),
    testAccounts(auth),
    Promise.all(mediaPrefixes.map(prefix => bucket.getFiles({ prefix }).then(([files]) => files))),
  ]);
  const data = Object.fromEntries(snapshots);
  const blockers = new Set();
  const candidateProducts = data.products.filter(row => marked(row) || row.data().isRealCatalogueStock === false);
  const candidateSlugs = new Set(candidateProducts.map(row => row.id));
  // Preview historically marked every new draft. Actual staff photographs must
  // never become deletion candidates merely because of that old default or an
  // approval that has not happened yet. Ambiguous test markers need review.
  const protectedDrafts = data.productDrafts.filter(row => row.data().photos?.some(photo => photo.kind === 'photograph')
    && (marked(row) || candidateSlugs.has(row.id)));
  const protectedSlugs = new Set(protectedDrafts.map(row => row.id));
  for (const row of protectedDrafts) {
    if (marked(row) || candidateProducts.some(product => product.id === row.id && marked(product))) {
      blockers.add(`Photographed draft has a test marker; review and retain genuine work: ${row.ref.path}`);
    }
  }
  const testProducts = candidateProducts.filter(row => !protectedSlugs.has(row.id));
  const testSlugs = new Set(testProducts.map(row => row.id));
  const retainedProducts = data.products.filter(row => !testSlugs.has(row.id));
  const retainedSlugs = new Set([...retainedProducts.map(row => row.id), ...protectedSlugs]);
  const drafts = data.productDrafts.filter(row => !protectedSlugs.has(row.id) && (marked(row) || testSlugs.has(row.id)));
  const keptUnpublished = { firestore: [], storage: [] };
  keptUnpublished.firestore.push(...[...data.productDrafts, ...data.products, ...data.inventory]
    .filter(row => protectedSlugs.has(row.id)).map(row => row.ref.path));
  for (const row of drafts) {
    if (retainedSlugs.has(row.id)) blockers.add(`Retained product has a marked draft: ${row.id}`);
    testSlugs.add(row.id);
  }

  const content = editorial.flatMap(name => data[name]);
  const testContent = content.filter(row => marked(row) || row.data().illustrative === true);
  const testContentPaths = new Set(testContent.map(row => row.ref.path));
  const retainedContent = content.filter(row => !testContentPaths.has(row.ref.path));
  const retainedContentPaths = new Set(retainedContent.map(row => row.ref.path));
  const editorialDrafts = data.contentDrafts.filter(row => marked(row) || testContentPaths.has(editorialKey(row)));
  const publicContentPaths = new Set(content.map(row => row.ref.path));
  keptUnpublished.firestore.push(...data.contentDrafts.filter(row => !editorialDrafts.includes(row)
    && !publicContentPaths.has(editorialKey(row))).map(row => row.ref.path));
  keptUnpublished.firestore.push(...data.productDrafts.filter(row => !drafts.includes(row)
    && !retainedSlugs.has(row.id)).map(row => row.ref.path));
  for (const row of editorialDrafts) {
    if (retainedContentPaths.has(editorialKey(row))) blockers.add(`Retained content has a marked draft: ${row.id}`);
  }
  for (const row of retainedContent) {
    const { coverProductId, productIds = [] } = row.data();
    if ([coverProductId, ...productIds].some(slug => testSlugs.has(slug))) {
      blockers.add(`Retained content links to test stock: ${row.ref.path}`);
    }
  }

  const orders = data.orders.filter(row => marked(row) || (row.data().items ?? [])
    .some(line => line.isRealCatalogueStock === false || (line.isRealCatalogueStock !== true && testSlugs.has(line.slug))));
  const testOrders = new Set(orders.map(row => row.id));
  const retainedOrders = data.orders.filter(row => !testOrders.has(row.id));
  const retainedOrderIds = new Set(retainedOrders.map(row => row.id));
  const testPhones = new Set(orders.map(row => row.data().phoneKey).filter(Boolean));
  const retainedPhones = new Set(retainedOrders.map(row => row.data().phoneKey).filter(Boolean));
  for (const row of retainedOrders) {
    if ((row.data().items ?? []).some(line => testSlugs.has(line.slug))) {
      blockers.add(`Retained order links to test stock: ${row.ref.path}`);
    }
  }
  for (const row of orders) {
    if ((row.data().items ?? []).some(line => retainedSlugs.has(line.slug))) {
      blockers.add(`Order cleanup could affect retained stock: ${row.ref.path}`);
    }
    if (retainedPhones.has(row.data().phoneKey)) blockers.add(`Order shares phone accounting with a retained order: ${row.ref.path}`);
  }

  const testSizes = sizeIds(testProducts);
  const retainedSizes = sizeIds(retainedProducts);
  for (const size of testSizes) if (retainedSizes.has(size)) blockers.add(`Size counter is shared with retained stock: ${size}`);

  const stockDocs = data.inventory.filter(row => !protectedSlugs.has(row.id) && (marked(row) || testSlugs.has(row.id)));
  for (const row of stockDocs) if (retainedSlugs.has(row.id)) blockers.add(`Retained product has test inventory: ${row.id}`);
  const manualSales = data.manualSales.filter(row => marked(row) || testSlugs.has(row.data().slug));
  for (const row of manualSales) {
    if (retainedSlugs.has(row.data().slug)) blockers.add(`Manual sale cleanup could affect retained stock: ${row.ref.path}`);
  }
  const audit = data.auditLogs.filter(row => {
    const { orderId, productId, collection, slug } = row.data();
    return marked(row) || testOrders.has(orderId) || testSlugs.has(productId) || testContentPaths.has(`${collection}/${slug}`);
  });
  const isTestRequest = row => {
    const [parent, slug, group, id, ...extra] = row.ref.path.split('/');
    return parent === 'orderRequests' && group === 'requests' && !extra.length && (testSlugs.has(slug) || testOrders.has(id));
  };
  const isTestPhoto = row => {
    const [parent, slug, group, , ...extra] = row.ref.path.split('/');
    const eligible = parent === 'productPhotoSources' && group === 'photos' && !extra.length;
    if (eligible && protectedSlugs.has(slug)) { keptUnpublished.firestore.push(row.ref.path); return false; }
    if (eligible && !marked(row) && !testSlugs.has(slug) && !retainedSlugs.has(slug)) keptUnpublished.firestore.push(row.ref.path);
    return eligible && (marked(row) || testSlugs.has(slug));
  };
  const orderPhones = data.orderPhones.filter(row => !retainedOrders.length || (testPhones.has(row.id) && !retainedPhones.has(row.id)));
  const phoneBlocks = data.orderPhoneBlocks.filter(row => !retainedOrders.length
    || (testOrders.has(row.data().orderId) && !retainedPhones.has(row.id)));

  // Remove dependants first. A retry can still identify their owning product and order.
  const docs = [
    ...audit, ...manualSales, ...requestLedger.docs.filter(isTestRequest), ...photoLedger.docs.filter(isTestPhoto),
    ...orderPhones, ...phoneBlocks, ...(!retainedOrders.length ? data.orderSources : []),
    ...data.orderQueue.filter(row => testOrders.has(row.id) || (marked(row) && !retainedOrderIds.has(row.id))),
    ...[...data.catalogueSizes, ...data.catalogueSizeCounts].filter(row => !retainedSizes.has(row.id)
      && (!retainedProducts.length || testSizes.has(row.id))),
    ...stockDocs, ...editorialDrafts, ...testContent, ...orders, ...drafts, ...testProducts,
  ];

  const objects = [];
  for (const file of media.flat()) {
    const [, slug, tail] = file.name.split('/');
    if (!slug || !tail) continue;
    const isMarked = file.metadata.metadata?.nikTestData === 'true';
    if (retainedSlugs.has(slug)) {
      if (protectedSlugs.has(slug)) keptUnpublished.storage.push(file.name);
      if (isMarked) blockers.add(`Retained product has marked media: ${file.name}`);
      continue;
    }
    if (!isMarked && !testSlugs.has(slug)) {
      keptUnpublished.storage.push(file.name);
      continue;
    }
    if (!file.metadata.generation) blockers.add(`Object generation unavailable: ${file.name}`);
    objects.push(file);
  }
  const memberships = accounts.length ? await db.getAll(...accounts.map(uid => db.doc(`staffMembers/${uid}`))) : [];
  return { docs, accounts, objects, keptUnpublished, membershipChanges: memberships.filter(row => row.exists).map(row => row.ref.path).sort(), blockers: [...blockers].sort() };
}

async function remove(db, auth, { docs, accounts, objects }) {
  // Object and document preconditions detect changes after the inventory read.
  for (const file of objects) {
    await file.delete({ ifGenerationMatch: file.metadata.generation, ignoreNotFound: true });
  }
  for (let offset = 0; offset < docs.length; offset += 400) {
    const batch = db.batch();
    for (const doc of docs.slice(offset, offset + 400)) batch.delete(doc.ref, { lastUpdateTime: doc.updateTime });
    await batch.commit();
  }
  for (const uid of accounts) {
    await withTeamLock(db, { uid: 'operator:launch-cleanup', operator: true }, async () => {
      const user = await auth.getUser(uid);
      if (user.customClaims?.testAccount !== true || permanentTeamEmails.has(user.email?.toLowerCase())) throw new Error(`Test account marking changed or real account protected: ${uid}`);
      // Retain names/history, but never leave an active membership behind an
      // Auth deletion: old ID tokens can otherwise outlive the deleted account.
      await db.runTransaction(async tx => {
        const ref = db.doc(`staffMembers/${uid}`), previous = (await tx.get(ref)).data();
        if (!previous) return;
        const next = { ...previous, status: 'suspended', accessPending: false, accessVersion: (previous.accessVersion ?? 0) + 1 };
        await protectLastOwner(tx, db, previous, next);
        tx.update(ref, { status: next.status, accessPending: false, accessVersion: next.accessVersion,
          suspendedAt: FieldValue.serverTimestamp(), suspendedBy: 'operator:launch-cleanup', updatedAt: FieldValue.serverTimestamp(), updatedBy: 'operator:launch-cleanup' });
        tx.create(db.collection('auditLogs').doc(), { action: 'staff-test-account-cleanup', actorUid: 'operator:launch-cleanup', targetUid: uid,
          before: memberAudit(previous), after: memberAudit(next), at: FieldValue.serverTimestamp() });
      });
      await auth.revokeRefreshTokens(uid);
      await auth.deleteUser(uid);
    });
  }
}

async function main() {
  const { values: args } = parseArgs({ options: {
    project: { type: 'string' }, execute: { type: 'boolean' }, confirm: { type: 'string' },
  } });
  const { project, local, bucketName } = target(args, process.env);
  if (local) process.env.METADATA_SERVER_DETECTION = 'none';
  const app = initializeApp({ projectId: project });
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);
    const candidates = await plan(db, auth, getStorage(app).bucket(bucketName));
    const report = {
      project, bucket: bucketName, mode: args.execute ? 'execute' : 'dry-run', generatedAt: new Date().toISOString(),
      firestore: candidates.docs.map(row => row.ref.path).sort(), auth: candidates.accounts,
      storage: candidates.objects.map(file => file.name).sort(), blockers: candidates.blockers,
      membershipChanges: candidates.membershipChanges,
      keptUnpublished: {
        firestore: candidates.keptUnpublished.firestore.sort(),
        storage: candidates.keptUnpublished.storage.sort(),
      },
    };
    const directory = new URL('../.cache/', import.meta.url);
    const file = new URL(`launch-cleanup-${project}.json`, directory);
    await mkdir(directory, { recursive: true });
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.log(JSON.stringify(report, null, 2));
    console.log(`Cleanup inventory saved to ${fileURLToPath(file)}`);
    if (!args.execute) return;
    if (candidates.blockers.length) throw new Error('Resolve every reported blocker before executing cleanup.');
    await remove(db, auth, candidates);
    console.log('Cleanup completed. Run a fresh dry run to verify the result.');
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error(`Cleanup stopped: ${error.message}`);
  process.exitCode = 1;
});
