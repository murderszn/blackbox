---
tags: [finance, viability]
updated: 2026-07-11
---

# Health Score
### The Algorithmic Rationale of Cash Flow Efficiency

The **Health Score** is a heuristic algorithm rendered in [[Stage - Viability]] that measures the efficiency, safety, and velocity of a user's cash flow. 

Unlike a credit bureau score (which measures how well you pay back debt, incentivizing you to stay in debt), the **Blackbox Health Score** measures how well you protect and grow your income.

---

## 🧠 Top-Down Rationale: Scoring Heuristics

The scoring engine starting baseline is **100 points**. Points are added or subtracted based on the following criteria:

### 1. The Savings Rate Reward (Margin)
Your savings rate is the ultimate determinant of wealth velocity.
*   **Reward (+10 points):** Awarded if the monthly net savings rate is **> 20%** of gross income.
*   **Neutral (0 points):** Savings rate between **10% and 20%**.
*   **Penalty (-10 points):** Savings rate is **< 10%**. Under-saving leaves you vulnerable.

### 2. The Debt/Payment Drag Penalties (Leverage)
Consumer debt shrinks your cash flow net. Points are deducted based on debt-to-income loads:
*   **Active Debt Penalty (-10 points):** Deducted for *each* active non-mortgage debt payment (Dream Car, College Tuition, Medical Bills) that exceeds **10%** of gross income.
*   **Auto Payment Cap (-15 points):** Deducted if monthly car payments exceed **15%** of monthly gross income (violating the 20/4/10 Auto Rule).
*   **Mortgage Over-Leverage (-15 points):** Deducted if mortgage + bills exceed **30%** of gross income (violating the 28/36 Housing Rule).

### 3. The Runway Safety Multiplier
*   **Negative Balance Penalty (-30 points):** If the 5-year savings projection ever dips below $0, a massive penalty is applied, forcing the Health Score into a failing range (Grade D/F) and triggering the `unaffordable` banner status.

---

## 🛠️ Code Implementation

Calculated in `js/script.js` inside the model updater:
*   **Grade Thresholds:**
    *   **A (90–100):** Peak cash flow efficiency. High savings margin, zero non-mortgage debt.
    *   **B (75–89):** Balanced. Stable, but could optimize discretionary leaks or pay down debts.
    *   **C (55–74):** Fragile. High debt payments or low savings rate. Lifestyle-driven.
    *   **D/F (< 55):** Insolvency risk. Flat savings curve or negative projected cash flow.

ADR: [[ADR - Compact Currency]] · [[Financial Brain Framework]] · [[Personal Finance Handbook]]
