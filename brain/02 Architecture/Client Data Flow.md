---
tags: [architecture, data]
updated: 2026-07-11
---

# Client Data Flow

1. **Planning inputs** — income + category amounts + enables → `budgetItems[]`
2. **Purchases** — car / house / college / medical toggles + loan params
3. **`calculate()`** — builds monthly series for `years = 25`
4. **Headline** — 5-year mark → viability (`finalSavings`)
5. **Horizon marks** — `window.__bbProjection` exposes 5 / 10 / 20 / 25
6. **Surfaces** — charts, pie, ledger, mini metrics, walkthroughs, app phone number
7. **AI** — `buildPlanContextForChat()` snapshots plan for canned reports

Money display: [[Compact Currency]]  
Math detail: [[Projection Engine]]
