export function publicIndexingEnabled(target, value) {
  if (value !== undefined && !['true', 'false'].includes(value)) throw new Error('VITE_PUBLIC_INDEXING must be true, false or unset.');
  if (value === 'true' && target !== 'production') throw new Error('Only an approved production release can enable public indexing.');
  return target === 'production' && value === 'true';
}

export function robotsForPath(path, enabled, status = 200) {
  const publicPath = /^\/(?:$|(?:shop|collections|archive|about|lookbooks|events|contact)\/?$|(?:products|collections|lookbooks|events|help)\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$)/.test(path);
  return enabled && status === 200 && publicPath ? 'index, follow' : 'noindex, nofollow';
}
