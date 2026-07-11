---
tags: [stage, signal, finance]
act: 3
updated: 2026-07-11
---

# Stage · Budget

- **id:** `#stage-budget`  
- **Act:** Model

This stage acts as the **Allocation Gate** where monthly cash flows are actively divided into discrete categories.

## 🧠 Top-Down Rationale: The Audit of Desires

A budget is not a restriction; it is the conscious direction of your money before it leaves your hands. To prevent lifestyle creep from eroding cash flow:

1.  **Differentiate Needs vs. Wants:**
    *   **Needs (Housing, Groceries, Utilities, Transport):** The baseline required to survive and maintain employment.
    *   **Wants (Dining Out, Travel, Entertainment):** Optional expenses that should only be funded after savings goals are met.
2.  **Visual Proportionality:** The Chart.js doughnut chart gives instant visual feedback. If a "want" category (like Dining) takes up a larger slice of the pie than your savings rate or primary shelter, the budget is structurally out of balance (lifestyle-driven).

## 🛠️ Code Implementation

*   **Custom HTML Legend:** Built dynamically to prevent label collisions. High-density rows contain category name, raw dollar amount, and relative percentage.
*   **Donut Ratio:** Donut chart occupies ~70% of the panel width, while the key takes ~30%.
*   **Clean Overflows:** Hide excess items behind a `+N more` indicator to preserve Obsidian Atelier aesthetic density.

Skill: [[Skill - Dense Dashboard Layout]] · [[Tool - Chart.js]] · [[Financial Brain Framework]]
