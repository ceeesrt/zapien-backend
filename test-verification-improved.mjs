import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/openai-test-improved';
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
    console.log('\n✅ Testing OpenAI Config Persistence\n');

    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to chatbots and open the latest one
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Click on the first bot
    const botCard = page.locator('[class*="bot-card"]:not(.empty)').first();
    if (await botCard.isVisible()) {
      await botCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await screenshot(page, '01-bot-details');
    }

    // Look for OpenAI tab/section
    // Try different selectors
    const tabs = await page.locator('button[role="tab"], div[role="tab"], a[href*="openai"], button[href*="openai"]').all();
    console.log(`   Found ${tabs.length} potential tabs`);

    // Try to find and click OpenAI tab
    const openaiButton = await page.locator('button, a, div').filter({ hasText: /openai|IA|artificial/i }).first();
    if (await openaiButton.isVisible()) {
      await openaiButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✓ Clicked OpenAI/IA section');
    }

    await screenshot(page, '02-openai-section');

    // Check for API key indicator or configured message
    const configuredText = await page.locator('text=/Configurada|API Key|sk-/i').first().isVisible().catch(() => false);
    const apiKeyInput = await page.locator('input[type="password"]').inputValue().catch(() => '');
    const greenCheckmark = await page.locator('text=/✓.*Configurada|has.*API/i').isVisible().catch(() => false);
    const modelSelect = await page.locator('select').inputValue().catch(() => '');

    console.log(`\n   📊 VERIFICATION:`);
    console.log(`   ${greenCheckmark ? '✅' : '❌'} API Key indicator (✓ Configurada)`);
    console.log(`   ${apiKeyInput ? '✅' : '❌'} API Key input has value`);
    console.log(`   ${modelSelect === 'gpt-4' ? '✅' : '❌'} Model is gpt-4: ${modelSelect || 'empty'}`);

    // Get page text content for debugging
    const pageText = await page.textContent('body');
    const hasConfigured = pageText.includes('Configurada') || pageText.includes('✓');
    console.log(`   ${hasConfigured ? '✅' : '❌'} Page contains "Configurada" or checkmark`);

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
  console.error('Fatal:', e);
  process.exit(1);
});
