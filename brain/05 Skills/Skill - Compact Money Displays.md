---
tags: [skill, finance, ui]
updated: 2026-07-11
---

# Skill · Compact Money Displays

When adding any new dollar surface:

1. Use `formatCompactCurrency(value)` from `script.js`  
2. Threshold: `abs >= 1000` → K; `>= 1e6` → M  
3. Editable faces: compact **overlay** when idle; full digits on focus (`syncAmountFaceDigits`)  
4. Don’t compact AI prompt internals if full precision is required — prefer compact for **UI**  

See [[Compact Currency]] · [[ADR - Compact Currency]]
