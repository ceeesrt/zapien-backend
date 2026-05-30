import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/openai-persistence-test';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function screenshot(page, name) {
  const filename = `${screenshotDir}/${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 ${name}`);
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());
  page.setDefaultTimeout(20000);

  try {
    console.log('\n🧪 Testing OpenAI Data Persistence\n');

    // Login
    console.log('1️⃣  Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('   ✅ Logged in\n');

    // Navigate to chatbots
    console.log('2️⃣  Creating chatbot with OpenAI configuration...');
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click create
    await page.click('a[href="/chatbots/nuevo"]');
    await page.waitForURL('**/chatbots/**');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('   ✓ Creation form opened');

    // Fill basics
    await page.fill('input[id="botName"]', 'TestBot OpenAI');
    await page.fill('textarea', 'Bot para probar persistencia de OpenAI');
    await screenshot(page, '01-basics-filled');

    // Navigate to OpenAI step
    for (let i = 0; i < 7; i++) {
      const nextBtn = page.locator('button').filter({ hasText: /siguiente|next|continuar/i }).first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // Fill OpenAI config
    console.log('   ✓ Navigated to OpenAI step');
    await page.fill('input[id="openaiApiKey"]', 'sk-test-key-12345abcde');

    // Set model to GPT-4
    await page.selectOption('select[id="openaiModel"]', 'gpt-4');

    // Adjust temperature slider
    const tempSlider = page.locator('input[id="temperature"]');
    await tempSlider.evaluate((el) => {
      el.value = '1.2';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Adjust max tokens slider
    const tokensSlider = page.locator('input[id="maxTokens"]');
    await tokensSlider.evaluate((el) => {
      el.value = '1000';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await screenshot(page, '02-openai-filled');
    console.log('   ✓ OpenAI config filled');

    // Create chatbot
    const createBtn = page.locator('button').filter({ hasText: /crear|finalizar|create/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(3000);
    }
    console.log('   ✓ Chatbot creation submitted');

    // Wait for redirect and navigate to bot details
    await page.goto('http://localhost:5173/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '03-chatbots-list');

    // Click on the new bot
    const botCard = page.locator('[class*="bot-card"]:not(.empty)').first();
    if (await botCard.isVisible()) {
      await botCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      console.log('   ✓ Bot details opened');
    }

    await screenshot(page, '04-bot-details');

    // Navigate to OpenAI tab
    console.log('3️⃣  Verifying OpenAI configuration persisted...');
    const openaiTab = page.locator('a, button, div[role="button"]').filter({ hasText: /openai|ia/i }).first();
    if (await openaiTab.isVisible()) {
      await openaiTab.click();
      await page.waitForTimeout(1000);
      console.log('   ✓ Opened OpenAI configuration');
    }

    await screenshot(page, '05-openai-config');

    // Verify data is there
    const apiKeyInput = page.locator('input[type="password"]');
    const modelSelect = page.locator('select');
    const tempValue = page.locator('input[type="range"]').first();

    const hasApiKey = await apiKeyInput.inputValue().then(val => !!val).catch(() => false);
    const hasModel = await modelSelect.inputValue().then(val => val === 'gpt-4').catch(() => false);
    const hasTempValue = await tempValue.inputValue().then(val => parseFloat(val) > 1).catch(() => false);

    console.log(`\n   📊 VERIFICATION RESULTS:`);
    console.log(`   ${hasApiKey ? '✅' : '❌'} API Key persisted`);
    console.log(`   ${hasModel ? '✅' : '❌'} Model (gpt-4) persisted`);
    console.log(`   ${hasTempValue ? '✅' : '❌'} Settings (temperature) persisted`);

    if (hasApiKey && hasModel && hasTempValue) {
      console.log('\n✅ SUCCESS: All OpenAI configuration data persisted correctly!\n');
    } else {
      console.log('\n❌ FAILURE: Some data was not persisted\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    try {
      await screenshot(page, '99-error');
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

run().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
