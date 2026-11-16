import { resolveFirebaseRuntime } from '../src/services/firebaseConfig.js';
import { validateCloudDeployment } from '../functions/runtime-config.js';

export const liveConfirmation = 'DEPLOY LIVE night-in-kampala';

export function selectDeployment(profiles, target, cliProject, confirmation) {
  if (!['preview', 'production'].includes(target)) throw new Error('Select preview or production explicitly. The default Firebase config is emulator-only.');
  const selected = profiles?.[target];
  const config = validateCloudDeployment({ ...selected, target });
  if (cliProject && cliProject !== config.projectId) throw new Error('CLI project does not match the selected deployment profile.');
  if (target === 'production' && confirmation !== liveConfirmation) throw new Error(`Type "${liveConfirmation}" to confirm a live release.`);
  if (target === 'preview' && (typeof selected.channel !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(selected.channel)
    || selected.channel === 'live')) throw new Error('Choose a named preview channel other than live.');
  if (target === 'preview') {
    const hostname = new URL(config.origin).hostname;
    if (!hostname.startsWith(`${config.projectId}--${selected.channel}-`) || !hostname.endsWith('.web.app')
      || config.origin === profiles.production?.origin) throw new Error('Use the exact Firebase Hosting channel origin for preview.');
  }
  const client = resolveFirebaseRuntime({ development: false, target, cloudConfig: selected.webConfig });
  if (client.config.projectId !== config.projectId) throw new Error('Browser and Functions project IDs must match.');
  if (client.config.storageBucket !== 'night-in-kampala.firebasestorage.app') throw new Error('Select the approved Storage bucket.');
  return { ...config, webConfig: client.config };
}

export function checkReleaseHook(config, hook, step, cliProject) {
  if (!hook) return;
  if (cliProject !== config.projectId || !['hosting', 'backend'].includes(hook)
    || step !== (config.target === 'preview' ? `preview-${hook}` : 'production')) {
    throw new Error('Use the guarded release command for this project and channel.');
  }
}

export function releaseSteps(config) {
  const flags = ['--config', `firebase.${config.target}.generated.json`, '--project', config.projectId];
  return config.target === 'preview' ? [
    { step: 'preview-backend', args: ['deploy', ...flags, '--only', 'functions,firestore,storage'] },
    { step: 'preview-hosting', args: ['hosting:channel:deploy', config.channel, ...flags, '--no-authorized-domains'] },
  ] : [{ step: 'production', args: ['deploy', ...flags, '--only', 'functions,firestore,storage,hosting'] }];
}
