# Feature request [API]: let agency API keys read their client accounts' data

**Reported by:** Carlos
**Date:** 2026-07-27
**Component:** Public REST API - API key roles and account scoping
**Type:** Feature gap (with a live client friction case)
**Priority:** High for the agency segment

## Problem

Agencies manage client accounts through the in-app account switcher, but that relationship does not exist in the public API:

- The agency-level API key editor offers only two roles: `General > Get User Information` and `Sales Data > Create Orders`. No read role exists in the catalog, so there is nothing an agency can grant to unlock reads.
- With both available roles enabled, `GET /user-info` returns 200 and even lists the agency's `accessibleAccounts`, while **every data endpoint returns 401** (leads, sales, tags, stages, sources, ad-accounts, attribution).
- No account-scoping mechanism exists: no `accountId` parameter, no account header, no key exchange.

Consequence: an agency with 20 clients must collect, store, and rotate 20 client API keys to automate anything, and MCP/AI connectors stay locked to one account per connection.

## Evidence

**Live API verification (2026-07-27),** agency key with 6 APPROVED accessible accounts and both catalog roles enabled:

| Endpoint | Result |
|---|---|
| `GET /user-info` | 200, lists the 6 accessible accounts |
| `GET /leads`, `/sales`, `/tags`, `/stages`, `/sources`, `/ad-accounts`, `/attribution/ad-account` | 401, plain-text `Unauthorized` |

Probes for undocumented scoping (`?accountId=`, `Account-Id` header) change nothing. The agency key UI confirms the two-role catalog (screenshot available).

**Live client case, official MCP (2026-07-27):** an agency user asked their assistant to pull a client account's Facebook attribution and could not - the connection was scoped to the agency's own key and the client account was unreachable. Support's current guidance is to disconnect the MCP, log into the client account, and reconnect, once per client per switch. The support thread also confirmed that agency access without re-logging is planned but unscheduled. This request is the API-level foundation that work needs anyway: the limitation is not only in the MCP, it is in the API itself.

## Proposed implementation

Two layers; each ships independently.

### Layer 1 - role catalog

Offer the standard read roles on agency-level keys (same catalog as client-account keys). Smallest change, but on its own it only unlocks the agency's own account data.

### Layer 2 - account scoping (the actual ask)

Two options:

- **Option A - request parameter.** Accept `accountId` (or account email) on data endpoints. When present and the caller is an agency key, verify the target is in the agency's APPROVED `accessibleAccounts` and execute in that account's context; otherwise return 403 with a body naming the reason.
- **Option B - key exchange.** Add `POST /api/v1.0/account-tokens`: agency key plus `accountId` returns a short-lived account-scoped token that data endpoints honor like a normal account key. Endpoints keep their single-account semantics untouched, the token carries the account context, and revocation and auditing have one clear object to act on.

**Recommendation: Option B.** It avoids touching the auth path of every endpoint, is easier to audit, and the same mechanism can back the planned agency tools in the official MCP.

### Security requirements (either option)

1. Scoping mirrors the in-app switcher exactly: APPROVED `accessibleAccounts` only.
2. Revoking agency access in-app invalidates scoping or outstanding tokens immediately.
3. Audit entries record both the agency identity and the target account.
4. Rate-limit policy is defined explicitly for scoped calls (per agency key, per target account, or both) so one agency cannot multiply its quota by its client count silently.

## Acceptance criteria

1. An agency key with read roles can read data from each APPROVED accessible account through the chosen mechanism, and only from those.
2. A non-accessible `accountId` returns 403 with a message naming the reason - not the current plain-text 401 that is indistinguishable from a wrong key.
3. In-app access revocation takes effect immediately.
4. `accessibleAccounts` in `/user-info` exposes the identifier the scoping mechanism expects, so integrations can discover valid targets programmatically.
5. The public spec (`rest-api.txt`) documents the role catalog and the scoping mechanism; the role system is undocumented today.

## Related

- The DAY-grouping card ([HMCP-60](https://markethero.atlassian.net/browse/HMCP-60)) came out of the same client-debugging effort; both stem from agency-grade API usage.
- Separate small card candidate: role-based denials should be 403 with the missing role named, instead of plain-text 401.
