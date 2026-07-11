---
tags: [skill, qa]
updated: 2026-07-11
---

# Skill · Playwright Visual QA

## Capture set (minimum)

| Stage id | Assert |
|----------|--------|
| `stage-planning` | Income compact K if 4+ digits |
| `stage-budget` | Donut larger than key (~70/30) |
| `stage-ledger` | Title 25-year; milestone rows |
| `stage-app` | Calm type; frameless stores |
| `stage-outro` | Frameless social |

## Evaluate snippets

```js
// rail left?
getComputedStyle(document.getElementById('stageRail')).left
// horizon
window.__bbProjection.years // 25
// money
document.getElementById('topRightSavings').textContent // $…K
```

Tool: [[Tool - Playwright MCP]]
