# Hyros API v1.39 - Live Verification

Follow-up to [hyros-api-improvement-proposals.md](hyros-api-improvement-proposals.md).

Hyros published REST API **1.39** (from 1.37) and Webhooks **1.1** (from 1.0) on
**2026-08-04 at 13:16:05 GMT**. Both spec files carry that same `last-modified`.

Everything below was tested live on **2026-08-04** with curl against
`https://api.hyros.com/v1`, roughly 40 requests. The key resolves to
`info@triggerfishleads.com` (TriggerFish Leads, LLC).

Every filter was probed twice: once with a valid value, once with a bogus value.
A filter that returns rows for both is being ignored, not applied. That pair is
the only way to tell the two apart while the API silently drops unknown
parameters.

## Scoreboard

| Group | Count |
|---|---|
| Shipped and verified working | 10 |
| Documented but not implemented | 3 |
| Locked behind a missing role on a normal key | 8 endpoint groups, 7 opened with an all-roles key |
| Not addressed | 2 |
| New undocumented behavior | 4 |

## Shipped and verified working

| # | Proposal | Probe | Result |
|---|---|---|---|
| 1 | Remove tags | `PUT /leads` `{"removeTags":["!probe-b"]}` on a lead holding `!probe-a,!probe-b` | left `!probe-a` only |
| 2 | Filter leads by tag | `tags=@california` vs `tags=@no-existe-xyz` | rows vs `[]` |
| T2 | Filter leads by stage | `stage=qualified-lead` vs bogus | rows vs `[]` |
| 3 | Incremental sync | `updatedFromDate` for today vs year 2030 | rows vs `[]` |
| 11 | Search by phone | `phones=19295443901`, a lead that **has** a real email | returned that lead |
| T1/14 | Read parity | `GET /leads` payload | `currentStage {name,date}` and `adOptimizationConsent` both present |
| 12 | Lead journey | `?emails=` and `includeEvents=true` | 200, plus `subscriptions` and `journey` arrays |
| 13 | Tag counts | `GET /tags/count?name=@california` | `{"name":"@california","amount":87}` |
| 15 | Ad accounts | `GET /ad-accounts` with no `ids` | listed all 3 connected accounts; `fields=id,name` trims correctly |
| 17 | Stage counts | `GET /stages` | real amounts (31164, 22473), no more `null` |

Two caveats inside this group.

`GET /tags/count` accepts `name` as an **exact match only**. `@california`
returns the tag; `california` and `calif` both return `[]`. Proposal 13 asked
for name search, so this half landed.

`GET /leads?phones=` now finds leads that carry a real email address. That was
the exact limitation flagged in proposal 11, and it is closed.

## Documented but not implemented

### 1. Strict request validation is announced in the spec and absent from the API

The 1.39 description opens with a section titled "Unrecognized parameters and
fields", promising `400 Bad Request` naming the offender. The API still returns
`200` and ignores the input:

```
GET /leads?bogusParam=1          -> 200, normal list
GET /leads?email=maria...        -> 200, 106 KB = the entire unfiltered lead base
PUT /leads {"campoInventadoXyz"} -> 200 OK
```

The `email` versus `emails` typo is the case the spec text names directly, and it
still hands back every lead in the account while looking like a successful
filter. This is proposal 5, reproduced without change from 2026-07-01.

Risk: a client reads the 1.39 spec, trusts the guarantee, and drops their own
defensive checks. The failure mode gets worse than before the release.

### 2. `dateTimeGroupingOption` survived the release untouched

Same ad account, same 30-day window, three variants:

| Parameter sent | Rows returned |
|---|---|
| `dateTimeGroupingOption=day` (what 1.39 documents) | 1 aggregate row |
| nothing | 1 aggregate row, byte-identical |
| `adLevelDateGroupingOption=day` | 30 daily rows |

The 30 daily rows sum exactly to the aggregate: 114 sales, $29,463.63.

Engineering already confirmed on 2026-07-28 that `adLevelDateGroupingOption` is
the real parameter name. The spec at line 2331 still documents the name the API
does not honor. Combined with the missing strict validation, a client sending
the documented parameter gets a plausible aggregate row and no error - the same
trap that cost a full day of joint debugging on 2026-07-24.

### 3. Async write latency is roughly 5 minutes for updates, not the documented 10 seconds

The 1.39 spec states changes are "typically visible within ~10 seconds".

Creates match that: a `POST /leads` was readable 5 seconds later. Updates do not.
Four consecutive `PUT /leads` calls each returned `200 OK` while
`lastUpdatedDate` stayed frozen at `11:15:45` for six minutes. All four then
landed together at `11:20:59`.

This nearly produced a false bug report. The first `PUT` carried `removeTags`,
and after 80 seconds of no effect the obvious reading was that `removeTags` was
broken. A positive control - a plain tag **add**, a path known to work - showed
the same stall, which isolated the cause as queue latency rather than a broken
field. `removeTags` works.

Any integration that writes and then reads back inside a minute will read stale
data and may retry, which is the duplicate-creation loop described in proposal
16. The documented number should match observed update behavior, or creates and
updates should carry separate numbers.

## Deployed but locked behind a missing role

A nonexistent route returns `404 Not found`. These return `401 Unauthorized`,
which proves the code is deployed and the key lacks the role:

- `GET|PUT|DELETE /products`
- `GET|PUT|DELETE /custom-costs`
- `GET /carts`
- `GET|DELETE /webhook-subscriptions`
- `GET|DELETE /conversion-definition`
- `PUT|DELETE /sources/{tag}`
- `DELETE /leads`

Proposals 6, 7, 8, 9, 10 and the webhook management half of proposal 4 could not
be exercised with this key. The second pass below reaches them.

One improvement worth noting. A wrong key and a missing role are now
distinguishable by response body:

| Case | Body |
|---|---|
| Invalid key | `{"@type":"hyros-api-response-dto","result":"ERROR","message":["Api key not valid"]}` |
| Valid key, missing role | `Unauthorized` (plain text, 12 bytes) |

Still `401` rather than `403`, still no role named, and the role system remains
absent from the public spec. The proposal 18 DX request stands.

## Second pass: the same probes with an all-roles key

The account holder issued a second key with every role enabled, on a different
account (`carlos.aragon@hyros.com`). That unlocked 7 of the 8 groups above and
let the full CRUD loops run.

| Endpoint group | Result |
|---|---|
| `products` GET / PUT / DELETE | full loop verified: created at 1.23, updated to 9.99, deleted |
| `custom-costs` GET / PUT / DELETE | GET works; see the create anomaly below |
| `carts` GET | works |
| `webhook-subscriptions` POST / GET / DELETE | full loop verified |
| `sources` PUT / DELETE | rename landed, delete returned 200 |
| `leads` DELETE | verified: the lead was gone about 5 minutes later |
| `conversion-definition` GET / DELETE | still `401` even with every role enabled |

`conversion-definition` is the outlier. Every other endpoint opened up, so
either its role is missing from the catalog or the endpoint is gated on
something other than roles.

### Webhook subscription writes are synchronous

`POST /webhook-subscriptions` returns the created object inline, including
`externalId` and `secretKey`, and `DELETE` removes it from the list on the next
read. Both skip the async queue that every other write goes through. Worth
documenting, because it is the one write whose result a client can trust
immediately.

### `POST /custom-costs` returns 200 and the cost never appears

A cost created with `startDate: 2026-08-01`, `frequency: ONE_TIME`, `cost: 1.0`
and an existing tag returned `200 OK`. Fifteen minutes later `GET /custom-costs`
with a 2020-2030 window still returned the same 6 pre-existing costs and not the
new one.

Whether the write is dropped or the read is incomplete could not be isolated
from the API alone; checking the app UI for that cost would settle it. Note the
endpoint does validate: an earlier attempt with a nonexistent tag was correctly
rejected with `400 Some tags were not found`.

### Two more date formats

Proposal 17 flagged `GET /sales` returning Java `Date.toString()`. Two more
turned up:

| Field | Format |
|---|---|
| `GET /carts` → `creationDate` | `"Thu Jul 23 04:04:48 UTC 2026"` (Java) |
| webhook subscription `creationDate` | `1785861499497` (epoch millis) |
| everything else | ISO 8601 |

Three date encodings across one API means every client writes three parsers.

### `GET /sources` has no name or tag filter

The test account holds **7,111 sources across 29 pages**. Confirming that one
source existed meant paging through all of them, because `GET /sources` filters
only by `adSourceIds` (which itself requires `integrationType`), `includeOrganic`,
and `includeDisregarded`. A `name` or `tag` filter, matching what `/tags/count`
now offers, would turn a 29-request sweep into one call.

This also nearly produced a second false negative: an 8-page sweep found nothing
and the obvious reading was that `POST /sources` had silently dropped the record.
The source was on page 25.

## Not addressed

**Agency keys (proposal 18).** No change. The agency key returns `200` on
`/user-info` and `401` on leads, sales and tags. An `accountId` query parameter
changes nothing. `/user-info` exposes `allowedAccounts` and `accessibleAccounts`
but no role information.

**Sales endpoint (proposal 17).** The drift was documented rather than fixed, and
live behavior matches the new text: `orderId` is ignored, `updatedFromDate` is
ignored, and dates come back as `"Tue Aug 04 15:53:15 UTC 2026"` instead of ISO
8601. `updatedFromDate` reached `GET /leads` only, not `/sales` or
`/subscriptions`, so refund and subscription-status sync still has no incremental
path.

## New undocumented behavior: firstName is lowercased

`POST` and `PUT /leads` normalize `firstName` to lowercase before storing it.

| Sent | Stored |
|---|---|
| `"CAMBIADO"` | `"cambiado"` |
| `"Probe2"` | `"probe2"` |

Nothing in the spec mentions the transform. Any client mirroring names into a CRM
or using them in email merge fields gets lowercase back and will need to
re-capitalize. Either document it or preserve the input casing. `lastName` was
not tested; it likely behaves the same way and is worth checking.

## Cleanup owed

`DELETE /leads` works, as the second pass confirmed, but the TriggerFish key
lacks the role for it. Two disposable leads created for the `removeTags` test
are therefore still in that account, awaiting deletion from the app:

| Email | Lead id | Tags |
|---|---|---|
| `probe-v139-d096fc@example.com` | `416289955c13a1a59085451bfd35e51f2e5f9cd3aac86476a2b88442cbbdd50b` | `!probe-a, !probe-c, !probe-d` |
| `probe2-v139-442bbd@gmail.com` | `c420bf2d7d5d5e33305f2220e6bfb6b3e74da3f04586d6a0742771c531ae5824` | `!probe2-a, !probe2-b` |

The `!audit-a`, `!audit-b`, `!audit-c` leads from the 2026-07-01 audit are still
in the same account for the same reason.

Everything created on `carlos.aragon@hyros.com` during the second pass was
removed through the API: one product, one ad source, one lead, and two webhook
subscriptions. The custom cost from the anomaly above never materialized, so
there was nothing to remove.

Neither of the two Hyros MCP connectors available during this work could reach
the TriggerFish account: both authenticate as `carlos.aragon@hyros.com`, and a
lead search there returns nothing. That is proposal 18 in practice, on a real
cleanup task.

## Reproducing any of this

```bash
BASE=https://api.hyros.com/v1
K=$HYROS_API_KEY

# strict validation is off: both return 200
curl -s "$BASE/api/v1.0/leads?bogusParam=1&pageSize=1" -H "API-Key: $K" | head -c 120
curl -s "$BASE/api/v1.0/leads?email=someone@example.com" -H "API-Key: $K" | wc -c

# grouping: 1 row vs 30 rows
Q="attributionModel=last_click&startDate=2026-07-01T00:00:00&endDate=2026-07-30T23:59:59&fields=sales,revenue&ids=<AD_ACCOUNT_ID>"
curl -s "$BASE/api/v1.0/attribution/ad-account?$Q&dateTimeGroupingOption=day"  -H "API-Key: $K"
curl -s "$BASE/api/v1.0/attribution/ad-account?$Q&adLevelDateGroupingOption=day" -H "API-Key: $K"

# deployed vs missing: 404 vs 401
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/v1.0/no-existe-nada" -H "API-Key: $K"
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/v1.0/products?pageSize=1" -H "API-Key: $K"
```

## Suggested tickets

1. Ship strict validation, or remove the section from the 1.39 spec. Shipping the
   promise without the behavior is worse than the old silent-ignore, because
   clients now have a written guarantee to rely on.
2. Rename `dateTimeGroupingOption` to `adLevelDateGroupingOption` in the
   `/attribution/ad-account` spec, or teach the API to accept both.
3. Correct the async latency figure, with separate numbers for creates and
   updates.
4. Add read roles to the standard key role catalog, or document which role each
   new endpoint requires and return `403` naming it.
5. Document or drop the `firstName` lowercase transform.
6. Investigate `POST /custom-costs`: it returns `200` and the cost is not
   retrievable afterwards.
7. Settle on one date encoding, or document the three that ship today
   (ISO 8601, Java `Date.toString()`, epoch millis).
8. Add a `name` or `tag` filter to `GET /sources`. Finding one source in an
   account with 7,111 of them currently takes 29 requests.
9. Check why `conversion-definition` stays `401` on a key with every role
   enabled, unlike the seven other gated groups.
