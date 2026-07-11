---
tags: [finance, format]
updated: 2026-07-11
---

# Compact Currency

`formatCompactCurrency(value)` · alias `formatMoney`.

| Range | Output |
|-------|--------|
| `\|n\| < 1000` | `$999` |
| `\|n\| ≥ 1000` | `$9.6K`, `$146K` |
| `\|n\| ≥ 1e6` | `$1.5M` |

Planning tiles: compact overlay via `data-compact="1"` + `.tile-value-compact`; full edit on focus.

Skill: [[Skill - Compact Money Displays]] · ADR: [[ADR - Compact Currency]]
