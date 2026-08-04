#!/usr/bin/env node
// Exercises every tool added for API v1.39 against a live account, through the
// same handlers the MCP server dispatches to. Writes are made on disposable
// records and cleaned up. Run with: node scripts/smoke-v139.mjs
import { HyrosClient } from '../dist/client.js';
import { handleReadTool } from '../dist/tools/reads.js';
import { handleWriteTool } from '../dist/tools/writes.js';

const apiKey = process.env.HYROS_SMOKE_KEY ?? process.env.HYROS_API_KEY;
if (!apiKey) {
  console.error('Set HYROS_SMOKE_KEY (or HYROS_API_KEY) before running.');
  process.exit(1);
}

const client = new HyrosClient(apiKey, process.env.HYROS_BASE_URL ?? 'https://api.hyros.com/v1');
const suffix = process.argv[2] ?? String(process.hrtime.bigint()).slice(-6);
let pass = 0;
let fail = 0;

async function check(label, fn) {
  try {
    const out = await fn();
    console.log(`  ok   ${label}`);
    pass++;
    return out;
  } catch (err) {
    console.log(`  FAIL ${label} — ${err.message}`);
    fail++;
    return undefined;
  }
}

const read = (name, args = {}) => handleReadTool(name, args, client);
const write = (name, args = {}) => handleWriteTool(name, args, client);

console.log('reads');
await check('hyros_get_tags_count', () => read('hyros_get_tags_count', { pageSize: 2 }));
await check('hyros_get_ad_accounts (no ids)', () => read('hyros_get_ad_accounts'));
await check('hyros_get_products', () => read('hyros_get_products', { pageSize: 2 }));
await check('hyros_get_custom_costs', () => read('hyros_get_custom_costs', { pageSize: 2 }));
await check('hyros_get_carts', () => read('hyros_get_carts', { pageSize: 2 }));
await check('hyros_get_webhook_subscriptions', () => read('hyros_get_webhook_subscriptions'));

console.log('new lead filters');
await check('hyros_get_leads phones', () => read('hyros_get_leads', { phones: '19995550100', pageSize: 1 }));
await check('hyros_get_leads tags', () => read('hyros_get_leads', { tags: '@no-such-tag-xyz', pageSize: 1 }));
await check('hyros_get_leads stage', () => read('hyros_get_leads', { stage: 'no-such-stage-xyz', pageSize: 1 }));
await check('hyros_get_leads updatedFromDate', () =>
  read('hyros_get_leads', { updatedFromDate: '2030-01-01T00:00:00-05:00', pageSize: 1 }));

console.log('journey');
await check('hyros_get_lead_journey rejects empty args', async () => {
  try {
    await read('hyros_get_lead_journey');
  } catch {
    return 'rejected';
  }
  throw new Error('expected a rejection');
});

console.log('webhook subscription lifecycle');
const created = await check('hyros_create_webhook_subscription', () =>
  write('hyros_create_webhook_subscription', {
    name: `zz-smoke-${suffix}`,
    targetUrl: `https://example.com/zz-smoke-${suffix}`,
    eventTypes: ['sale.refunded', 'lead.tag.removed', 'subscription.status.changed'],
  }));
const externalId = created?.result?.externalId;
if (externalId) {
  await check('hyros_delete_webhook_subscription', () =>
    write('hyros_delete_webhook_subscription', { externalId }));
  await check('subscription is gone from the list', async () => {
    const list = await read('hyros_get_webhook_subscriptions');
    if (list.result.some((s) => s.externalId === externalId)) throw new Error('still listed');
    return 'gone';
  });
}

console.log('product lifecycle (async, so reads lag the writes)');
await check('hyros_create_product', () =>
  write('hyros_create_product', { name: `zz-smoke-prod-${suffix}`, price: 1.23 }));

console.log(`\n${pass} ok, ${fail} failed`);
console.log(`Leftover to clean up if the product landed: zz-smoke-prod-${suffix}`);
process.exit(fail === 0 ? 0 : 1);
