# BLACKBOX — Lifestyle Affordability Calculator

BLACKBOX is an editorial financial-planning experience for testing whether a lifestyle, major purchase, or long-term plan can survive real cash-flow pressure.

![BLACKBOX](assets/brand/blackbox.png)

## What it does

- Models income, recurring expenses, and custom budget categories
- Plans major purchases: car, home, college, medical, and other floor blockers
- Projects cash flow, savings, spending, and ledger outcomes across long horizons
- Visualizes the model with Chart.js, D3 treemaps, and a cinematic stage journey
- Provides AI-assisted finance summaries through a server-side Pollinations proxy
- Ships as a static-first Vercel site with local Node API parity

## Design system

BLACKBOX uses the **Obsidian Atelier** visual system:

- Deep black vault UI with champagne-gold data accents
- Editorial display typography + compact mono financial values
- Full-screen staged sections: Planning, Purchases, Viability, Budget, Savings, Spending, Treemap, Ledger, AI, App, Outro
- Three.js/WebGL ambience for the hero and journey field
- Frameless controls, dense dashboards, and mobile-first fallback layouts

## Live deployment

Production is auto-deployed by Vercel from `main`.

- Repository: <https://github.com/murderszn/blackbox>
- Live app: Vercel production deployment

## Local development

Requires Node.js 18+.

```bash
git clone https://github.com/murderszn/blackbox.git
cd blackbox
npm install
npm start
```

Open <http://localhost:8080>.

Useful scripts:

```bash
npm start       # local app + API server
npm run dev     # dev wrapper
npm run dev:raw # direct server.js launch
npm test        # Playwright smoke test; server must already be running
```

## Environment variables

Optional server-side configuration:

```bash
POLLINATIONS_API_KEY=...   # shared AI key, never sent to visitors
SUPABASE_URL=...           # optional signup backend
SUPABASE_ANON_KEY=...      # optional signup backend
```

If no Pollinations key is configured, the app falls back to local heuristic analysis.

## Project structure

```text
blackbox/
├── index.html              # Main document and stage markup
├── server.js               # Local static/API server
├── api/                    # Vercel-compatible API routes
├── assets/
│   ├── atmosphere/         # Editorial photography / scene images
│   ├── brand/              # Logo, store badges, social preview art
│   └── icons/              # Finance category icons
├── styles/
│   ├── style.css           # Base layout and legacy calculator styles
│   └── atelier.css         # Obsidian Atelier system and stage polish
├── js/
│   ├── script.js           # Finance engine, charts, state, AI UI
│   ├── experience.js       # Stage rail, reveals, scrub HUD, motion layer
│   ├── hero-tesseract.js   # Hero Three.js object
│   ├── journey-webgl.js    # Background journey field
│   └── bento-fit.js        # App-stage bento text fitting
├── tests/                  # Playwright smoke/visual helpers
├── scripts/                # Developer scripts
├── docs/                   # Craft plans and migration notes
└── brain/                  # Obsidian product/architecture knowledge vault
```

## Knowledge brain

The product second brain lives in [`brain/`](./brain/). Open `blackbox/brain` as an Obsidian vault and start at `00 Maps/Home.md`.

A local brain utility is available at:

```bash
node brain/server.js
```

## Quality check

Run the smoke test after starting the server:

```bash
npm start
# in another terminal
npm test
```

The test verifies that the app boots, core assets load, finance calculations respond to input, loan math behaves, and the atelier shell is present.

## Deployment notes

- Vercel deploys from `main` automatically.
- Static assets are grouped under `assets/`, `styles/`, and `js/`.
- Root-level QA screenshots and Playwright MCP logs are ignored by git.
- Secrets and local Vercel metadata are ignored.

## Credits

Designed and developed by [aurawlbx / murderszn](https://github.com/murderszn).

Est. 2025
