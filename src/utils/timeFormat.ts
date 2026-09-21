/**
 * Time and Duration Formatting Utilities for MacroVex 2.1 Pro
 * Canonical UTC 24-hour timestamp and duration calculation.
 */

/**
 * Formats any timestamp into canonical UTC format: YYYY-MM-DD HH:MM:SS UTC
 * Guarantees zero local/browser/server timezone dependency by strictly using UTC.
 * If timestamp is missing, non-positive, or NaN, returns 'TIMESTAMP UNAVAILABLE'.
 */
export function formatUTCDateTime(timestamp?: number | string | null): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') {
    return 'TIMESTAMP UNAVAILABLE';
  }

  // If already a valid canonical string ending with UTC, return as-is
  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (trimmed === 'TIMESTAMP UNAVAILABLE') return 'TIMESTAMP UNAVAILABLE';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC$/.test(trimmed)) {
      return trimmed;
    }
  }

  const num = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  let d: Date;

  if (!isNaN(num) && num > 0) {
    d = new Date(num);
  } else if (typeof timestamp === 'string') {
    d = new Date(timestamp);
  } else {
    return 'TIMESTAMP UNAVAILABLE';
  }

  if (isNaN(d.getTime()) || d.getTime() <= 0) {
    return 'TIMESTAMP UNAVAILABLE';
  }

  try {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const seconds = String(d.getUTCSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  } catch {
    return 'TIMESTAMP UNAVAILABLE';
  }
}

/**
 * Formats a unix epoch millisecond timestamp into canonical UTC time string: YYYY-MM-DD HH:MM:SS UTC
 * Backward compatible alias for formatUTCDateTime.
 */
export function format24HourTime(timestamp?: number | string | null): string {
  return formatUTCDateTime(timestamp);
}

/**
 * Formats duration in seconds into HH:MM:SS (e.g. 02:47:31 or 00:04:12)
 * If invalid or negative, returns '00:00:00'.
 */
export function formatDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(Number(seconds)) || Number(seconds) < 0) {
    return '00:00:00';
  }
  const totalSec = Math.floor(Number(seconds));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Formats a timestamp into full date and 24-hour time: YYYY-MM-DD HH:MM:SS UTC
 */
export function formatDate24Hour(timestamp?: number | string | null): string {
  return formatUTCDateTime(timestamp);
}

