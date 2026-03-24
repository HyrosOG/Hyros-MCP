# Hyros MCP Server

[![npm version](https://img.shields.io/npm/v/hyros-mcp.svg)](https://www.npmjs.com/package/hyros-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for the [Hyros](https://hyros.com) advertising attribution API. Gives AI assistants (Claude, Cursor, etc.) full access to your Hyros account through the [Model Context Protocol](https://modelcontextprotocol.io).

**38 tools** covering leads, sales, calls, subscriptions, attribution reports, ad management, and smart analytics.

Built by [Carlos Aragon](https://carlosaragon.online).

## Quick Start

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hyros": {
      "command": "npx",
      "args": ["-y", "hyros-mcp"],
      "env": {
        "HYROS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add hyros -- npx -y hyros-mcp
```

Then set your API key in the environment.

### Cursor / Windsurf

Add to your MCP config:

```json
{
  "mcpServers": {
    "hyros": {
      "command": "npx",
      "args": ["-y", "hyros-mcp"],
      "env": {
        "HYROS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `HYROS_API_KEY` | Yes | Your Hyros API key (Settings > Integrations > API) |
| `HYROS_BASE_URL` | No | API base URL (default: `https://api.hyros.com/v1`) |

## Tools

### Read Operations (16)

| Tool | Description |
|---|---|
| `hyros_get_user_info` | Account information |
| `hyros_get_leads` | Search and retrieve leads |
| `hyros_get_lead_journey` | Full customer journey with attribution |
| `hyros_get_sales` | Query sales records |
| `hyros_get_calls` | Query call records |
| `hyros_get_subscriptions` | Query subscriptions |
| `hyros_get_clicks` | Get click history for a lead |
| `hyros_get_tags` | List all tags |
| `hyros_get_stages` | List funnel stages |
| `hyros_get_domains` | List verified domains |
| `hyros_get_sources` | Get ad sources and campaigns |
| `hyros_get_ads` | Get ads by platform |
| `hyros_get_keywords` | Get keywords by ad group |
| `hyros_get_tracking_script` | Get tracking script HTML |
| `hyros_get_attribution_report` | Attribution metrics (ROAS, ROI, CPA, etc.) |
| `hyros_get_ad_account_report` | Account-level attribution metrics |

### Write Operations (17)

| Tool | Description |
|---|---|
| `hyros_create_lead` | Create a new lead |
| `hyros_update_lead` | Update lead data and tags |
| `hyros_create_order` | Register a sale/order |
| `hyros_refund_order` | Process a refund |
| `hyros_update_sale` | Update sale status |
| `hyros_delete_sale` | Delete a sale |
| `hyros_create_call` | Register a call event |
| `hyros_update_call` | Update call qualification |
| `hyros_delete_call` | Delete a call |
| `hyros_create_subscription` | Create subscription |
| `hyros_update_subscription` | Update subscription |
| `hyros_create_source` | Create ad source |
| `hyros_create_custom_cost` | Add custom ad cost |
| `hyros_create_product` | Create product |
| `hyros_create_cart` | Track a shopping cart |
| `hyros_update_cart` | Update pending cart |
| `hyros_create_click` | Manually record a click |

### Smart Analytics (5)

| Tool | Description |
|---|---|
| `hyros_daily_summary` | Today's performance: revenue, leads, calls, subscriptions |
| `hyros_best_performers` | Top ads/campaigns ranked by any metric |
| `hyros_compare_periods` | Compare metrics between two date ranges |
| `hyros_funnel_overview` | Full funnel from leads to revenue |
| `hyros_subscription_health` | MRR, ARR, churn, and subscription breakdown |

## Resources

| URI | Description |
|---|---|
| `hyros://account` | Account information |
| `hyros://tags` | Available tags |
| `hyros://stages` | Funnel stages |

## Prompts

| Name | Description |
|---|---|
| `daily_briefing` | Daily performance summary |
| `campaign_analysis` | Campaign performance analysis |
| `lead_lookup` | Investigate a specific lead |

## Example Questions

Once connected, you can ask things like:

- "What was my revenue today?"
- "Show me my best performing Facebook ads this month"
- "Compare last week vs this week"
- "Look up the customer journey for john@example.com"
- "What's my current MRR?"
- "Which campaigns have the highest ROAS?"
- "Create a lead with email test@example.com and tag them as VIP"

## Security

- HTTPS-only connections (API key never sent over plaintext)
- Domain-restricted to `*.hyros.com` (prevents SSRF)
- Runtime input validation on all tool parameters
- Request timeouts (30s) with retry logic
- Client-side rate limiting (25 req/sec)
- Path traversal prevention on URL parameters

## Development

```bash
git clone https://github.com/CachoMX/Hyros-MCP.git
cd Hyros-MCP
npm install
cp .env.example .env    # Add your API key
npm run build           # Compile TypeScript
npm run dev             # Run in development mode
npm test                # Run tests
```

## License

MIT - [Carlos Aragon](https://carlosaragon.online)
