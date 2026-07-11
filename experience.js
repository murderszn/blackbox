/**
 * BLACKBOX — Obsidian Atelier experience layer
 *
 * Advanced technique 1: Stable layout (no scroll-driven opacity/phase)
 *   — Content is fully opaque immediately (no reveal fades)
 *   — Hero text stays at fixed opacity; no parallax fade on scroll
 *
 * Advanced technique 2: Fluid micro-interactions
 *   — Ambient cursor gold light
 *   — Magnetic primary CTAs
 *   — Metric value tick flash on DOM mutation
 *
 * Advanced technique 3: High-fidelity interactive data visualization HUD
 *   — Live scrub HUD over savings chart (mousemove → month + balance)
 *   — Driven from Chart.js instance when available
 *
 * Complex state transitions:
 *   — Affordability banner morphs healthy/strained classes with FLIP-ish
 *     height/metric transitions when health score changes
 */

(function () {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    /* ── Ambient cursor ─────────────────────────────────── */
    function initAmbientCursor() {
        if (reduced || !finePointer) return;
        document.body.classList.add('is-pointer-fine');
        const el = document.createElement('div');
        el.id = 'ambientCursor';
        document.body.appendChild(el);

        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        let tx = x;
        let ty = y;
        let active = false;

        const onMove = (e) => {
            tx = e.clientX;
            ty = e.clientY;
            if (!active) {
                active = true;
                el.classList.add('is-active');
            }
        };
        window.addEventListener('pointermove', onMove, { passive: true });
        window.addEventListener('pointerleave', () => {
            active = false;
            el.classList.remove('is-active');
        });

        const tick = () => {
            x += (tx - x) * 0.12;
            y += (ty - y) * 0.12;
            el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    /* ── Magnetic buttons ───────────────────────────────── */
    function initMagnetic() {
        if (reduced || !finePointer) return;
        const targets = document.querySelectorAll(
            '.hero-cta-primary, .hero-cta-secondary, .btn-primary, .email-signup-button'
        );
        targets.forEach((btn) => {
            btn.classList.add('magnetic');
            const strength = 0.28;
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                btn.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
            });
            btn.addEventListener('pointerleave', () => {
                btn.style.transform = '';
            });
        });
    }

    /* ── Scroll reveals ─────────────────────────────────── */
    function initReveals() {
        // No opacity phase / blur reveal. Keep the document plane fully opaque
        // so scroll never repaints text through intermediate alpha values.
        const selectors = [
            '.instructions-panel',
            '.stage-panel',
            '.financial-planning-header',
            '.app-launch-section',
            '.site-footer',
            '.summary-grid'
        ];
        document.querySelectorAll(selectors.join(',')).forEach((el) => {
            el.classList.add('reveal-block', 'is-revealed', 'is-inview');
            el.style.opacity = '1';
            el.style.filter = 'none';
            el.style.transform = 'none';
        });
    }

    /* ── Hero: fixed opacity (no scroll phase-out) ──────── */
    function initHeroParallax() {
        // Intentionally empty: hero title/copy stay at fixed opacity and position.
        // Binary hide when past the hero is handled by script.js updateHeroOffscreen.
        const title = document.querySelector('.header-banner-title');
        const atmos = document.querySelector('.hero-atmosphere');
        if (title) {
            title.style.opacity = '';
            title.style.transform = '';
        }
        if (atmos) {
            atmos.style.opacity = '';
            atmos.style.transform = '';
        }
    }

    /* ── Metric tick observers ──────────────────────────── */
    function initMetricTicks() {
        const ids = [
            'financialHealthScore',
            'savingsRate',
            'topRightSavings',
            'miniMonthlyCashFlow',
            'miniMajorPurchases',
            'miniExpenseRatio',
            'carPaymentDisplay',
            'housePaymentDisplay'
        ];
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            let last = el.textContent;
            const mo = new MutationObserver(() => {
                const next = el.textContent;
                if (next !== last) {
                    last = next;
                    el.classList.remove('metric-tick');
                    // force reflow
                    void el.offsetWidth;
                    el.classList.add('metric-tick');
                }
            });
            mo.observe(el, { characterData: true, childList: true, subtree: true });
        });
    }

    /* ── Affordability state morph ──────────────────────── */
    function initAffordabilityMorph() {
        const banner = document.getElementById('affordabilityBanner');
        const scoreEl = document.getElementById('financialHealthScore');
        if (!banner || !scoreEl) return;

        const apply = () => {
            const raw = (scoreEl.textContent || '').replace(/[^\d.]/g, '');
            const score = parseFloat(raw);
            banner.classList.remove('is-healthy', 'is-strained');
            if (!Number.isFinite(score)) return;
            if (score >= 60) banner.classList.add('is-healthy');
            else banner.classList.add('is-strained');
        };

        const mo = new MutationObserver(apply);
        mo.observe(scoreEl, { characterData: true, childList: true, subtree: true });
        apply();
    }

    /**
     * Scrub month meta — must match script.js savings chart tooltip:
     * year = floor(idx/12), month = idx%12, month 0 → "Start".
     */
    function formatScrubMeta(idx, dataLen) {
        const year = Math.floor(idx / 12);
        const month = idx % 12;
        const monthLabel = month === 0 ? 'Start' : `Month ${month}`;
        const points = Number.isFinite(dataLen) ? ` · Point ${idx + 1}/${dataLen}` : '';
        return `Year ${year} · ${monthLabel}${points}`;
    }
    // Expose for durable tests (same shipped function the HUD uses)
    window.__bbFormatScrubMeta = formatScrubMeta;

    /* ── Interactive savings chart HUD ──────────────────── */
    function initChartScrubHUD() {
        const canvas = document.getElementById('savingsChart');
        if (!canvas) return;
        const wrap = canvas.closest('.chart-wrapper') || canvas.parentElement;
        const container = canvas.closest('.chart-container');
        if (!wrap || !container) return;

        if (container.querySelector('.chart-scrub-hud')) return;

        const hud = document.createElement('div');
        hud.className = 'chart-scrub-hud';
        hud.innerHTML = `
            <div>
                <div class="scrub-label">Scrub trajectory</div>
                <div class="scrub-value" id="scrubBalance">—</div>
            </div>
            <div class="scrub-meta" id="scrubMonth">Hover the chart to inspect any month</div>
        `;
        container.insertBefore(hud, wrap);

        const balanceEl = hud.querySelector('#scrubBalance');
        const monthEl = hud.querySelector('#scrubMonth');

        const formatMoney = (n) => {
            if (!Number.isFinite(n)) return '—';
            const sign = n < 0 ? '-' : '';
            return sign + '$' + Math.abs(Math.round(n)).toLocaleString();
        };

        const readChart = () => {
            // Chart.js attaches instance on canvas via Chart.getChart if available
            if (typeof Chart !== 'undefined' && Chart.getChart) {
                return Chart.getChart(canvas);
            }
            return window.savingsChart || null;
        };

        const onMove = (e) => {
            const chart = readChart();
            if (!chart || !chart.data || !chart.data.datasets?.[0]) return;
            const data = chart.data.datasets[0].data;
            const labels = chart.data.labels || [];
            if (!data.length) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const area = chart.chartArea;
            if (!area) return;
            const rel = (x - area.left) / Math.max(1, area.right - area.left);
            const idx = Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1))));
            const val = Number(data[idx]);
            balanceEl.textContent = formatMoney(val);
            // Align with Chart.js tooltip in script.js (month = idx%12; 0 = Start)
            monthEl.textContent = formatScrubMeta(idx, data.length);
        };

        const onLeave = () => {
            const chart = readChart();
            if (!chart?.data?.datasets?.[0]?.data?.length) {
                balanceEl.textContent = '—';
                monthEl.textContent = 'Hover the chart to inspect any month';
                return;
            }
            const data = chart.data.datasets[0].data;
            const last = Number(data[data.length - 1]);
            balanceEl.textContent = formatMoney(last);
            monthEl.textContent = `5-year endpoint  ·  ${formatMoney(last)}`;
        };

        canvas.addEventListener('mousemove', onMove, { passive: true });
        canvas.addEventListener('mouseleave', onLeave);
        // seed once charts likely exist
        setTimeout(onLeave, 1200);
        setTimeout(onLeave, 2800);
    }

    /* ── Expose savingsChart for HUD if script keeps it local ── */
    function bridgeSavingsChart() {
        // Patch: observe when canvas gets a chart via Chart.getChart only
        // Also try to bind window after calculate runs by monkeypatching if needed
        if (typeof window !== 'undefined' && !window.__bbChartBridge) {
            window.__bbChartBridge = true;
            const orig = window.calculate;
            // calculate is not on window by default (script is non-module with functions in global scope for many apps)
            // script.js uses plain functions — they become globals unless deferred module
        }
    }

    /* ── Icon map for budget categories ─────────────────── */
    const ICON_MAP = {
        income: '/assets/icons/income.svg',
        bills: '/assets/icons/housing.svg',
        util: '/assets/icons/housing.svg',
        dining: '/assets/icons/food.svg',
        grocery: '/assets/icons/food.svg',
        grocer: '/assets/icons/food.svg',
        auto: '/assets/icons/transport.svg',
        transport: '/assets/icons/transport.svg',
        entertain: '/assets/icons/growth.svg',
        shop: '/assets/icons/shopping.svg',
        fee: '/assets/icons/growth.svg',
        travel: '/assets/icons/transport.svg',
        health: '/assets/icons/growth.svg',
        home: '/assets/icons/house.svg',
        garden: '/assets/icons/house.svg',
        software: '/assets/icons/ai.svg',
        tech: '/assets/icons/ai.svg',
        car: '/assets/icons/car.svg',
        house: '/assets/icons/house.svg',
        default: '/assets/icons/growth.svg'
    };

    function iconForName(name) {
        const n = String(name || '').toLowerCase();
        for (const [key, path] of Object.entries(ICON_MAP)) {
            if (key === 'default') continue;
            if (n.includes(key)) return path;
        }
        return ICON_MAP.default;
    }

    function injectBudgetIcons() {
        document.querySelectorAll('.budget-item').forEach((item) => {
            if (item.querySelector('.budget-item-icon')) return;
            const top = item.querySelector('.tile-head') || item.querySelector('.budget-item-top');
            if (!top) return;
            const nameInput = item.querySelector('.budget-name-input') || item.querySelector('.budget-item-name') || top.querySelector('.budget-item-name, input');
            const name = item.classList.contains('income-item')
                ? 'income'
                : nameInput?.value || nameInput?.getAttribute('value') || '';
            const img = document.createElement('img');
            img.className = 'budget-item-icon';
            img.src = iconForName(name);
            img.alt = '';
            img.width = 28;
            img.height = 28;
            img.decoding = 'async';
            if (top.classList.contains('tile-head')) {
                img.style.width = '18px';
                img.style.height = '18px';
                img.style.marginRight = '2px';
            }
            top.insertBefore(img, top.firstChild);
        });
    }

    function watchBudgetIcons() {
        const container = document.getElementById('budgetItems');
        if (!container) return;
        injectBudgetIcons();
        const mo = new MutationObserver(() => injectBudgetIcons());
        mo.observe(container, { childList: true });
    }

    /* ── Panel icons for car/house ──────────────────────── */
    function injectPanelIcons() {
        const carTitle = document.querySelector('#carPanel .panel-title span');
        const houseTitle = document.querySelector('#housePanel .panel-title span');
        if (carTitle && !carTitle.querySelector('.panel-icon')) {
            const img = document.createElement('img');
            img.className = 'panel-icon';
            img.src = '/assets/icons/car.svg';
            img.alt = '';
            img.width = 32;
            img.height = 32;
            carTitle.prepend(img);
        }
        if (houseTitle && !houseTitle.querySelector('.panel-icon')) {
            const img = document.createElement('img');
            img.className = 'panel-icon';
            img.src = '/assets/icons/house.svg';
            img.alt = '';
            img.width = 32;
            img.height = 32;
            houseTitle.prepend(img);
        }
        const aiTitle = document.querySelector('.ai-analysis-title');
        if (aiTitle && !aiTitle.querySelector('.panel-icon')) {
            const img = document.createElement('img');
            img.className = 'panel-icon';
            img.src = '/assets/icons/ai.svg';
            img.alt = '';
            img.width = 32;
            img.height = 32;
            aiTitle.prepend(img);
        }
    }

    /* ── Full-viewport stage jumps + cinematic journey ──── */
    function initStageJumps() {
        const stages = Array.from(document.querySelectorAll('.stage-panel[data-stage]'));
        const rail = document.getElementById('stageRail');
        if (!stages.length) return;

        const HERO_INDEX = -1; // virtual intro stage (scrollY ≈ 0)
        const film = document.getElementById('journeyFilm');
        const filmIdx = document.getElementById('journeyFilmIdx');
        const filmTitle = document.getElementById('journeyFilmTitle');
        const filmMeta = document.getElementById('journeyFilmMeta');
        const filmBar = document.getElementById('journeyFilmBar');
        let trackFill = null;

        const chapterMeta = {
            Intro: 'scroll to enter the model',
            Planning: 'income & lifestyle load',
            Purchases: 'floor blockers',
            Viability: 'live affordability',
            Budget: 'composition',
            Savings: 'trajectory',
            Spending: 'pressure map',
            Treemap: 'spatial spend',
            Ledger: 'decade ledger',
            AI: 'viability & reports',
            App: 'mobile waitlist',
            Outro: 'close'
        };

        const actTitles = {
            0: 'Intro',
            1: 'Load',
            2: 'Stress',
            3: 'Signal',
            4: 'Decide'
        };

        const armStages = (on) => {
            // Proximity snap while past hero; off only on the intro lander
            document.documentElement.classList.toggle('stages-armed', !!on);
            document.documentElement.classList.toggle('journey-live', !!on);
            // Own the final physics contract here as well as in CSS. Several
            // legacy mandatory-snap declarations exist in the layered theme;
            // an important inline value prevents cascade order or cached CSS
            // from restoring the trackpad fight.
            // CSS snap and transformed stage geometry are fundamentally at
            // odds: the snap engine evaluates visual boxes and can pull toward
            // an adjacent 3D frame. Keep scrolling native; rail and keyboard
            // navigation still land on exact layout anchors.
            document.documentElement.style.setProperty('scroll-snap-type', 'none', 'important');
            if (film) {
                if (on) film.removeAttribute('hidden');
                else film.setAttribute('hidden', '');
            }
        };

        const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');

        // Transform-independent document geometry. The 3D camera writes
        // transforms every frame, so getBoundingClientRect() cannot be used for
        // navigation or it creates a camera -> measurement -> camera loop.
        const documentTop = (el) => {
            let top = 0;
            for (let node = el; node && node !== document.body; node = node.offsetParent) {
                top += node.offsetTop;
            }
            // The fixed hero is cleared by a collapsed margin on `.content`;
            // collapsed margins are not represented in the offsetParent chain.
            const content = document.querySelector('.content');
            if (content && content.contains(el)) {
                top += parseFloat(getComputedStyle(content).marginTop) || 0;
            }
            return top;
        };

        /** Continuous progress 0→1 from scroll position through stage centers */
        const computeFractionalProgress = () => {
            const y = window.scrollY || 0;
            const vh = window.innerHeight || 1;
            const mid = y + vh * 0.4;
            if (!stages.length) return 0;
            const centers = stages.map((s) => documentTop(s) + s.offsetHeight * 0.35);
            // Before first stage
            if (mid <= centers[0]) {
                const heroEnd = Math.max(1, centers[0]);
                return Math.min(1, Math.max(0, mid / heroEnd)) * (1 / stages.length);
            }
            // After last
            if (mid >= centers[centers.length - 1]) return 1;
            for (let i = 0; i < centers.length - 1; i++) {
                if (mid >= centers[i] && mid <= centers[i + 1]) {
                    const t = (mid - centers[i]) / Math.max(1, centers[i + 1] - centers[i]);
                    return (i + t) / (centers.length - 1);
                }
            }
            return 0;
        };

        /* ── 3D storyboard engine ─────────────────────────────
         * Continuous rAF loop, not scroll-event driven:
         *  - every visual value (y-parallax, z-depth, tilt, scale, opacity)
         *    lerps toward its target each frame, so motion stays fluid even
         *    when scroll input arrives in coarse steps;
         *  - wheel input feeds an inertial scroll target (Lenis-style) on
         *    desktop fine pointers, replacing hard mandatory snap with a
         *    gentle JS proximity pull once the wheel goes idle;
         *  - stage positions come from offsetTop (layout), never from
         *    getBoundingClientRect, so the transforms we write can't feed
         *    back into the math and wobble.
         */
        const cameraOn = !reduced && window.matchMedia('(min-width: 900px)').matches;
        // Preserve native wheel/trackpad momentum. The earlier wheel hijack made
        // short trackpad gestures feel sticky and could pull through a stage
        // after the user had stopped. CSS proximity snap supplies the gentle
        // settle; the rAF camera remains independent and fully interpolated.
        const smoothOn = false;

        /* Transform-immune stage geometry. Rects are useless once the camera
           writes inline transforms, and offsetTop chains alone lose the hero
           height (.content's 100vh margin-top collapses through to <body>) —
           so sum offsetTops up to <body> and anchor at body's document top,
           which no descendant transform can perturb. */
        // Everything that travels the corridor gets the camera treatment —
        // stages plus in-flow interstitials like #summaryCards, which would
        // otherwise float at full opacity over every transition.
        const corridorEls = stages.concat(
            Array.from(document.querySelectorAll('#summaryCards')).filter((el) => el.offsetParent)
        );
        let stageTops = [];
        let corridorTops = [];
        let corridorHeights = [];
        const measureStages = () => {
            stageTops = stages.map(documentTop);
            corridorTops = corridorEls.map(documentTop);
            corridorHeights = corridorEls.map((el) => el.offsetHeight);
        };
        measureStages();
        window.addEventListener('resize', measureStages, { passive: true });
        window.addEventListener('load', () => setTimeout(measureStages, 300));
        if ('ResizeObserver' in window) {
            let mRaf = 0;
            const ro = new ResizeObserver(() => {
                cancelAnimationFrame(mRaf);
                mRaf = requestAnimationFrame(measureStages);
            });
            ro.observe(document.body);
        }

        const cam = corridorEls.map(() => ({ ty: 0, z: 0, rx: 0, s: 1, o: 1 }));
        let targetY = window.scrollY || 0;
        let lastWheelAt = 0;
        let lastWrittenY = -1;
        let snapIdx = null; // chosen once per idle period; null = not chosen yet

        const syncScrollTargets = () => {
            targetY = window.scrollY || 0;
            snapIdx = null;
        };

        const nestedScrollable = (e) => {
            for (let n = e.target instanceof Element ? e.target : null; n && n !== document.body; n = n.parentElement) {
                const cs = getComputedStyle(n);
                if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) return true;
            }
            return false;
        };

        if (smoothOn) {
            document.documentElement.classList.add('bb-smooth');
            window.addEventListener(
                'wheel',
                (e) => {
                    if (e.ctrlKey) return; // pinch-zoom
                    if (nestedScrollable(e)) return; // let inner scrollers work
                    e.preventDefault();
                    const unit = e.deltaMode === 1 ? 16 : 1;
                    const max = document.documentElement.scrollHeight - window.innerHeight;
                    targetY = Math.max(0, Math.min(max, targetY + e.deltaY * unit));
                    lastWheelAt = performance.now();
                    snapIdx = null;
                },
                { passive: false }
            );
            // Adopt scrollbar drags / keyboard / programmatic scrolls — but not
            // the engine's own scrollTo writes, or it would cancel the snap pull
            window.addEventListener(
                'scroll',
                () => {
                    const y = window.scrollY || 0;
                    if (Math.abs(y - lastWrittenY) <= 2) return; // engine-written
                    if (performance.now() - lastWheelAt > 200) targetY = y;
                },
                { passive: true }
            );
        }

        if (cameraOn) {
            document.documentElement.classList.add('bb-camera');
            let cameraLastFrame = performance.now();
            const frame = (now = performance.now()) => {
                const dt = Math.min(0.05, Math.max(0.001, (now - cameraLastFrame) / 1000));
                cameraLastFrame = now;
                // Time-based damping stays consistent at 30/60/120 Hz.
                // Opacity is never interpolated — text stays fully opaque.
                const moveK = 1 - Math.exp(-13 * dt);
                const vh = window.innerHeight || 1;

                if (smoothOn) {
                    const y = window.scrollY || 0;
                    let dy = targetY - y;
                    if (performance.now() - lastWheelAt > 240) {
                        // Idle proximity snap. The stage is chosen ONCE per idle
                        // period (snapIdx), after inertia has ~finished —
                        // re-picking every frame lets mid-flight layout shifts
                        // chain the pull across multiple stages.
                        if (snapIdx === null && Math.abs(dy) < 2) {
                            let bestI = -1;
                            let bestDist = Math.abs(targetY); // hero top = 0
                            stageTops.forEach((top, i) => {
                                const d = Math.abs(targetY - top);
                                if (d < bestDist) {
                                    bestDist = d;
                                    bestI = i;
                                }
                            });
                            // 0.55vh radius > half the stage pitch, so the camera
                            // always settles on a chapter, never between two
                            snapIdx = bestDist < vh * 0.55 ? bestI : -1;
                        }
                        if (snapIdx >= 0) {
                            const dSnap = stageTops[snapIdx] - targetY;
                            // 0.22 compounds with the 0.14 scroll ease — lower
                            // reads as drifting, not settling
                            if (Math.abs(dSnap) > 1) targetY += dSnap * 0.22;
                            dy = targetY - y;
                        }
                    }
                    if (Math.abs(dy) >= 2) {
                        lastWrittenY = Math.round(y + dy * 0.14);
                        window.scrollTo(0, y + dy * 0.14);
                    } else if (Math.abs(dy) > 0.25) {
                        // land exactly — scrollY quantizes to integers, so a
                        // sub-pixel dy can never converge through easing alone
                        lastWrittenY = Math.round(targetY);
                        window.scrollTo(0, targetY);
                    }
                }

                const y = window.scrollY || 0;
                // 0.5vh focal line so a stage resting at its snap point sits at
                // delta 0 — full scale, no tilt, full opacity
                const mid = y + vh * 0.5;
                corridorEls.forEach((stage, i) => {
                    const center = corridorTops[i] + corridorHeights[i] * 0.5;
                    const delta = Math.max(-1.15, Math.min(1.15, (center - mid) / vh));
                    const abs = Math.abs(delta);
                    const c = cam[i];
                    // Editorial depth, not a theme-park fly-through. Nearby
                    // controls stay readable while the next frame establishes
                    // itself; distant chapters still recede into the room.
                    c.ty += (delta * -28 - c.ty) * moveK;
                    c.z += (-Math.min(240, abs * 210) - c.z) * moveK;
                    c.rx += (delta * -4.5 - c.rx) * moveK;
                    c.s += (1 - Math.min(0.13, abs * 0.11) - c.s) * moveK;
                    c.o = 1;
                    // Keep the interface plane pixel-stable and fully opaque.
                    // No transform/opacity phase — spatial motion lives in journey-webgl.js.
                    stage.style.setProperty('transform', 'none', 'important');
                    stage.style.setProperty('opacity', '1', 'important');
                });
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
        }

        const publishJourney = (state) => {
            window.__bbJourney = state;
            try {
                window.dispatchEvent(new CustomEvent('bb:journey', { detail: state }));
            } catch (_) { /* ignore */ }
        };

        const updateJourneyFilm = (index, fractionalOverride) => {
            const total = stages.length;
            const onHero = index === HERO_INDEX;
            const label = onHero ? 'Intro' : (stages[index]?.dataset?.stage || 'Section');
            const act = onHero ? 0 : (parseInt(stages[index]?.dataset?.act || '0', 10) || 0);
            const actTitle = onHero ? 'Intro' : (stages[index]?.dataset?.actTitle || actTitles[act] || '');
            const stageIdx = onHero ? 0 : index + 1;

            let pct =
                typeof fractionalOverride === 'number'
                    ? fractionalOverride
                    : onHero
                      ? 0
                      : total > 1
                        ? index / (total - 1)
                        : 1;
            pct = Math.min(1, Math.max(0, pct));

            // One unambiguous hierarchy: HUD/rail use stage number, title owns
            // the four-act grouping. No more repeated "01" on Purchases.
            if (filmIdx) filmIdx.textContent = pad2(stageIdx);
            if (filmTitle) {
                // "01 LOAD" energy — act title primary when live
                filmTitle.textContent = onHero ? 'Intro' : `Act ${pad2(act)} · ${actTitle}`;
            }
            if (filmMeta) {
                filmMeta.textContent = onHero
                    ? chapterMeta.Intro
                    : `${label} · ${pad2(stageIdx)} / ${pad2(total)} · ${chapterMeta[label] || 'model journey'}`;
            }
            if (filmBar) filmBar.style.transform = `scaleX(${pct})`;
            if (trackFill) trackFill.style.transform = `scaleY(${pct})`;

            document.documentElement.style.setProperty('--journey-progress', String(pct));
            document.documentElement.style.setProperty('--journey-stage', String(stageIdx));
            document.documentElement.style.setProperty('--journey-act', String(act));
            document.documentElement.dataset.journeyAct = String(act);

            publishJourney({
                progress: pct,
                stageIndex: stageIdx,
                act,
                actTitle,
                label,
                onHero
            });
        };

        const jumpToHero = () => {
            armStages(false);
            setActive(HERO_INDEX);
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            syncScrollTargets();
            requestAnimationFrame(() => {
                armStages(false);
                window.scrollTo(0, 0);
                setActive(HERO_INDEX);
                syncScrollTargets();
                const hero = document.querySelector('.hero');
                if (hero) hero.classList.remove('hero-offscreen');
            });
            try {
                history.replaceState(null, '', '#top');
            } catch (_) { /* ignore */ }
        };

        // Build journey spine: track + Intro + content nodes
        if (rail) {
            rail.innerHTML = '';
            rail.classList.add('journey-spine');

            const track = document.createElement('div');
            track.className = 'journey-track';
            track.setAttribute('aria-hidden', 'true');
            trackFill = document.createElement('div');
            trackFill.className = 'journey-track-fill';
            trackFill.id = 'journeyTrackFill';
            track.appendChild(trackFill);
            rail.appendChild(track);

            const intro = document.createElement('button');
            intro.type = 'button';
            intro.className = 'stage-rail-dot stage-rail-dot--hero journey-node';
            intro.dataset.label = 'Intro';
            intro.dataset.node = '00';
            intro.setAttribute('aria-label', 'Jump to intro hero');
            intro.innerHTML = '<span class="journey-node-core"></span>';
            intro.addEventListener('click', jumpToHero);
            rail.appendChild(intro);

            stages.forEach((stage, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'stage-rail-dot journey-node';
                btn.dataset.label = stage.dataset.stage || 'Section';
                btn.dataset.node = pad2(i + 1);
                btn.setAttribute('aria-label', `Jump to ${btn.dataset.label}`);
                btn.innerHTML = '<span class="journey-node-core"></span>';
                btn.addEventListener('click', () => jumpToStage(stage));
                rail.appendChild(btn);
            });
        }

        const dots = rail ? Array.from(rail.querySelectorAll('.stage-rail-dot')) : [];

        // Tag spine nodes with act from stage data (node index stays 01…N)
        stages.forEach((stage, i) => {
            const d = dots[i + 1];
            if (d) {
                d.dataset.act = stage.dataset.act || '';
                d.dataset.node = pad2(i + 1);
            }
        });

        let lastActiveIndex = null;
        let chartResizeRaf = 0;
        const setActive = (index, fractionalOverride) => {
            const stageChanged = index !== lastActiveIndex;
            lastActiveIndex = index;
            // index -1 = hero intro; 0..n-1 = stages
            stages.forEach((s, i) => {
                s.classList.toggle('is-stage-active', i === index);
            });
            dots.forEach((d, i) => {
                const isHeroDot = i === 0;
                const active = isHeroDot ? index === HERO_INDEX : index === i - 1;
                d.classList.toggle('is-active', active);
                d.classList.toggle('is-passed', isHeroDot ? index >= 0 : index > i - 1);
            });
            const frac =
                typeof fractionalOverride === 'number'
                    ? fractionalOverride
                    : index === HERO_INDEX
                      ? 0
                      : computeFractionalProgress();
            updateJourneyFilm(index, frac);
            // Chart layout is expensive and can resize the body. Running it on
            // every scroll event fed back into camera measurement and produced
            // visible shudder. Resize once, after a real chapter transition.
            if (index >= 0 && stageChanged) {
                cancelAnimationFrame(chartResizeRaf);
                chartResizeRaf = requestAnimationFrame(() => {
                    if (typeof handleChartResize === 'function') {
                        try { handleChartResize(); } catch (_) { /* ignore */ }
                    } else {
                        window.dispatchEvent(new Event('resize'));
                    }
                });
            }
        };

        function jumpToStage(stage) {
            if (!stage) return;
            armStages(true);
            const idx = stages.indexOf(stage);
            if (idx >= 0) setActive(idx);
            // Rail/nav jumps are deterministic cuts. Native smooth scrolling
            // plus snap can capture an intermediate chapter and visibly hunt.
            // scrollIntoView reads the camera-transformed visual box and can
            // land one chapter late. Use the immutable layout anchor instead.
            document.documentElement.style.setProperty('scroll-snap-type', 'none', 'important');
            window.scrollTo(0, stageTops[idx] || documentTop(stage));
            syncScrollTargets();
            requestAnimationFrame(() => {
                armStages(true);
                if (idx >= 0) setActive(idx, computeFractionalProgress());
                syncScrollTargets();
            });
        }

        // Hero vs stages from scroll position
        const syncFromScroll = () => {
            const y = window.scrollY || 0;
            const vh = window.innerHeight || 1;
            const mid = y + vh * 0.4;
            const firstTop = stageTops[0] || documentTop(stages[0]);
            const pastHero = y > Math.min(vh * 0.4, Math.max(80, firstTop - 40));
            armStages(pastHero);

            const frac = computeFractionalProgress();

            if (!pastHero) {
                setActive(HERO_INDEX, frac);
                return;
            }

            let best = 0;
            let bestDist = Infinity;
            stages.forEach((s, i) => {
                const center = (stageTops[i] || documentTop(s)) + s.offsetHeight * 0.35;
                const dist = Math.abs(center - mid);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = i;
                }
            });
            setActive(best, frac);
        };

        let scrollTick = false;
        window.addEventListener(
            'scroll',
            () => {
                if (scrollTick) return;
                scrollTick = true;
                requestAnimationFrame(() => {
                    scrollTick = false;
                    syncFromScroll();
                });
            },
            { passive: true }
        );

        // IntersectionObserver as secondary signal once past hero
        // Intersection ratios are transform-aware; keep them as a fallback for
        // the flat/mobile layout only. Desktop camera selection uses anchors.
        if ('IntersectionObserver' in window && !cameraOn) {
            const ratios = new Map();
            const io = new IntersectionObserver(
                (entries) => {
                    if ((window.scrollY || 0) <= (window.innerHeight || 1) * 0.55) return;
                    entries.forEach((entry) => {
                        ratios.set(entry.target, entry.intersectionRatio);
                    });
                    let best = -1;
                    let bestR = 0;
                    stages.forEach((s, i) => {
                        const r = ratios.get(s) || 0;
                        if (r > bestR) {
                            bestR = r;
                            best = i;
                        }
                    });
                    if (best >= 0 && bestR > 0.2) setActive(best);
                },
                { threshold: [0.15, 0.35, 0.55, 0.75], rootMargin: '-8% 0px -8% 0px' }
            );
            stages.forEach((s) => io.observe(s));
        }

        // Keyboard: from hero, PageDown/j enters first stage; PageUp/k on first returns to hero
        window.addEventListener('keydown', (e) => {
            if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
            const y = window.scrollY || 0;
            const vh = window.innerHeight || 1;
            const onHero = y <= vh * 0.55;
            const activeIdx = stages.findIndex((s) => s.classList.contains('is-stage-active'));

            if (e.key === 'PageDown' || e.key === 'j' || e.key === 'ArrowDown') {
                if (onHero || activeIdx < 0) {
                    e.preventDefault();
                    jumpToStage(stages[0]);
                    return;
                }
                const next = Math.min(stages.length - 1, activeIdx + 1);
                if (next !== activeIdx) {
                    e.preventDefault();
                    jumpToStage(stages[next]);
                }
            } else if (e.key === 'PageUp' || e.key === 'k' || e.key === 'ArrowUp') {
                if (onHero) return;
                if (activeIdx <= 0) {
                    e.preventDefault();
                    jumpToHero();
                    return;
                }
                e.preventDefault();
                jumpToStage(stages[activeIdx - 1]);
            } else if (e.key === 'Home') {
                e.preventDefault();
                jumpToHero();
            }
        });

        // Smooth hash navigation to stages
        document.querySelectorAll('a[href^="#stage-"], a[href="#analysis"], a[href="#download"], a[href="#top"], a[href="#get-started"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const id = (a.getAttribute('href') || '').slice(1);
                if (id === 'top' || id === '') {
                    e.preventDefault();
                    jumpToHero();
                    return;
                }
                if (id === 'get-started') {
                    e.preventDefault();
                    const planning = document.getElementById('stage-planning') || stages[0];
                    jumpToStage(planning);
                    return;
                }
                const target =
                    document.getElementById(id) ||
                    (id === 'analysis' ? document.getElementById('stage-ai') : null) ||
                    (id === 'download' ? document.getElementById('stage-app') : null);
                const stage =
                    target?.closest?.('.stage-panel') ||
                    (target?.classList?.contains('stage-panel') ? target : null) ||
                    (id === 'download' ? document.getElementById('stage-app') : null);
                if (stage) {
                    e.preventDefault();
                    jumpToStage(stage);
                    history.replaceState(null, '', `#${stage.id}`);
                }
            });
        });

        // Load: always land on hero unless deep-linked to a stage
        const hash = (location.hash || '').replace('#', '');
        const deepLink =
            hash &&
            hash !== 'top' &&
            (document.getElementById(hash)?.closest?.('.stage-panel') ||
                document.getElementById(hash)?.classList?.contains('stage-panel') ||
                (hash === 'analysis' && document.getElementById('stage-ai')));

        if (deepLink) {
            const el =
                document.getElementById(hash) ||
                (hash === 'analysis' ? document.getElementById('stage-ai') : null);
            const stage = el?.classList?.contains('stage-panel') ? el : el?.closest?.('.stage-panel');
            if (stage) {
                // Defer until layout is ready
                requestAnimationFrame(() => jumpToStage(stage));
                return;
            }
        }

        // Force hero lander — kill snap restore / browser scroll restoration
        if ('scrollRestoration' in history) {
            try { history.scrollRestoration = 'manual'; } catch (_) { /* ignore */ }
        }
        armStages(false);
        window.scrollTo(0, 0);
        setActive(HERO_INDEX);
        // Re-assert after fonts/layout (browsers sometimes restore later)
        requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            setActive(HERO_INDEX);
            armStages(false);
        });
        setTimeout(() => {
            if ((window.scrollY || 0) < 40) {
                window.scrollTo(0, 0);
                setActive(HERO_INDEX);
                armStages(false);
            }
        }, 120);
    }

    /* ── Boot ───────────────────────────────────────────── */
    function boot() {
        // Single dark palette only — clear any legacy light preference
        try { localStorage.removeItem('blackbox_theme'); } catch (_) { /* ignore */ }
        document.documentElement.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme');

        initAmbientCursor();
        initMagnetic();
        initReveals();
        initHeroParallax();
        initMetricTicks();
        initAffordabilityMorph();
        initChartScrubHUD();
        watchBudgetIcons();
        injectPanelIcons();
        bridgeSavingsChart();
        initStageJumps();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // Re-run scrub seed after late chart paint
    window.addEventListener('load', () => {
        setTimeout(initChartScrubHUD, 400);
    });
})();
