---
tags: [product, chrome, rail]
updated: 2026-07-11
---

# Journey Rail

Fixed **left** node spine (`.stage-rail.journey-spine`).

- Vertical gold track + filled progress
- Nodes: passed / active / upcoming
- Hover/active tooltip opens **to the right** (`left: calc(100% + …)`)
- Mobile: smaller dots, tooltips hidden

Implementation: `experience.js` builds dots; styles in `atelier.css`.

See [[Journey Film]] · [[ADR - Left Journey Rail]]
