import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

test('secret scan allows demo settings and blocks planted credentials without printing them', async () => {
  await mkdir('.cache', { recursive: true });
  const root = await mkdtemp(resolve('.cache/secret-scan-'));
  const scanner = resolve('scripts/scan-secrets.mjs');
  const run = () => spawnSync(process.execPath, [scanner], { cwd: root, encoding: 'utf8' });
  try {
    assert.equal(spawnSync('git', ['init', '-q'], { cwd: root }).status, 0);
    await writeFile(resolve(root, 'demo.json'), JSON.stringify({ apiKey: 'demo-key', projectId: 'demo-night-in-kampala' }));
    assert.equal(run().status, 0);
    const cases = [
      ['Google API key', ['AI', 'za', 'X'.repeat(34), '-'].join('')],
      ['Private key block', ['-----BEGIN', 'PRIVATE KEY-----'].join(' ')],
      ['Service-account JSON', JSON.stringify({ type: ['service', 'account'].join('_') })],
      ['GitHub token', 'ghp_' + 'x'.repeat(36)],
      ['Stripe secret or restricted key', 'sk_live_' + 'x'.repeat(24)],
    ];
    for (const [kind, planted] of cases) {
      await writeFile(resolve(root, 'planted.txt'), planted);
      const result = run();
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(kind));
      assert.ok(!result.stderr.includes(planted));
    }
    // A removed working copy can still have a credential in the index.
    await writeFile(resolve(root, 'planted.txt'), cases[0][1]);
    assert.equal(spawnSync('git', ['add', 'planted.txt'], { cwd: root }).status, 0);
    await rm(resolve(root, 'planted.txt'));
    const staged = run();
    assert.equal(staged.status, 1);
    assert.ok(staged.stderr.includes('Google API key'));
    assert.ok(!staged.stderr.includes(cases[0][1]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
