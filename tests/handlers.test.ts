import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { readTools, handleReadTool } from '../src/tools/reads.js';
import { writeTools, handleWriteTool } from '../src/tools/writes.js';
import { compoundTools, handleCompoundTool } from '../src/tools/compound.js';

// ---------------------------------------------------------------------------
// Mock HyrosClient – records calls and returns a harmless default value
// ---------------------------------------------------------------------------

const mockClient = new Proxy({} as any, {
  get: () => async () => ({ result: [] }),
});

// ---------------------------------------------------------------------------
// 1. Read Handler Coverage
// ---------------------------------------------------------------------------

describe('Read handler coverage', () => {
  it('every readTools entry has a corresponding handler in handleReadTool', async () => {
    for (const tool of readTools) {
      // If a handler is missing handleReadTool throws "Unknown read tool: …"
      // So we call it with minimal args and expect it NOT to throw that error.
      try {
        await handleReadTool(tool.name, {}, mockClient);
      } catch (err: any) {
        assert.ok(
          !err.message.includes('Unknown read tool'),
          `No handler registered for read tool "${tool.name}"`,
        );
      }
    }
  });

  it('handleReadTool has no extra handlers beyond what readTools defines', async () => {
    // The only way to surface extra entries is to try an unknown name; it must throw.
    // Since we can't enumerate the private map, we verify the dispatch rejects unknown names.
    await assert.rejects(
      () => handleReadTool('nonexistent_tool', {}, mockClient),
      /Unknown read tool/,
    );
  });

  it('handleReadTool throws for unknown tool name', async () => {
    await assert.rejects(
      () => handleReadTool('hyros_does_not_exist', {}, mockClient),
      /Unknown read tool: hyros_does_not_exist/,
    );
  });

  it('all read tools have readOnlyHint: true', () => {
    for (const tool of readTools) {
      assert.equal(
        (tool.annotations as any)?.readOnlyHint,
        true,
        `read tool "${tool.name}" should have readOnlyHint: true`,
      );
    }
  });

  it('all read tools have additionalProperties: false', () => {
    for (const tool of readTools) {
      assert.equal(
        (tool.inputSchema as any).additionalProperties,
        false,
        `read tool "${tool.name}" should have additionalProperties: false`,
      );
    }
  });

  it('readTools count is exactly 16', () => {
    assert.equal(readTools.length, 16);
  });
});

// ---------------------------------------------------------------------------
// 2. Write Handler Coverage
// ---------------------------------------------------------------------------

describe('Write handler coverage', () => {
  it('every writeTools entry has a corresponding handler in handleWriteTool', async () => {
    for (const tool of writeTools) {
      try {
        await handleWriteTool(tool.name, {}, mockClient);
      } catch (err: any) {
        assert.ok(
          !err.message.includes('Unknown write tool'),
          `No handler registered for write tool "${tool.name}"`,
        );
      }
    }
  });

  it('handleWriteTool throws for unknown tool name', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_does_not_exist', {}, mockClient),
      /Unknown write tool: hyros_does_not_exist/,
    );
  });

  it('all write tools have annotations', () => {
    for (const tool of writeTools) {
      assert.ok(
        tool.annotations !== undefined && tool.annotations !== null,
        `write tool "${tool.name}" should have annotations`,
      );
    }
  });

  it('destructive write tools have destructiveHint: true AND readOnlyHint: false', () => {
    const destructiveNames = ['hyros_refund_order', 'hyros_delete_sale', 'hyros_delete_call'];
    for (const name of destructiveNames) {
      const tool = writeTools.find((t) => t.name === name);
      assert.ok(tool, `expected to find write tool "${name}"`);
      assert.equal(
        (tool!.annotations as any)?.destructiveHint,
        true,
        `"${name}" should have destructiveHint: true`,
      );
      assert.equal(
        (tool!.annotations as any)?.readOnlyHint,
        false,
        `"${name}" should have readOnlyHint: false`,
      );
    }
  });

  it('non-destructive write tools have readOnlyHint: false', () => {
    const destructiveNames = new Set(['hyros_refund_order', 'hyros_delete_sale', 'hyros_delete_call']);
    for (const tool of writeTools) {
      if (destructiveNames.has(tool.name)) continue;
      assert.equal(
        (tool.annotations as any)?.readOnlyHint,
        false,
        `non-destructive write tool "${tool.name}" should have readOnlyHint: false`,
      );
    }
  });

  it('writeTools count is exactly 17', () => {
    assert.equal(writeTools.length, 17);
  });
});

// ---------------------------------------------------------------------------
// 3. Compound Handler Coverage
// ---------------------------------------------------------------------------

describe('Compound handler coverage', () => {
  it('every compound tool has readOnlyHint: true', () => {
    for (const tool of compoundTools) {
      assert.equal(
        (tool.annotations as any)?.readOnlyHint,
        true,
        `compound tool "${tool.name}" should have readOnlyHint: true`,
      );
    }
  });

  it('handleCompoundTool throws for unknown tool name', async () => {
    await assert.rejects(
      () => handleCompoundTool('hyros_does_not_exist', {}, mockClient),
      /Unknown compound tool: hyros_does_not_exist/,
    );
  });

  it('compoundTools count is exactly 5', () => {
    assert.equal(compoundTools.length, 5);
  });

  it('every compoundTools entry has a corresponding handler in handleCompoundTool', async () => {
    for (const tool of compoundTools) {
      try {
        await handleCompoundTool(tool.name, {}, mockClient);
      } catch (err: any) {
        assert.ok(
          !err.message.includes('Unknown compound tool'),
          `No handler registered for compound tool "${tool.name}"`,
        );
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Total Tool Registration
// ---------------------------------------------------------------------------

describe('Total tool registration', () => {
  const allTools = [...readTools, ...writeTools, ...compoundTools];

  it('total tool count across all three modules equals 38', () => {
    assert.equal(allTools.length, 38);
  });

  it('no duplicate tool names across all modules', () => {
    const names = allTools.map((t) => t.name);
    const uniqueNames = new Set(names);
    assert.equal(
      uniqueNames.size,
      names.length,
      `Found duplicate tool names: ${names.filter((n, i) => names.indexOf(n) !== i).join(', ')}`,
    );
  });

  it('all tools have unique names', () => {
    const seen = new Map<string, string>();
    for (const tool of allTools) {
      assert.ok(
        !seen.has(tool.name),
        `Tool name "${tool.name}" appears in multiple modules`,
      );
      seen.set(tool.name, tool.name);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Input Validation in Handlers
// ---------------------------------------------------------------------------

describe('Input validation in handlers', () => {
  it('hyros_get_lead_journey throws without ids', async () => {
    await assert.rejects(
      () => handleReadTool('hyros_get_lead_journey', {}, mockClient),
      /Missing or invalid required parameter: ids/,
    );
  });

  it('hyros_get_ads throws without integrationType', async () => {
    await assert.rejects(
      () => handleReadTool('hyros_get_ads', {}, mockClient),
      /Missing or invalid required parameter: integrationType/,
    );
  });

  it('hyros_get_keywords throws without adgroupId', async () => {
    await assert.rejects(
      () => handleReadTool('hyros_get_keywords', {}, mockClient),
      /Missing or invalid required parameter: adgroupId/,
    );
  });

  it('hyros_create_lead throws without email AND phoneNumbers', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_lead', {}, mockClient),
      /At least one of email or phoneNumbers must be provided/,
    );
  });

  it('hyros_update_lead throws without any search param', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_update_lead', {}, mockClient),
      /At least one search parameter \(searchEmail, searchId, or searchPhone\) must be provided/,
    );
  });

  it('hyros_create_order throws without items', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_order', { email: 'test@example.com' }, mockClient),
      /Missing or invalid required parameter: items/,
    );
  });

  it('hyros_delete_sale throws without saleId', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_delete_sale', {}, mockClient),
      /Missing or invalid required parameter: saleId/,
    );
  });

  it('hyros_create_click throws without sessionId AND email', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_click', { referrerUrl: 'https://example.com' }, mockClient),
      /At least one of sessionId or email must be provided/,
    );
  });

  it('hyros_create_subscription throws without status', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_subscription', {
        startDate: '2024-01-01T00:00:00',
        price: 29.99,
        periodicity: 'MONTH',
      }, mockClient),
      /Missing or invalid required parameter: status/,
    );
  });

  it('hyros_create_subscription throws without startDate', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_subscription', {
        status: 'ACTIVE',
        price: 29.99,
        periodicity: 'MONTH',
      }, mockClient),
      /Missing or invalid required parameter: startDate/,
    );
  });

  it('hyros_create_subscription throws without price', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_subscription', {
        status: 'ACTIVE',
        startDate: '2024-01-01T00:00:00',
        periodicity: 'MONTH',
      }, mockClient),
      /Missing or invalid required parameter: price/,
    );
  });

  it('hyros_create_subscription throws without periodicity', async () => {
    await assert.rejects(
      () => handleWriteTool('hyros_create_subscription', {
        status: 'ACTIVE',
        startDate: '2024-01-01T00:00:00',
        price: 29.99,
      }, mockClient),
      /Missing or invalid required parameter: periodicity/,
    );
  });
});
