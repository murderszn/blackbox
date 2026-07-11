---
tags: [finance, engine]
updated: 2026-07-11
---

# Projection Engine

Core: `calculate()` in `script.js`.

## Horizon

| Constant | Value | Role |
|----------|-------|------|
| `years` | **25** | Full series + ledger |
| `chartYears` | 5 | Viability headline index |
| Monthly loop | `years * 12` | Compound path |

## Balance update (each month)

1. Start from base lifestyle surplus (`income − enabled categories`)  
2. Subtract active loan payments (car / house / college / medical)  
3. Subtract house down payment in purchase month  
4. Add residual to balance  
5. Apply monthly growth `0.04 / 12`  

## Exposed projection

```js
window.__bbProjection = {
  years, chartYears, savingsData,
  fiveYearSavings, tenYearSavings,
  twentyYearSavings, twentyFiveYearSavings, labels
}
```

Related: [[Loan Math]] · [[Major Purchases Model]] · [[ADR - 25 Year Ledger]]
