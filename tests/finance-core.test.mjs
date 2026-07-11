/**
 * Durable smoke tests for BLACKBOX finance core + atelier shell.
 * Drives the shipped page via Playwright (real entry on :8080).
 *
 * Run: node tests/finance-core.test.mjs
 * Requires: npm start (server on 8080) and playwright installed.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BLACKBOX_URL || 'http://localhost:8080/';

function parseMoney(text) {
  if (!text) return NaN;
  const n = Number(String(text).replace(/[^0-9.-]/g, ''));
  return n;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  // Structural assets on disk
  for (const rel of [
    'atelier.css',
    'experience.js',
    'assets/atmosphere/hero-monolith.jpg',
    'assets/atmosphere/vault-glow.jpg',
    'assets/icons/income.svg',
    'assets/icons/car.svg',
    'assets/icons/house.svg'
  ]) {
    const p = path.join(ROOT, rel);
    assert.ok(fs.existsSync(p), `missing asset ${rel}`);
    assert.ok(fs.statSync(p).size > 50, `asset too small ${rel}`);
  }

  const res = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
  assert.equal(res.status(), 200, 'primary page should return HTML 200');
  await page.waitForTimeout(1200);

  // Shell present
  assert.ok(await page.locator('link[href="/atelier.css"]').count());
  assert.ok(await page.locator('script[src="/experience.js"]').count());
  assert.ok(await page.locator('.hero-atmosphere').count());
  assert.ok(await page.locator('.header-banner-title-text').textContent() === 'BLACKBOX');

  const gold = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()
  );
  assert.ok(gold.includes('c9a86c') || gold.includes('#c9'), `expected champagne gold token, got ${gold}`);

  const displayFont = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.header-banner-title-text')).fontFamily
  );
  assert.match(displayFont, /Cormorant|Garamond|serif/i, 'distinctive display typography required');

  // Advanced techniques present
  const tech = await page.evaluate(() => ({
    scrub: !!document.querySelector('.chart-scrub-hud'),
    reveals: document.querySelectorAll('.reveal-block').length,
    icons: document.querySelectorAll('img[src*="/assets/icons/"]').length
  }));
  assert.ok(tech.scrub, 'chart scrub HUD should exist');
  assert.ok(tech.reveals >= 5, 'scroll reveal blocks should be wired');
  assert.ok(tech.icons >= 8, 'real icon assets should be referenced');

  // Finance: change income via shipped path
  const before = await page.evaluate(() => ({
    savings: document.getElementById('topRightSavings')?.textContent,
    rate: document.getElementById('savingsRate')?.textContent,
    cash: document.getElementById('miniMonthlyCashFlow')?.textContent
  }));
  const beforeSavings = parseMoney(before.savings);
  assert.ok(Number.isFinite(beforeSavings), 'baseline savings should parse');

  await page.evaluate(() => {
    const el = document.getElementById('monthlyIncome');
    el.value = '14000';
    if (typeof updateIncome === 'function') updateIncome(14000);
    else if (typeof updateIncomeFromInput === 'function') updateIncomeFromInput(14000);
    else if (typeof calculate === 'function') calculate();
  });
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => ({
    savings: document.getElementById('topRightSavings')?.textContent,
    rate: document.getElementById('savingsRate')?.textContent,
    cash: document.getElementById('miniMonthlyCashFlow')?.textContent,
    income: document.getElementById('monthlyIncome')?.value
  }));
  const afterSavings = parseMoney(after.savings);
  assert.equal(after.income, '14000');
  assert.ok(afterSavings > beforeSavings, `raising income should raise 5y savings (${beforeSavings} -> ${afterSavings})`);
  assert.notEqual(after.rate, before.rate, 'savings rate should update');

  // Shipped loan math
  const loan = await page.evaluate(() => ({
    a: typeof calculateLoanPayment === 'function' ? calculateLoanPayment(40000, 6, 60) : null,
    b: typeof calculateLoanPayment === 'function' ? calculateLoanPayment(0, 6, 60) : null
  }));
  assert.ok(loan.a > 700 && loan.a < 900, `car loan pmt unexpected: ${loan.a}`);
  assert.equal(loan.b, 0);

  assert.equal(pageErrors.length, 0, `uncaught page errors: ${pageErrors.join('; ')}`);

  // Scrub HUD month labels must match Chart.js tooltip (script.js: month = idx%12, 0 = Start)
  const scrubAlign = await page.evaluate(() => {
    const fmt = window.__bbFormatScrubMeta;
    if (typeof fmt !== 'function') return { ok: false, reason: 'missing __bbFormatScrubMeta' };
    // Mirror script.js title callback
    const tooltipTitle = (dataIndex) => {
      const year = Math.floor(dataIndex / 12);
      const month = dataIndex % 12;
      if (month === 0) return `Year ${year} - Start`;
      return `Year ${year}, Month ${month}`;
    };
    const samples = [0, 9, 12, 21, 60];
    const rows = samples.map((idx) => {
      const meta = fmt(idx, 61);
      const tip = tooltipTitle(idx);
      const year = Math.floor(idx / 12);
      const month = idx % 12;
      const monthOk =
        month === 0
          ? meta.includes('Start') && !meta.includes('Month 1')
          : meta.includes(`Month ${month}`) && !meta.includes(`Month ${month + 1}`);
      const yearOk = meta.includes(`Year ${year}`);
      return { idx, meta, tip, monthOk, yearOk };
    });
    // Live HUD: hover-equivalent set via format used by onMove
    const monthEl = document.getElementById('scrubMonth');
    if (monthEl) monthEl.textContent = fmt(21, 61);
    const hudAfter = monthEl?.textContent || '';
    return {
      ok: rows.every((r) => r.monthOk && r.yearOk),
      rows,
      hudAfter,
      hudMatchesIdx21: hudAfter.includes('Year 1') && hudAfter.includes('Month 9') && !hudAfter.includes('Month 10')
    };
  });
  assert.ok(scrubAlign.ok, `scrub meta misaligned: ${JSON.stringify(scrubAlign.rows)}`);
  assert.ok(scrubAlign.hudMatchesIdx21, `idx=21 must be Year 1 · Month 9, got: ${scrubAlign.hudAfter}`);

  // Second load consistency
  const res2 = await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  assert.equal(res2.status(), 200);

  console.log('PASS finance-core + atelier shell');
  console.log(JSON.stringify({ before, after, loan, tech, gold, displayFont, scrubAlign }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error('FAIL', err);
  process.exit(1);
});
