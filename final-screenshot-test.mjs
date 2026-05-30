import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('/tmp/final-success', { recursive: true });

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

    // Go to bot
    await page.goto('http://localhost:5173/chatbots/6a14bc19b9b34ac019fc8563');
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);

    // Open OpenAI
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(1500);
      
      // Take screenshot
      await page.screenshot({ path: '/tmp/final-success/openai-persisted.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/final-success/openai-persisted.png');
    }

    console.log('\n✅ Test complete. Check screenshot to visually confirm data persistence.\n');

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
