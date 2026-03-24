import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { HyrosClient } from '../src/client.js';

// ---------------------------------------------------------------------------
// Helper: mock globalThis.fetch with a sequence of canned responses
// ---------------------------------------------------------------------------
function mockFetch(responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>) {
  let callIndex = 0;
  return mock.method(globalThis, 'fetch', async () => {
    const resp = responses[callIndex++] ?? responses[responses.length - 1];
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: resp.status === 200 ? 'OK' : 'Error',
      headers: new Headers(resp.headers ?? {}),
      json: async () => resp.body,
      text: async () => JSON.stringify(resp.body),
    };
  });
}

/** Convenience: a valid client for most tests */
function makeClient() {
  return new HyrosClient('test-api-key', 'https://api.hyros.com/v1');
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Rate Limiter
// ═══════════════════════════════════════════════════════════════════════════
describe('Rate Limiter', () => {
  afterEach(() => {
    // Restore fetch after every test so mocks don't leak between tests
    try { (globalThis.fetch as any).mock?.restore?.(); } catch { /* no-op */ }
  });

  it('multiple rapid requests complete without error', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'ok' } }]);
    const client = makeClient();
    // Fire 5 quick requests in parallel
    await Promise.all(
      Array.from({ length: 5 }, () => client.getUserInfo()),
    );
    assert.equal(fetchMock.mock.callCount(), 5);
    fetchMock.mock.restore();
  });

  it('rate limiter does not block when under the limit', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'ok' } }]);
    const client = makeClient();
    const start = Date.now();
    // 3 requests should be well under the 25/sec limit
    await client.getUserInfo();
    await client.getUserInfo();
    await client.getUserInfo();
    const elapsed = Date.now() - start;
    // Should complete quickly — no throttle delay expected
    assert.ok(elapsed < 2000, `Expected < 2000ms, got ${elapsed}ms`);
    assert.equal(fetchMock.mock.callCount(), 3);
    fetchMock.mock.restore();
  });

  it('constructor validates HTTPS requirement', () => {
    assert.throws(
      () => new HyrosClient('key', 'http://api.hyros.com/v1'),
      { message: /must use HTTPS/i },
    );
  });

  it('constructor validates domain allowlist', () => {
    assert.throws(
      () => new HyrosClient('key', 'https://evil.example.com/v1'),
      { message: /must point to a hyros\.com domain/i },
    );
  });

  it('constructor rejects non-hyros.com domains', () => {
    assert.throws(
      () => new HyrosClient('key', 'https://not-hyros.com/v1'),
      { message: /must point to a hyros\.com domain/i },
    );
  });

  it('constructor rejects HTTP URLs', () => {
    assert.throws(
      () => new HyrosClient('key', 'http://hyros.com/v1'),
      { message: /must use HTTPS/i },
    );
  });

  it('constructor accepts hyros.com domain', () => {
    assert.doesNotThrow(() => new HyrosClient('key', 'https://hyros.com/v1'));
  });

  it('constructor accepts subdomain of hyros.com', () => {
    assert.doesNotThrow(() => new HyrosClient('key', 'https://api.hyros.com/v1'));
  });

  it('handles 25 parallel requests without throwing', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'ok' } }]);
    const client = makeClient();
    await Promise.all(
      Array.from({ length: 25 }, () => client.getUserInfo()),
    );
    assert.equal(fetchMock.mock.callCount(), 25);
    fetchMock.mock.restore();
  });

  it('sends API-Key header on every request', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'ok' } }]);
    const client = makeClient();
    await client.getUserInfo();
    const callArgs = fetchMock.mock.calls[0].arguments;
    const options = callArgs[1] as RequestInit;
    const headers = options.headers as Record<string, string>;
    assert.equal(headers['API-Key'], 'test-api-key');
    fetchMock.mock.restore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. fetchAllPages
// ═══════════════════════════════════════════════════════════════════════════
describe('fetchAllPages', () => {
  afterEach(() => {
    try { (globalThis.fetch as any).mock?.restore?.(); } catch { /* no-op */ }
  });

  it('single page (no nextPageId) returns all items', async () => {
    const client = makeClient();
    const { result, truncated } = await client.fetchAllPages(async () => ({
      result: [1, 2, 3],
    }));
    assert.deepEqual(result, [1, 2, 3]);
    assert.equal(truncated, false);
  });

  it('two pages accumulates results correctly', async () => {
    let page = 0;
    const client = makeClient();
    const { result } = await client.fetchAllPages(async () => {
      page++;
      if (page === 1) return { result: ['a', 'b'], nextPageId: 'page2' };
      return { result: ['c', 'd'] };
    });
    assert.deepEqual(result, ['a', 'b', 'c', 'd']);
    assert.equal(page, 2, 'should have fetched exactly 2 pages');
  });

  it('three pages with varying sizes', async () => {
    let page = 0;
    const client = makeClient();
    const { result } = await client.fetchAllPages(async () => {
      page++;
      if (page === 1) return { result: [1], nextPageId: 'p2' };
      if (page === 2) return { result: [2, 3, 4], nextPageId: 'p3' };
      return { result: [5, 6] };
    });
    assert.deepEqual(result, [1, 2, 3, 4, 5, 6]);
    assert.equal(page, 3, 'should have fetched exactly 3 pages');
  });

  it('empty first page returns empty result', async () => {
    const client = makeClient();
    const { result, truncated } = await client.fetchAllPages(async () => ({
      result: [],
    }));
    assert.deepEqual(result, []);
    assert.equal(truncated, false);
  });

  it('maxPages limit stops pagination', async () => {
    let page = 0;
    const client = makeClient();
    const { result, truncated } = await client.fetchAllPages(async () => {
      page++;
      // Simulate 5 pages; every page returns a nextPageId
      return { result: [page], nextPageId: `page${page + 1}` };
    }, 2);
    assert.deepEqual(result, [1, 2]);
    assert.equal(truncated, true);
  });

  it('maxPages=1 returns only first page', async () => {
    let page = 0;
    const client = makeClient();
    const { result, truncated } = await client.fetchAllPages(async () => {
      page++;
      return { result: [page * 10], nextPageId: 'next' };
    }, 1);
    assert.deepEqual(result, [10]);
    assert.equal(truncated, true);
  });

  it('truncated flag is true when more pages exist', async () => {
    let page = 0;
    const client = makeClient();
    const { truncated } = await client.fetchAllPages(async () => {
      page++;
      return { result: [page], nextPageId: 'more' };
    }, 3);
    assert.equal(truncated, true);
  });

  it('truncated flag is false when only one page exists (pageId stays undefined)', async () => {
    const client = makeClient();
    const { result, truncated } = await client.fetchAllPages(async () => ({
      result: [10, 20, 30],
      // no nextPageId — single page
    }));
    assert.deepEqual(result, [10, 20, 30]);
    // pageId is never assigned, so truncated is false
    assert.equal(truncated, false);
  });

  it('handles API error on second page gracefully (throws)', async () => {
    let page = 0;
    const client = makeClient();
    await assert.rejects(
      () =>
        client.fetchAllPages(async () => {
          page++;
          if (page === 1) return { result: [1, 2], nextPageId: 'p2' };
          throw new Error('API error on page 2');
        }),
      { message: /API error on page 2/ },
    );
  });

  it('handles undefined result from API as empty array', async () => {
    const client = makeClient();
    const { result } = await client.fetchAllPages(async () => ({
      result: undefined as unknown as number[],
    }));
    assert.deepEqual(result, []);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Retry Logic
// ═══════════════════════════════════════════════════════════════════════════
describe('Retry Logic', () => {
  afterEach(() => {
    try { (globalThis.fetch as any).mock?.restore?.(); } catch { /* no-op */ }
  });

  it('returns response on first successful attempt', async () => {
    const fetchMock = mockFetch([
      { status: 200, body: { result: { email: 'a@b.com' } } },
    ]);
    const client = makeClient();
    const res = await client.getUserInfo();
    assert.deepEqual(res, { result: { email: 'a@b.com' } });
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();
  });

  it('retries on 429 status and succeeds', async () => {
    const fetchMock = mockFetch([
      { status: 429, body: {} },
      { status: 200, body: { result: 'ok' } },
    ]);
    const client = makeClient();
    const res = await client.getUserInfo();
    assert.deepEqual(res, { result: 'ok' });
    assert.equal(fetchMock.mock.callCount(), 2);
    fetchMock.mock.restore();
  });

  it('retries on 500 status and succeeds on second attempt', async () => {
    const fetchMock = mockFetch([
      { status: 500, body: {} },
      { status: 200, body: { result: 'recovered' } },
    ]);
    const client = makeClient();
    const res = await client.getUserInfo();
    assert.deepEqual(res, { result: 'recovered' });
    assert.equal(fetchMock.mock.callCount(), 2);
    fetchMock.mock.restore();
  });

  it('gives up after MAX_RETRIES (3) attempts on retryable status', async () => {
    const fetchMock = mockFetch([
      { status: 500, body: {} },
      { status: 500, body: {} },
      { status: 500, body: {} },
    ]);
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /HTTP 500/ },
    );
    // Should have made exactly 3 attempts (MAX_RETRIES = 3)
    assert.equal(fetchMock.mock.callCount(), 3);
    fetchMock.mock.restore();
  });

  it('does NOT retry on 400 (client error)', async () => {
    const fetchMock = mockFetch([
      { status: 400, body: { message: 'bad request' } },
    ]);
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /Hyros API error: bad request/ },
    );
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();
  });

  it('does NOT retry on 403 (forbidden)', async () => {
    const fetchMock = mockFetch([
      { status: 403, body: { message: 'forbidden' } },
    ]);
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /Hyros API error: forbidden/ },
    );
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Error Handling
// ═══════════════════════════════════════════════════════════════════════════
describe('Error Handling', () => {
  afterEach(() => {
    try { (globalThis.fetch as any).mock?.restore?.(); } catch { /* no-op */ }
  });

  it('parses Hyros API error message (string format)', async () => {
    const fetchMock = mockFetch([
      { status: 422, body: { message: 'Email is required' } },
    ]);
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /Hyros API error: Email is required/ },
    );
    fetchMock.mock.restore();
  });

  it('parses Hyros API error message (array format)', async () => {
    const fetchMock = mockFetch([
      { status: 422, body: { message: ['Field A invalid', 'Field B missing'] } },
    ]);
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /Hyros API error: Field A invalid, Field B missing/ },
    );
    fetchMock.mock.restore();
  });

  it('falls back to HTTP status text when error body is not JSON', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => {
      return {
        ok: false,
        status: 418,
        statusText: "I'm a teapot",
        headers: new Headers(),
        json: async () => { throw new SyntaxError('Unexpected token'); },
        text: async () => 'not json',
      };
    });
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /HTTP 418: I'm a teapot/ },
    );
    // 418 is not retryable, so only 1 call
    assert.equal(fetchMock.mock.callCount(), 1);
    fetchMock.mock.restore();
  });

  it('handles network error (fetch throws)', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed');
    });
    const client = makeClient();
    await assert.rejects(
      () => client.getUserInfo(),
      { message: /fetch failed/ },
    );
    // Network errors are retried — should attempt MAX_RETRIES times
    assert.equal(fetchMock.mock.callCount(), 3);
    fetchMock.mock.restore();
  });

  it('encodeURIComponent on path params — deleteSale', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'deleted' } }]);
    const client = makeClient();
    await client.deleteSale('sale/123&special=true');
    const calledUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(
      calledUrl.includes('sale%2F123%26special%3Dtrue'),
      `URL should contain encoded sale ID, got: ${calledUrl}`,
    );
    fetchMock.mock.restore();
  });

  it('encodeURIComponent on path params — deleteCall', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'deleted' } }]);
    const client = makeClient();
    await client.deleteCall('call/456 with spaces');
    const calledUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(
      calledUrl.includes('call%2F456%20with%20spaces'),
      `URL should contain encoded call ID, got: ${calledUrl}`,
    );
    fetchMock.mock.restore();
  });

  it('encodeURIComponent on path params — refundOrder', async () => {
    const fetchMock = mockFetch([{ status: 200, body: { result: 'refunded' } }]);
    const client = makeClient();
    await client.refundOrder('order#999');
    const calledUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(
      calledUrl.includes('order%23999'),
      `URL should contain encoded order ID, got: ${calledUrl}`,
    );
    fetchMock.mock.restore();
  });
});
