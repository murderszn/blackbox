import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  const widths = [1024, 768, 480];
  const stages = [
    'stage-planning',
    'stage-budget',
    'stage-savings',
    'stage-spending',
    'stage-treemap'
  ];
  
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    for (const stageId of stages) {
      const el = page.locator(`#${stageId}`);
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);
        await el.screenshot({ path: `/Users/jahflyx/.gemini/antigravity-cli/brain/5d296aab-d0c7-4c9c-bb4b-5f2d0942712b/${stageId}-${width}.png` });
      }
    }
    await page.close();
    console.log(`Captured all stages at width ${width}`);
  }
  
  await browser.close();
}

main().catch(console.error);
