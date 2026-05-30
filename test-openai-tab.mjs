import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/openai-tab-test';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true });
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Go to bot detail
    const wsId = await page.evaluate(() => localStorage.getItem('workspaceId'));
    const botId = '6a14bc19b9b34ac019fc8563';
    
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give time for API calls
    
    await screenshot(page, '01-initial-load');
    console.log('📸 Saved initial page screenshot');

    // Look for tab buttons
    const tabButtons = await page.locator('button:has-text("OpenAI"), button:has-text("openai"), a:has-text("OpenAI")').all();
    console.log(`Found ${tabButtons.length} OpenAI buttons`);

    // Look for all tabs
    const allTabButtons = await page.locator('button[role="tab"], div[role="tab"], nav button, nav a').all();
    console.log(`Found ${allTabButtons.length} total tabs`);

    // Try clicking each one to find OpenAI
    for (let i = 0; i < Math.min(5, allTabButtons.length); i++) {
      const text = await allTabButtons[i].textContent();
      console.log(`  Tab ${i}: ${text.trim()}`);
      
      if (text.toLowerCase().includes('openai')) {
        console.log(`    -> Clicking OpenAI tab`);
        await allTabButtons[i].click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    await screenshot(page, '02-after-nav');
    
    // Check content
    const allText = await page.textContent('body');
    const hasConfigurada = allText.includes('Configurada');
    const hasGpt = allText.includes('GPT');
    
    console.log(`\n✅ Configurada found: ${hasConfigurada}`);
    console.log(`✅ GPT found: ${hasGpt}`);

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
