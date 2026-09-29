/**
 * Centralized formatting utilities to guarantee consistency between
 * Node.js SSR and client browser hydration.
 */

export function formatNumber(value: number | string | null | undefined, fallback = '0'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return fallback;
  return num.toLocaleString('en-IN');
}

export function formatCurrency(value: number | string | null | undefined, fallback = '?0'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return fallback;
  return `?${num.toLocaleString('en-IN')}`;
}

export function formatDateTime(value: string | Date | null | undefined, fallback = 'Recent'): string {
  if (!value) return fallback;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback;
  }
}

export function formatDate(value: string | Date | null | undefined, fallback = '-'): string {
  if (!value) return fallback;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fallback;
  }
}
