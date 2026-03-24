import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';
import { requireString, optString, optNumber, optBoolean } from '../validation.js';
import { extractPagination, extractListParams } from './helpers.js';

export const readTools: Tool[] = [
  {
    name: 'hyros_get_user_info',
    description: 'Get the authenticated Hyros account information including email, timezone, and currency settings.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_leads',
    description: 'Search and retrieve leads from Hyros. Filter by email, ID, or date range. Use this to find customers, check their tags, and see when they joined.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated lead IDs to retrieve (max 50)',
        },
        emails: {
          type: 'string',
          description: 'Comma-separated emails or email prefixes to search (max 50)',
        },
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format (e.g. 2024-01-01T00:00:00-05:00)',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format (e.g. 2024-01-31T23:59:59-05:00)',
        },
        pageSize: {
          type: 'number',
          description: 'Number of results per page (1-250, default 50)',
        },
        pageId: {
          type: 'string',
          description: 'Page ID for pagination (from nextPageId in previous response)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_lead_journey',
    description: 'Get the complete customer journey for one or more leads, including all sales, calls, carts, and ad attribution sources. Use this to understand what ads drove a customer to convert.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated lead IDs (required). Get lead IDs from hyros_get_leads first.',
        },
      },
      required: ['ids'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_sales',
    description: 'Retrieve sales records filtered by date, email, lead ID, product tag, or recurring/refund status. Use this to check revenue, see what products sold, and track refunds.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated sale IDs (max 50)',
        },
        emails: {
          type: 'string',
          description: 'Comma-separated emails to filter sales by (max 50)',
        },
        leadIds: {
          type: 'string',
          description: 'Comma-separated lead IDs to filter sales by (max 50)',
        },
        productTags: {
          type: 'string',
          description: 'Comma-separated product tags to filter by (max 20)',
        },
        isRecurringSale: {
          type: 'string',
          enum: ['RECURRING', 'NON_RECURRING', 'ALL'],
          description: 'Filter by recurring status (default: ALL)',
        },
        saleRefundedState: {
          type: 'string',
          enum: ['REFUNDED', 'NON_REFUNDED', 'ALL'],
          description: 'Filter by refund status (default: ALL)',
        },
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_calls',
    description: 'Retrieve call records from Hyros. Useful for businesses with phone sales teams. Filter by date, email, qualification status, or call state.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated call IDs (max 50)',
        },
        emails: {
          type: 'string',
          description: 'Comma-separated emails (max 50)',
        },
        leadIds: {
          type: 'string',
          description: 'Comma-separated lead IDs (max 50)',
        },
        productTags: {
          type: 'string',
          description: 'Comma-separated product tags (max 20)',
        },
        qualified: {
          type: 'boolean',
          description: 'Filter by qualification status',
        },
        state: {
          type: 'string',
          enum: ['QUALIFIED', 'UNQUALIFIED', 'CANCELLED', 'NO_SHOW'],
          description: 'Filter by call state',
        },
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_subscriptions',
    description: 'Retrieve subscription records. Use this to check MRR, see active subscribers, find churned customers, and track subscription status changes.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated subscription IDs (max 50)',
        },
        emails: {
          type: 'string',
          description: 'Comma-separated emails (max 50)',
        },
        leadIds: {
          type: 'string',
          description: 'Comma-separated lead IDs (max 50)',
        },
        productTags: {
          type: 'string',
          description: 'Comma-separated product tags (max 20)',
        },
        states: {
          type: 'string',
          description: 'Comma-separated states: ACTIVE, TRIALING, CANCELED, PAST_DUE, INCOMPLETE, INCOMPLETE_EXPIRED, UNPAID, COMPLETED, PAUSED',
        },
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_clicks',
    description: 'Get click tracking data for a specific lead. Shows the ad clicks and traffic sources that led a customer to your site.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        leadId: {
          type: 'string',
          description: 'Lead ID to get clicks for (mutually exclusive with email)',
        },
        email: {
          type: 'string',
          description: 'Lead email to get clicks for (mutually exclusive with leadId)',
        },
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (max 250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_tags',
    description: 'Get all available tags in your Hyros account. Tags starting with $ are product tags, @ are source tags, ! are action tags.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_stages',
    description: 'Get all lead funnel stages configured in your Hyros account (e.g., MQL, SQL, Opportunity, Customer).',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Filter stages by name',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_domains',
    description: 'Get all verified domains in your Hyros account.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_sources',
    description: 'Get ad sources and campaigns tracked in Hyros. Sources represent your marketing channels, campaigns, and ad sets.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        adSourceIds: {
          type: 'string',
          description: 'Comma-separated ad source IDs to retrieve',
        },
        includeOrganic: {
          type: 'boolean',
          description: 'Include organic traffic sources',
        },
        includeDisregarded: {
          type: 'boolean',
          description: 'Include disregarded sources',
        },
        integationType: {
          type: 'string',
          enum: ['FACEBOOK', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'LINKEDIN', 'TWITTER', 'PINTEREST', 'BING'],
          description: 'Filter by platform',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_ads',
    description: 'Get ads from a specific advertising platform tracked in Hyros.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        integrationType: {
          type: 'string',
          enum: ['FACEBOOK', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'LINKEDIN', 'TWITTER', 'PINTEREST', 'BING'],
          description: 'Advertising platform to get ads from (required)',
        },
        adSourceIds: {
          type: 'string',
          description: 'Comma-separated ad source IDs to filter by',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: ['integrationType'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_keywords',
    description: 'Get keywords for a specific ad group (mainly for Google Ads keyword tracking).',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        adgroupId: {
          type: 'string',
          description: 'Ad group ID to get keywords for (required)',
        },
      },
      required: ['adgroupId'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_tracking_script',
    description: 'Get the Hyros tracking script to install on your website.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to get script for (returns default script if not provided)',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_attribution_report',
    description: 'Get detailed attribution metrics for specific ads, campaigns, or ad sets. Use this to answer "what is my ROAS?", "how much did I earn vs spend?", "which ad has the best ROI?". Requires specifying the level (e.g., facebook_adset, google_campaign) and the IDs to query. Use hyros_get_sources to find source IDs first.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        attributionModel: {
          type: 'string',
          enum: ['last_click', 'scientific', 'first_click'],
          description: 'Attribution model: last_click (last touch), scientific (AI-based), first_click (first touch)',
        },
        startDate: {
          type: 'string',
          description: 'Report start date in ISO 8601 format, e.g. 2024-01-01T00:00:00 (required)',
        },
        endDate: {
          type: 'string',
          description: 'Report end date in ISO 8601 format, e.g. 2024-01-31T23:59:59 (required)',
        },
        level: {
          type: 'string',
          enum: ['facebook_adset', 'facebook_ad', 'google_campaign', 'google_ad', 'google_v2_adgroup', 'google_v2_keyword', 'tiktok_adgroup', 'tiktok_ad', 'snapchat_adsquad', 'snapchat_ad', 'pinterest_adgroup', 'pinterest_ad', 'twitter_adgroup', 'bing_adgroup', 'bing_ad', 'linkedin_campaign'],
          description: 'Attribution level (required): the granularity of the report. Use facebook_adset for Facebook ad sets, google_campaign for Google campaigns, etc.',
        },
        ids: {
          type: 'string',
          description: 'Comma-separated IDs based on the level (required, unless level is google_v2_keyword). E.g. for facebook_adset use the adset IDs. Use isAdAccountId=true to provide an ad account ID and get all sources within it.',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated metrics (required). Options: revenue,cost,sales,leads,calls,roas,roi,profit,refund,unique_sales,new_leads,cost_per_lead,cost_per_sale,cost_per_call,clicks,impressions,ctr,cpm,cvr,qualified_calls,unqualified_calls,30_days_ltv,90_days_ltv,1_year_ltv,new_mrr,churn_rate,aov,cac,name,parent_name. Example: "revenue,cost,sales,leads,roas,roi"',
        },
        currency: {
          type: 'string',
          enum: ['usd', 'user_currency'],
          description: 'Currency for monetary values (default: user_currency)',
        },
        isAdAccountId: {
          type: 'boolean',
          description: 'If true, the ids field should contain a single ad account ID and the report will include all sources in that account at the specified level',
        },
        windowAttributionDaysRange: {
          type: 'number',
          description: 'Days range for attribution window (0-365, default: 0)',
        },
        scientificDaysRange: {
          type: 'number',
          description: 'Day range (1-30) for first ad attribution in scientific model (default: 30)',
        },
        dayOfAttribution: {
          type: 'boolean',
          description: 'If true, filter by click date instead of sale date',
        },
        timeGroupingOption: {
          type: 'string',
          enum: ['source_link', 'day', 'week', 'month', 'year'],
          description: 'How to group the results (default: source_link)',
        },
        sourceConfiguration: {
          type: 'string',
          enum: ['all_sources', 'only_organic', 'only_paid', 'prioritize_organic', 'prioritize_paid'],
          description: 'Filter by organic/paid sources (default: ignore_organic)',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (1-250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: ['attributionModel', 'startDate', 'endDate', 'level', 'ids', 'fields'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_get_ad_account_report',
    description: 'Get attribution metrics grouped by ad account. Provide the ad account ID(s) to get aggregated performance across all campaigns/ads in those accounts.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        attributionModel: {
          type: 'string',
          enum: ['last_click', 'scientific', 'first_click'],
          description: 'Attribution model to use',
        },
        startDate: {
          type: 'string',
          description: 'Report start date in ISO 8601 format (required)',
        },
        endDate: {
          type: 'string',
          description: 'Report end date in ISO 8601 format (required)',
        },
        ids: {
          type: 'string',
          description: 'Comma-separated ad account IDs to report on (required)',
        },
        fields: {
          type: 'string',
          description: 'Comma-separated metrics (required). Options: revenue,cost,sales,leads,roas,roi,profit,clicks,impressions,ctr,cost_per_lead,cost_per_sale,name',
        },
        currency: {
          type: 'string',
          enum: ['usd', 'user_currency'],
          description: 'Currency for monetary values',
        },
        windowAttributionDaysRange: {
          type: 'number',
          description: 'Attribution window in days (0-365)',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (max 250)',
        },
        pageId: {
          type: 'string',
          description: 'Pagination page ID',
        },
      },
      required: ['attributionModel', 'startDate', 'endDate', 'ids', 'fields'],
      additionalProperties: false,
    },
  },
];

type ReadHandler = (args: Record<string, unknown>, client: HyrosClient) => Promise<unknown>;

const readHandlers: Record<string, ReadHandler> = {
  hyros_get_user_info: (_args, client) => client.getUserInfo(),

  hyros_get_leads: (args, client) => client.getLeads({
    ids: optString(args, 'ids'),
    emails: optString(args, 'emails'),
    ...extractListParams(args),
  }),

  hyros_get_lead_journey: (args, client) => client.getLeadJourney(requireString(args, 'ids')),

  hyros_get_sales: (args, client) => client.getSales({
    ids: optString(args, 'ids'),
    emails: optString(args, 'emails'),
    leadIds: optString(args, 'leadIds'),
    productTags: optString(args, 'productTags'),
    isRecurringSale: optString(args, 'isRecurringSale') as 'RECURRING' | 'NON_RECURRING' | 'ALL' | undefined,
    saleRefundedState: optString(args, 'saleRefundedState') as 'REFUNDED' | 'NON_REFUNDED' | 'ALL' | undefined,
    ...extractListParams(args),
  }),

  hyros_get_calls: (args, client) => client.getCalls({
    ids: optString(args, 'ids'),
    emails: optString(args, 'emails'),
    leadIds: optString(args, 'leadIds'),
    productTags: optString(args, 'productTags'),
    qualified: optBoolean(args, 'qualified'),
    state: optString(args, 'state'),
    ...extractListParams(args),
  }),

  hyros_get_subscriptions: (args, client) => client.getSubscriptions({
    ids: optString(args, 'ids'),
    emails: optString(args, 'emails'),
    leadIds: optString(args, 'leadIds'),
    productTags: optString(args, 'productTags'),
    subscriptionStates: optString(args, 'states'),
    ...extractListParams(args),
  }),

  hyros_get_clicks: (args, client) => client.getClicks({
    leadId: optString(args, 'leadId'),
    email: optString(args, 'email'),
    ...extractListParams(args),
  }),

  hyros_get_tags: (_args, client) => client.getTags(),

  hyros_get_stages: (args, client) => client.getStages({
    name: optString(args, 'name'),
    ...extractPagination(args),
  }),

  hyros_get_domains: (_args, client) => client.getDomains(),

  hyros_get_sources: (args, client) => client.getSources({
    adSourceIds: optString(args, 'adSourceIds'),
    includeOrganic: optBoolean(args, 'includeOrganic'),
    includeDisregarded: optBoolean(args, 'includeDisregarded'),
    integationType: optString(args, 'integationType'),
    ...extractPagination(args),
  }),

  hyros_get_ads: (args, client) => client.getAds({
    integrationType: requireString(args, 'integrationType'),
    adSourceIds: optString(args, 'adSourceIds'),
    ...extractPagination(args),
  }),

  hyros_get_keywords: (args, client) => client.getKeywords(requireString(args, 'adgroupId')),

  hyros_get_tracking_script: (args, client) => client.getTrackingScript(optString(args, 'domain')),

  hyros_get_attribution_report: (args, client) => client.getAttributionReport({
    attributionModel: requireString(args, 'attributionModel') as 'last_click' | 'scientific' | 'first_click',
    startDate: requireString(args, 'startDate'),
    endDate: requireString(args, 'endDate'),
    level: requireString(args, 'level'),
    ids: requireString(args, 'ids'),
    fields: requireString(args, 'fields'),
    currency: optString(args, 'currency') as 'usd' | 'user_currency' | undefined,
    windowAttributionDaysRange: optNumber(args, 'windowAttributionDaysRange'),
    scientificDaysRange: optNumber(args, 'scientificDaysRange'),
    dayOfAttribution: optBoolean(args, 'dayOfAttribution'),
    isAdAccountId: optBoolean(args, 'isAdAccountId'),
    timeGroupingOption: optString(args, 'timeGroupingOption'),
    sourceConfiguration: optString(args, 'sourceConfiguration'),
    ...extractPagination(args),
  }),

  hyros_get_ad_account_report: (args, client) => client.getAdAccountReport({
    attributionModel: requireString(args, 'attributionModel') as 'last_click' | 'scientific' | 'first_click',
    startDate: requireString(args, 'startDate'),
    endDate: requireString(args, 'endDate'),
    ids: requireString(args, 'ids'),
    fields: requireString(args, 'fields'),
    currency: optString(args, 'currency') as 'usd' | 'user_currency' | undefined,
    windowAttributionDaysRange: optNumber(args, 'windowAttributionDaysRange'),
    scientificDaysRange: optNumber(args, 'scientificDaysRange'),
    dayOfAttribution: optBoolean(args, 'dayOfAttribution'),
    ...extractPagination(args),
  }),
};

export async function handleReadTool(name: string, args: Record<string, unknown>, client: HyrosClient): Promise<unknown> {
  const handler = readHandlers[name];
  if (!handler) throw new Error(`Unknown read tool: ${name}`);
  return handler(args, client);
}
