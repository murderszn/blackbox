import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const data = await page.evaluate(() => {
    const bar = document.querySelector('.planning-scenario-bar');
    const label = document.querySelector('.planning-scenario-label');
    const input = document.querySelector('.planning-scenario-input');
    const save = document.querySelector('.planning-scenario-save');
    
    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, className: el.className, x: r.x, y: r.y, width: r.width, height: r.height };
    };
    
    return {
      bar: getBox(bar),
      label: getBox(label),
      input: getBox(input),
      save: getBox(save),
      barStyle: bar ? window.getComputedStyle(bar).display : null,
      saveStyle: save ? {
        display: window.getComputedStyle(save).display,
        width: window.getComputedStyle(save).width,
        gridColumn: window.getComputedStyle(save).gridColumn
      } : null
    };
  });
  
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch(console.error);
