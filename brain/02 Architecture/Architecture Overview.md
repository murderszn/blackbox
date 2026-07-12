---
tags: [architecture]
updated: 2026-07-11
---

# Architecture Overview

```mermaid
flowchart TB
  subgraph client [Browser]
    HTML[index.html stages]
    CSS[styles/style.css + styles/atelier.css]
    JS[js/script.js calc + charts]
    EXP[js/experience.js journey]
    BENTO[bento-fit.js]
    THREE[hero-tesseract / journey-webgl]
  end
  subgraph server [Node :8080]
    S[server.js static + API]
    P[/api/pollinations-text]
    A[/api/ai-analysis]
    U[/api/signup]
  end
  HTML --> JS
  HTML --> EXP
  JS -->|SSE/fetch| P
  JS --> A
  HTML --> U
  S --> P
  S --> A
  S --> U
```

## Stack

| Layer | Choice |
|-------|--------|
| UI | Static HTML + CSS + vanilla JS |
| Charts | [[Tool - Chart.js]] + [[Tool - D3]] treemap |
| 3D | [[Tool - Three.js]] hero cube |
| Serve | [[Tool - Node Server]] / [[Tool - Vercel]] |
| AI | [[Tool - Pollinations]] BYO key |
| QA | [[Tool - Playwright MCP]] + `tests/` |

## Source of truth files

→ [[File Map]] · [[Client Data Flow]] · [[Server and APIs]]
