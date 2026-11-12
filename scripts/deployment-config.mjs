import { resolveFirebaseRuntime } from '../src/services/firebaseConfig.js';
import { validateCloudDeployment } from '../functions/runtime-config.js';

export function selectDeployment(profiles, target, cliProject) {
  if (!['staging', 'production'].includes(target)) throw new Error('Select staging or production explicitly; the default Firebase config is emulator-only.');
  const selected = profiles?.[target];
  const peer = profiles?.[target === 'staging' ? 'production' : 'staging'];
  if (peer?.approved !== true) throw new Error('Confirm both project roles before preparing a cloud release.');
  const config = validateCloudDeployment({ ...selected, target, peerProjectId: peer.projectId });
  validateCloudDeployment({ ...peer, target: target === 'staging' ? 'production' : 'staging', peerProjectId: config.projectId });
  if (config.origin === peer.origin) throw new Error('Staging and production require different public origins.');
  if (cliProject && cliProject !== config.projectId) throw new Error('CLI project does not match the selected deployment profile.');
  const client = resolveFirebaseRuntime({ development: false, target, cloudConfig: selected.webConfig });
  if (client.config.projectId !== config.projectId) throw new Error('Browser and Functions project IDs must match.');
  return { ...config, webConfig: client.config };
}
