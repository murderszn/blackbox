---
tags: [stage, signal, ledger, finance]
act: 3
updated: 2026-07-11
---

# Stage · Ledger

- **id:** `#stage-ledger`  
- **Act:** Model

This stage presents the **25-Year Financial Summary Ledger**—a dense, high-frequency data grid showing the long-term mathematical consequences of the user's current habits.

## 🧠 Top-Down Rationale: The Decades Map

Short-term thinking masks systemic issues. The 25-year ledger forces the user to see exactly where their cash flow will be at key life milestones:

1.  **Year 5 (The Foundation):** Shows the short-term survival rate of the plan.
2.  **Year 10 (The Horizon):** The compounding impact of carrying auto loans or credit card debt. If a user maintains high debt, their cumulative savings row will lag behind.
3.  **Year 20 (The Legacy):** Illustrates the final opportunity cost. By comparing a debt-free scenario against a leveraged one, the user can see that avoiding bottom-up lifestyle choices (leases, high mortgages) results in hundreds of thousands of dollars of extra wealth by Year 20.

## 🛠️ Code Implementation

*   **25-Year Matrix:** Rows represent years. Columns map Gross Income, Taxes, Living Costs, Major Payments, Cumulative Savings, and Savings Rate.
*   **Target Highlights:** Visually isolates **Year 5, 10, and 20** to provide readable target marks on a 25-year path.
*   **Compact Formatting:** Leverages [[Compact Currency]] formatting to keep the large numbers clean and dense.

ADR: [[ADR - 25 Year Ledger]] · [[Projection Engine]] · [[Personal Finance Handbook]]
