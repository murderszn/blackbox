---
tags: [stage, load, finance]
act: 1
updated: 2026-07-11
---

# Stage · Purchases

- **id:** `#stage-purchases`  
- **Act:** Load

This stage houses the **Lifestyle Anchors**—the four major fixed obligations (Dream Car, Dream House, College Tuition, and Medical) that can be toggled on to stress-test your financial viability.

## 🧠 Top-Down Rationale: The Payment Trap

Cars and houses are the two largest purchases most people make. However, they are frequently bought using **bottom-up financing logic**: *"Can I afford the monthly payment?"*

This question masks the true danger:
1.  **Shrinking the Net Income:** A family earning $8,000/month with $4,500/month in car and mortgage payments effectively operates on a $3,500 income. They have a high-income lifestyle but a low-income net safety margin.
2.  **Asset vs. Liability:** Depreciating assets (like cars) should never be financed. Houses should be constrained by the **28/36 Rule** (PITI under 28% of gross) to avoid house-poor syndrome.

## 🛠️ Code Implementation

*   **Bento Grid Layout:** Organized as a 3-column asymmetric layout (2-column on mobile) where the complex Dream House occupies a wide slot (`span 2`) and smaller cards fit side-by-side.
*   **Stewardship Tips Card:** An inline reference card displaying standard guidelines (20/4/10 Auto Rule, 28/36 Housing Rule, and Emergency Fund Buffers) to guide inputs before saving.
*   **Live Amortization:** Calculates dynamic monthly obligations in real-time as prices, terms, and interest rates shift.

Skill: [[Major Purchases Model]] · [[Loan Math]] · [[Personal Finance Handbook]]
