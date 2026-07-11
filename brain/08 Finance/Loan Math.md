---
tags: [finance, loans]
updated: 2026-07-11
---

# Loan Math

Standard amortization helper `calculateLoanPayment(principal, annualRatePct, months)`.

Used by:

- Car  
- House (after down payment)  
- College / tuition  
- Hospital / medical  

Finite loans active only while `isFiniteLoanActive(month, start, term)`.  
House bills continue after purchase month for the projection window.
