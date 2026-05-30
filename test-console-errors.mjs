import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // Capture page errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

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
    await page.waitForTimeout(3000);

    // Click OpenAI tab
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(2000);
    }

    // Check console for errors
    console.log('\n📋 Console Messages:');
    const errorMsgs = consoleLogs.filter(m => m.type === 'error' || m.type === 'warning');
    const openaiMsgs = consoleLogs.filter(m => m.text.toLowerCase().includes('openai'));
    
    if (errorMsgs.length > 0) {
      console.log('❌ Errors/Warnings:');
      errorMsgs.forEach(m => {
        console.log(`   ${m.type}: ${m.text}`);
      });
    }

    if (openaiMsgs.length > 0) {
      console.log('✅ OpenAI-related messages:');
      openaiMsgs.forEach(m => {
        console.log(`   ${m.type}: ${m.text}`);
      });
    }

    if (errors.length > 0) {
      console.log('❌ Page Errors:');
      errors.forEach(e => console.log(`   ${e}`));
    }

    console.log('\n📊 Total logs:', consoleLogs.length);

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
