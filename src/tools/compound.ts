import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';
import type { Sale, Call, Subscription } from '../types.js';
import { requireString, optString, optNumber } from '../validation.js';
import { getTodayRange, sumMetric, pctChange, getPrice, extractErrors } from './compound-utils.js';

// Shared types for casting API responses
type SaleRecord = Pick<Sale, 'usdPrice' | 'price' | 'recurring'>;
type CallRecord = Pick<Call, 'qualified' | 'state'>;
type SubRecord = Pick<Subscription, 'status' | 'price' | 'periodicity'>;

export const compoundTools: Tool[] = [
  {
    name: 'hyros_daily_summary',
    description: 'Get a complete performance summary for today (or a specific date). Returns total revenue from sales, number of new leads, call team performance, and subscription stats. Perfect for answering "how did we do today?" or "what is today\'s revenue?"',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to summarize in YYYY-MM-DD format (defaults to today)',
        },
        timezone: {
          type: 'string',
          description: 'Timezone offset for the date (e.g., -05:00 for EST). Must be in +HH:MM or -HH:MM format. Defaults to +00:00',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_best_performers',
    description: 'Get the top performing ads/campaigns ranked by revenue, ROAS, ROI, etc. for a given date range. Requires an ad account ID and the level of analysis. Use hyros_get_sources to find your ad account IDs first. Perfect for "what are my best ads this week?" or "which campaigns have the highest ROAS this month?"',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format, e.g. 2024-01-01T00:00:00 (required)',
        },
        endDate: {
          type: 'string',
          description: 'End date in ISO 8601 format, e.g. 2024-01-31T23:59:59 (required)',
        },
        adAccountId: {
          type: 'string',
          description: 'Ad account ID to analyze (required). Get this from hyros_get_sources.',
        },
        level: {
          type: 'string',
          enum: ['facebook_adset', 'facebook_ad', 'google_campaign', 'google_ad', 'tiktok_adgroup', 'tiktok_ad', 'snapchat_adsquad', 'pinterest_adgroup', 'bing_adgroup', 'linkedin_campaign'],
          description: 'Level of analysis (required): use facebook_adset for Facebook ad sets, google_campaign for Google campaigns, etc.',
        },
        rankBy: {
          type: 'string',
          enum: ['revenue', 'roas', 'roi', 'sales', 'leads', 'cpa', 'cpl', 'cost'],
          description: 'Metric to rank performers by (default: revenue)',
        },
        topCount: {
          type: 'number',
          description: 'Number of top performers to return (default: 10)',
        },
        attributionModel: {
          type: 'string',
          enum: ['last_click', 'scientific', 'first_click'],
          description: 'Attribution model (default: last_click)',
        },
        currency: {
          type: 'string',
          enum: ['usd', 'user_currency'],
          description: 'Currency for monetary values (default: user_currency)',
        },
      },
      required: ['startDate', 'endDate', 'adAccountId', 'level'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_compare_periods',
    description: 'Compare ad performance metrics between two date ranges using attribution data. Requires an ad account ID and level. Returns revenue, cost, ROAS, sales, leads, and percentage changes. Perfect for "compare this week vs last week".',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        period1StartDate: {
          type: 'string',
          description: 'Period 1 start date in ISO 8601 format (required)',
        },
        period1EndDate: {
          type: 'string',
          description: 'Period 1 end date in ISO 8601 format (required)',
        },
        period2StartDate: {
          type: 'string',
          description: 'Period 2 start date in ISO 8601 format (required)',
        },
        period2EndDate: {
          type: 'string',
          description: 'Period 2 end date in ISO 8601 format (required)',
        },
        adAccountId: {
          type: 'string',
          description: 'Ad account ID to compare (required). Get from hyros_get_sources.',
        },
        level: {
          type: 'string',
          enum: ['facebook_adset', 'facebook_ad', 'google_campaign', 'google_ad', 'tiktok_adgroup', 'tiktok_ad', 'snapchat_adsquad', 'pinterest_adgroup', 'bing_adgroup', 'linkedin_campaign'],
          description: 'Level of analysis (required)',
        },
        attributionModel: {
          type: 'string',
          enum: ['last_click', 'scientific', 'first_click'],
          description: 'Attribution model (default: last_click)',
        },
        currency: {
          type: 'string',
          enum: ['usd', 'user_currency'],
          description: 'Currency code',
        },
      },
      required: ['period1StartDate', 'period1EndDate', 'period2StartDate', 'period2EndDate', 'adAccountId', 'level'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_funnel_overview',
    description: 'Get a complete funnel overview showing the full customer journey from clicks to revenue for a date range. Shows: total leads, calls (with qualification rate), sales (with amounts), subscriptions, and calculates conversion rates between each stage.',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: {
          type: 'string',
          description: 'Start date in ISO 8601 format (required)',
        },
        toDate: {
          type: 'string',
          description: 'End date in ISO 8601 format (required)',
        },
        currency: {
          type: 'string',
          description: 'Currency code for revenue',
        },
      },
      required: ['fromDate', 'toDate'],
      additionalProperties: false,
    },
  },
  {
    name: 'hyros_subscription_health',
    description: 'Get a health report for your subscription business. Shows active count, MRR (monthly recurring revenue), trial count, churn (canceled this period), past due, and other subscription statuses. Perfect for "what is my MRR?" or "how many active subscribers do I have?"',
    annotations: {
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        fromDate: {
          type: 'string',
          description: 'Start date to look for subscriptions (ISO 8601)',
        },
        toDate: {
          type: 'string',
          description: 'End date (ISO 8601)',
        },
        currency: {
          type: 'string',
          description: 'Currency for MRR calculation',
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
];

export async function handleCompoundTool(
  name: string,
  args: Record<string, unknown>,
  client: HyrosClient,
): Promise<unknown> {
  switch (name) {
    case 'hyros_daily_summary': {
      const date = optString(args, 'date');
      const timezone = optString(args, 'timezone') ?? '+00:00';

      const { fromDate, toDate } = getTodayRange(date, timezone);

      // Fetch all pages in parallel; individual failures do not abort the whole summary
      const [leadsResult, salesResult, callsResult, subscriptionsResult] = await Promise.allSettled([
        client.fetchAllPages((pageId) => client.getLeads({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getSales({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getCalls({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getSubscriptions({ fromDate, toDate, pageSize: 250, pageId })),
      ]);

      const leads = leadsResult.status === 'fulfilled' ? leadsResult.value.result : [];
      const sales = salesResult.status === 'fulfilled' ? salesResult.value.result : [];
      const calls = callsResult.status === 'fulfilled' ? callsResult.value.result : [];
      const subscriptions = subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value.result : [];

      const truncated = {
        leads: leadsResult.status === 'fulfilled' && leadsResult.value.truncated,
        sales: salesResult.status === 'fulfilled' && salesResult.value.truncated,
        calls: callsResult.status === 'fulfilled' && callsResult.value.truncated,
        subscriptions: subscriptionsResult.status === 'fulfilled' && subscriptionsResult.value.truncated,
      };
      const anyTruncated = Object.values(truncated).some(Boolean);

      const salesTyped = sales as SaleRecord[];
      const callsTyped = calls as CallRecord[];
      const subsTyped = subscriptions as SubRecord[];

      const totalRevenue = salesTyped.reduce((acc, s) => acc + (getPrice(s)), 0);
      const recurringRevenue = salesTyped.filter((s) => s.recurring).reduce((acc, s) => acc + (getPrice(s)), 0);
      const qualifiedCalls = callsTyped.filter((c) => c.qualified === true).length;
      const canceledOrNoShow = callsTyped.filter((c) => c.state === 'CANCELLED' || c.state === 'NO_SHOW').length;

      return {
        date: date ?? new Date().toISOString().split('T')[0],
        period: { fromDate, toDate },
        revenue: {
          total: Number(totalRevenue.toFixed(2)),
          recurring: Number(recurringRevenue.toFixed(2)),
          oneTime: Number((totalRevenue - recurringRevenue).toFixed(2)),
        },
        leads: { new: leads.length },
        sales: { count: sales.length },
        calls: {
          total: calls.length,
          qualified: qualifiedCalls,
          qualificationRate: calls.length > 0 ? `${((qualifiedCalls / calls.length) * 100).toFixed(1)}%` : '0%',
          canceledOrNoShow,
        },
        subscriptions: {
          new: subscriptions.length,
          active: subsTyped.filter((s) => s.status === 'ACTIVE').length,
        },
        ...(anyTruncated && {
          warning: 'Some results were truncated after 10 pages. Actual counts may be higher.',
          truncated,
        }),
        ...(extractErrors({ leads: leadsResult, sales: salesResult, calls: callsResult, subscriptions: subscriptionsResult }) && {
          errors: extractErrors({ leads: leadsResult, sales: salesResult, calls: callsResult, subscriptions: subscriptionsResult }),
        }),
      };
    }

    case 'hyros_best_performers': {
      const startDate = requireString(args, 'startDate');
      const endDate = requireString(args, 'endDate');
      const adAccountId = requireString(args, 'adAccountId');
      const level = requireString(args, 'level');
      const rankBy = optString(args, 'rankBy') ?? 'revenue';
      const topCount = optNumber(args, 'topCount') ?? 10;
      const attributionModel = (optString(args, 'attributionModel') as 'last_click' | 'scientific' | 'first_click' | undefined) ?? 'last_click';
      const currency = optString(args, 'currency') as 'usd' | 'user_currency' | undefined;

      const fields = 'revenue,cost,sales,leads,roas,roi,cost_per_sale,cost_per_lead,name,parent_name';

      const result = await client.getAttributionReport({
        attributionModel,
        startDate,
        endDate,
        level,
        ids: adAccountId,
        fields,
        isAdAccountId: true,
        ...(currency && { currency }),
        pageSize: 250,
      });

      const items = (result.result ?? []) as Array<Record<string, unknown>>;

      // Map user-friendly rankBy aliases to actual API field names
      const rankByFieldMap: Record<string, string> = { cpa: 'cost_per_sale', cpl: 'cost_per_lead' };
      const sortField = rankByFieldMap[rankBy] ?? rankBy;

      const lowerIsBetter = ['cpa', 'cpl', 'cost_per_lead', 'cost_per_sale', 'cost'].includes(sortField) || ['cpa', 'cpl'].includes(rankBy);
      const sorted = [...items]
        .filter((item) => item[sortField] !== undefined && item[sortField] !== null)
        .sort((a, b) => {
          const aVal = Number(a[sortField]) || 0;
          const bVal = Number(b[sortField]) || 0;
          return lowerIsBetter ? aVal - bVal : bVal - aVal;
        })
        .slice(0, topCount);

      const totalRevenue = sumMetric(items, 'revenue');
      const totalCost = sumMetric(items, 'cost');
      const totalSales = sumMetric(items, 'sales');
      const totalLeads = sumMetric(items, 'leads');

      return {
        period: { startDate, endDate },
        adAccountId,
        level,
        rankedBy: rankBy,
        attributionModel,
        totals: {
          revenue: totalRevenue,
          cost: totalCost,
          sales: totalSales,
          leads: totalLeads,
          roas: totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0,
        },
        topPerformers: sorted.map((item, index) => ({
          rank: index + 1,
          name: item.name ?? item.id ?? 'Unknown',
          parentName: item.parent_name,
          id: item.id,
          revenue: item.revenue,
          cost: item.cost,
          roas: item.roas,
          roi: item.roi,
          sales: item.sales,
          leads: item.leads,
          costPerSale: item.cost_per_sale,
          costPerLead: item.cost_per_lead,
        })),
      };
    }

    case 'hyros_compare_periods': {
      const p1Start = requireString(args, 'period1StartDate');
      const p1End = requireString(args, 'period1EndDate');
      const p2Start = requireString(args, 'period2StartDate');
      const p2End = requireString(args, 'period2EndDate');
      const adAccountId = requireString(args, 'adAccountId');
      const level = requireString(args, 'level');
      const attributionModel = (optString(args, 'attributionModel') as 'last_click' | 'scientific' | 'first_click' | undefined) ?? 'last_click';
      const currency = optString(args, 'currency') as 'usd' | 'user_currency' | undefined;

      const fields = 'revenue,cost,sales,leads,roas,roi,clicks';

      const [p1Settled, p2Settled] = await Promise.allSettled([
        client.getAttributionReport({
          attributionModel,
          startDate: p1Start,
          endDate: p1End,
          level,
          ids: adAccountId,
          fields,
          isAdAccountId: true,
          ...(currency && { currency }),
          pageSize: 250,
        }),
        client.getAttributionReport({
          attributionModel,
          startDate: p2Start,
          endDate: p2End,
          level,
          ids: adAccountId,
          fields,
          isAdAccountId: true,
          ...(currency && { currency }),
          pageSize: 250,
        }),
      ]);

      if (p1Settled.status === 'rejected' && p2Settled.status === 'rejected') {
        throw new Error(`Both period queries failed. Period 1: ${(p1Settled.reason as Error)?.message}. Period 2: ${(p2Settled.reason as Error)?.message}`);
      }

      const p1Items = p1Settled.status === 'fulfilled' ? ((p1Settled.value.result ?? []) as Array<Record<string, unknown>>) : [];
      const p2Items = p2Settled.status === 'fulfilled' ? ((p2Settled.value.result ?? []) as Array<Record<string, unknown>>) : [];

      const p1 = {
        revenue: sumMetric(p1Items, 'revenue'),
        cost: sumMetric(p1Items, 'cost'),
        sales: sumMetric(p1Items, 'sales'),
        leads: sumMetric(p1Items, 'leads'),
        clicks: sumMetric(p1Items, 'clicks'),
      };
      const p2 = {
        revenue: sumMetric(p2Items, 'revenue'),
        cost: sumMetric(p2Items, 'cost'),
        sales: sumMetric(p2Items, 'sales'),
        leads: sumMetric(p2Items, 'leads'),
        clicks: sumMetric(p2Items, 'clicks'),
      };

      const p1Roas = p1.cost > 0 ? p1.revenue / p1.cost : 0;
      const p2Roas = p2.cost > 0 ? p2.revenue / p2.cost : 0;
      const p1Roi = p1.cost > 0 ? ((p1.revenue - p1.cost) / p1.cost) * 100 : 0;
      const p2Roi = p2.cost > 0 ? ((p2.revenue - p2.cost) / p2.cost) * 100 : 0;

      return {
        period1: { startDate: p1Start, endDate: p1End },
        period2: { startDate: p2Start, endDate: p2End },
        comparison: {
          revenue: {
            period1: p1.revenue,
            period2: p2.revenue,
            change: pctChange(p2.revenue, p1.revenue),
            diff: Number((p2.revenue - p1.revenue).toFixed(2)),
          },
          cost: {
            period1: p1.cost,
            period2: p2.cost,
            change: pctChange(p2.cost, p1.cost),
            diff: Number((p2.cost - p1.cost).toFixed(2)),
          },
          roas: {
            period1: Number(p1Roas.toFixed(2)),
            period2: Number(p2Roas.toFixed(2)),
            change: pctChange(p2Roas, p1Roas),
          },
          roi: {
            period1: `${p1Roi.toFixed(1)}%`,
            period2: `${p2Roi.toFixed(1)}%`,
            change: pctChange(p2Roi, p1Roi),
          },
          sales: {
            period1: p1.sales,
            period2: p2.sales,
            change: pctChange(p2.sales, p1.sales),
          },
          leads: {
            period1: p1.leads,
            period2: p2.leads,
            change: pctChange(p2.leads, p1.leads),
          },
          clicks: {
            period1: p1.clicks,
            period2: p2.clicks,
            change: pctChange(p2.clicks, p1.clicks),
          },
        },
        ...(extractErrors({ period1: p1Settled, period2: p2Settled }) && {
          errors: extractErrors({ period1: p1Settled, period2: p2Settled }),
        }),
      };
    }

    case 'hyros_funnel_overview': {
      const fromDate = requireString(args, 'fromDate');
      const toDate = requireString(args, 'toDate');
      const currency = optString(args, 'currency');

      const [leadsResult, salesResult, callsResult, subscriptionsResult] = await Promise.allSettled([
        client.fetchAllPages((pageId) => client.getLeads({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getSales({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getCalls({ fromDate, toDate, pageSize: 250, pageId })),
        client.fetchAllPages((pageId) => client.getSubscriptions({ fromDate, toDate, pageSize: 250, pageId })),
      ]);

      const leads = leadsResult.status === 'fulfilled' ? leadsResult.value.result : [];
      const sales = salesResult.status === 'fulfilled' ? salesResult.value.result : [];
      const calls = callsResult.status === 'fulfilled' ? callsResult.value.result : [];
      const subscriptions = subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value.result : [];

      const truncated = {
        leads: leadsResult.status === 'fulfilled' && leadsResult.value.truncated,
        sales: salesResult.status === 'fulfilled' && salesResult.value.truncated,
        calls: callsResult.status === 'fulfilled' && callsResult.value.truncated,
        subscriptions: subscriptionsResult.status === 'fulfilled' && subscriptionsResult.value.truncated,
      };
      const anyTruncated = Object.values(truncated).some(Boolean);

      const salesTyped = sales as SaleRecord[];
      const callsTyped = calls as CallRecord[];
      const subsTyped = subscriptions as SubRecord[];

      const totalRevenue = salesTyped.reduce((acc, s) => acc + getPrice(s), 0);
      const recurringRevenue = salesTyped
        .filter((s) => s.recurring)
        .reduce((acc, s) => acc + (getPrice(s)), 0);

      // Calls breakdown
      const qualifiedCalls = callsTyped.filter((c) => c.qualified === true).length;
      const noShowCalls = callsTyped.filter((c) => c.state === 'NO_SHOW').length;
      const cancelledCalls = callsTyped.filter((c) => c.state === 'CANCELLED').length;

      // Subscription breakdown
      const activeSubs = subsTyped.filter((s) => s.status === 'ACTIVE').length;
      const trialSubs = subsTyped.filter((s) => s.status === 'TRIALING').length;
      const canceledSubs = subsTyped.filter((s) => s.status === 'CANCELED').length;

      // Funnel conversion rates
      const leadsToCallsRate =
        leads.length > 0 && calls.length > 0
          ? `${((calls.length / leads.length) * 100).toFixed(1)}%`
          : 'N/A';
      const callsToSalesRate =
        calls.length > 0 && sales.length > 0
          ? `${((sales.length / calls.length) * 100).toFixed(1)}%`
          : 'N/A';
      const leadsToSalesRate =
        leads.length > 0 && sales.length > 0
          ? `${((sales.length / leads.length) * 100).toFixed(1)}%`
          : 'N/A';

      return {
        period: { fromDate, toDate },
        funnel: {
          leads: { total: leads.length },
          calls: {
            total: calls.length,
            qualified: qualifiedCalls,
            qualificationRate:
              calls.length > 0
                ? `${((qualifiedCalls / calls.length) * 100).toFixed(1)}%`
                : '0%',
            noShow: noShowCalls,
            cancelled: cancelledCalls,
          },
          sales: {
            total: sales.length,
            revenue: Number(totalRevenue.toFixed(2)),
            recurringRevenue: Number(recurringRevenue.toFixed(2)),
            currency: currency ?? 'USD (estimated)',
          },
          subscriptions: {
            total: subscriptions.length,
            active: activeSubs,
            trialing: trialSubs,
            canceled: canceledSubs,
          },
        },
        conversionRates: {
          leadsToSales: leadsToSalesRate,
          leadsToCall: leadsToCallsRate,
          callsToSales: callsToSalesRate,
        },
        ...(anyTruncated && {
          warning: 'Some results were truncated after 10 pages. Actual counts may be higher.',
          truncated,
        }),
        ...(extractErrors({ leads: leadsResult, sales: salesResult, calls: callsResult, subscriptions: subscriptionsResult }) && {
          errors: extractErrors({ leads: leadsResult, sales: salesResult, calls: callsResult, subscriptions: subscriptionsResult }),
        }),
      };
    }

    case 'hyros_subscription_health': {
      const fromDate = optString(args, 'fromDate');
      const toDate = optString(args, 'toDate');

      const subParams = (state: string) => (pageId?: string) =>
        client.getSubscriptions({
          subscriptionStates: state,
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
          pageSize: 250,
          pageId,
        });

      // Fetch all pages for each subscription state in parallel
      const [activeResult, trialingResult, canceledResult, pastDueResult, pausedResult] =
        await Promise.allSettled([
          client.fetchAllPages(subParams('ACTIVE')),
          client.fetchAllPages(subParams('TRIALING')),
          client.fetchAllPages(subParams('CANCELED')),
          client.fetchAllPages(subParams('PAST_DUE')),
          client.fetchAllPages(subParams('PAUSED')),
        ]);

      const active = (activeResult.status === 'fulfilled' ? activeResult.value.result : []) as SubRecord[];
      const trialing = (trialingResult.status === 'fulfilled' ? trialingResult.value.result : []) as SubRecord[];
      const canceled = (canceledResult.status === 'fulfilled' ? canceledResult.value.result : []) as SubRecord[];
      const pastDue = (pastDueResult.status === 'fulfilled' ? pastDueResult.value.result : []) as SubRecord[];
      const paused = (pausedResult.status === 'fulfilled' ? pausedResult.value.result : []) as SubRecord[];

      // Normalise all subscription prices to a monthly equivalent for MRR
      const periodicityToMonths: Record<string, number> = {
        DAY: 365 / 12,
        WEEK: 365 / 12 / 7,
        MONTH: 1,
        QUARTER: 1 / 3,
        YEAR: 1 / 12,
      };

      const calcMrr = (subs: SubRecord[]): number =>
        subs.reduce((acc, s) => {
          const price = s.price ?? 0;
          const multiplier = periodicityToMonths[s.periodicity ?? 'MONTH'] ?? 1;
          return acc + price * multiplier;
        }, 0);

      const mrr = calcMrr(active);
      const trialingMrr = calcMrr(trialing);
      const arr = mrr * 12;

      // This is the ratio of canceled to (active + canceled) in the queried window,
      // not a true period-over-period churn rate. Labeled accordingly.
      const canceledToActiveRatio =
        active.length + canceled.length > 0
          ? `${((canceled.length / (active.length + canceled.length)) * 100).toFixed(1)}%`
          : '0%';

      return {
        health: {
          mrr: Number(mrr.toFixed(2)),
          arr: Number(arr.toFixed(2)),
          trialingMrr: Number(trialingMrr.toFixed(2)),
          canceledToActiveRatio,
          canceledToActiveRatioNote: 'Ratio of canceled / (active + canceled) in this window. Not a true period-over-period churn rate.',
        },
        counts: {
          active: active.length,
          trialing: trialing.length,
          canceled: canceled.length,
          pastDue: pastDue.length,
          paused: paused.length,
          total:
            active.length +
            trialing.length +
            canceled.length +
            pastDue.length +
            paused.length,
        },
        alerts: [
          ...(pastDue.length > 0
            ? [`${pastDue.length} subscription(s) past due — may churn soon`]
            : []),
          ...(canceled.length > 0 && fromDate
            ? [`${canceled.length} subscription(s) canceled in this period`]
            : []),
        ],
      };
    }

    default:
      throw new Error(`Unknown compound tool: ${name}`);
  }
}
