// Calendar months anchored to the original UTC day, including Jan 31 / leap years.
export function monthAt(start, offset) {
  const anchor = new Date(start);
  const result = new Date(anchor);
  result.setUTCDate(1);
  result.setUTCMonth(anchor.getUTCMonth() + offset);
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(anchor.getUTCDate(), last));
  return result.toISOString();
}
export function periodsFor(start, expiresAt, at = new Date().toISOString()) {
  if (!start || start > at) return [];
  if (expiresAt) return [{ number: 1, start, end: expiresAt }];
  const anchor = new Date(start), current = new Date(at);
  const count = (current.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + current.getUTCMonth() - anchor.getUTCMonth();
  return Array.from({ length: count + 1 }, (_, i) => ({ number: i + 1, start: monthAt(start, i), end: monthAt(start, i + 1) })).filter(p => p.start <= at);
}
