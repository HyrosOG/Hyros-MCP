import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';

export const readTools: Tool[] = [
  {
    name: 'hyros_get_user_info',
    description: 'Get the authenticated Hyros account information including email, timezone, and currency settings.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hyros_get_leads',
    description: 'Search and retrieve leads from Hyros. Filter by email, ID, or date range. Use this to find customers, check their tags, and see when they joined.',
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
    },
  },
  {
    name: 'hyros_get_lead_journey',
    description: 'Get the complete customer journey for one or more leads, including all sales, calls, carts, and ad attribution sources. Use this to understand what ads drove a customer to convert.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'string',
          description: 'Comma-separated lead IDs (required). Get lead IDs from hyros_get_leads first.',
        },
      },
      required: ['ids'],
    },
  },
  {
    name: 'hyros_get_sales',
    description: 'Retrieve sales records filtered by date, email, lead ID, product tag, or recurring/refund status. Use this to check revenue, see what products sold, and track refunds.',
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
    },
  },
  {
    name: 'hyros_get_calls',
    description: 'Retrieve call records from Hyros. Useful for businesses with phone sales teams. Filter by date, email, qualification status, or call state.',
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
    },
  },
  {
    name: 'hyros_get_subscriptions',
    description: 'Retrieve subscription records. Use this to check MRR, see active subscribers, find churned customers, and track subscription status changes.',
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
    },
  },
  {
    name: 'hyros_get_clicks',
    description: 'Get click tracking data for a specific lead. Shows the ad clicks and traffic sources that led a customer to your site.',
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
    },
  },
  {
    name: 'hyros_get_tags',
    description: 'Get all available tags in your Hyros account. Tags starting with $ are product tags, @ are source tags, ! are action tags.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hyros_get_stages',
    description: 'Get all lead funnel stages configured in your Hyros account (e.g., MQL, SQL, Opportunity, Customer).',
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
    },
  },
  {
    name: 'hyros_get_domains',
    description: 'Get all verified domains in your Hyros account.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'hyros_get_sources',
    description: 'Get ad sources and campaigns tracked in Hyros. Sources represent your marketing channels, campaigns, and ad sets.',
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
    },
  },
  {
    name: 'hyros_get_ads',
    description: 'Get ads from a specific advertising platform tracked in Hyros.',
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
    },
  },
  {
    name: 'hyros_get_keywords',
    description: 'Get keywords for a specific ad group (mainly for Google Ads keyword tracking).',
    inputSchema: {
      type: 'object',
      properties: {
        adgroupId: {
          type: 'string',
          description: 'Ad group ID to get keywords for (required)',
        },
      },
      required: ['adgroupId'],
    },
  },
  {
    name: 'hyros_get_tracking_script',
    description: 'Get the Hyros tracking script to install on your website.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain to get script for (returns default script if not provided)',
        },
      },
      required: [],
    },
  },
  {
    name: 'hyros_get_attribution_report',
    description: 'Get detailed attribution metrics for specific ads, campaigns, or ad sets. Use this to answer "what is my ROAS?", "how much did I earn vs spend?", "which ad has the best ROI?". Requires specifying the level (e.g., facebook_adset, google_campaign) and the IDs to query. Use hyros_get_sources to find source IDs first.',
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
    },
  },
  {
    name: 'hyros_get_ad_account_report',
    description: 'Get attribution metrics grouped by ad account. Provide the ad account ID(s) to get aggregated performance across all campaigns/ads in those accounts.',
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
    },
  },
];

export async function handleReadTool(name: string, args: Record<string, unknown>, client: HyrosClient): Promise<unknown> {
  switch (name) {
    case 'hyros_get_user_info':
      return client.getUserInfo();

    case 'hyros_get_leads':
      return client.getLeads({
        ids: args.ids as string | undefined,
        emails: args.emails as string | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_lead_journey':
      return client.getLeadJourney(args.ids as string);

    case 'hyros_get_sales':
      return client.getSales({
        ids: args.ids as string | undefined,
        emails: args.emails as string | undefined,
        leadIds: args.leadIds as string | undefined,
        productTags: args.productTags as string | undefined,
        isRecurringSale: args.isRecurringSale as 'RECURRING' | 'NON_RECURRING' | 'ALL' | undefined,
        saleRefundedState: args.saleRefundedState as 'REFUNDED' | 'NON_REFUNDED' | 'ALL' | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_calls':
      return client.getCalls({
        ids: args.ids as string | undefined,
        emails: args.emails as string | undefined,
        leadIds: args.leadIds as string | undefined,
        productTags: args.productTags as string | undefined,
        qualified: args.qualified as boolean | undefined,
        state: args.state as string | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_subscriptions':
      return client.getSubscriptions({
        ids: args.ids as string | undefined,
        emails: args.emails as string | undefined,
        leadIds: args.leadIds as string | undefined,
        productTags: args.productTags as string | undefined,
        subscriptionStates: args.subscriptionStates as string | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_clicks':
      return client.getClicks({
        leadId: args.leadId as string | undefined,
        email: args.email as string | undefined,
        fromDate: args.fromDate as string | undefined,
        toDate: args.toDate as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_tags':
      return client.getTags();

    case 'hyros_get_stages':
      return client.getStages({
        name: args.name as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_domains':
      return client.getDomains();

    case 'hyros_get_sources':
      return client.getSources({
        adSourceIds: args.adSourceIds as string | undefined,
        includeOrganic: args.includeOrganic as boolean | undefined,
        includeDisregarded: args.includeDisregarded as boolean | undefined,
        integationType: args.integationType as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_ads':
      return client.getAds({
        integrationType: args.integrationType as string,
        adSourceIds: args.adSourceIds as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_keywords':
      return client.getKeywords(args.adgroupId as string);

    case 'hyros_get_tracking_script':
      return client.getTrackingScript(args.domain as string | undefined);

    case 'hyros_get_attribution_report':
      return client.getAttributionReport({
        attributionModel: args.attributionModel as 'last_click' | 'scientific' | 'first_click',
        startDate: args.startDate as string,
        endDate: args.endDate as string,
        level: args.level as string,
        ids: args.ids as string,
        fields: args.fields as string,
        currency: args.currency as 'usd' | 'user_currency' | undefined,
        windowAttributionDaysRange: args.windowAttributionDaysRange as number | undefined,
        scientificDaysRange: args.scientificDaysRange as number | undefined,
        dayOfAttribution: args.dayOfAttribution as boolean | undefined,
        isAdAccountId: args.isAdAccountId as boolean | undefined,
        timeGroupingOption: args.timeGroupingOption as string | undefined,
        sourceConfiguration: args.sourceConfiguration as string | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    case 'hyros_get_ad_account_report':
      return client.getAdAccountReport({
        attributionModel: args.attributionModel as 'last_click' | 'scientific' | 'first_click',
        startDate: args.startDate as string,
        endDate: args.endDate as string,
        ids: args.ids as string,
        fields: args.fields as string,
        currency: args.currency as 'usd' | 'user_currency' | undefined,
        windowAttributionDaysRange: args.windowAttributionDaysRange as number | undefined,
        scientificDaysRange: args.scientificDaysRange as number | undefined,
        dayOfAttribution: args.dayOfAttribution as boolean | undefined,
        pageSize: args.pageSize as number | undefined,
        pageId: args.pageId as string | undefined,
      });

    default:
      throw new Error(`Unknown read tool: ${name}`);
  }
}
