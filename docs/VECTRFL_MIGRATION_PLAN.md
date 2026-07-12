# BLACKBOX × Vectrfl Migration Plan

> Migrate the lifestyle model from a snap-deck of instrument panels into a **continuous, node-linked process film** — keeping finance UX, gold atelier aesthetic, and one-viewport tooling.

**Reference:** [vectrfl.com](https://www.vectrfl.com/) · [Utsubo case study](https://www.utsubo.com/blog/vectr-ai-startup-branding-case-study)  
**Status board:** [vectrfl-migration-plan.html](./vectrfl-migration-plan.html)  
**Last updated:** 2026-07-11

---

## Goals

1. **Scroll as story** — continuous / proximity scroll with a process-film feel (not PowerPoint snaps only).
2. **Node spine** — gold line + nodes that reflect real progress through the model.
3. **3D continuum** — hero cube does not die after Intro; morphs into a journey graph.
4. **Grid craft** — viability metrics + budget tiles share one modular card language.
5. **Keep the product** — forms, charts, AI chat, and affordability math stay first-class.

## Non-goals

- Cloning Vectrfl branding (blue Signal palette, Roboto, staffing copy).
- Full WebGPU OffscreenCanvas worker pipeline (later upgrade).
- Open-sourcing or depending on private Utsubo client code.

## Tech notes from Vectrfl (learn, don’t copy)

| Vectrfl | BLACKBOX approach |
|---------|-------------------|
| Three.js WebGPU + WebGL fallback | Three.js WebGL first (existing 0.170 CDN); WebGPU later |
| OffscreenCanvas worker | Main-thread throttled RAF; pause off-screen |
| Lenis smooth scroll | Optional desktop Lenis in Phase E |
| Taxi.js page transitions | Single-page stage film (no multi-page) |
| 4 process chapters | **4 acts** wrapping 11 finance stages |
| Continuous line story | SVG/WebGL node spine + fractional progress |

## Act map (11 stages → 4 film acts)

| Act | Film title | Stages |
|-----|------------|--------|
| **01 Load** | Lifestyle load | Planning, Purchases |
| **02 Stress** | Affordability | Viability |
| **03 Signal** | Evidence | Budget, Savings, Spending, Treemap, Ledger |
| **04 Decide** | Stress-test & ship | AI, App, Outro |

---

## Phase checklist

### Phase A — Scroll contract & invitation
- [x] A1. Single snap/scroll CSS contract (collapse conflicting `stages-armed` layers)
- [x] A2. Tool stages: `min-height: 100dvh`, avoid hard `overflow: hidden` clipping where forms need air
- [x] A3. Fractional journey progress (lerp between stage centers)
- [x] A4. Hero invite: “scroll to enter the model”
- [x] A5. Simplify `jumpToStage` (one scroll path, reassert arming)
- [x] A6. Playwright: hero → Planning → AI film/track; no double-height stages

### Phase B — Four-act film language
- [x] B1. `data-act` / `data-act-title` on each stage in HTML
- [x] B2. Film HUD shows act index + stage meta
- [x] B3. Spine: act-aware passed/active styling
- [x] B4. `chapterMeta` + act titles in `js/experience.js`
- [x] B5. Playwright: act labels advance correctly across jumps

### Phase C — Persistent WebGL journey layer
- [x] C1. Expose `window.__bbJourney` + `bb:journey` events from film update
- [x] C2. Fixed `#journeyWebgl` container behind content
- [x] C3. Shared Three runtime; keep hero cube as Intro look
- [x] C4. Node graph + gold edges driven by progress
- [x] C5. Cube fades / recedes as progress leaves Intro
- [x] C6. `prefers-reduced-motion` + pause when tab hidden
- [x] C7. Playwright: canvas exists past Planning; progress changes scene state

### Phase D — Modular grid cells
- [x] D1. CSS tokens: `--bb-gutter`, value-lg / value-md
- [x] D2. Viability: 12-col lattice; core ≠ mini type scale
- [x] D3. Planning tiles: full-width amount, optional icon media zone
- [x] D4. Shared hover/border language for metrics + tiles
- [x] D5. Playwright: equal spend/income type family; metrics hierarchy

### Phase E — Motion polish
- [x] E1. Softer stage enter; reduce inactive dim if it fights film
- [x] E2. Custom desktop inertial scroll + proximity settle (no added dependency)
- [x] E3. Mobile: free scroll + film/spine sync (no mandatory snap)
- [x] E4. Full Playwright journey smoke suite documented

---

## File ownership

| Area | Primary files |
|------|----------------|
| Plan / status | `docs/VECTRFL_MIGRATION_PLAN.md`, `docs/vectrfl-migration-plan.html` |
| Scroll / film | `js/experience.js`, `styles/atelier.css`, `index.html` |
| 3D | `js/hero-tesseract.js` → + `js/journey-webgl.js`, `index.html` |
| Grids | `index.html`, `js/script.js`, `styles/atelier.css` |

## Definition of done (global)

- [x] Journey film + spine track progress continuously (not only discrete jumps)
- [x] WebGL atmosphere persists after hero
- [x] Metrics + budget read as one modular card system
- [x] Playwright smoke: Intro → Planning → Viability → Budget → AI → App
- [x] Reduced-motion: no mandatory snap, static or minimal 3D

## Progress log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-07-11 | Plan | Plan MD + HTML status board created |
| | | *Execution entries append below* |

| 2026-07-11 | A–E | Scroll contract (proximity), fractional progress, hero invite, 4-act film, journey-webgl.js node graph, bb-cell metric scales, Playwright smoke |
| 2026-07-11 | 3D engine | Lerped rAF storyboard camera (perspective corridor: z-depth/tilt/scale/fade per stage incl. #summaryCards) + custom inertial wheel scroll with JS proximity snap replacing CSS mandatory snap on desktop; reduced-motion & <900px keep native scroll/crossfade. Files: experience.js (initStageJumps engine block), atelier.css (bb-camera / bb-smooth rules) |
| 2026-07-11 | Persistent field | Restored `js/journey-webgl.js` as a scroll-directed champagne node path with semantic stage focus, pointer parallax, sparse depth atmosphere, tab pause, reduced-motion opt-out, and capped pixel ratio. |
