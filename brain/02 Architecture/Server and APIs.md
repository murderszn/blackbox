---
tags: [architecture, api]
updated: 2026-07-11
---

# Server and APIs

## Local

```bash
npm start   # node server.js → http://localhost:8080
```

Static files + API routes. Node 18+.

## Routes

| Route | Purpose |
|-------|---------|
| `/api/pollinations-text` | Stream canned reports with user’s Bearer key |
| `/api/ai-analysis` | Structured viability grade/insights |
| `/api/signup` | Waitlist → Supabase (env-backed) |

## AI key model

- Key stored in **browser localStorage** only
- Proxy attaches `Authorization: Bearer …` server-side
- No freeform chat; canned prompt IDs only

See [[Tool - Pollinations]] · [[Skill - Canned AI Chat]] · [[Skill - Local Launch]]
