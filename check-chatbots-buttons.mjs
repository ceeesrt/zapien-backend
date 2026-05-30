import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Go to chatbots
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log('\n=== CHATBOTS PAGE BUTTONS ===\n');
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`Total buttons: ${buttonCount}\n`);

    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
      const classes = await btn.getAttribute('class');
      const isEnabled = await btn.isEnabled().catch(() => false);
      
      if (text.trim() || ariaLabel) {
        console.log(`Button ${i+1}:`);
        console.log(`  Text: "${text.trim()}"`);
        if (ariaLabel) console.log(`  Aria: "${ariaLabel}"`);
        console.log(`  Enabled: ${isEnabled}`);
        console.log(`  Classes: ${classes ? classes.substring(0, 80) : 'none'}`);
        console.log('');
      }
    }

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error('Error:', e));
