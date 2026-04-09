import type {
  HyrosApiResponse,
  Lead,
  LeadsQueryParams,
  Sale,
  SalesQueryParams,
  Call,
  CallsQueryParams,
  Subscription,
  SubscriptionsQueryParams,
  Click,
  ClicksQueryParams,
  Tag,
  Stage,
  StagesQueryParams,
  Domain,
  UserInfo,
  AdSourceRecord,
  SourcesQueryParams,
  Ad,
  AdsQueryParams,
  Keyword,
  LeadJourney,
  AttributionMetrics,
  AttributionReportParams,
  AdAccountReportParams,
  OrderItem,
  CartItem,
  UpdateCartParams,
  CreateClickParams,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
// 401 can occasionally be transient on Hyros (auth service flakiness) — allow one retry
const TRANSIENT_AUTH_CODES = new Set([401]);
const MAX_REQUESTS_PER_SECOND = 25; // Hyros limit is 30/sec; leave headroom

export class HyrosClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly requestTimestamps: number[] = [];

  constructor(apiKey: string, baseUrl = 'https://api.hyros.com/v1') {
    // Enforce HTTPS to prevent API key leakage over plaintext
    if (!baseUrl.startsWith('https://')) {
      throw new Error('HYROS_BASE_URL must use HTTPS to protect API credentials.');
    }
    // Restrict to hyros.com domains to prevent SSRF/credential exfiltration
    const hostname = new URL(baseUrl).hostname;
    if (!hostname.endsWith('.hyros.com') && hostname !== 'hyros.com') {
      throw new Error(`HYROS_BASE_URL must point to a hyros.com domain, got: ${hostname}`);
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /** Sliding-window rate limiter: waits if we'd exceed MAX_REQUESTS_PER_SECOND */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    // Purge timestamps older than 1 second
    while (this.requestTimestamps.length > 0 && now - this.requestTimestamps[0] >= 1000) {
      this.requestTimestamps.shift();
    }
    if (this.requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
      const waitMs = 1000 - (now - this.requestTimestamps[0]);
      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
      // Purge again after waiting
      const after = Date.now();
      while (this.requestTimestamps.length > 0 && after - this.requestTimestamps[0] >= 1000) {
        this.requestTimestamps.shift();
      }
    }
    this.requestTimestamps.push(Date.now());
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
    options?: { responseAsText?: boolean },
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    const jsonBody = body !== undefined ? JSON.stringify(body) : undefined;

    let lastError: Error | null = null;

    await this.rateLimit();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Fresh timeout signal per attempt so retries aren't killed by the first attempt's timer
        const response = await fetch(url.toString(), {
          method,
          headers,
          body: jsonBody,
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
        });

        if (RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_RETRIES - 1) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
          const backoffMs = retryAfterMs || 2 ** attempt * 500;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }

        // 401 can be transiently returned by Hyros — retry once with a short delay
        if (TRANSIENT_AUTH_CODES.has(response.status) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorBody = await response.json() as { message?: string[] | string; result?: string };
            if (errorBody.message) {
              const msg = Array.isArray(errorBody.message)
                ? errorBody.message.join(', ')
                : errorBody.message;
              errorMessage = `Hyros API error: ${msg}`;
            }
          } catch {
            // ignore JSON parse error on error response
          }
          if (response.status === 401) {
            errorMessage += ' — verify your HYROS_API_KEY is correct and has the required permissions';
          }
          throw new Error(errorMessage);
        }

        // Handle text responses (e.g., tracking script returns raw HTML)
        if (options?.responseAsText) {
          const text = await response.text();
          try {
            return JSON.parse(text) as T;
          } catch {
            return { script: text } as T;
          }
        }

        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry non-network errors (our own thrown errors from !response.ok)
        if (lastError.message.startsWith('HTTP ') || lastError.message.startsWith('Hyros API error:')) {
          throw lastError;
        }

        // Retry on network/timeout errors
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
          continue;
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  /**
   * Auto-paginate a list endpoint, collecting all pages up to maxPages.
   * Returns the merged result array. Callers pass a function that fetches
   * one page given a pageId.
   */
  async fetchAllPages<T>(
    fetchPage: (pageId?: string) => Promise<HyrosApiResponse<T[]>>,
    maxPages = 10,
  ): Promise<{ result: T[]; truncated: boolean }> {
    const all: T[] = [];
    let pageId: string | undefined;
    let pages = 0;

    while (pages < maxPages) {
      const response = await fetchPage(pageId);
      const items = response.result ?? [];
      all.push(...items);
      pages++;

      if (!response.nextPageId) break;
      pageId = response.nextPageId;
    }

    return { result: all, truncated: pageId !== undefined };
  }

  // ─── READ OPERATIONS ──────────────────────────────────────────────

  /** Get the authenticated Hyros account info including timezone and currency. */
  async getUserInfo(): Promise<HyrosApiResponse<UserInfo>> {
    return this.request('GET', '/api/v1.0/user-info');
  }

  /** Search leads by ID, email, or date range. Supports pagination. */
  async getLeads(params: LeadsQueryParams): Promise<HyrosApiResponse<Lead[]>> {
    return this.request('GET', '/api/v1.0/leads', params as Record<string, string | number | boolean | undefined>);
  }

  /** Retrieve the full attribution journey (touchpoints) for one or more leads. */
  async getLeadJourney(ids: string): Promise<HyrosApiResponse<LeadJourney[]>> {
    return this.request('GET', '/api/v1.0/leads/journey', { ids });
  }

  /** Query sales records by lead, date range, or other filters. Supports pagination. */
  async getSales(params: SalesQueryParams): Promise<HyrosApiResponse<Sale[]>> {
    return this.request('GET', '/api/v1.0/sales', params as Record<string, string | number | boolean | undefined>);
  }

  /** Query call records by lead, date range, or other filters. Supports pagination. */
  async getCalls(params: CallsQueryParams): Promise<HyrosApiResponse<Call[]>> {
    return this.request('GET', '/api/v1.0/calls', params as Record<string, string | number | boolean | undefined>);
  }

  /** Query subscription records by lead or date range. Supports pagination. */
  async getSubscriptions(params: SubscriptionsQueryParams): Promise<HyrosApiResponse<Subscription[]>> {
    return this.request('GET', '/api/v1.0/subscriptions', params as Record<string, string | number | boolean | undefined>);
  }

  /** Query click events for leads by date range or other filters. Supports pagination. */
  async getClicks(params: ClicksQueryParams): Promise<HyrosApiResponse<Click[]>> {
    return this.request('GET', '/api/v1.0/leads/clicks', params as Record<string, string | number | boolean | undefined>);
  }

  /** List all tags configured in the Hyros account. */
  async getTags(): Promise<HyrosApiResponse<Tag[]>> {
    return this.request('GET', '/api/v1.0/tags');
  }

  /** List pipeline stages, optionally filtered by name or other criteria. */
  async getStages(params: StagesQueryParams): Promise<HyrosApiResponse<Stage[]>> {
    return this.request('GET', '/api/v1.0/stages', params as Record<string, string | number | boolean | undefined>);
  }

  /** List all tracking domains registered in the Hyros account. */
  async getDomains(): Promise<HyrosApiResponse<Domain[]>> {
    return this.request('GET', '/api/v1.0/domains');
  }

  /** Query ad sources (traffic sources) with optional filters. */
  async getSources(params: SourcesQueryParams): Promise<HyrosApiResponse<AdSourceRecord[]>> {
    return this.request('GET', '/api/v1.0/sources', params as Record<string, string | number | boolean | undefined>);
  }

  /** Query ads by source, campaign, or other filters. */
  async getAds(params: AdsQueryParams): Promise<HyrosApiResponse<Ad[]>> {
    return this.request('GET', '/api/v1.0/ads', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  /** List keywords belonging to a specific ad group. */
  async getKeywords(adgroupId: string): Promise<HyrosApiResponse<Keyword[]>> {
    return this.request('GET', '/api/v1.0/keywords', { adgroupId });
  }

  /** Retrieve the Hyros tracking script HTML, optionally scoped to a domain. */
  async getTrackingScript(domain?: string): Promise<{ script: string }> {
    return this.request('GET', '/api/v1.0/tracking-script', domain ? { domain } : undefined, undefined, { responseAsText: true });
  }

  /** Generate an attribution report with revenue, cost, and ROAS metrics for a date range. */
  async getAttributionReport(params: AttributionReportParams): Promise<HyrosApiResponse<AttributionMetrics[]>> {
    return this.request('GET', '/api/v1.0/attribution', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  /** Generate an attribution report scoped to a specific ad account. */
  async getAdAccountReport(params: AdAccountReportParams): Promise<HyrosApiResponse<AttributionMetrics[]>> {
    return this.request('GET', '/api/v1.0/attribution/ad-account', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  // ─── WRITE OPERATIONS ─────────────────────────────────────────────

  /** Create a new lead with optional tags, IPs, phone numbers, and stage. */
  async createLead(data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    tags?: string[];
    leadIps?: string[];
    phoneNumbers?: string[];
    stage?: string;
    adOptimizationConsent?: 'GRANTED' | 'DENIED' | 'UNSPECIFIED';
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/leads', undefined, data);
  }

  /** Update an existing lead found by email, ID, or phone. */
  async updateLead(
    searchParams: { email?: string; id?: string; phone?: string },
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      tags?: string[];
      leadIps?: string[];
      phoneNumbers?: string[];
      adOptimizationConsent?: 'GRANTED' | 'DENIED' | 'UNSPECIFIED';
      leadStage?: { name: string; date?: string };
    },
  ): Promise<HyrosApiResponse<string>> {
    return this.request(
      'PUT',
      '/api/v1.0/leads',
      searchParams as Record<string, string | number | boolean | undefined>,
      data,
    );
  }

  /** Create a new order with line items, shipping, taxes, and discount. */
  async createOrder(data: {
    items: OrderItem[];
    email?: string;
    phoneNumbers?: string[];
    firstName?: string;
    lastName?: string;
    leadIps?: string[];
    orderId?: string;
    externalSubscriptionId?: string;
    cartId?: string;
    date?: string;
    shipping?: number;
    taxes?: number;
    discount?: number;
    currency?: string;
    stage?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/orders', undefined, data);
  }

  /** Refund an order, optionally specifying a partial refund amount. */
  async refundOrder(orderId: string, refundedAmount?: number): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/orders/${encodeURIComponent(orderId)}`, refundedAmount !== undefined ? { refundedAmount } : undefined);
  }

  /** Update sale properties such as refund status or recurring flag. */
  async updateSale(data: {
    ids: string;
    isRecurringSale?: boolean;
    isRefunded?: boolean;
    refundedDate?: string;
    refundedAmount?: number;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/sales', undefined, data);
  }

  /** Permanently delete a sale record. Cannot be undone. */
  async deleteSale(saleId: string): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/sales/${encodeURIComponent(saleId)}`);
  }

  /** Record a new call event linked to a lead by email, phone, or IP. */
  async createCall(data: {
    name: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumbers?: string[];
    leadIps?: string[];
    stage?: string;
    externalId?: string;
    date?: string;
    qualification?: boolean;
    state?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/calls', undefined, data);
  }

  /** Update an existing call's qualification or state. */
  async updateCall(data: {
    name: string;
    ids?: string;
    externalIds?: string;
    qualification?: boolean;
    state?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/calls', undefined, data);
  }

  /** Permanently delete a call record. Cannot be undone. */
  async deleteCall(callId: string): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/calls/${encodeURIComponent(callId)}`);
  }

  /** Create a new subscription with pricing, periodicity, and optional trial dates. */
  async createSubscription(data: {
    status: string;
    startDate: string;
    price: number;
    periodicity: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
    email?: string;
    phoneNumbers?: string[];
    firstName?: string;
    lastName?: string;
    stage?: string;
    subscriptionId?: string;
    trialStartDate?: string;
    trialEndDate?: string;
    planId?: string;
    cancelAtDate?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/subscriptions', undefined, data);
  }

  /** Update a subscription's price, status, or trial/cancellation dates. */
  async updateSubscription(data: {
    ids: string;
    price: number;
    name?: string;
    status?: string;
    startDate?: string;
    trialStartDate?: string;
    trialEndDate?: string;
    cancelAtDate?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/subscriptions', undefined, data);
  }

  /** Register a new ad/traffic source in Hyros. */
  async createSource(data: {
    name: string;
    accountId?: string;
    adSourceId?: string;
    adspendSubType?: string;
    campaignId?: string;
    category?: string;
    goal?: string;
    integationType?: string;
    isDisregard?: boolean;
    isOrganic?: boolean;
    trafficSource?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/sources', undefined, data);
  }

  /** Create a custom cost entry (daily or one-time) linked to specific tags. */
  async createCustomCost(data: {
    startDate: string;
    frequency: 'DAILY' | 'ONE_TIME';
    cost: number;
    tags: string[];
    name?: string;
    endDate?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/custom-costs', undefined, data);
  }

  /** Create a new product with a name, price, and optional category. */
  async createProduct(data: {
    name: string;
    price: number;
    category?: string;
    packages?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/products', undefined, data);
  }

  /** Create a new shopping cart with line items linked to a lead. */
  async createCart(data: {
    items: CartItem[];
    email?: string;
    phoneNumbers?: string[];
    firstName?: string;
    lastName?: string;
    leadIps?: string[];
    cartId?: string;
    date?: string;
    currency?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/carts', undefined, data);
  }

  /** Update an existing cart's items or status. */
  async updateCart(params: UpdateCartParams): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/carts', undefined, params);
  }

  /** Record a new click event for attribution tracking. */
  async createClick(params: CreateClickParams): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/clicks', undefined, params);
  }
}
