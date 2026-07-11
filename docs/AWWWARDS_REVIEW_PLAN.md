# BLACKBOX · Awwwards Review Plan

> Thorough site review (2026-07-11) + prioritised upgrade plan to push BLACKBOX toward Awwwards-grade craft as a **personal finance budgeting & analytics** product — with Vectrfl-class scroll smoothness.

**Scope:** Live site review via Playwright (1440×900) + code audit of scroll/motion/ledger + Vectrfl reference patterns.  
**Not a clone brief:** Learn structure and feel from [vectrfl.com](https://www.vectrfl.com/); keep Obsidian Atelier gold/black identity.

---

## 1. Executive verdict

| Area | Score (1–5) | Notes |
|------|-------------|--------|
| Visual identity | **4** | Distinct gold vault aesthetic; not generic SaaS |
| Stage craft / density | **3.5** | Viability dash improved; charts strong; ledger was scrolling |
| Motion / scroll feel | **2.5** | Proximity snap works; **no smooth scroll engine**; jumps feel hard |
| Information design | **3.5** | Compact money + dashboards good; some horizon inconsistency |
| Interaction polish | **3** | Tooltips on viability; missing elsewhere; keyboard stage jump OK |
| Product clarity | **3.5** | Strong model; walkthroughs hidden; narrative could guide first use |
| Technical polish | **3** | CSS cascade wars; conflicting snap rules; overflow traps |
| Awwwards readiness | **3 / 5** | Memorable look; needs **fluid motion + zero nested scroll + tighter narrative** |

**Headline gap vs Awwwards winners / Vectrfl:**  
BLACKBOX already has *frames* (full-viewport stages, rail, film HUD). It lacks *continuity* — buttery interpolated scroll, ambient progress, and “one breath” transitions between acts.

---

## 2. What was measured (audit snapshot)

### Viewport fit (1440×900)

| Stage | Fits 100dvh | Internal scroll |
|-------|-------------|-----------------|
| Planning → Treemap | Yes | No |
| **Ledger** | Yes stage | **Yes** — `.table-scroll` overflow ~28px+ (25 rows) |
| AI / App / Outro | Yes | No |

### Motion contract

| Signal | Current |
|--------|---------|
| `scroll-snap-type` | `y proximity` when armed (good) |
| `scroll-behavior` | `auto` (hard) |
| Lenis / smooth engine | **Absent** |
| `window.__bbJourney` | Present |
| Journey film HUD | Present, bottom-left |
| Stage rail | Left (correct) |
| Jump navigation | `scrollIntoView({ behavior: 'auto' })` — instant, not cinematic |

### Vectrfl patterns to adopt (not copy)

1. **Continuous scroll story** — progress feels fractional, not page-flipped  
2. **Process chapters** — clear act titles (we have 4 acts; under-used visually)  
3. **“Scroll to discover” invitation** — hero must teach the mechanic  
4. **Smooth inertia** — wheel/trackpad deceleration (Lenis or custom lerp)  
5. **Sparse, confident type** — large ideas, tight instruments (we’re denser by product need — keep density, soften transitions)

---

## 3. Product strengths to protect

1. **Obsidian Atelier** palette + mono data type — unique finance branding  
2. **Live model** — income, categories, floor blockers → true recalculation  
3. **Compact currency (K/M)** — dense analytics face language  
4. **Viability dashboard** — bento + portal tooltips (recent win)  
5. **25-year ledger + 5/10/20 checkpoints** — long-horizon finance story  
6. **BYO Pollinations AI** — honest key model, canned reports  
7. **Four-act film map** — Load → Stress → Signal → Decide  

---

## 4. Critical findings (ordered by impact)

### P0 — Blocking “tool that feels finished”

| ID | Finding | Why it hurts Awwwards / trust |
|----|---------|-------------------------------|
| **P0.1** | 25-year ledger needs internal scroll | Nested scroll breaks film continuity; looks unfinished |
| **P0.2** | No smooth scroll / stage transitions | Feels snap-deck, not process film (vs Vectrfl) |
| **P0.3** | CSS cascade conflicts (`!important` stacks) | Hard to ship polish; regressions between stages |
| **P0.4** | Horizon inconsistency | Savings title says “5 years” while series is 25y; confuses analytics story |

### P1 — High craft impact

| ID | Finding | Direction |
|----|---------|-----------|
| **P1.1** | Act transitions invisible | Crossfade film HUD + spine fill is subtle; need stronger chapter moments |
| **P1.2** | Chart stages are quiet | Good charts, weak “insight strip” (walkthroughs hidden for space) |
| **P1.3** | Planning density vs first-run clarity | Power-user board; new users need a 10s guided read |
| **P1.4** | Tooltips only on viability | Purchases / ledger / pie need same portal tip system |
| **P1.5** | Rail overlaps content at left | Label “03 VIABILITY” sits on cards — reserve left padding when journey-live |
| **P1.6** | Hero → Planning gap / arming | Ensure single smooth invite, no double lander dead space |

### P2 — Awwwards differentiators

| ID | Finding | Direction |
|----|---------|-----------|
| **P2.1** | No scenario compare view | Side-by-side “Plan A / Plan B” is awards-friendly + useful |
| **P2.2** | No export / share artifact | One-click “share snapshot” (PNG/PDF of viability) |
| **P2.3** | Accessibility gaps | Focus rings, tooltip ARIA, reduced-motion paths incomplete |
| **P2.4** | Mobile not awards-primary | Ensure 390px is *usable*; desktop is the showcase |
| **P2.5** | Sound / haptics optional | Soft tick on stage change (muted by default) |
| **P2.6** | Microcopy voice | Unify: editorial display + clinical data (avoid mixed marketing tones) |

### P3 — Engineering hygiene

| ID | Finding |
|----|---------|
| **P3.1** | Collapse duplicate CSS blocks in `atelier.css` (viability/ledger written 4+ times) |
| **P3.2** | Single scroll contract module — kill competing snap rules |
| **P3.3** | Finance unit tests for 25y marks + compact format |
| **P3.4** | Visual regression set (`qa-review-*.png`) as CI smoke |

---

## 5. Plan of record (phased)

### Phase 0 — Fit & honesty (1 session) ✅ done (2026-07-11)

**Goal:** Every finance surface fits one viewport; labels match math.

- [x] Audit all stages for nested scroll  
- [x] **P0.1** Ledger: 25 rows flex-fit, no scrollbar, compact headers/status (`Y1…Y25`, OK/Over)  
- [x] **P0.4** Savings title → “Savings Projection” + 25-year path copy  
- [x] Playwright: `#stage-ledger .table-scroll` overflow **0** at 1440×900 and 1280×720; Y25 visible  

**Exit:** Ledger + charts tell one horizon story without inner scrollbars.

---

### Phase 1 — Vectrfl-class smoothness (1–2 sessions)

**Goal:** Scrolling feels continuous and expensive.

> **2026-07-11 progress:** S1 shipped as a custom engine (no Lenis dep): inertial wheel lerp + idle JS proximity snap (CSS mandatory snap disabled under `html.bb-smooth`), plus a 3D storyboard camera (perspective corridor — depth/tilt/scale/fade per stage) driven by a continuous rAF loop in `experience.js`. Reduced-motion and <900px viewports keep native scroll and the static look. S2 (cinematic rail/nav jumps) still pending — jumps remain instant.

| Task | Implementation sketch |
|------|------------------------|
| **S1** Smooth scroll core | Optional Lenis *or* custom `lerp` on `scrollTo` + wheel dampening; respect `prefers-reduced-motion` |
| **S2** Cinematic stage jump | `jumpToStage` uses smooth scroll + brief opacity/scale (already have enter anim — sync duration) |
| **S3** Fractional progress polish | Spine fill + film HUD progress already exist — ensure 60fps, no jank on chart-heavy stages |
| **S4** Hero invitation | Persistent “scroll to enter the model” with line draw; fades when `stages-armed` |
| **S5** Act chapter cards | On act change (1→2→3→4), brief full-bleed kicker: `02 · STRESS` for ~600ms |

**Exit:** Blind A/B — site feels “oiled,” not “paged.”

---

### Phase 2 — Analytics clarity (1–2 sessions)

**Goal:** Read as a *best-in-class finance analytics tool*, not only a pretty landing.

| Task | Detail |
|------|--------|
| **A1** Insight rail | One-line live insight under each chart title (from existing walkthrough generators) — not multi-card walls |
| **A2** Portal tooltips sitewide | Reuse viability `vdTooltip` pattern for purchases, pie, ledger columns |
| **A3** Ledger as instrument | Alternating row washes, milestone glow only on 5/10/20, sticky header without scroll container |
| **A4** Savings scrub trust | Month labels aligned with Chart.js (prior scrub bug class) |
| **A5** Compare strip | Mini “Δ vs last saved scenario” on viability |

**Exit:** A judge can explain the plan in 30 seconds from Signal act alone.

---

### Phase 3 — Narrative & first-run (1 session)

| Task | Detail |
|------|--------|
| **N1** First-run path | Soft coach marks: Planning amount → Purchases toggle → Viability board |
| **N2** Empty / extreme states | Zero income, all purchases on — designed empty/danger states |
| **N3** Copy pass | One voice: calm, precise, no hype on App stage |

---

### Phase 4 — Awards surface polish (1–2 sessions)

| Task | Detail |
|------|--------|
| **W1** Left content inset | `padding-inline-start` when journey rail visible — no label collision |
| **W2** Load performance | Atmosphere images priority; chart deferred until stage near |
| **W3** 3 critique cycles | Capture → 5 problems → fix (existing skill) on hero, viability, ledger, app |
| **W4** Case-study page | Optional `/story` or README section: before/after, model honesty |

---

## 6. Smoothness specification (acceptance)

Inspired by Vectrfl; adapted for a dense tool:

1. **Wheel/trackpad:** No multi-stage jump on one flick; proximity snap only settles when near a stage center  
2. **Stage link / rail click:** 400–700ms smooth ease-out-expo scroll; active node interpolates  
3. **Nested scroll:** **Forbidden** on showcase desktop (≥1200×800) for primary stages  
4. **Reduced motion:** Instant jumps, no parallax, film HUD static  
5. **Charts:** Resize/update without layout thrash; pause off-screen RAF  

---

## 7. Ledger no-scroll specification (P0.1)

| Constraint | Target |
|------------|--------|
| Rows | 25 data + 1 header |
| Container | Flex child filling stage below title |
| Overflow | `hidden` — never `auto` on desktop |
| Row height | `flex: 1 1 0` equal distribution |
| Labels | `Y1`…`Y25`; milestones badge `5` / `10` / `20` |
| Status | Short `OK` / `Over` + full title attribute |
| Headers | Income · Spend · Saved · Cumulative · Status |

---

## 8. Success metrics

| Metric | Target |
|--------|--------|
| Nested scrollers on desktop showcase path | **0** |
| Stage jump feel (subjective) | Smooth, ≤700ms |
| Time for new user to understand viability | ≤30s |
| Finance smoke | Income↑ → savings↑ still holds |
| Visual QA set | All 11 stages captured clean |

---

## 9. Execution order (recommended)

```
Week pulse (compressed):
  Day 1  Phase 0 — ledger fit + horizon labels     ← now
  Day 1  Phase 1 S1–S2 — smooth scroll + jumps
  Day 2  Phase 1 S3–S5 — film continuity
  Day 2  Phase 2 A1–A4 — analytics clarity
  Day 3  Phase 3 + 4 — narrative, inset, critique ×3
```

---

## 10. Out of scope (this plan)

- Cloning Vectrfl blue/Roboto/staffing content  
- Freeform AI chat  
- Full WebGPU journey graph rewrite  
- Mobile-first Awwwards campaign (desktop showcase first)

---

## 11. Related docs

- [VECTRFL_MIGRATION_PLAN.md](./VECTRFL_MIGRATION_PLAN.md)  
- Brain vault: `brain/00 Maps/Home.md`  
- Skills: Visual Consistency Pass · Critique Cycle · Playwright Visual QA  

---

*Review date: 2026-07-11 · Next action: complete Phase 0 ledger fit, then Phase 1 smoothness.*
