import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Let Three.js and animations load/settle
  
  const stages = [
    'stage-planning',
    'stage-purchases',
    'stage-viability',
    'stage-budget',
    'stage-savings',
    'stage-spending',
    'stage-treemap',
    'stage-ledger',
    'stage-ai',
    'stage-app',
    'stage-outro'
  ];
  
  for (const stageId of stages) {
    const selector = `#${stageId}`;
    const el = page.locator(selector);
    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await el.screenshot({ path: `/Users/jahflyx/.gemini/antigravity-cli/brain/5d296aab-d0c7-4c9c-bb4b-5f2d0942712b/${stageId}.png` });
      console.log(`Captured ${stageId}.png`);
    } else {
      console.log(`Stage ${stageId} not found`);
    }
  }
  
  await browser.close();
}

main().catch(console.error);
