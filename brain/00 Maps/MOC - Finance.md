---
tags: [moc, finance]
updated: 2026-07-11
---

# MOC · Finance

This Map of Content (MOC) connects all the financial models, heuristics, algorithms, and interface stages driving the **BLACKBOX** personal finance calculator.

---

## 🧠 Brain & Methodology

Core financial frameworks and guides explaining how the app scores and evaluates cash flow:

*   [[Financial Brain Framework]] — Explains the 3x3 Earner-Spender matrix (Low/Med/High), action directives, and points penalty heuristics.
*   [[Personal Finance Handbook]] — Details standard tax brackets, FICO score weights, average American income percentiles, and guidelines for major asset classes (20/4/10 Auto Rule, 28/36 Housing Rule, dsCR, runway).

---

## ⚙️ Calculation Engine

The low-level mathematical scripts running behind the planning dashboards:

*   [[Projection Engine]] — Manages 25-year compound growth, compound interest, tax withholding calculations, and monthly intervals.
*   [[Loan Math]] — Amortization formulas for mortgage and interest schedules.
*   [[Health Score]] — Logic for computing the financial score, awarding points for healthy saving and penalizing debt overhead.
*   [[Compact Currency]] — Utility for rendering large numbers compactly (e.g. $146K).
*   [[Major Purchases Model]] — Mathematical overhead calculations for housing, cars, tuition, and medical bills.

---

## 🖥️ Journey Stages & UI Surfaces

The visual interfaces structured into a frameless, viewport-snapped journey:

*   [[Stage - Budget]] — Monthly budget allocation inputs and category doughnut chart.
*   [[Stage - Savings]] — 25-year cumulative savings projection chart (supporting Linear and Log scales).
*   [[Stage - Viability]] — The 5-year stress-test dashboard and headline health indicators.
*   [[Stage - Purchases]] — The bento-grid layout allowing users to toggle and customize Dream Cars, Dream Houses, tuition, and medical plans.
*   [[Stage - Ledger]] — High-density 25-year projection ledger.

---

## 🤖 AI Context & Integrations

How the model packages inputs to send to LLM nodes for stress tests:

*   [[Tool - Pollinations]] — Integrates with the open-inference text generation nodes.
*   [[Skill - Canned AI Chat]] — Local fallback stress-tester simulation in the event of missing keys.
