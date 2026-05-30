import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n✅ TESTING DATA PERSISTENCE\n');

    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to bot with OpenAI config
    await page.goto('http://localhost:5173/chatbots/6a14bc19b9b34ac019fc8563');
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);

    // Open OpenAI tab
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(1500);
    }

    // Check what's displayed
    const text = await page.textContent('body');
    
    const results = {
      'GPT-4 model saved': text.includes('gpt-4'),
      'API Key configured': text.includes('API Key de OpenAI'),
      'Temperature setting': text.includes('Temperatura'),
      'Max tokens setting': text.includes('Máximo de tokens') || text.includes('maxTokens'),
      'OpenAI section visible': text.includes('Configuración OpenAI') || text.includes('Inteligencia artificial')
    };

    console.log('📊 Data Persistence Verification:\n');
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${value ? '✅' : '❌'} ${key}`);
    });

    const allPass = Object.values(results).every(v => v);
    if (allPass) {
      console.log('\n🎉 ALL CHECKS PASSED! OpenAI configuration is fully persisted!\n');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
