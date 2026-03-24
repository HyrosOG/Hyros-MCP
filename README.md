# Hyros MCP Server

MCP server for the [Hyros](https://hyros.com) advertising attribution API. Enables LLMs to query and manage Hyros accounts through the Model Context Protocol.

Built by [Carlos Aragon](https://carlosaragon.online).

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and add your Hyros API key
3. Build: `npm run build`
4. Add to your MCP client config (see below)

## MCP Client Configuration

Add to your MCP client config file (e.g. `mcp_config.json`):

```json
{
  "mcpServers": {
    "hyros": {
      "command": "node",
      "args": ["/path/to/hyros-mcp/dist/index.js"],
      "env": {
        "HYROS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Tools

### Read Operations (16)
- `hyros_get_user_info` - Account information
- `hyros_get_leads` - Search and retrieve leads
- `hyros_get_lead_journey` - Full customer journey for leads
- `hyros_get_sales` - Query sales records
- `hyros_get_calls` - Query call records
- `hyros_get_subscriptions` - Query subscriptions
- `hyros_get_clicks` - Get clicks for a lead
- `hyros_get_tags` - Get all available tags
- `hyros_get_stages` - Get lead funnel stages
- `hyros_get_domains` - Get verified domains
- `hyros_get_sources` - Get ad sources/campaigns
- `hyros_get_ads` - Get ads by platform
- `hyros_get_keywords` - Get keywords by ad group
- `hyros_get_tracking_script` - Get tracking script
- `hyros_get_attribution_report` - Attribution metrics for ads/campaigns
- `hyros_get_ad_account_report` - Attribution metrics by ad account

### Write Operations (17)
- `hyros_create_lead` - Create a new lead
- `hyros_update_lead` - Update lead data and tags
- `hyros_create_order` - Register a new sale/order
- `hyros_refund_order` - Process a refund
- `hyros_update_sale` - Update sale status
- `hyros_delete_sale` - Delete a sale
- `hyros_create_call` - Register a call event
- `hyros_update_call` - Update call qualification
- `hyros_delete_call` - Delete a call
- `hyros_create_subscription` - Create subscription
- `hyros_update_subscription` - Update subscription
- `hyros_create_source` - Create ad source
- `hyros_create_custom_cost` - Add custom ad cost
- `hyros_create_product` - Create product
- `hyros_create_cart` - Track a shopping cart before purchase
- `hyros_update_cart` - Update pending cart items
- `hyros_create_click` - Manually record a click event

### Compound/Smart Tools (5)
- `hyros_daily_summary` - Today's performance overview (revenue + leads + top ads)
- `hyros_best_performers` - Top ads/campaigns ranked by metric
- `hyros_compare_periods` - Compare metrics between two date ranges
- `hyros_funnel_overview` - Full funnel: clicks -> leads -> calls -> sales
- `hyros_subscription_health` - Subscription MRR and health metrics

## Resources
- `hyros://account` - Account information
- `hyros://tags` - Available tags
- `hyros://stages` - Funnel stages

## Prompts
- `daily_briefing` - Daily performance summary
- `campaign_analysis` - Campaign performance analysis
- `lead_lookup` - Investigate a specific lead

## Development

```bash
npm install       # Install dependencies
npm run build     # Compile TypeScript
npm run dev       # Run in development mode
npm test          # Run test suite (137 tests)
```

## License

Built by [Carlos Aragon](https://carlosaragon.online).
