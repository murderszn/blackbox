import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations to settle
  
  // Scroll to Planning section or ensure it is visible
  const planningSection = page.locator('#stage-planning');
  await planningSection.scrollIntoViewIfNeeded();
  
  // Capture a screenshot of the planning topbar
  const header = page.locator('.planning-topbar');
  await header.screenshot({ path: '/Users/jahflyx/.gemini/antigravity-cli/brain/5d296aab-d0c7-4c9c-bb4b-5f2d0942712b/planning-topbar.png' });
  
  // Capture the whole planning stage card
  const planningCard = page.locator('.planning-stage-card');
  await planningCard.screenshot({ path: '/Users/jahflyx/.gemini/antigravity-cli/brain/5d296aab-d0c7-4c9c-bb4b-5f2d0942712b/planning-card.png' });
  
  // Let's capture the whole page to see it in full
  await page.screenshot({ path: '/Users/jahflyx/.gemini/antigravity-cli/brain/5d296aab-d0c7-4c9c-bb4b-5f2d0942712b/fullpage.png', fullPage: true });

  console.log('Screenshots saved successfully!');
  await browser.close();
}

main().catch(console.error);
