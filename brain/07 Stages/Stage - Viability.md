---
tags: [stage, stress, finance]
act: 2
updated: 2026-07-11
---

# Stage · Viability

- **id:** `#stage-viability`  
- **Act:** Stress

This stage is the **Stress-Test Dashboard**. It serves as the primary visual warning center of the application, rendering the headline health grades and long-term viability verdicts.

## 🧠 Top-Down Rationale: The Solvency Verdict

A plan is only as good as its resilience to shock. If your cash flow margin is thin, any minor emergency (job loss, medical bill, rate hike) will push you into insolvency.

1.  **The 5-Year Target:** Rather than looking at a single month, Blackbox runs the numbers out to a 5-year horizon. If your projected savings balance goes negative at any point within these first 5 years, the top banner turns red, declaring the lifestyle **unaffordable**.
2.  **Point-Based Health Grading:** The viability module calculates a numeric score (0 to 100) and letter grade (A to F) using the [[Financial Brain Framework]]. Rather than praising raw income, it rewards a high **savings rate** and penalizes **excessive payment-to-income ratios** (such as auto payments > 15% or housing > 30% of income).

## 🛠️ Code Implementation

*   **Affordability Banner:** A high-impact panel changing states (`healthy` to `unaffordable`) depending on cash flow sustainability.
*   **KPI Board:** Visual cards presenting the 5-year savings balance, the net savings rate, and the overall Health Score.
*   **Dynamic Grade Indicator:** Real-time feedback loops displaying the grading assessment computed by `script.js`.

Skill: [[Health Score]] · [[Projection Engine]] · [[Financial Brain Framework]]
