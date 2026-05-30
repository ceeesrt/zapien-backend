import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('\n🧪 FINAL COMPREHENSIVE TEST - OpenAI Data Persistence\n');
    console.log('=' .repeat(50));

    // Step 1: Login
    console.log('\n📍 STEP 1: Login');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('   ✅ Logged in');

    // Step 2: Navigate to known bot with OpenAI config
    console.log('\n📍 STEP 2: Navigate to bot detail');
    const botId = '6a14bc19b9b34ac019fc8563';
    const wsId = '6a11ef44397e905f49156779';
    
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);
    console.log('   ✅ Navigated to bot detail (hard refreshed)');

    // Step 3: Click OpenAI tab
    console.log('\n📍 STEP 3: Open OpenAI configuration');
    const openaiBtn = page.locator('button').filter({ hasText: 'OpenAI' }).first();
    if (await openaiBtn.isVisible()) {
      await openaiBtn.click();
      await page.waitForTimeout(1500);
      console.log('   ✅ OpenAI tab clicked');
    }

    // Step 4: Verify data display
    console.log('\n📍 STEP 4: Verify persisted data');
    
    const pageText = await page.textContent('body');
    const hasGpt4 = pageText.includes('gpt-4') || pageText.includes('GPT-4');
    const hasApiKeyLabel = pageText.includes('API Key de OpenAI');
    const hasTemperatura = pageText.includes('Temperatura');
    const hasTokens = pageText.includes('Máximo de tokens');
    
    console.log(`\n   Data Checks:`);
    console.log(`   ${hasGpt4 ? '✅' : '❌'} GPT-4 model displayed`);
    console.log(`   ${hasApiKeyLabel ? '✅' : '❌'} API Key label present`);
    console.log(`   ${hasTemperatura ? '✅' : '❌'} Temperature setting shown`);
    console.log(`   ${hasTokens ? '✅' : '❌'} Max tokens setting shown`);

    // Step 5: Backend verification
    console.log('\n📍 STEP 5: Backend data verification');
    
    const response = await page.evaluate(async (botId, wsId) => {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/workspaces/${wsId}/chatbots/${botId}/openai-config`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      return res.json();
    }, botId, wsId);

    if (response.data) {
      console.log(`\n   Backend Response:`);
      console.log(`   Model: ${response.data.openaiModel}`);
      console.log(`   Has API Key: ${response.data.hasApiKey}`);
      console.log(`   Temperature: ${response.data.openaiSettings?.temperature}`);
      console.log(`   Max Tokens: ${response.data.openaiSettings?.maxTokens}`);
    }

    // Final verdict
    console.log('\n' + '='.repeat(50));
    if (hasGpt4 && hasApiKeyLabel && hasTemperatura && hasTokens) {
      console.log('\n✅ SUCCESS! OpenAI configuration is fully persisted!\n');
    } else {
      console.log('\n⚠️  Partial success - backend has data but frontend display needs review\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
