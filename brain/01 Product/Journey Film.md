---
tags: [product, journey, film]
updated: 2026-07-11
---

# Journey Film

BLACKBOX scrolls as a **process film**: linked nodes on a gold spine, act titles, fractional progress — inspired by [[Link - Vectrfl]] without copying palette or product.

## Chrome

| Element | Placement | Role |
|---------|-----------|------|
| [[Journey Rail]] | **Left** fixed | Stage nodes + labels |
| Film HUD | Bottom-left | Act index + stage meta + progress |
| Floating nav | Top center | Model · AI · App |
| Hero cube | Intro only | Three.js onyx glass; journey WebGL ball disabled |

## Progress model

- Stages expose `data-stage`, `data-act`, `data-act-title`
- `js/experience.js` drives `window.__bbJourney` + `bb:journey` events
- `html.stages-armed` enables **proximity** snap after leaving hero
- Keyboard: `j` / `k` / arrows / PageUp-Down jump stages when not in inputs

## Related

- [[Four Acts]] · [[MOC - Stages]] · [[ADR - Proximity Scroll]] · [[ADR - Left Journey Rail]]
- Plan: [VECTRFL_MIGRATION_PLAN.md](../../docs/VECTRFL_MIGRATION_PLAN.md)
