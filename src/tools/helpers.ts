// Shared parameter extraction helpers to reduce duplication across tool handlers

import { optString, optNumber } from '../validation.js';

/** Extract common pagination params: pageSize, pageId */
export function extractPagination(args: Record<string, unknown>) {
  return {
    pageSize: optNumber(args, 'pageSize'),
    pageId: optString(args, 'pageId'),
  };
}

/** Extract common date range params: fromDate, toDate */
export function extractDateRange(args: Record<string, unknown>) {
  return {
    fromDate: optString(args, 'fromDate'),
    toDate: optString(args, 'toDate'),
  };
}

/** Extract date range + pagination (used by most list endpoints) */
export function extractListParams(args: Record<string, unknown>) {
  return {
    ...extractDateRange(args),
    ...extractPagination(args),
  };
}
