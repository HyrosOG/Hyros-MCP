// Hyros API TypeScript types

export interface HyrosApiResponse<T> {
  result: T;
  request_id?: string;
  nextPageId?: string;
}

export interface HyrosErrorResponse {
  result: 'ERROR';
  message: string[];
}

export interface Lead {
  email: string;
  id: string;
  creationDate: string;
  lastUpdatedDate?: string;
  tags?: string[];
  ips?: string[];
  phoneNumbers?: string[];
  firstName?: string;
  lastName?: string;
  provider?: IntegrationProvider;
  currentStage?: LeadStage;
  adOptimizationConsent?: AdOptimizationConsent;
  firstSource?: AdSource;
  lastSource?: AdSource;
  originLead?: Lead;
  isOriginLead?: boolean;
}

export interface LeadStage {
  name: string;
  date?: string;
}

export type AdOptimizationConsent = 'GRANTED' | 'DENIED' | 'UNSPECIFIED';

export interface IntegrationProvider {
  id: string;
  integration: {
    name: string;
    type: string;
    id: string;
  };
}

export interface AdSource {
  sourceLinkId?: string;
  name: string;
  tag?: string;
  disregarded?: boolean;
  organic?: boolean;
  clickDate?: string;
  clickId?: string;
  adSource?: {
    adSourceId: string;
    adAccountId: string;
    platform: string;
  };
  sourceLinkAd?: {
    name: string;
    adSourceId: string;
  };
  trafficSource?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
  };
  goal?: {
    id: string;
    name: string;
  };
}

export interface ProductInfo {
  id?: string;
  sku?: string;
  name: string;
  tag?: string;
  category?: {
    id: string;
    name: string;
  };
  provider?: IntegrationProvider;
}

export interface Price {
  currency: string;
  price: number;
  discount: number;
  hardCost: number;
  refunded: number;
}

export interface UsdPrice {
  price: number;
  discount: number;
  hardCost: number;
  refunded: number;
}

export interface Sale {
  id: string;
  orderId?: string;
  creationDate: string;
  qualified: boolean;
  score: number;
  recurring: boolean;
  quantity: number;
  lead?: Lead;
  price?: Price;
  usdPrice?: UsdPrice;
  product?: ProductInfo;
  firstSource?: AdSource;
  lastSource?: AdSource;
  provider?: IntegrationProvider;
}

export interface Call {
  id: string;
  tag?: string;
  creationDate: string;
  qualified?: boolean;
  score?: number;
  state?: string;
  lead?: Lead;
  firstSource?: AdSource;
  lastSource?: AdSource;
  provider?: IntegrationProvider;
}

export interface Click {
  id: string;
  date: string;
  referrer?: string;
  sessionId?: string;
  ip?: string;
  adSource?: {
    adSourceId: string;
    adAccountId?: string;
    platform: string;
  };
}

export interface Subscription {
  id: string;
  status: string;
  startDate: string;
  price: number;
  periodicity: string;
  planId?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  cancelAtDate?: string;
  lead?: Lead;
}

export interface Tag {
  id?: string;
  name: string;
  type?: string;
}

export interface Stage {
  id: string;
  name: string;
}

export interface Domain {
  id?: string;
  domain: string;
  verified?: boolean;
}

export interface UserInfo {
  id?: string;
  email: string;
  name?: string;
  timezone?: string;
  currency?: string;
  plan?: string;
}

export interface AdSourceRecord {
  id: string;
  name: string;
  integationType?: string;
  accountId?: string;
  adSourceId?: string;
  campaignId?: string;
  isOrganic?: boolean;
  isDisregard?: boolean;
  trafficSource?: string;
  category?: string;
  goal?: string;
}

export interface Ad {
  id: string;
  name: string;
  adGroupId?: string;
  adSetId?: string;
  campaignId?: string;
  platform?: string;
  status?: string;
}

export interface Keyword {
  id: string;
  name: string;
  adGroupId: string;
  matchType?: string;
}

export interface CartItem {
  name: string;
  price: number;
  quantity?: number;
  externalId?: string;
  sku?: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity?: number;
  externalId?: string;
  costOfGoods?: number;
  taxes?: number;
  itemDiscount?: number;
  packages?: string[];
  tag?: string;
  categoryName?: string;
}

export interface LeadJourney {
  lead: Lead;
  sales: Sale[];
  calls: Call[];
  carts: Array<{
    id: string;
    orderId?: string;
    creationDate: string;
    events: number;
    products: ProductInfo[];
    firstSource?: AdSource;
    lastSource?: AdSource;
  }>;
  linkedLeads?: Lead[];
}

export interface AttributionMetrics {
  id?: string;
  name?: string;
  platform?: string;
  revenue?: number;
  cost?: number;
  sales?: number;
  leads?: number;
  clicks?: number;
  impressions?: number;
  roas?: number;
  roi?: number;
  cpa?: number;
  cpl?: number;
  cpc?: number;
  ctr?: number;
  conversionRate?: number;
  ltv?: number;
  refunds?: number;
  refundedAmount?: number;
  [key: string]: unknown;
}

// Request param types
export interface PaginationParams {
  pageSize?: number;
  pageId?: string;
}

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export interface LeadsQueryParams extends PaginationParams, DateRangeParams {
  ids?: string;
  emails?: string;
  phones?: string;
  tags?: string;
  stage?: string;
  // fromDate/toDate filter on join date; these filter on last-modified time.
  updatedFromDate?: string;
  updatedToDate?: string;
}

export interface SalesQueryParams extends PaginationParams, DateRangeParams {
  ids?: string;
  emails?: string;
  leadIds?: string;
  productTags?: string;
  isRecurringSale?: 'RECURRING' | 'NON_RECURRING' | 'ALL';
  saleRefundedState?: 'REFUNDED' | 'NON_REFUNDED' | 'ALL';
}

export interface CallsQueryParams extends PaginationParams, DateRangeParams {
  ids?: string;
  emails?: string;
  leadIds?: string;
  productTags?: string;
  qualified?: boolean;
  state?: string;
}

export interface SubscriptionsQueryParams extends PaginationParams, DateRangeParams {
  ids?: string;
  emails?: string;
  leadIds?: string;
  productTags?: string;
  subscriptionStates?: string;
}

export interface ClicksQueryParams extends PaginationParams, DateRangeParams {
  leadId?: string;
  email?: string;
}

export interface StagesQueryParams extends PaginationParams {
  name?: string;
}

export interface LeadJourneyQueryParams {
  ids?: string;
  emails?: string;
  includeEvents?: boolean;
}

export interface SourcesQueryParams extends PaginationParams {
  adSourceIds?: string;
  includeOrganic?: boolean;
  includeDisregarded?: boolean;
  integationType?: string;
}

export interface AdsQueryParams extends PaginationParams {
  integrationType: string;
  adSourceIds?: string;
}

export interface AttributionReportParams extends PaginationParams {
  attributionModel: 'last_click' | 'scientific' | 'first_click';
  startDate: string;
  endDate: string;
  level: string;
  ids: string;
  fields: string;
  currency?: 'usd' | 'user_currency';
  windowAttributionDaysRange?: number;
  scientificDaysRange?: number;
  dayOfAttribution?: boolean;
  sourceConfiguration?: string;
  ignoreRecurringSales?: boolean;
  isAdAccountId?: boolean;
  timeGroupingOption?: string;
  keywordsIds?: string;
  status?: 'active' | 'paused';
  forecastingOption?: 'first_sale' | 'total_sales';
  newCustomerConfiguration?: string;
}

export interface AdAccountReportParams extends PaginationParams {
  attributionModel: 'last_click' | 'scientific' | 'first_click';
  startDate: string;
  endDate: string;
  ids: string;
  fields: string;
  currency?: 'usd' | 'user_currency';
  windowAttributionDaysRange?: number;
  scientificDaysRange?: number;
  dayOfAttribution?: boolean;
  // The docs call this dateTimeGroupingOption, but the API only honors adLevelDateGroupingOption.
  adLevelDateGroupingOption?: 'ad_account' | 'day' | 'week' | 'month' | 'year';
  sourceConfiguration?: string;
  ignoreRecurringSales?: boolean;
  forecastingOption?: 'first_sale' | 'total_sales';
  newCustomerConfiguration?: string;
}

export interface CreateCartParams {
  items: CartItem[];
  cartId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  leadIps?: string[];
  phoneNumbers?: string[];
  date?: string;
  currency?: string;
}

export interface UpdateCartParams {
  cartId: string;
  items: CartItem[];
  email?: string;
  firstName?: string;
  lastName?: string;
  leadIps?: string[];
  phoneNumbers?: string[];
  date?: string;
  currency?: string;
}

export interface CreateClickParams {
  referrerUrl: string;
  sessionId?: string;
  email?: string;
  previousUrl?: string;
  userAgent?: string;
  ip?: string;
  sourceLinkTag?: string;
  isOrganic?: boolean;
  integrationType?: string;
  adSourceId?: string;
  adspendAdId?: string;
  adSourceClickId?: string;
  phones?: string[];
  tag?: string;
  date?: string;
}

export interface Product {
  id: string;
  name: string;
  tag?: string;
  sku?: string;
  price?: number;
  customCost?: number;
  recurring?: boolean;
  callProduct?: boolean;
  category?: string;
}

export interface ProductsQueryParams extends PaginationParams {
  ids?: string;
  name?: string;
  tags?: string;
  category?: string;
}

export interface UpdateProductParams {
  name?: string;
  price?: number;
  sku?: string;
  costOfGoods?: number;
  category?: string;
  recurring?: boolean;
}

export interface CustomCost {
  id: string;
  cost: number;
  frequency: CustomCostFrequency;
  startDate: string;
  endDate?: string;
  name?: string;
  tags?: string[];
}

export type CustomCostFrequency = 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface CustomCostsQueryParams extends PaginationParams {
  ids?: string;
  // Filters on the cost's active window, not on its creation date.
  fromDate?: string;
  toDate?: string;
}

export interface CustomCostParams {
  cost: number;
  frequency: CustomCostFrequency;
  startDate: string;
  tags: string[];
  endDate?: string;
  name?: string;
}

export interface Cart {
  id: string;
  creationDate: string;
  orderId?: string;
  events?: number;
  items?: CartItem[];
  provider?: IntegrationProvider;
}

export interface CartsQueryParams extends PaginationParams, DateRangeParams {
  emails?: string;
  leadIds?: string;
  purchased?: boolean;
}

export interface TagCount {
  name: string;
  amount: number;
}

export interface TagsCountQueryParams extends PaginationParams {
  // Exact match, not a prefix or substring search: `@california` hits, `calif` does not.
  name?: string;
}

export interface AdAccount {
  id: string;
  name: string;
  type?: string;
}

export interface AdAccountsQueryParams {
  ids?: string;
  fields?: string;
}

export interface UpdateSourceParams {
  name?: string;
  category?: string;
  goal?: string;
  trafficSource?: string;
  isDisregard?: boolean;
  isOrganic?: boolean;
}

export type WebhookEventType =
  | 'sale.attributed'
  | 'sale.refunded'
  | 'lead.opted.in'
  | 'lead.origin.assigned'
  | 'lead.stage.changed'
  | 'lead.tag.added'
  | 'lead.tag.removed'
  | 'call.attributed'
  | 'subscription.created'
  | 'subscription.status.changed';

export interface WebhookSubscription {
  externalId: string;
  name: string;
  targetUrl: string;
  eventTypes: WebhookEventType[];
  state?: string;
  /** Returned only by the create call; store it to verify X-Hyros-Signature. */
  secretKey?: string;
  creationDate?: number;
  lastDeliveryDate?: number | null;
}

export interface CreateWebhookSubscriptionParams {
  name: string;
  targetUrl: string;
  eventTypes: WebhookEventType[];
}
