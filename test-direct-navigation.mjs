import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  try {
    console.log('\n🧪 Testing Direct Bot Navigation\n');

    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Get workspace ID from storage
    const wsId = await page.evaluate(() => localStorage.getItem('workspaceId'));
    const botId = '6a14bc19b9b34ac019fc8563';
    
    console.log(`   Workspace: ${wsId}`);
    console.log(`   Bot ID: ${botId}`);
    
    // Navigate directly to bot detail page
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n✅ Bot detail page loaded\n');
    
    // Check if we can find OpenAI content
    const allText = await page.textContent('body');
    
    const hasOpenAI = allText.includes('OpenAI');
    const hasConfigured = allText.includes('Configurada');
    const hasGpt4 = allText.includes('GPT-4') || allText.includes('gpt-4');
    const hasApiKey = allText.includes('API Key');
    
    console.log('   📊 Page Content:');
    console.log(`   ${hasOpenAI ? '✅' : '❌'} OpenAI section`);
    console.log(`   ${hasConfigured ? '✅' : '❌'} "Configurada" indicator`);
    console.log(`   ${hasGpt4 ? '✅' : '❌'} GPT-4 model`);
    console.log(`   ${hasApiKey ? '✅' : '❌'} "API Key" text`);

    // Check form inputs
    const inputs = await page.locator('input[type="password"]').all();
    const selects = await page.locator('select').all();
    
    console.log(`\n   📋 Found ${inputs.length} password inputs, ${selects.length} selects`);
    
    if (inputs.length > 0) {
      const value = await inputs[0].inputValue();
      const placeholder = await inputs[0].getAttribute('placeholder');
      console.log(`     Input 0: placeholder="${placeholder}", hasValue=${!!value}`);
    }
    
    if (selects.length > 0) {
      const value = await selects[0].inputValue();
      console.log(`     Select 0: value="${value}"`);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
