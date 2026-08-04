# Bug Report: official Hyros MCP Ad Account Report double-counts cost when grouped by DAY

**Reported by:** Carlos
**Date:** 2026-07-24
**Component:** Official Hyros MCP connector, Ad Account Report tool with `dateTimeGroupingOption: DAY` (not the public REST API; see Related ticket)
**Severity:** High (reported daily cost is ~2x inflated in the DAY view)
**Status:** Open

## Summary

When the same Ad Account Report is requested twice with a byte-identical parameter set and only `dateTimeGroupingOption` changed, the totals do not reconcile:

- Grouped by `AD_ACCOUNT`: total cost = **3343.85** (correct, matches the campaign-level breakdown).
- Grouped by `DAY`: **31 daily rows** summing to **6788.94**.

The exact defect was isolated (see Defect signature below): **every DAY row equals that day's true cost plus the next day's true cost**. Each day bucket spans 48 hours instead of 24. An independent per-day series from the same underlying data returns a clean 30-row series that sums to **3343.85** to the cent, which rules out the tracking data as the source.

## Environment and parameters

Both report calls used an identical parameter set. Only `dateTimeGroupingOption` differed.

| Parameter | Value |
|---|---|
| attributionModel | `LAST_CLICK` |
| ids | `["8213000786"]` (Google, "Juice Guru Institute") |
| startDate | `2026-06-21` |
| endDate | `2026-07-20` |
| fields | `["COST"]` |
| currency | `USD` |
| dayOfAttribution | `false` |
| forecastingOption | `FIRST_SALE` |
| ignoreRecurringSales | `false` |
| newCustomerConfiguration | `ALL_CUSTOMERS` |
| scientificDaysRange | `30` |
| windowAttributionDaysRange | `0` |
| sourceConfiguration | `ALL_SOURCES` |
| dateTimeGroupingOption | Report 1: `AD_ACCOUNT` / Report 2: `DAY` |

Day boundary observed in the DAY response: `17:00`-`16:59` `America/Los_Angeles` (= 00:00 UTC).

## Steps to reproduce

1. Call the Ad Account Report with the parameter set above and `dateTimeGroupingOption = AD_ACCOUNT`. Record the total cost.
2. Call the exact same report with only `dateTimeGroupingOption = DAY`. Sum all daily rows.
3. Compare the two totals.

Ground truth for step 3, producible without any MCP: `GET /api/v1.0/attribution` with `level=google_campaign`, `ids=22836936234,22162870058,22901216329`, the same window and attribution model, and `timeGroupingOption=day` returns the correct 30-row series.

## Expected vs. actual

- **Expected:** the sum of the DAY rows equals the AD_ACCOUNT total (`3343.85`), with exactly 30 rows, one per day of the inclusive `2026-06-21` → `2026-07-20` window.
- **Actual:** the DAY series returns **31 rows** totaling **6788.94**, including a row dated **`2026-06-20`** - before the requested `startDate`.

## Defect signature (exact, verified on all 31 rows)

Comparing the defective series against the ground-truth series row by row:

```
dayRow(D) = trueCost(D) + trueCost(D+1)        holds for 31 of 31 rows
```

Sample pairs (full tables below):

| DAY row | Reported cost | trueCost(D) | trueCost(D+1) | Sum |
|---|---|---|---|---|
| 2026-06-20 | 205.92 | 101.24 | 104.68 | 205.92 |
| 2026-06-21 | 252.11 | 104.68 | 147.43 | 252.11 |
| 2026-06-22 | 313.48 | 147.43 | 166.05 | 313.48 |
| 2026-07-19 | 222.19 | 90.86 | 131.33 | 222.19 |
| 2026-07-20 | 131.33 | 131.33 | (outside window) | 131.33 |

The totals close arithmetically with zero residue:

```
6788.94 = 2 x 3343.85 + 101.24
          every in-window day counted twice, plus the out-of-window June 20 (101.24) once
```

This is not a vague inflation: each bucket aggregates exactly two consecutive days. The 2026-07-20 row only looks "partial" because its second day falls outside the window; it is in fact the only single-day row.

## Evidence

### AD_ACCOUNT view (correct)

Single row, cost = **3343.85** (id `8213000786`). Campaign breakdown (three campaigns with cost > 0):

| Campaign ID | Cost |
|---|---|
| 22836936234 | 1868.51 |
| 22162870058 | 924.98 |
| 22901216329 | 550.36 |
| **Total** | **3343.85** |

### DAY view - official MCP (defective, 31 rows)

| Row start (17:00 PT boundary) | Cost |
|---|---|
| 2026-06-20 *(out of range)* | 205.92 |
| 2026-06-21 | 252.11 |
| 2026-06-22 | 313.48 |
| 2026-06-23 | 283.55 |
| 2026-06-24 | 249.78 |
| 2026-06-25 | 278.57 |
| 2026-06-26 | 280.10 |
| 2026-06-27 | 239.14 |
| 2026-06-28 | 221.62 |
| 2026-06-29 | 238.08 |
| 2026-06-30 | 240.08 |
| 2026-07-01 | 218.38 |
| 2026-07-02 | 200.07 |
| 2026-07-03 | 205.11 |
| 2026-07-04 | 294.99 |
| 2026-07-05 | 352.77 |
| 2026-07-06 | 303.09 |
| 2026-07-07 | 261.21 |
| 2026-07-08 | 205.04 |
| 2026-07-09 | 169.41 |
| 2026-07-10 | 171.61 |
| 2026-07-11 | 166.00 |
| 2026-07-12 | 154.93 |
| 2026-07-13 | 168.57 |
| 2026-07-14 | 160.19 |
| 2026-07-15 | 139.48 |
| 2026-07-16 | 155.86 |
| 2026-07-17 | 149.28 |
| 2026-07-18 | 157.00 |
| 2026-07-19 | 222.19 |
| 2026-07-20 | 131.33 |
| **Total (31 rows)** | **6788.94** |

### DAY view - ground truth via public REST API (correct, 30 rows)

| Day | Cost |
|---|---|
| 2026-06-21 | 104.68 |
| 2026-06-22 | 147.43 |
| 2026-06-23 | 166.05 |
| 2026-06-24 | 117.50 |
| 2026-06-25 | 132.28 |
| 2026-06-26 | 146.29 |
| 2026-06-27 | 133.81 |
| 2026-06-28 | 105.33 |
| 2026-06-29 | 116.29 |
| 2026-06-30 | 121.79 |
| 2026-07-01 | 118.29 |
| 2026-07-02 | 100.09 |
| 2026-07-03 | 99.98 |
| 2026-07-04 | 105.13 |
| 2026-07-05 | 189.86 |
| 2026-07-06 | 162.91 |
| 2026-07-07 | 140.18 |
| 2026-07-08 | 121.03 |
| 2026-07-09 | 84.01 |
| 2026-07-10 | 85.40 |
| 2026-07-11 | 86.21 |
| 2026-07-12 | 79.79 |
| 2026-07-13 | 75.14 |
| 2026-07-14 | 93.43 |
| 2026-07-15 | 66.76 |
| 2026-07-16 | 72.72 |
| 2026-07-17 | 83.14 |
| 2026-07-18 | 66.14 |
| 2026-07-19 | 90.86 |
| 2026-07-20 | 131.33 |
| **Total (30 rows)** | **3343.85** |

### Reconciliation

| View | Rows | Sum | vs. AD_ACCOUNT (3343.85) |
|---|---|---|---|
| AD_ACCOUNT | 1 | 3343.85 | baseline |
| DAY - official MCP | 31 | 6788.94 | = 2 x 3343.85 + 101.24 |
| DAY - public API ground truth | 30 | 3343.85 | exact match |

## Root-cause hypothesis

The `dayRow(D) = trueCost(D) + trueCost(D+1)` signature means each DAY bucket covers a 48-hour span: bucket D aggregates [D, D+2) in one timezone frame. The 17:00 PT bucket start (= 00:00 UTC) points at a UTC / account-timezone conversion applied to the bucket start boundary but not the end boundary, or an end-inclusive vs end-exclusive mix. The same offset drags the out-of-window 2026-06-20 bucket into a window that starts 2026-06-21.

## Impact

- Any dashboard, export, or automation that trusts the DAY-grouped Ad Account Report over-reports cost by roughly 2x. Downstream ROAS, CPA, and pacing numbers derived from the DAY view are correspondingly wrong.
- The AD_ACCOUNT-grouped total is unaffected and can serve as the source of truth in the meantime.

## Acceptance criteria

1. DAY series for a 30-day window returns exactly 30 rows, all inside the requested window.
2. `sum(DAY rows) == AD_ACCOUNT total` for the same parameters, to the cent (add this as a regression test).
3. Day boundaries match the account timezone (buckets start at 00:00 account time, not 17:00).
4. Each bucket spans exactly 24 hours: for any D, `dayRow(D)` equals the ground-truth `trueCost(D)` from campaign-level day grouping.

## Related ticket (public REST API)

`GET /api/v1.0/attribution/ad-account` documents `dateTimeGroupingOption` (`ad_account`/`day`/`week`/`month`/`year`), a parameter name the API does not recognize - verified on two separate accounts on 2026-07-24; every variant returned one aggregate row. Engineering confirmed the real parameter is `adLevelDateGroupingOption`. Remaining card: correct the public spec to name the parameter the API honors.

## Resolution (2026-07-28)

Engineering confirmed the day calculation covered 48 hours per row and deployed a fix to production. Verified live against the same account and window through `adLevelDateGroupingOption=day`: 30 rows, all inside the requested window, summing to the AD_ACCOUNT total to the cent (3340.33 = 3340.33, both measured at the same moment). All four acceptance criteria pass.

## Honesty notes (from the reproduction run)

- "Identical parameters as before" means identical to the set used in this reproduction run, not verified byte-for-byte against the client's very first manual test.
- Totals shifted slightly between runs (AD_ACCOUNT `3346.52` → `3343.85`, a few daily values moved), consistent with live attribution / conversion-lag updates. The signature and the ~2x discrepancy reproduce across runs regardless.
