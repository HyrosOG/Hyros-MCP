import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { HyrosClient } from '../client.js';

export const compoundTools: Tool[] = [
  {
    name: 'hyros_daily_summary',
    description: 'Get a complete performance summary for today (or a specific date). Returns total revenue from sales, number of new leads, call team performance, and subscription stats. Perfect for answering "how did we do today?" or "what is today\'s revenue?"',
    inputSchema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to summarize in YYYY-MM-DD format (defaults to today)',
        },
        timezone: {
          type: 'string',
          description: 'Timezone offset for the date (e.g., -05:00 for EST). Defaults to +00:00',
        },
      },
      required: [],
    },
  },
  {
    name: 'hyros_best_performers',
    description: 'Get the top performing ads/campaigns ranked by revenue, ROAS, ROI, etc. for a given date range. Requires an ad account ID and the level of analysis. Use hyros_get_sources to find your ad account IDs first. Perfect for "what are my best ads this week?" or "which campaigns have the highest ROAS this month?"',
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
    },
  },
  {
    name: 'hyros_compare_periods',
    description: 'Compare ad performance metrics between two date ranges using attribution data. Requires an ad account ID and level. Returns revenue, cost, ROAS, sales, leads, and percentage changes. Perfect for "compare this week vs last week".',
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
    },
  },
  {
    name: 'hyros_funnel_overview',
    description: 'Get a complete funnel overview showing the full customer journey from clicks to revenue for a date range. Shows: total leads, calls (with qualification rate), sales (with amounts), subscriptions, and calculates conversion rates between each stage.',
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
    },
  },
  {
    name: 'hyros_subscription_health',
    description: 'Get a health report for your subscription business. Shows active count, MRR (monthly recurring revenue), trial count, churn (canceled this period), past due, and other subscription statuses. Perfect for "what is my MRR?" or "how many active subscribers do I have?"',
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
    },
  },
];

// Helper to get today's date range in ISO 8601
function getTodayRange(date?: string, timezone = '+00:00'): { fromDate: string; toDate: string } {
  const tz = timezone.startsWith('+') || timezone.startsWith('-') ? timezone : `+${timezone}`;
  const d = date ?? new Date().toISOString().split('T')[0];
  return {
    fromDate: `${d}T00:00:00${tz}`,
    toDate: `${d}T23:59:59${tz}`,
  };
}

// Helper to safely sum a numeric field from attribution metrics
function sumMetric(items: Array<Record<string, unknown>>, field: string): number {
  return items.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
}

// Helper to calculate percentage change
function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+inf%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

export async function handleCompoundTool(
  name: string,
  args: Record<string, unknown>,
  client: HyrosClient,
): Promise<unknown> {
  switch (name) {
    case 'hyros_daily_summary': {
      const date = args.date as string | undefined;
      const timezone = (args.timezone as string | undefined) ?? '+00:00';

      const { fromDate, toDate } = getTodayRange(date, timezone);

      // Fetch data in parallel; individual failures do not abort the whole summary
      const [leadsResult, salesResult, callsResult, subscriptionsResult] = await Promise.allSettled([
        client.getLeads({ fromDate, toDate, pageSize: 250 }),
        client.getSales({ fromDate, toDate, pageSize: 250 }),
        client.getCalls({ fromDate, toDate, pageSize: 250 }),
        client.getSubscriptions({ fromDate, toDate, pageSize: 250 }),
      ]);

      const leads = leadsResult.status === 'fulfilled' ? (leadsResult.value.result ?? []) : [];
      const sales = salesResult.status === 'fulfilled' ? (salesResult.value.result ?? []) : [];
      const calls = callsResult.status === 'fulfilled' ? (callsResult.value.result ?? []) : [];
      const subscriptions = subscriptionsResult.status === 'fulfilled' ? (subscriptionsResult.value.result ?? []) : [];

      type SaleRecord = { usdPrice?: { price?: number }; price?: { price?: number }; recurring?: boolean };
      type CallRecord = { qualified?: boolean; state?: string };
      type SubRecord = { status?: string };

      const salesTyped = sales as SaleRecord[];
      const callsTyped = calls as CallRecord[];
      const subsTyped = subscriptions as SubRecord[];

      const totalRevenue = salesTyped.reduce((acc, s) => acc + (s.usdPrice?.price ?? s.price?.price ?? 0), 0);
      const recurringRevenue = salesTyped.filter((s) => s.recurring).reduce((acc, s) => acc + (s.usdPrice?.price ?? s.price?.price ?? 0), 0);
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
        errors: {
          leads: leadsResult.status === 'rejected' ? (leadsResult.reason as Error)?.message : undefined,
          sales: salesResult.status === 'rejected' ? (salesResult.reason as Error)?.message : undefined,
          calls: callsResult.status === 'rejected' ? (callsResult.reason as Error)?.message : undefined,
          subscriptions: subscriptionsResult.status === 'rejected' ? (subscriptionsResult.reason as Error)?.message : undefined,
        },
      };
    }

    case 'hyros_best_performers': {
      const startDate = args.startDate as string;
      const endDate = args.endDate as string;
      const adAccountId = args.adAccountId as string;
      const level = args.level as string;
      const rankBy = (args.rankBy as string | undefined) ?? 'revenue';
      const topCount = (args.topCount as number | undefined) ?? 10;
      const attributionModel = (args.attributionModel as 'last_click' | 'scientific' | 'first_click' | undefined) ?? 'last_click';
      const currency = args.currency as 'usd' | 'user_currency' | undefined;

      const fields = 'revenue,cost,sales,leads,roas,roi,name,parent_name';

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

      const lowerIsBetter = ['cpa', 'cost_per_lead', 'cost_per_sale', 'cost'].includes(rankBy);
      const sorted = [...items]
        .filter((item) => item[rankBy] !== undefined && item[rankBy] !== null)
        .sort((a, b) => {
          const aVal = Number(a[rankBy]) || 0;
          const bVal = Number(b[rankBy]) || 0;
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
        })),
      };
    }

    case 'hyros_compare_periods': {
      const p1Start = args.period1StartDate as string;
      const p1End = args.period1EndDate as string;
      const p2Start = args.period2StartDate as string;
      const p2End = args.period2EndDate as string;
      const adAccountId = args.adAccountId as string;
      const level = args.level as string;
      const attributionModel = (args.attributionModel as 'last_click' | 'scientific' | 'first_click' | undefined) ?? 'last_click';
      const currency = args.currency as 'usd' | 'user_currency' | undefined;

      const fields = 'revenue,cost,sales,leads,roas,roi';

      const [p1Result, p2Result] = await Promise.all([
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

      const p1Items = (p1Result.result ?? []) as Array<Record<string, unknown>>;
      const p2Items = (p2Result.result ?? []) as Array<Record<string, unknown>>;

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
      };
    }

    case 'hyros_funnel_overview': {
      const fromDate = args.fromDate as string;
      const toDate = args.toDate as string;
      const currency = args.currency as string | undefined;

      const [leadsResult, salesResult, callsResult, subscriptionsResult] = await Promise.allSettled([
        client.getLeads({ fromDate, toDate, pageSize: 250 }),
        client.getSales({ fromDate, toDate, pageSize: 250 }),
        client.getCalls({ fromDate, toDate, pageSize: 250 }),
        client.getSubscriptions({ fromDate, toDate, pageSize: 250 }),
      ]);

      const leads =
        leadsResult.status === 'fulfilled' ? (leadsResult.value.result ?? []) : [];
      const sales =
        salesResult.status === 'fulfilled' ? (salesResult.value.result ?? []) : [];
      const calls =
        callsResult.status === 'fulfilled' ? (callsResult.value.result ?? []) : [];
      const subscriptions =
        subscriptionsResult.status === 'fulfilled'
          ? (subscriptionsResult.value.result ?? [])
          : [];

      type SaleRecord = {
        usdPrice?: { price?: number };
        price?: { price?: number; currency?: string };
        recurring?: boolean;
      };
      type CallRecord = { qualified?: boolean; state?: string };
      type SubRecord = { status?: string; price?: number; periodicity?: string };

      const salesTyped = sales as SaleRecord[];
      const callsTyped = calls as CallRecord[];
      const subsTyped = subscriptions as SubRecord[];

      // Revenue: prefer USD-normalised price where available
      const totalRevenue = salesTyped.reduce((acc, s) => {
        const p = s.usdPrice?.price ?? s.price?.price ?? 0;
        return acc + p;
      }, 0);
      const recurringRevenue = salesTyped
        .filter((s) => s.recurring)
        .reduce((acc, s) => acc + (s.usdPrice?.price ?? s.price?.price ?? 0), 0);

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
        errors: {
          leads:
            leadsResult.status === 'rejected' ? String(leadsResult.reason) : undefined,
          sales:
            salesResult.status === 'rejected' ? String(salesResult.reason) : undefined,
          calls:
            callsResult.status === 'rejected' ? String(callsResult.reason) : undefined,
          subscriptions:
            subscriptionsResult.status === 'rejected'
              ? String(subscriptionsResult.reason)
              : undefined,
        },
      };
    }

    case 'hyros_subscription_health': {
      const fromDate = args.fromDate as string | undefined;
      const toDate = args.toDate as string | undefined;

      // Fetch all meaningful subscription states in parallel
      const [activeResult, trialingResult, canceledResult, pastDueResult, pausedResult] =
        await Promise.allSettled([
          client.getSubscriptions({
            subscriptionStates: 'ACTIVE',
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            pageSize: 250,
          }),
          client.getSubscriptions({
            subscriptionStates: 'TRIALING',
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            pageSize: 250,
          }),
          client.getSubscriptions({
            subscriptionStates: 'CANCELED',
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            pageSize: 250,
          }),
          client.getSubscriptions({
            subscriptionStates: 'PAST_DUE',
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            pageSize: 250,
          }),
          client.getSubscriptions({
            subscriptionStates: 'PAUSED',
            ...(fromDate && { fromDate }),
            ...(toDate && { toDate }),
            pageSize: 250,
          }),
        ]);

      type SubRecord = { price?: number; periodicity?: string };

      const active =
        activeResult.status === 'fulfilled'
          ? ((activeResult.value.result ?? []) as SubRecord[])
          : [];
      const trialing =
        trialingResult.status === 'fulfilled'
          ? ((trialingResult.value.result ?? []) as SubRecord[])
          : [];
      const canceled =
        canceledResult.status === 'fulfilled'
          ? ((canceledResult.value.result ?? []) as SubRecord[])
          : [];
      const pastDue =
        pastDueResult.status === 'fulfilled'
          ? ((pastDueResult.value.result ?? []) as SubRecord[])
          : [];
      const paused =
        pausedResult.status === 'fulfilled'
          ? ((pausedResult.value.result ?? []) as SubRecord[])
          : [];

      // Normalise all subscription prices to a monthly equivalent for MRR
      const periodicityToMonths: Record<string, number> = {
        DAY: 30,
        WEEK: 4.33,
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
      const churnRate =
        active.length + canceled.length > 0
          ? `${((canceled.length / (active.length + canceled.length)) * 100).toFixed(1)}%`
          : '0%';

      return {
        health: {
          mrr: Number(mrr.toFixed(2)),
          arr: Number(arr.toFixed(2)),
          trialingMrr: Number(trialingMrr.toFixed(2)),
          churnRate,
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
