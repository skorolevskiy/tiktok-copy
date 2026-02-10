export function truncateUrl(url, maxLen = 45) {
  return url.length > maxLen ? url.substring(0, maxLen) + '...' : url;
}

export function shortId(uuid) {
  return uuid ? uuid.substring(0, 8) + '...' : '';
}

export function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
