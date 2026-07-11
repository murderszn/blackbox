---
tags: [stage, load, finance]
act: 1
updated: 2026-07-11
---

# Stage · Planning

- **id:** `#stage-planning`  
- **Act:** Load  

This stage establishes the absolute foundation of the financial model. Before budgeting a single dollar or planning a purchase, the user must declare their **Gross Monthly Income**.

## 🧠 Top-Down Rationale: The Hard Cap

Most individuals approach budgeting from the **bottom-up**: they let their lifestyle (rent, car lease, subscriptions, dining) dictate their spending, and then try to save whatever is left. This is a recipe for a fragile financial state.

In Blackbox, budgeting is **top-down**:
1.  **Your Income is the Hard Ceiling:** Your monthly earnings set the boundaries.
2.  **Define the Savings Margin First:** Allocate your target savings rate (e.g. 20% or more) as a non-negotiable payment to your future self.
3.  **Squeeze the Lifestyle to Fit:** Discretionary categories must expand and contract to fit within the remaining net cash flow, rather than letting categories grow out of control and borrowing to bridge the gap.

## 🛠️ Code Implementation

*   **Atelier Tiles:** Input cells for Gross Monthly Income.
*   **Compact K Overlay:** Reformat 4+ digit values (e.g. $14,000 becomes $14K) to maintain clean readability.
*   **Scenarios Chip:** Save and load baseline scenarios directly in the header.

Skills: [[Skill - Compact Money Displays]] · [[Skill - Dense Dashboard Layout]] · [[Projection Engine]]
