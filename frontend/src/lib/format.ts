/** Formats an ISO timestamp as relative time, preserving invalid input verbatim. */
export function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const units: Array<[number, string]> = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];
  for (const [size, name] of units) {
    if (abs >= size) {
      const count = Math.floor(abs / size);
      return seconds >= 0 ? `${count} ${name}${count === 1 ? '' : 's'} ago` : `in ${count} ${name}${count === 1 ? '' : 's'}`;
    }
  }
  return 'just now';
}

/** Returns the conventional seven-character abbreviated commit identifier. */
export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Converts an uppercase change-kind value into a display label. */
export function changeLabel(kind: string): string {
  return kind.charAt(0) + kind.slice(1).toLowerCase().replace('_', ' ');
}
