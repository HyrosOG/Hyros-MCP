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
} from './types.js';

export class HyrosClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(apiKey: string, baseUrl = 'https://api.hyros.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const options: RequestInit = {
      method,
      headers: {
        'API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

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
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // ─── READ OPERATIONS ──────────────────────────────────────────────

  async getUserInfo(): Promise<HyrosApiResponse<UserInfo>> {
    return this.request('GET', '/api/v1.0/user-info');
  }

  async getLeads(params: LeadsQueryParams): Promise<HyrosApiResponse<Lead[]>> {
    return this.request('GET', '/api/v1.0/leads', params as Record<string, string | number | boolean | undefined>);
  }

  async getLeadJourney(ids: string): Promise<HyrosApiResponse<LeadJourney[]>> {
    return this.request('GET', '/api/v1.0/leads/journey', { ids });
  }

  async getSales(params: SalesQueryParams): Promise<HyrosApiResponse<Sale[]>> {
    return this.request('GET', '/api/v1.0/sales', params as Record<string, string | number | boolean | undefined>);
  }

  async getCalls(params: CallsQueryParams): Promise<HyrosApiResponse<Call[]>> {
    return this.request('GET', '/api/v1.0/calls', params as Record<string, string | number | boolean | undefined>);
  }

  async getSubscriptions(params: SubscriptionsQueryParams): Promise<HyrosApiResponse<Subscription[]>> {
    return this.request('GET', '/api/v1.0/subscriptions', params as Record<string, string | number | boolean | undefined>);
  }

  async getClicks(params: ClicksQueryParams): Promise<HyrosApiResponse<Click[]>> {
    return this.request('GET', '/api/v1.0/leads/clicks', params as Record<string, string | number | boolean | undefined>);
  }

  async getTags(): Promise<HyrosApiResponse<Tag[]>> {
    return this.request('GET', '/api/v1.0/tags');
  }

  async getStages(params: StagesQueryParams): Promise<HyrosApiResponse<Stage[]>> {
    return this.request('GET', '/api/v1.0/stages', params as Record<string, string | number | boolean | undefined>);
  }

  async getDomains(): Promise<HyrosApiResponse<Domain[]>> {
    return this.request('GET', '/api/v1.0/domains');
  }

  async getSources(params: SourcesQueryParams): Promise<HyrosApiResponse<AdSourceRecord[]>> {
    return this.request('GET', '/api/v1.0/sources', params as Record<string, string | number | boolean | undefined>);
  }

  async getAds(params: AdsQueryParams): Promise<HyrosApiResponse<Ad[]>> {
    return this.request('GET', '/api/v1.0/ads', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  async getKeywords(adgroupId: string): Promise<HyrosApiResponse<Keyword[]>> {
    return this.request('GET', '/api/v1.0/keywords', { adgroupId });
  }

  async getTrackingScript(domain?: string): Promise<HyrosApiResponse<{ script: string }>> {
    return this.request('GET', '/api/v1.0/tracking-script', domain ? { domain } : undefined);
  }

  async getAttributionReport(params: AttributionReportParams): Promise<HyrosApiResponse<AttributionMetrics[]>> {
    return this.request('GET', '/api/v1.0/attribution', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  async getAdAccountReport(params: AdAccountReportParams): Promise<HyrosApiResponse<AttributionMetrics[]>> {
    return this.request('GET', '/api/v1.0/attribution/ad-account', params as unknown as Record<string, string | number | boolean | undefined>);
  }

  // ─── WRITE OPERATIONS ─────────────────────────────────────────────

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

  async refundOrder(orderId: string, refundedAmount?: number): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/orders/${orderId}`, refundedAmount !== undefined ? { refundedAmount } : undefined);
  }

  async updateSale(data: {
    ids: string;
    isRecurringSale?: boolean;
    isRefunded?: boolean;
    refundedDate?: string;
    refundedAmount?: number;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/sales', data as unknown as Record<string, string | number | boolean | undefined>);
  }

  async deleteSale(saleId: string): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/sales/${saleId}`);
  }

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

  async updateCall(data: {
    name: string;
    ids?: string;
    externalIds?: string;
    qualification?: boolean;
    state?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('PUT', '/api/v1.0/calls', undefined, data);
  }

  async deleteCall(callId: string): Promise<HyrosApiResponse<string>> {
    return this.request('DELETE', `/api/v1.0/calls/${callId}`);
  }

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

  async createProduct(data: {
    name: string;
    price: number;
    category?: string;
    packages?: string;
  }): Promise<HyrosApiResponse<string>> {
    return this.request('POST', '/api/v1.0/products', undefined, data);
  }

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
}
