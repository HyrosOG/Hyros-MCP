# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-04

Support for Hyros REST API v1.39 and Webhooks v1.1, published 2026-08-04. Tool
count goes from 38 to 53. Every addition was verified against a live account;
the findings are in
[docs/hyros-api-v139-verification.md](docs/hyros-api-v139-verification.md).

### Added

Read tools:

- `hyros_get_tags_count` - tags with lead counts and pagination
- `hyros_get_ad_accounts` - list connected ad accounts, no ids needed
- `hyros_get_products` - catalog with price and cost of goods
- `hyros_get_custom_costs` - custom costs active in a date window
- `hyros_get_carts` - carts, filterable to abandoned ones
- `hyros_get_webhook_subscriptions` - configured webhook subscriptions

Write tools:

- `hyros_delete_lead` - erase a lead and its PII for GDPR and CCPA requests
- `hyros_update_product`, `hyros_delete_product`
- `hyros_update_custom_cost`, `hyros_delete_custom_cost`
- `hyros_update_source`, `hyros_delete_source` - addressed by tag, not id
- `hyros_create_webhook_subscription`, `hyros_delete_webhook_subscription`

New parameters on existing tools:

- `hyros_get_leads` accepts `phones`, `tags`, `stage`, `updatedFromDate` and
  `updatedToDate`. The `updated*` pair filters on last-modified time, which
  makes incremental sync possible: `fromDate`/`toDate` only see the join date
  and miss re-tagged or re-staged leads.
- `hyros_get_lead_journey` accepts `emails` and `includeEvents`, and the
  response now carries `subscriptions`.
- `hyros_update_lead` accepts `removeTags`.

Other:

- `npm run smoke:v139` exercises every new tool against a live account through
  the same handlers the server dispatches to.

### Changed

- `hyros_get_lead_journey` no longer requires `ids`. Pass `ids` or `emails`.
  Calls that already send `ids` keep working.
- The `Lead` type models what the API actually returns: `currentStage`,
  `adOptimizationConsent`, `lastUpdatedDate`, `firstSource`, `lastSource`,
  `originLead` and `isOriginLead`. The `stage` field it previously declared was
  never returned by any endpoint.
- The `lead_lookup` prompt queries the journey by email instead of looking up
  the lead id first.

### Deprecated

- `hyros_get_tags`, following Hyros deprecating `GET /tags`. Use
  `hyros_get_tags_count`, which adds lead counts, pagination, and exact-name
  lookup.

### Notes

Several of these tools need roles that Hyros API keys do not carry by default,
and the API returns a bare `401 Unauthorized` when a role is missing. See
"If a tool answers Unauthorized" in the README.

`hyros_get_tags_count` matches `name` exactly, prefix included: `@california`
finds the tag, `california` returns nothing.

Writes are queued by the API. Creates were visible in about 5 seconds during
testing, but a chain of updates took roughly 5 minutes to land, well past the
"~10 seconds" the Hyros spec states. Treat a `200` as accepted, not applied.

## [1.0.4]

Baseline before this changelog existed. See the git history.
