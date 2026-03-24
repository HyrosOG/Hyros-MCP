// Extracted compound tool helpers — testable and reusable

import type { Sale } from '../types.js';

/** Timezone offset regex: +HH:MM or -HH:MM */
const TZ_OFFSET_RE = /^[+-]\d{2}:\d{2}$/;

/** Get a date range spanning a full day in ISO 8601 with timezone offset */
export function getTodayRange(date?: string, timezone = '+00:00'): { fromDate: string; toDate: string } {
  let tz = timezone;
  // Try to fix common input like "05:00" -> "+05:00" (missing sign)
  if (!TZ_OFFSET_RE.test(tz) && !tz.startsWith('+') && !tz.startsWith('-')) {
    tz = `+${tz}`;
  }
  if (!TZ_OFFSET_RE.test(tz)) {
    throw new Error(`Invalid timezone offset "${timezone}". Expected format: +HH:MM or -HH:MM (e.g., -05:00 for EST)`);
  }
  const d = date ?? new Date().toISOString().split('T')[0];
  return {
    fromDate: `${d}T00:00:00${tz}`,
    toDate: `${d}T23:59:59${tz}`,
  };
}

/** Safely sum a numeric field from an array of records */
export function sumMetric(items: Array<Record<string, unknown>>, field: string): number {
  return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
}

/** Calculate percentage change between two values, handling zero/negative previous */
export function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+inf%' : '0%';
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

type SaleRecord = Pick<Sale, 'usdPrice' | 'price'>;

/** Extract price from a sale record, preferring USD-normalised price */
export function getPrice(sale: SaleRecord): number {
  return sale.usdPrice?.price ?? sale.price?.price ?? 0;
}

/** Extract error message from a rejected PromiseSettledResult reason */
function extractReason(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

/**
 * Build an errors object from named PromiseSettledResult entries.
 * Returns undefined when all succeeded (omitting empty `errors: {}` from output).
 */
export function extractErrors(
  entries: Record<string, PromiseSettledResult<unknown>>,
): Record<string, string> | undefined {
  const errors: Record<string, string> = {};
  for (const [key, result] of Object.entries(entries)) {
    if (result.status === 'rejected') {
      errors[key] = extractReason(result.reason);
    }
  }
  return Object.keys(errors).length > 0 ? errors : undefined;
}
