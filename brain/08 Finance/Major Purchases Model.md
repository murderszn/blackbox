---
tags: [finance, purchases]
updated: 2026-07-11
---

# Major Purchases Model
### Amortization Math and Rule Capping for Major Outflows

This model details the mathematics and logical triggers used to evaluate the affordability of the four primary floor blockers on [[Stage - Purchases]].

---

## 🧠 Top-Down Rationale: Blockers to Wealth

Major purchases represent **fixed obligations**. Unlike discretionary spending (which can be cut in a bad month), loan payments are legally mandated. Therefore, they act as **floor blockers** that locked-in cash flow and compound risk over time.

To protect the user's cash flow, Blackbox overlays these blockers with standard constraints (detailed in the [[Personal Finance Handbook]]):
*   **Car Financing Cap:** Term maxed at **48 months** (4 years), with monthly payment under **10%** of gross monthly income.
*   **Housing Debt Cap:** PITI (Principal, Interest, Taxes, Insurance) under **28%** of gross, with total debt under **36%** of gross.

---

## 📐 Amortization Math

For installment agreements (Car, House, Tuition, and Medical plans), monthly payments are calculated using standard fixed-rate amortization:

$$M = P \frac{r(1+r)^n}{(1+r)^n - 1}$$

Where:
*   $M$ = Monthly payment.
*   $P$ = Principal loan amount (for housing: Price minus Down Payment).
*   $r$ = Monthly interest rate (Annual APR divided by 12).
*   $n$ = Total number of monthly payments (Term).

---

## 🛠️ Code Implementation

Calculated in `js/script.js` during the projection cycle:
*   **Auto Options:** The loan starts in the user-selected `purchaseYear` and is added to the monthly outflow array for exactly `Term` months, after which it drops off, freeing up cash flow.
*   **Housing Bills:** Monthly housing costs are computed as $M + \text{bills}$, where bills represent utilities, property tax estimates, and maintenance reserves.
*   **Display:** Output fields are reformatted dynamically using [[Compact Currency]].

ADR: [[ADR - 25 Year Ledger]] · [[Loan Math]] · [[Financial Brain Framework]]
