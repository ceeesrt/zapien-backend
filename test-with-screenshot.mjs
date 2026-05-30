import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('/tmp/ss-openai', { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const botId = '6a14bc19b9b34ac019fc8563';
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // List all button texts
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons. First 10:`);
    for (let i = 0; i < Math.min(10, buttons.length); i++) {
      const text = await buttons[i].textContent();
      console.log(`  ${i}: "${text.trim()}"`);
    }

    // Take screenshot before click
    await page.screenshot({ path: '/tmp/ss-openai/01-before.png', fullPage: true });
    console.log('\n📸 Screenshot 1: Before click');

    // Find OpenAI button more carefully
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      const text = await openaiBtn.textContent();
      console.log(`\nClicking button: "${text.trim()}"`);
      await openaiBtn.click();
      await page.waitForTimeout(2500);
      
      // Take screenshot after click
      await page.screenshot({ path: '/tmp/ss-openai/02-after.png', fullPage: true });
      console.log('📸 Screenshot 2: After click');
      
      // Take one more after waiting longer
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/ss-openai/03-final.png', fullPage: true });
      console.log('📸 Screenshot 3: Final');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
