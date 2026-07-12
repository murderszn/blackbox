---
tags: [stage, signal, finance]
act: 3
updated: 2026-07-11
---

# Stage · Savings

- **id:** `#stage-savings`  
- **Act:** Model

This stage charts the monthly cumulative net savings balance projected over the 25-year timeline.

## 🧠 Top-Down Rationale: The Margin Generator

Your savings curve is the mathematical reflection of your cash flow margin. If you let your lifestyle dictate your budget, this curve will be flat or negative.

1.  **Compound Velocity:** Demonstrates how rapidly savings accrue when you live below your means and carry zero non-mortgage debt.
2.  **The Opportunity Cost of Payments:** By toggling off major purchases or debt in [[Stage - Purchases]], the savings curve dynamically arches upward. This shows the immediate, compounding wealth gained by refusing to finance depreciating assets (like cars).

## 🛠️ Code Implementation

*   **Chart.js Line Chart:** Renders the 300-month series showing the growth projection.
*   **Scrub HUD:** Interactive scrubbing mechanism in `js/experience.js` that allows users to hover across the timeline to view precise balance readouts at specific months.
*   **Compact Tooltips:** Integrates [[Compact Currency]] formatting on axes and tooltips.

Skill: [[Tool - Chart.js]] · [[Projection Engine]] · [[Financial Brain Framework]]
