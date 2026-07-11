---
tags: [stage, signal, finance]
act: 3
updated: 2026-07-11
---

# Stage · Spending

- **id:** `#stage-spending`  
- **Act:** Model

This stage tracks the cumulative spending curves over the full 25-year modeling horizon, broken down by category.

## 🧠 Top-Down Rationale: The Compounding Cost of Convenience

Most consumers focus on the short-term cost of a subscription or utility (e.g. "$15/month"). They fail to model what that expense looks like when accumulated over 10, 20, or 25 years.

In Blackbox, we project these curves over decades to reveal:
1.  **Lifestyle Accumulation:** A $200/month dining-out habit accumulates to **$60,000** of pure cash flow drain over 25 years. This could have been a down payment on an asset.
2.  **Scale Switch (Linear vs. Logarithmic):** 
    *   **Linear Scale:** Useful for highlighting massive structural blocks (like Housing).
    *   **Logarithmic Scale:** Dynamically compresses massive values so the user can see if minor, discretionary "leaks" are growing proportionally and draining margins alongside primary needs.

## 🛠️ Code Implementation

*   **Yearly Cumulative Spends:** Plotted as stacked or grouped bar charts.
*   **Scale Toggle:** Dynamically swaps Chart.js configurations between `linear` and `logarithmic` scales while mapping 0 values to `null` to prevent rendering errors.

Skill: [[Tool - Chart.js]] · [[Financial Brain Framework]] · [[Personal Finance Handbook]]
