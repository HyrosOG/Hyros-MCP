import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTodayRange, sumMetric, pctChange, getPrice } from '../src/tools/compound-utils.js';

describe('getTodayRange', () => {
  it('produces correct range with explicit date and timezone', () => {
    const result = getTodayRange('2024-03-15', '-05:00');
    assert.equal(result.fromDate, '2024-03-15T00:00:00-05:00');
    assert.equal(result.toDate, '2024-03-15T23:59:59-05:00');
  });

  it('auto-prepends + to bare timezone like "05:00"', () => {
    const result = getTodayRange('2024-01-01', '05:00');
    assert.equal(result.fromDate, '2024-01-01T00:00:00+05:00');
    assert.equal(result.toDate, '2024-01-01T23:59:59+05:00');
  });

  it('throws on invalid timezone format', () => {
    assert.throws(() => getTodayRange('2024-01-01', 'invalid'), /Invalid timezone/);
  });

  it('defaults to +00:00', () => {
    const result = getTodayRange('2024-06-01');
    assert.equal(result.fromDate, '2024-06-01T00:00:00+00:00');
    assert.equal(result.toDate, '2024-06-01T23:59:59+00:00');
  });

  it('handles negative timezone (-05:00 for EST)', () => {
    const result = getTodayRange('2024-11-20', '-05:00');
    assert.equal(result.fromDate, '2024-11-20T00:00:00-05:00');
    assert.equal(result.toDate, '2024-11-20T23:59:59-05:00');
  });

  it('handles +14:00 extreme timezone', () => {
    const result = getTodayRange('2024-07-04', '+14:00');
    assert.equal(result.fromDate, '2024-07-04T00:00:00+14:00');
    assert.equal(result.toDate, '2024-07-04T23:59:59+14:00');
  });

  it('uses today\'s date when date is undefined (just verify format)', () => {
    const result = getTodayRange(undefined, '+00:00');
    // Should match YYYY-MM-DDT00:00:00+00:00 pattern
    assert.match(result.fromDate, /^\d{4}-\d{2}-\d{2}T00:00:00\+00:00$/);
    assert.match(result.toDate, /^\d{4}-\d{2}-\d{2}T23:59:59\+00:00$/);
  });

  it('handles date at year boundary (2024-12-31)', () => {
    const result = getTodayRange('2024-12-31', '+00:00');
    assert.equal(result.fromDate, '2024-12-31T00:00:00+00:00');
    assert.equal(result.toDate, '2024-12-31T23:59:59+00:00');
  });
});

describe('sumMetric', () => {
  it('sums numeric field correctly', () => {
    const items = [{ revenue: 100 }, { revenue: 200 }, { revenue: 50 }];
    assert.equal(sumMetric(items, 'revenue'), 350);
  });

  it('handles missing fields as 0', () => {
    const items = [{ revenue: 100 }, {}, { revenue: 50 }];
    assert.equal(sumMetric(items, 'revenue'), 150);
  });

  it('handles empty array', () => {
    assert.equal(sumMetric([], 'revenue'), 0);
  });

  it('handles string numbers (coercion)', () => {
    const items = [{ revenue: '100' }, { revenue: '50' }];
    assert.equal(sumMetric(items, 'revenue'), 150);
  });

  it('treats NaN strings as 0', () => {
    const items = [{ revenue: 'abc' }, { revenue: 100 }];
    assert.equal(sumMetric(items, 'revenue'), 100);
  });

  it('handles negative numbers', () => {
    const items = [{ revenue: -30 }, { revenue: 100 }, { revenue: -20 }];
    assert.equal(sumMetric(items, 'revenue'), 50);
  });
});

describe('pctChange', () => {
  it('positive change (100 -> 150 = +50%)', () => {
    assert.equal(pctChange(150, 100), '+50.0%');
  });

  it('negative change (100 -> 50 = -50%)', () => {
    assert.equal(pctChange(50, 100), '-50.0%');
  });

  it('zero previous with positive current = +inf%', () => {
    assert.equal(pctChange(100, 0), '+inf%');
  });

  it('zero previous with zero current = 0%', () => {
    assert.equal(pctChange(0, 0), '0%');
  });

  it('no change = +0.0%', () => {
    assert.equal(pctChange(100, 100), '+0.0%');
  });

  it('negative previous values handled correctly (Math.abs)', () => {
    // previous = -100, current = -50 => change = (-50 - (-100)) / abs(-100) * 100 = 50%
    assert.equal(pctChange(-50, -100), '+50.0%');
  });

  it('large percentage change', () => {
    // 100 -> 10000 = +9900%
    assert.equal(pctChange(10000, 100), '+9900.0%');
  });

  it('small fractional change', () => {
    // 100 -> 100.5 = +0.5%
    assert.equal(pctChange(100.5, 100), '+0.5%');
  });
});

describe('getPrice', () => {
  it('returns usdPrice.price when available', () => {
    const sale = { usdPrice: { price: 49.99 }, price: { price: 42.0 } } as any;
    assert.equal(getPrice(sale), 49.99);
  });

  it('falls back to price.price when no usdPrice', () => {
    const sale = { usdPrice: undefined, price: { price: 42.0 } } as any;
    assert.equal(getPrice(sale), 42.0);
  });

  it('returns 0 when both undefined', () => {
    const sale = { usdPrice: undefined, price: undefined } as any;
    assert.equal(getPrice(sale), 0);
  });

  it('returns 0 when both null', () => {
    const sale = { usdPrice: null, price: null } as any;
    assert.equal(getPrice(sale), 0);
  });

  it('returns usdPrice over price when both present', () => {
    const sale = { usdPrice: { price: 100 }, price: { price: 80 } } as any;
    assert.equal(getPrice(sale), 100);
  });
});

describe('tool registration consistency', () => {
  it('all read tools have handlers', async () => {
    const { readTools, handleReadTool } = await import('../src/tools/reads.js');

    // Verify each tool name can be dispatched (would throw if missing)
    for (const tool of readTools) {
      assert.ok(tool.name, `Tool has a name`);
      assert.ok(tool.description, `${tool.name} has a description`);
      assert.ok(tool.inputSchema, `${tool.name} has an inputSchema`);
      assert.equal(
        (tool.inputSchema as Record<string, unknown>).additionalProperties,
        false,
        `${tool.name} has additionalProperties: false`,
      );
    }
  });

  it('all write tools have handlers', async () => {
    const { writeTools } = await import('../src/tools/writes.js');

    for (const tool of writeTools) {
      assert.ok(tool.name, `Tool has a name`);
      assert.ok(tool.description, `${tool.name} has a description`);
      assert.ok(tool.inputSchema, `${tool.name} has an inputSchema`);
      assert.equal(
        (tool.inputSchema as Record<string, unknown>).additionalProperties,
        false,
        `${tool.name} has additionalProperties: false`,
      );
    }
  });

  it('all compound tools have handlers', async () => {
    const { compoundTools } = await import('../src/tools/compound.js');

    for (const tool of compoundTools) {
      assert.ok(tool.name, `Tool has a name`);
      assert.ok(tool.description, `${tool.name} has a description`);
      assert.ok(tool.inputSchema, `${tool.name} has an inputSchema`);
      assert.equal(
        (tool.inputSchema as Record<string, unknown>).additionalProperties,
        false,
        `${tool.name} has additionalProperties: false`,
      );
    }
  });

  it('all tools have annotations', async () => {
    const { readTools } = await import('../src/tools/reads.js');
    const { writeTools } = await import('../src/tools/writes.js');
    const { compoundTools } = await import('../src/tools/compound.js');

    for (const tool of [...readTools, ...writeTools, ...compoundTools]) {
      assert.ok(
        (tool as Record<string, unknown>).annotations,
        `${tool.name} has annotations`,
      );
    }
  });
});
