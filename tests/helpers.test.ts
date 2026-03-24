import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPagination, extractDateRange, extractListParams } from '../src/tools/helpers.js';

describe('extractPagination', () => {
  it('extracts pageSize and pageId', () => {
    assert.deepEqual(extractPagination({ pageSize: 50, pageId: 'abc' }), {
      pageSize: 50,
      pageId: 'abc',
    });
  });

  it('returns undefined for missing params', () => {
    assert.deepEqual(extractPagination({}), {
      pageSize: undefined,
      pageId: undefined,
    });
  });
});

describe('extractDateRange', () => {
  it('extracts fromDate and toDate', () => {
    assert.deepEqual(extractDateRange({ fromDate: '2024-01-01', toDate: '2024-01-31' }), {
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
    });
  });

  it('returns undefined for missing params', () => {
    assert.deepEqual(extractDateRange({}), {
      fromDate: undefined,
      toDate: undefined,
    });
  });
});

describe('extractListParams', () => {
  it('combines date range and pagination', () => {
    const result = extractListParams({
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      pageSize: 100,
      pageId: 'xyz',
    });
    assert.deepEqual(result, {
      fromDate: '2024-01-01',
      toDate: '2024-01-31',
      pageSize: 100,
      pageId: 'xyz',
    });
  });
});
