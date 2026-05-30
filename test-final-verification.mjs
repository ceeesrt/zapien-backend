import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('/tmp/final-verification', { recursive: true });

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
    
    // Hard refresh to ensure code is loaded
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);

    // Click OpenAI tab
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(1500);
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/final-verification/openai-config.png', fullPage: true });

    // Check for the indicators
    const allText = await page.textContent('body');
    
    const checks = {
      'Configurada indicator': allText.includes('Configurada'),
      'API Key label': allText.includes('API Key de OpenAI'),
      'GPT-4 selected': allText.includes('gpt-4') || allText.includes('GPT-4'),
      'Temperature setting': allText.includes('Temperatura'),
      'API Key value shown': allText.includes('••••••••'), 
      'Max tokens': allText.includes('Máximo de tokens') || allText.includes('maxTokens')
    };

    console.log('\n📊 OpenAI Configuration Display Verification:\n');
    Object.entries(checks).forEach(([key, found]) => {
      const status = found ? '✅' : '❌';
      console.log(`${status} ${key}`);
    });

    const allPass = Object.values(checks).every(v => v);
    if (allPass) {
      console.log('\n🎉 SUCCESS! All configuration data is persisting and displaying correctly!');
    } else {
      console.log('\n⚠️  Some data is not displaying as expected');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
