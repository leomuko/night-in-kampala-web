import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';

const signatures = [
  ['Google API key', /\bAIza[A-Za-z0-9_-]{35}\b/],
  ['Private key block', /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/],
  ['Service-account JSON', /"type"\s*:\s*"service_account"/],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ['Stripe secret or restricted key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{15,}\b/],
  ['AWS access key ID', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['OpenAI key', /\bsk-(?:(?:proj|svcacct)-)?[A-Za-z0-9_-]{20,}\b/],
  ['SendGrid key', /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ['Resend key', /\bre_[A-Za-z0-9]{6,}_[A-Za-z0-9]{20,}\b/],
  ['npm token', /\bnpm_[A-Za-z0-9]{36}\b/],
];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const findings = new Set();
function scan(file, source) {
  if (source.includes('\0')) return;
  for (const [kind, pattern] of signatures) {
    if (pattern.test(source)) findings.add(`${JSON.stringify(file)}: ${kind}`);
  }
}

// Include tracked files even if now ignored. Ignore local env/config files
// unless someone force-adds them. Report paths and types, never matched values.
const tracked = new Set(git('ls-files', '--cached', '-z').split('\0').filter(Boolean));
const paths = new Set([...tracked, ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)]);
for (const file of paths) {
  const info = lstatSync(file, { throwIfNoEntry: false });
  if (info?.isFile()) scan(file, readFileSync(file, 'utf8'));
}
// Inspect staged blobs that differ from the working copy as well.
const modified = git('diff', '--name-only', '--diff-filter=AM', '-z').split('\0').filter(Boolean);
for (const file of modified) {
  if (tracked.has(file)) scan(file, git('show', `:${file}`));
}
if (findings.size) {
  console.error(`Secret scan failed.\n${[...findings].sort().join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('Secret scan passed for the checkout and staged changes.');
}
