import { chromium } from 'playwright';

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

    // Go to bot detail
    const botId = '6a14bc19b9b34ac019fc8563';
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);

    // Click OpenAI tab
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(1500);
    }

    // Get the HTML of the API Key section
    const html = await page.locator('[class*="field"]:has(input[type="password"])').first().innerHTML();
    
    console.log('\n📄 API Key Field HTML:');
    console.log(html);

    // Check if "Configurada" is in the HTML
    if (html.includes('Configurada')) {
      console.log('\n✅ "Configurada" text is in the DOM');
    } else {
      console.log('\n❌ "Configurada" text NOT in the DOM');
      console.log('\nThis could mean hasApiKey state is false');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
