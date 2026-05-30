import { chromium } from 'playwright';
import fs from 'fs';

const ss = async (page, name) => {
  await page.screenshot({ path: `/tmp/openai-click/${name}.png`, fullPage: true });
};

fs.mkdirSync('/tmp/openai-click', { recursive: true });

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

    const wsId = await page.evaluate(() => localStorage.getItem('workspaceId'));
    const botId = '6a14bc19b9b34ac019fc8563';
    
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await ss(page, '01-initial');

    // Click the OpenAI button
    const openaiBtn = page.locator('button:has-text("OpenAI"), a:has-text("OpenAI"), div:has-text("OpenAI")').first();
    if (await openaiBtn.isVisible()) {
      console.log('Clicking OpenAI button...');
      await openaiBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, '02-after-click');
      
      const text = await page.textContent('body');
      const has_configurada = text.includes('Configurada');
      const has_gpt4 = text.includes('gpt-4') || text.includes('GPT-4');
      const has_apikey_label = text.includes('API Key');
      
      console.log(`\n✅ Results after clicking OpenAI:`);
      console.log(`   Configurada: ${has_configurada ? '✅' : '❌'}`);
      console.log(`   GPT-4: ${has_gpt4 ? '✅' : '❌'}`);
      console.log(`   API Key label: ${has_apikey_label ? '✅' : '❌'}`);
    } else {
      console.log('OpenAI button not visible');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
