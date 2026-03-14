import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';

export const writeTools: Tool[] = [
  {
    name: 'hyros_create_lead',
    description: 'Create a new lead in Hyros. If the email already exists, the lead will be updated with any new information provided.',
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
    },
  },
  {
    name: 'hyros_update_lead',
    description: 'Update an existing lead in Hyros. Can update email, name, tags, IPs, phone numbers, and funnel stage.',
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
    },
  },
  {
    name: 'hyros_create_order',
    description: 'Register a new sale/order in Hyros. This creates a sale record attributed to a lead.',
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
    },
  },
  {
    name: 'hyros_refund_order',
    description: 'Process a refund for an existing order in Hyros.',
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
    },
  },
  {
    name: 'hyros_update_sale',
    description: 'Update one or more sale records in Hyros. Can mark sales as recurring, refunded, or update refund amounts.',
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
    },
  },
  {
    name: 'hyros_delete_sale',
    description: 'Permanently delete a sale record from Hyros. This action cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        saleId: {
          type: 'string',
          description: 'Sale ID to delete (required)',
        },
      },
      required: ['saleId'],
    },
  },
  {
    name: 'hyros_create_call',
    description: 'Register a call event in Hyros. Used to track sales calls and attribute them to ad sources.',
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
    },
  },
  {
    name: 'hyros_update_call',
    description: 'Update the qualification status or state of existing call records.',
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
    },
  },
  {
    name: 'hyros_delete_call',
    description: 'Permanently delete a call record from Hyros.',
    inputSchema: {
      type: 'object',
      properties: {
        callId: {
          type: 'string',
          description: 'Call ID to delete (required)',
        },
      },
      required: ['callId'],
    },
  },
  {
    name: 'hyros_create_subscription',
    description: 'Register a new subscription in Hyros for recurring revenue tracking.',
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
    },
  },
  {
    name: 'hyros_update_subscription',
    description: 'Update existing subscription records. Can change status, price, dates, and cancellation.',
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
    },
  },
  {
    name: 'hyros_create_source',
    description: 'Create a new ad source/traffic source in Hyros for tracking custom marketing channels.',
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
    },
  },
  {
    name: 'hyros_create_custom_cost',
    description: 'Add a custom ad cost in Hyros. Use this to track offline ad spend, influencer payments, or any cost not automatically tracked by Hyros integrations.',
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
    },
  },
  {
    name: 'hyros_create_product',
    description: 'Create a new product in Hyros for sale attribution.',
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
    },
  },
];

export async function handleWriteTool(name: string, args: Record<string, unknown>, client: HyrosClient): Promise<unknown> {
  switch (name) {
    case 'hyros_create_lead':
      return client.createLead({
        email: args.email as string | undefined,
        firstName: args.firstName as string | undefined,
        lastName: args.lastName as string | undefined,
        tags: args.tags as string[] | undefined,
        leadIps: args.leadIps as string[] | undefined,
        phoneNumbers: args.phoneNumbers as string[] | undefined,
        stage: args.stage as string | undefined,
        adOptimizationConsent: args.adOptimizationConsent as 'GRANTED' | 'DENIED' | 'UNSPECIFIED' | undefined,
      });

    case 'hyros_update_lead':
      return client.updateLead(
        {
          email: args.searchEmail as string | undefined,
          id: args.searchId as string | undefined,
          phone: args.searchPhone as string | undefined,
        },
        {
          email: args.email as string | undefined,
          firstName: args.firstName as string | undefined,
          lastName: args.lastName as string | undefined,
          tags: args.tags as string[] | undefined,
          leadIps: args.leadIps as string[] | undefined,
          phoneNumbers: args.phoneNumbers as string[] | undefined,
          adOptimizationConsent: args.adOptimizationConsent as 'GRANTED' | 'DENIED' | 'UNSPECIFIED' | undefined,
          leadStage: args.leadStageName
            ? { name: args.leadStageName as string, date: args.leadStageDate as string | undefined }
            : undefined,
        },
      );

    case 'hyros_create_order':
      return client.createOrder({
        items: args.items as Array<{ name: string; price: number; quantity?: number }>,
        email: args.email as string | undefined,
        phoneNumbers: args.phoneNumbers as string[] | undefined,
        firstName: args.firstName as string | undefined,
        lastName: args.lastName as string | undefined,
        leadIps: args.leadIps as string[] | undefined,
        orderId: args.orderId as string | undefined,
        date: args.date as string | undefined,
        currency: args.currency as string | undefined,
        shipping: args.shipping as number | undefined,
        taxes: args.taxes as number | undefined,
        discount: args.discount as number | undefined,
        stage: args.stage as string | undefined,
      });

    case 'hyros_refund_order':
      return client.refundOrder(args.orderId as string, args.refundedAmount as number | undefined);

    case 'hyros_update_sale':
      return client.updateSale({
        ids: args.ids as string,
        isRecurringSale: args.isRecurringSale as boolean | undefined,
        isRefunded: args.isRefunded as boolean | undefined,
        refundedDate: args.refundedDate as string | undefined,
        refundedAmount: args.refundedAmount as number | undefined,
      });

    case 'hyros_delete_sale':
      return client.deleteSale(args.saleId as string);

    case 'hyros_create_call':
      return client.createCall({
        name: args.name as string,
        email: args.email as string | undefined,
        firstName: args.firstName as string | undefined,
        lastName: args.lastName as string | undefined,
        phoneNumbers: args.phoneNumbers as string[] | undefined,
        leadIps: args.leadIps as string[] | undefined,
        stage: args.stage as string | undefined,
        externalId: args.externalId as string | undefined,
        date: args.date as string | undefined,
        qualification: args.qualification as boolean | undefined,
        state: args.state as string | undefined,
      });

    case 'hyros_update_call':
      return client.updateCall({
        name: args.name as string,
        ids: args.ids as string | undefined,
        externalIds: args.externalIds as string | undefined,
        qualification: args.qualification as boolean | undefined,
        state: args.state as string | undefined,
      });

    case 'hyros_delete_call':
      return client.deleteCall(args.callId as string);

    case 'hyros_create_subscription':
      return client.createSubscription({
        status: args.status as string,
        startDate: args.startDate as string,
        price: args.price as number,
        periodicity: args.periodicity as 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
        email: args.email as string | undefined,
        phoneNumbers: args.phoneNumbers as string[] | undefined,
        firstName: args.firstName as string | undefined,
        lastName: args.lastName as string | undefined,
        stage: args.stage as string | undefined,
        subscriptionId: args.subscriptionId as string | undefined,
        trialStartDate: args.trialStartDate as string | undefined,
        trialEndDate: args.trialEndDate as string | undefined,
        planId: args.planId as string | undefined,
        cancelAtDate: args.cancelAtDate as string | undefined,
      });

    case 'hyros_update_subscription':
      return client.updateSubscription({
        ids: args.ids as string,
        price: args.price as number,
        name: args.name as string | undefined,
        status: args.status as string | undefined,
        startDate: args.startDate as string | undefined,
        trialStartDate: args.trialStartDate as string | undefined,
        trialEndDate: args.trialEndDate as string | undefined,
        cancelAtDate: args.cancelAtDate as string | undefined,
      });

    case 'hyros_create_source':
      return client.createSource({
        name: args.name as string,
        accountId: args.accountId as string | undefined,
        adSourceId: args.adSourceId as string | undefined,
        adspendSubType: args.adspendSubType as string | undefined,
        campaignId: args.campaignId as string | undefined,
        category: args.category as string | undefined,
        goal: args.goal as string | undefined,
        integationType: args.integationType as string | undefined,
        isDisregard: args.isDisregard as boolean | undefined,
        isOrganic: args.isOrganic as boolean | undefined,
        trafficSource: args.trafficSource as string | undefined,
      });

    case 'hyros_create_custom_cost':
      return client.createCustomCost({
        startDate: args.startDate as string,
        frequency: args.frequency as 'DAILY' | 'ONE_TIME',
        cost: args.cost as number,
        tags: args.tags as string[],
        name: args.name as string | undefined,
        endDate: args.endDate as string | undefined,
      });

    case 'hyros_create_product':
      return client.createProduct({
        name: args.name as string,
        price: args.price as number,
        category: args.category as string | undefined,
        packages: args.packages as string | undefined,
      });

    default:
      throw new Error(`Unknown write tool: ${name}`);
  }
}
