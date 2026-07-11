/**
 * Bento fit engine — Tableau/Power BI style max-fit typography & media.
 * Each [data-fit] cell grows titles/numbers/images to the largest size
 * that still fits the cell without overflow.
 */
(function () {
    'use strict';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function fitTextEl(el, parent, { min = 10, max = 96, weight = 'title' } = {}) {
        if (!el || !parent) return;
        // clientWidth/Height include the parent's own padding — subtract it so
        // we fit against the actual content box, not the padded outer box.
        const pcs = window.getComputedStyle(parent);
        const padX = (parseFloat(pcs.paddingLeft) || 0) + (parseFloat(pcs.paddingRight) || 0);
        const padY = (parseFloat(pcs.paddingTop) || 0) + (parseFloat(pcs.paddingBottom) || 0);
        const availW = parent.clientWidth - padX;
        const availH = parent.clientHeight - padY;
        // Skip undersized boxes — applying a tiny lock then re-fitting larger
        // later is what makes numbers "start small then grow" on load.
        if (availW < 24 || availH < 18) return;

        const hiCap = Math.min(max, availH * (weight === 'mega' ? 0.55 : weight === 'title' ? 0.42 : 0.28));
        if (hiCap < min) return;

        // Measure on an off-DOM probe so intermediate binary-search sizes never
        // paint (and never animate via any font-size transition on the live node).
        const cs = window.getComputedStyle(el);
        const probe = document.createElement(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? 'span' : el.tagName);
        probe.setAttribute('aria-hidden', 'true');
        probe.textContent = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
            ? (el.value || el.placeholder || el.textContent || '')
            : (el.textContent || '');
        probe.style.cssText = [
            'position:absolute',
            'left:-9999px',
            'top:0',
            'visibility:hidden',
            'pointer-events:none',
            'white-space:nowrap',
            `font-family:${cs.fontFamily}`,
            `font-weight:${cs.fontWeight}`,
            `font-style:${cs.fontStyle}`,
            `letter-spacing:${cs.letterSpacing}`,
            `line-height:${cs.lineHeight}`,
            `text-transform:${cs.textTransform}`,
            'font-variant-numeric:tabular-nums'
        ].join(';');
        document.body.appendChild(probe);

        let lo = min;
        let hi = hiCap;
        let best = lo;
        for (let i = 0; i < 14; i++) {
            const mid = (lo + hi) / 2;
            probe.style.fontSize = mid + 'px';
            const fits =
                probe.scrollWidth <= availW + 1 &&
                probe.scrollHeight <= availH + 1;
            if (fits) {
                best = mid;
                lo = mid;
            } else {
                hi = mid;
            }
        }
        probe.remove();

        el.style.setProperty('transition', 'none', 'important');
        el.style.setProperty('font-size', best.toFixed(1) + 'px', 'important');
        el.dataset.fitSize = best.toFixed(1);
    }

    /**
     * Planning amount faces: size is locked to a fixed probe string so
     * switching 9593 → 9.6K (or 999 → 1K) never changes font-size.
     */
    function fitAtelierTileAmount(cell) {
        const face = cell.querySelector('.budget-amount-face, .tile-value-wrap');
        const box = face || cell.querySelector('.tile-meter') || cell;
        if (!box) return;
        const compact = cell.querySelector('.tile-value-compact');
        const input = cell.querySelector('.tile-value, .budget-amount-input, .income-amount-input');
        if (!input && !compact) return;

        const availW = Math.max(0, box.clientWidth - 4);
        const availH = Math.max(0, box.clientHeight - 4);
        // Wait for real layout — a premature tiny lock then re-fit is the load pop.
        if (availW < 40 || availH < 22) return;

        // Prefer an existing lock when the face already has a good size
        // (e.g. re-render after scenario load) so we don't flash a CSS default.
        const prior = face?.dataset?.lockedFit || input?.dataset?.fitSize || compact?.dataset?.fitSize;
        const priorN = prior ? parseFloat(prior) : 0;

        // Stable probe: worst-case short K label + typical 4-digit amount width
        const probe = document.createElement('span');
        probe.setAttribute('aria-hidden', 'true');
        probe.textContent = '88.8K';
        const sample = compact || input;
        const cs = window.getComputedStyle(sample);
        probe.style.cssText = [
            'position:absolute',
            'left:-9999px',
            'top:0',
            'visibility:hidden',
            'pointer-events:none',
            'white-space:nowrap',
            `font-family:${cs.fontFamily}`,
            'font-weight:600',
            'font-variant-numeric:tabular-nums',
            'letter-spacing:-0.055em',
            'line-height:0.95'
        ].join(';');
        document.body.appendChild(probe);

        let lo = 18;
        let hi = Math.min(52, availH * 0.55);
        let best = lo;
        for (let i = 0; i < 14; i++) {
            const mid = (lo + hi) / 2;
            probe.style.fontSize = mid + 'px';
            const fits = probe.scrollWidth <= availW + 1 && probe.scrollHeight <= availH + 1;
            if (fits) {
                best = mid;
                lo = mid;
            } else {
                hi = mid;
            }
        }
        probe.remove();

        // Keep prior lock if new measure is within 1px — avoids micro-pop on refit
        if (priorN > 0 && Math.abs(priorN - best) < 1.1) {
            best = priorN;
        }

        const px = best.toFixed(1) + 'px';
        // Apply identical size to raw input AND compact K label (no transition)
        [input, compact].forEach((el) => {
            if (!el) return;
            el.style.setProperty('transition', 'none', 'important');
            el.style.setProperty('font-size', px, 'important');
            el.dataset.fitSize = best.toFixed(1);
        });
        // Remember locked size on the face so later compact toggles can re-apply without remeasure thrash
        if (face) face.dataset.lockedFit = best.toFixed(1);
    }

    /**
     * Category name label: native <input> can't honor text-overflow/ellipsis
     * (Chromium forces UA overflow:clip on form controls), so shrink font-size
     * to fit the full name instead of letting the browser hard-clip it.
     */
    function fitAtelierTileLabel(cell) {
        const input = cell.querySelector('.tile-label, .budget-item-name, .budget-name-input');
        if (!input) return;
        const box = input.parentElement || cell;
        const availW = Math.max(8, box.clientWidth - 4);
        const cs = window.getComputedStyle(input);
        const baseSize = parseFloat(cs.fontSize) || 12.48;

        const probe = document.createElement('span');
        probe.setAttribute('aria-hidden', 'true');
        probe.textContent = input.value || input.placeholder || '';
        probe.style.cssText = [
            'position:absolute', 'left:-9999px', 'top:0', 'visibility:hidden', 'pointer-events:none',
            'white-space:nowrap',
            `font-family:${cs.fontFamily}`,
            `font-weight:${cs.fontWeight}`,
            `letter-spacing:${cs.letterSpacing}`,
            `text-transform:${cs.textTransform}`
        ].join(';');
        document.body.appendChild(probe);

        let lo = 8;
        let hi = baseSize;
        let best = lo;
        for (let i = 0; i < 12; i++) {
            const mid = (lo + hi) / 2;
            probe.style.fontSize = mid + 'px';
            if (probe.scrollWidth <= availW) {
                best = mid;
                lo = mid;
            } else {
                hi = mid;
            }
        }
        probe.remove();
        input.style.setProperty('font-size', best.toFixed(1) + 'px', 'important');
    }

    function fitMedia(el, parent) {
        if (!el || !parent) return;
        const pw = parent.clientWidth;
        const ph = parent.clientHeight;
        if (pw < 8 || ph < 8) return;
        // object-fit contain already; scale frame to fill shorter axis
        const frame = el.closest('.bento-phone-frame') || el;
        const maxH = ph * 0.96;
        const maxW = pw * 0.96;
        frame.style.maxHeight = maxH + 'px';
        frame.style.maxWidth = maxW + 'px';
        frame.style.height = 'auto';
        frame.style.width = 'auto';
        // Prefer height-fill for phone portrait
        if (el.naturalWidth && el.naturalHeight) {
            const ar = el.naturalWidth / el.naturalHeight;
            let h = maxH;
            let w = h * ar;
            if (w > maxW) {
                w = maxW;
                h = w / ar;
            }
            frame.style.width = w + 'px';
            frame.style.height = h + 'px';
        }
    }

    function fitCell(cell) {
        const inner = cell.querySelector('.bento-cell-inner') || cell;
        const mode = cell.dataset.fit || 'auto';

        // Titles
        cell.querySelectorAll('.bento-fit-title, .app-launch-title, .stage-dash-title, .viability-verdict, .affordability-title').forEach((el) => {
            const box = el.parentElement;
            fitTextEl(el, box, { min: 16, max: 72, weight: 'title' });
        });

        // Planning tiles: one locked size for full digits AND K labels (never shrink on compact)
        if (cell.classList.contains('atelier-tile')) {
            fitAtelierTileAmount(cell);
            fitAtelierTileLabel(cell);
        } else {
            cell.querySelectorAll('.bento-fit-num, .viability-mega-value, .purchase-tile-hero-value, .payment-estimate-value, .core-metric-value, .vd-tile-value').forEach((el) => {
                const box = el.closest('.purchase-tile-hero, .viability-mega, .vd-tile, .bento-phone-overlay, .core-metric, .bento-cell-inner') || cell;
                fitTextEl(el, box, { min: 14, max: 96, weight: 'mega' });
            });
        }

        // Body copy + list — scale up to fill residual air under title
        if (mode === 'copy' || mode === 'auto') {
            cell.querySelectorAll('.bento-fit-body, .app-launch-lede').forEach((el) => {
                fitTextEl(el, el.parentElement, { min: 12, max: 28, weight: 'body' });
            });
            cell.querySelectorAll('.bento-fit-list, .app-launch-points').forEach((el) => {
                fitTextEl(el, el.parentElement, { min: 11, max: 24, weight: 'body' });
            });
            cell.querySelectorAll('.bento-fit-meta, .app-launch-release').forEach((el) => {
                fitTextEl(el, el.parentElement, { min: 10, max: 20, weight: 'body' });
            });
        }

        // Media
        cell.querySelectorAll('img.bento-phone-img, img.bento-fit-img, img.bento-atmos-img').forEach((img) => {
            const box = img.closest('.bento-cell-inner--media, .bento-cell-inner, .bento-cell') || cell;
            if (img.classList.contains('bento-atmos-img')) {
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
            } else if (img.classList.contains('bento-phone-img')) {
                const run = () => fitMedia(img, box);
                if (img.complete) run();
                else img.addEventListener('load', run, { once: true });
            } else {
                // store badges — scale up within row
                const row = img.closest('.app-launch-stores-row') || box;
                const maxH = Math.min(56, row.clientHeight * 0.7 || 48);
                img.style.height = maxH + 'px';
                img.style.width = 'auto';
            }
        });
    }

    function fitAll(root) {
        const scope = root || document;
        scope.querySelectorAll('.bento-cell[data-fit], .bento-shell, .purchase-tile, .viability-mega, .viability-dashboard, .atelier-tile').forEach((cell) => {
            // treat purchase tiles / viability as fit cells
            if (cell.classList.contains('purchase-tile') || cell.classList.contains('viability-mega') || cell.classList.contains('atelier-tile')) {
                cell.dataset.fit = cell.dataset.fit || 'auto';
            }
            fitCell(cell);
        });

        // Stage-level mega fits for viability
        const verdict = document.querySelector('#stage-viability .viability-verdict, #affordabilityTitle');
        if (verdict) {
            const band = verdict.closest('.viability-verdict-band') || verdict.parentElement;
            fitTextEl(verdict, band, { min: 22, max: 64, weight: 'title' });
        }
        document.querySelectorAll('.viability-mega-value').forEach((el) => {
            const box = el.closest('.viability-mega') || el.parentElement;
            fitTextEl(el, box, { min: 28, max: 96, weight: 'mega' });
        });
        document.querySelectorAll('.purchase-tile-hero-value').forEach((el) => {
            const box = el.closest('.purchase-tile-hero') || el.parentElement;
            fitTextEl(el, box, { min: 22, max: 72, weight: 'mega' });
        });
    }

    let raf = 0;
    const schedule = () => {
        cancelAnimationFrame(raf);
        // Double-rAF: wait for layout after DOM mutations (scenario load, etc.)
        raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => fitAll());
        });
    };

    function boot() {
        const run = () => schedule();
        // Fit as soon as fonts + first layout are ready so numbers never
        // paint small then jump up on the delayed timeouts.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(run).catch(run);
        } else {
            run();
        }
        run();
        // Refit when stage becomes active / resizes
        const ro = new ResizeObserver(() => schedule());
        document.querySelectorAll('.bento-shell, .stage-panel-card, .purchase-tile, .viability-dashboard, .bento-cell, #budgetItems, .atelier-tile').forEach((el) => ro.observe(el));
        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('bb:journey', () => schedule());
        window.addEventListener('bb:numbers', () => schedule());
        window.addEventListener('load', () => schedule());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.__bbBentoFit = fitAll;
    window.__bbBentoFitSchedule = schedule;
})();
