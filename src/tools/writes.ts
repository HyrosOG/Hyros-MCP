import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';
import type { CartItem } from '../types.js';
import { requireString, requireNumber, requireArray, requireStringArray, optString, optNumber, optBoolean, optArray, optStringArray, requireEmailOrPhone } from '../validation.js';

export const writeTools: Tool[] = [
  {
    name: 'hyros_create_lead',
    description: 'Create a new lead in Hyros. At least one of email or phoneNumbers must be provided. If the email already exists, the lead will be updated with any new information provided.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address of the lead (required if no phone number)',
        },
        firstName: {
          type: 'string',
          description: 'First name of the lead',
        },
        lastName: {
          type: 'string',
          description: 'Last name of the lead',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tags to apply to the lead',
        },
        leadIps: {
          type: 'array',
          items: { type: 'string' },
          description: 'IP addresses of the lead (used for ad attribution)',
        },
        phoneNumbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers (required if no email)',
        },
        stage: {
          type: 'string',
          description: 'Lead funnel stage name (e.g., MQL, SQL)',
        },
        adOptimizationConsent: {
          type: 'string',
          enum: ['GRANTED', 'DENIED', 'UNSPECIFIED'],
          description: 'Ad optimization consent status',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_update_lead',
    description: 'Update an existing lead in Hyros. At least one search parameter (searchEmail, searchId, or searchPhone) must be provided. Can update email, name, tags, IPs, phone numbers, and funnel stage.',
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        searchEmail: {
          type: 'string',
          description: 'Current email to find the lead (use one of: searchEmail, searchId, or searchPhone)',
        },
        searchId: {
          type: 'string',
          description: 'Lead ID to find the lead',
        },
        searchPhone: {
          type: 'string',
          description: 'Phone number to find the lead',
        },
        email: {
          type: 'string',
          description: 'New email address',
        },
        firstName: {
          type: 'string',
          description: 'New first name',
        },
        lastName: {
          type: 'string',
          description: 'New last name',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to apply to the lead',
        },
        leadIps: {
          type: 'array',
          items: { type: 'string' },
          description: 'IP addresses to set',
        },
        phoneNumbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers to set',
        },
        adOptimizationConsent: {
          type: 'string',
          enum: ['GRANTED', 'DENIED', 'UNSPECIFIED'],
          description: 'Ad optimization consent',
        },
        leadStageName: {
          type: 'string',
          description: 'Name of the funnel stage to apply',
        },
        leadStageDate: {
          type: 'string',
          description: 'Date the lead entered this stage (ISO 8601)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_order',
    description: 'Register a new sale/order in Hyros. This creates a sale record attributed to a lead.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Customer email (required if no phoneNumbers)',
        },
        phoneNumbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Customer phone numbers (required if no email)',
        },
        items: {
          type: 'array',
          description: 'Order items (required)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Product name (min 3 chars)' },
              price: { type: 'number', description: 'Price per unit' },
              quantity: { type: 'number', description: 'Quantity (default: 1)' },
              externalId: { type: 'string', description: 'External product ID' },
              costOfGoods: { type: 'number', description: 'Cost of goods per unit' },
              taxes: { type: 'number', description: 'Taxes per unit' },
              itemDiscount: { type: 'number', description: 'Item discount' },
              tag: { type: 'string', description: 'Product tag' },
              categoryName: { type: 'string', description: 'Product category name' },
            },
            required: ['name', 'price'],
            additionalProperties: false,
          },
        },
        orderId: {
          type: 'string',
          description: 'External order ID',
        },
        date: {
          type: 'string',
          description: 'Order date in ISO 8601 format',
        },
        currency: {
          type: 'string',
          description: 'Currency code (e.g., USD)',
        },
        shipping: {
          type: 'number',
          description: 'Shipping cost',
        },
        taxes: {
          type: 'number',
          description: 'Total order taxes',
        },
        discount: {
          type: 'number',
          description: 'Total order discount',
        },
        stage: {
          type: 'string',
          description: 'Lead stage to apply',
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_refund_order',
    description: 'Process a refund for an existing order in Hyros.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to refund (required)',
        },
        refundedAmount: {
          type: 'number',
          description: 'Amount to refund (if not provided, full refund is processed)',
        },
      },
      required: ['orderId'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_update_sale',
    description: 'Update one or more sale records in Hyros. Can mark sales as recurring, refunded, or update refund amounts.',
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated sale IDs to update (max 50, required)',
        },
        isRecurringSale: {
          type: 'boolean',
          description: 'Mark sale as recurring',
        },
        isRefunded: {
          type: 'boolean',
          description: 'Mark sale as refunded',
        },
        refundedDate: {
          type: 'string',
          description: 'Refund date in ISO 8601 format',
        },
        refundedAmount: {
          type: 'number',
          description: 'Amount refunded',
        },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_delete_sale',
    description: 'Permanently delete a sale record from Hyros. This action cannot be undone.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        saleId: {
          type: 'string',
          description: 'Sale ID to delete (required)',
        },
      },
      required: ['saleId'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_call',
    description: 'Register a call event in Hyros. Used to track sales calls and attribute them to ad sources.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the call event (required)',
        },
        email: {
          type: 'string',
          description: 'Lead email',
        },
        firstName: {
          type: 'string',
          description: 'Lead first name',
        },
        lastName: {
          type: 'string',
          description: 'Lead last name',
        },
        phoneNumbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lead phone numbers',
        },
        leadIps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lead IP addresses',
        },
        stage: {
          type: 'string',
          description: 'Lead stage',
        },
        externalId: {
          type: 'string',
          description: 'External call ID',
        },
        date: {
          type: 'string',
          description: 'Call date in ISO 8601 format',
        },
        qualification: {
          type: 'boolean',
          description: 'Whether the call was qualified',
        },
        state: {
          type: 'string',
          enum: ['QUALIFIED', 'UNQUALIFIED', 'CANCELLED', 'NO_SHOW'],
          description: 'Call state',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_update_call',
    description: 'Update the qualification status or state of existing call records.',
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Call event name (required)',
        },
        ids: {
          type: 'string',
          description: 'Comma-separated call IDs to update',
        },
        externalIds: {
          type: 'string',
          description: 'Comma-separated external call IDs to update',
        },
        qualification: {
          type: 'boolean',
          description: 'Qualified status',
        },
        state: {
          type: 'string',
          enum: ['QUALIFIED', 'UNQUALIFIED', 'CANCELLED', 'NO_SHOW'],
          description: 'Call state',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_delete_call',
    description: 'Permanently delete a call record from Hyros.',
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        callId: {
          type: 'string',
          description: 'Call ID to delete (required)',
        },
      },
      required: ['callId'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_subscription',
    description: 'Register a new subscription in Hyros for recurring revenue tracking.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['ACTIVE', 'TRIALING', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID', 'COMPLETED', 'PAUSED'],
          description: 'Initial subscription status (required)',
        },
        startDate: {
          type: 'string',
          description: 'Subscription start date in ISO 8601 format (required)',
        },
        price: {
          type: 'number',
          description: 'Subscription price per period (required)',
        },
        periodicity: {
          type: 'string',
          enum: ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'],
          description: 'Billing period (required)',
        },
        email: {
          type: 'string',
          description: 'Subscriber email',
        },
        phoneNumbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Subscriber phone numbers',
        },
        firstName: {
          type: 'string',
          description: 'Subscriber first name',
        },
        lastName: {
          type: 'string',
          description: 'Subscriber last name',
        },
        stage: {
          type: 'string',
          description: 'Lead stage',
        },
        subscriptionId: {
          type: 'string',
          description: 'External subscription ID',
        },
        trialStartDate: {
          type: 'string',
          description: 'Trial start date (ISO 8601)',
        },
        trialEndDate: {
          type: 'string',
          description: 'Trial end date (ISO 8601)',
        },
        planId: {
          type: 'string',
          description: 'Plan identifier',
        },
        cancelAtDate: {
          type: 'string',
          description: 'Scheduled cancellation date (required if status is CANCELED)',
        },
      },
      required: ['status', 'startDate', 'price', 'periodicity'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_update_subscription',
    description: 'Update existing subscription records. Can change status, price, dates, and cancellation.',
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated subscription IDs to update (max 50, required)',
        },
        price: {
          type: 'number',
          description: 'New subscription price (required)',
        },
        name: {
          type: 'string',
          description: 'Subscription name',
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'TRIALING', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID', 'COMPLETED', 'PAUSED'],
          description: 'New status',
        },
        startDate: {
          type: 'string',
          description: 'New start date (ISO 8601)',
        },
        trialStartDate: {
          type: 'string',
          description: 'Trial start date (ISO 8601)',
        },
        trialEndDate: {
          type: 'string',
          description: 'Trial end date (ISO 8601)',
        },
        cancelAtDate: {
          type: 'string',
          description: 'Cancellation date (required when setting status to CANCELED)',
        },
      },
      required: ['ids', 'price'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_source',
    description: 'Create a new ad source/traffic source in Hyros for tracking custom marketing channels.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Source name (required)',
        },
        accountId: {
          type: 'string',
          description: 'Ad account ID',
        },
        adSourceId: {
          type: 'string',
          description: 'External ad source ID',
        },
        campaignId: {
          type: 'string',
          description: 'Campaign ID',
        },
        category: {
          type: 'string',
          description: 'Source category',
        },
        goal: {
          type: 'string',
          description: 'Campaign goal',
        },
        integationType: {
          type: 'string',
          enum: ['FACEBOOK', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'LINKEDIN', 'TWITTER', 'PINTEREST', 'BING'],
          description: 'Advertising platform',
        },
        isDisregard: {
          type: 'boolean',
          description: 'Whether to disregard this source in attribution',
        },
        isOrganic: {
          type: 'boolean',
          description: 'Whether this is an organic source',
        },
        trafficSource: {
          type: 'string',
          description: 'Traffic source identifier',
        },
        adspendSubType: {
          type: 'string',
          enum: ['DISPLAY', 'VIDEO'],
          description: 'Ad spend sub-type',
        },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_custom_cost',
    description: 'Add a custom ad cost in Hyros. Use this to track offline ad spend, influencer payments, or any cost not automatically tracked by Hyros integrations.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Cost start date in ISO 8601 format (required)',
        },
        frequency: {
          type: 'string',
          enum: ['DAILY', 'ONE_TIME'],
          description: 'Whether the cost is daily or one-time (required)',
        },
        cost: {
          type: 'number',
          description: 'Cost amount (required)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to associate with this cost (max 20, required)',
        },
        name: {
          type: 'string',
          description: 'Cost name/description',
        },
        endDate: {
          type: 'string',
          description: 'Cost end date for recurring costs (ISO 8601)',
        },
      },
      required: ['startDate', 'frequency', 'cost', 'tags'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_product',
    description: 'Create a new product in Hyros for sale attribution.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Product name (required)',
        },
        price: {
          type: 'number',
          description: 'Product price (required)',
        },
        category: {
          type: 'string',
          description: 'Product category name',
        },
        packages: {
          type: 'string',
          description: 'Comma-separated package names for recurring sale attribution',
        },
      },
      required: ['name', 'price'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_cart',
    description: 'Create a new cart in Hyros to track a shopping cart before it converts to an order. Use this when a lead adds items to a cart so Hyros can attribute the eventual purchase.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description: 'Cart items (required)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Product name' },
              price: { type: 'number', description: 'Price per unit' },
              quantity: { type: 'number', description: 'Quantity' },
              externalId: { type: 'string', description: 'External product ID' },
              sku: { type: 'string', description: 'Product SKU' },
            },
            required: ['name', 'price'],
            additionalProperties: false,
          },
        },
        cartId: { type: 'string', description: 'External cart ID' },
        email: { type: 'string', description: 'Customer email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        leadIps: { type: 'array', items: { type: 'string' }, description: 'Lead IP addresses' },
        phoneNumbers: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', description: 'Cart date in ISO 8601 format' },
        currency: { type: 'string', description: 'Currency code (e.g., USD)' },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_update_cart',
    description: 'Update an existing cart in Hyros. Use this to modify items or customer info on a pending cart before it converts to an order.',
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        cartId: { type: 'string', description: 'The external cart ID to update' },
        items: {
          type: 'array',
          description: 'Updated cart items',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Product name' },
              price: { type: 'number', description: 'Price per unit' },
              quantity: { type: 'number', description: 'Quantity' },
              externalId: { type: 'string', description: 'External product ID' },
              sku: { type: 'string', description: 'Product SKU' },
            },
            required: ['name', 'price'],
            additionalProperties: false,
          },
        },
        email: { type: 'string', description: 'Customer email' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        leadIps: { type: 'array', items: { type: 'string' }, description: 'Lead IP addresses' },
        phoneNumbers: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', description: 'Cart date in ISO 8601 format' },
        currency: { type: 'string', description: 'Currency code (e.g., USD)' },
      },
      required: ['cartId', 'items'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_create_click',
    description: 'Manually track a click event in Hyros for attribution purposes. Use when you need to create a click record that was not automatically tracked by the Hyros tracking script.',
    annotations: {
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        referrerUrl: { type: 'string', description: 'The URL where the click originated from (the ad or source URL)' },
        sessionId: { type: 'string', description: 'Session identifier. Either sessionId or email is required.' },
        email: { type: 'string', description: 'Lead email. Either sessionId or email is required.' },
        previousUrl: { type: 'string', description: 'Previous URL before the click' },
        userAgent: { type: 'string', description: 'Browser user agent string' },
        ip: { type: 'string', description: 'Lead IP address' },
        sourceLinkTag: { type: 'string', description: 'Source link tag (e.g., @source-name)' },
        isOrganic: { type: 'boolean', description: 'Whether this is an organic (non-paid) click' },
        integrationType: { type: 'string', description: 'Ad platform integration type (e.g., FACEBOOK, GOOGLE)' },
        adSourceId: { type: 'string', description: 'Ad source ID' },
        adspendAdId: { type: 'string', description: 'Ad spend ad ID' },
        adSourceClickId: { type: 'string', description: 'Platform click ID (e.g., Facebook fbclid)' },
        phones: { type: 'array', items: { type: 'string' }, description: 'Lead phone numbers' },
        tag: { type: 'string', description: 'Tag to apply to this click' },
        date: { type: 'string', description: 'Click date in ISO 8601 format' },
      },
      required: ['referrerUrl'],
      additionalProperties: false,
    },
  },
];

type WriteHandler = (args: Record<string, unknown>, client: HyrosClient) => Promise<unknown>;

const writeHandlers: Record<string, WriteHandler> = {
  hyros_create_lead: async (args, client) => {
    const { email, phoneNumbers } = requireEmailOrPhone(args);
    return client.createLead({
      email,
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      tags: optStringArray(args, 'tags'),
      leadIps: optStringArray(args, 'leadIps'),
      phoneNumbers,
      stage: optString(args, 'stage'),
      adOptimizationConsent: optString(args, 'adOptimizationConsent') as 'GRANTED' | 'DENIED' | 'UNSPECIFIED' | undefined,
    });
  },

  hyros_update_lead: async (args, client) => {
    const searchEmail = optString(args, 'searchEmail');
    const searchId = optString(args, 'searchId');
    const searchPhone = optString(args, 'searchPhone');
    if (!searchEmail && !searchId && !searchPhone) {
      throw new Error('At least one search parameter (searchEmail, searchId, or searchPhone) must be provided');
    }
    const leadStageName = optString(args, 'leadStageName');
    return client.updateLead(
      {
        email: searchEmail,
        id: searchId,
        phone: searchPhone,
      },
      {
        email: optString(args, 'email'),
        firstName: optString(args, 'firstName'),
        lastName: optString(args, 'lastName'),
        tags: optStringArray(args, 'tags'),
        leadIps: optStringArray(args, 'leadIps'),
        phoneNumbers: optStringArray(args, 'phoneNumbers'),
        adOptimizationConsent: optString(args, 'adOptimizationConsent') as 'GRANTED' | 'DENIED' | 'UNSPECIFIED' | undefined,
        leadStage: leadStageName
          ? { name: leadStageName, date: optString(args, 'leadStageDate') }
          : undefined,
      },
    );
  },

  hyros_create_order: async (args, client) => {
    const { email, phoneNumbers } = requireEmailOrPhone(args);
    return client.createOrder({
      items: requireArray(args, 'items') as Array<{ name: string; price: number; quantity?: number }>,
      email,
      phoneNumbers,
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      leadIps: optStringArray(args, 'leadIps'),
      orderId: optString(args, 'orderId'),
      date: optString(args, 'date'),
      currency: optString(args, 'currency'),
      shipping: optNumber(args, 'shipping'),
      taxes: optNumber(args, 'taxes'),
      discount: optNumber(args, 'discount'),
      stage: optString(args, 'stage'),
    });
  },

  hyros_refund_order: async (args, client) =>
    client.refundOrder(requireString(args, 'orderId'), optNumber(args, 'refundedAmount')),

  hyros_update_sale: async (args, client) =>
    client.updateSale({
      ids: requireString(args, 'ids'),
      isRecurringSale: optBoolean(args, 'isRecurringSale'),
      isRefunded: optBoolean(args, 'isRefunded'),
      refundedDate: optString(args, 'refundedDate'),
      refundedAmount: optNumber(args, 'refundedAmount'),
    }),

  hyros_delete_sale: async (args, client) =>
    client.deleteSale(requireString(args, 'saleId')),

  hyros_create_call: async (args, client) =>
    client.createCall({
      name: requireString(args, 'name'),
      email: optString(args, 'email'),
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      phoneNumbers: optStringArray(args, 'phoneNumbers'),
      leadIps: optStringArray(args, 'leadIps'),
      stage: optString(args, 'stage'),
      externalId: optString(args, 'externalId'),
      date: optString(args, 'date'),
      qualification: optBoolean(args, 'qualification'),
      state: optString(args, 'state'),
    }),

  hyros_update_call: async (args, client) =>
    client.updateCall({
      name: requireString(args, 'name'),
      ids: optString(args, 'ids'),
      externalIds: optString(args, 'externalIds'),
      qualification: optBoolean(args, 'qualification'),
      state: optString(args, 'state'),
    }),

  hyros_delete_call: async (args, client) =>
    client.deleteCall(requireString(args, 'callId')),

  hyros_create_subscription: async (args, client) =>
    client.createSubscription({
      status: requireString(args, 'status'),
      startDate: requireString(args, 'startDate'),
      price: requireNumber(args, 'price'),
      periodicity: requireString(args, 'periodicity') as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
      email: optString(args, 'email'),
      phoneNumbers: optStringArray(args, 'phoneNumbers'),
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      stage: optString(args, 'stage'),
      subscriptionId: optString(args, 'subscriptionId'),
      trialStartDate: optString(args, 'trialStartDate'),
      trialEndDate: optString(args, 'trialEndDate'),
      planId: optString(args, 'planId'),
      cancelAtDate: optString(args, 'cancelAtDate'),
    }),

  hyros_update_subscription: async (args, client) =>
    client.updateSubscription({
      ids: requireString(args, 'ids'),
      price: requireNumber(args, 'price'),
      name: optString(args, 'name'),
      status: optString(args, 'status'),
      startDate: optString(args, 'startDate'),
      trialStartDate: optString(args, 'trialStartDate'),
      trialEndDate: optString(args, 'trialEndDate'),
      cancelAtDate: optString(args, 'cancelAtDate'),
    }),

  hyros_create_source: async (args, client) =>
    client.createSource({
      name: requireString(args, 'name'),
      accountId: optString(args, 'accountId'),
      adSourceId: optString(args, 'adSourceId'),
      adspendSubType: optString(args, 'adspendSubType'),
      campaignId: optString(args, 'campaignId'),
      category: optString(args, 'category'),
      goal: optString(args, 'goal'),
      integationType: optString(args, 'integationType'),
      isDisregard: optBoolean(args, 'isDisregard'),
      isOrganic: optBoolean(args, 'isOrganic'),
      trafficSource: optString(args, 'trafficSource'),
    }),

  hyros_create_custom_cost: async (args, client) =>
    client.createCustomCost({
      startDate: requireString(args, 'startDate'),
      frequency: requireString(args, 'frequency') as 'DAILY' | 'ONE_TIME',
      cost: requireNumber(args, 'cost'),
      tags: requireStringArray(args, 'tags'),
      name: optString(args, 'name'),
      endDate: optString(args, 'endDate'),
    }),

  hyros_create_product: async (args, client) =>
    client.createProduct({
      name: requireString(args, 'name'),
      price: requireNumber(args, 'price'),
      category: optString(args, 'category'),
      packages: optString(args, 'packages'),
    }),

  hyros_create_cart: async (args, client) =>
    client.createCart({
      items: requireArray(args, 'items') as CartItem[],
      cartId: optString(args, 'cartId'),
      email: optString(args, 'email'),
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      leadIps: optStringArray(args, 'leadIps'),
      phoneNumbers: optStringArray(args, 'phoneNumbers'),
      date: optString(args, 'date'),
      currency: optString(args, 'currency'),
    }),

  hyros_update_cart: async (args, client) =>
    client.updateCart({
      cartId: requireString(args, 'cartId'),
      items: requireArray(args, 'items') as CartItem[],
      email: optString(args, 'email'),
      firstName: optString(args, 'firstName'),
      lastName: optString(args, 'lastName'),
      leadIps: optStringArray(args, 'leadIps'),
      phoneNumbers: optStringArray(args, 'phoneNumbers'),
      date: optString(args, 'date'),
      currency: optString(args, 'currency'),
    }),

  hyros_create_click: async (args, client) => {
    const sessionId = optString(args, 'sessionId');
    const clickEmail = optString(args, 'email');
    if (!sessionId && !clickEmail) {
      throw new Error('At least one of sessionId or email must be provided');
    }
    return client.createClick({
      referrerUrl: requireString(args, 'referrerUrl'),
      sessionId,
      email: clickEmail,
      previousUrl: optString(args, 'previousUrl'),
      userAgent: optString(args, 'userAgent'),
      ip: optString(args, 'ip'),
      sourceLinkTag: optString(args, 'sourceLinkTag'),
      isOrganic: optBoolean(args, 'isOrganic'),
      integrationType: optString(args, 'integrationType'),
      adSourceId: optString(args, 'adSourceId'),
      adspendAdId: optString(args, 'adspendAdId'),
      adSourceClickId: optString(args, 'adSourceClickId'),
      phones: optStringArray(args, 'phones'),
      tag: optString(args, 'tag'),
      date: optString(args, 'date'),
    });
  },
};

export async function handleWriteTool(name: string, args: Record<string, unknown>, client: HyrosClient): Promise<unknown> {
  const handler = writeHandlers[name];
  if (!handler) throw new Error(`Unknown write tool: ${name}`);
  return handler(args, client);
}
