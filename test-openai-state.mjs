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

    const botId = '6a14bc19b9b34ac019fc8563';
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find OpenAI button
    const openaiBtn = page.locator('text=OpenAI').first();
    
    if (await openaiBtn.isVisible()) {
      console.log('✅ OpenAI button found\n');
      
      // Click it
      await openaiBtn.click();
      await page.waitForTimeout(2000);
      
      // Check for content
      const allText = await page.textContent('body');
      
      const checks = {
        'Configuración OpenAI': allText.includes('Configuración OpenAI'),
        'Configurada': allText.includes('Configurada'),
        'API Key de OpenAI': allText.includes('API Key de OpenAI'),
        'GPT-4': allText.includes('GPT-4') || allText.includes('gpt-4'),
        'Temperatura': allText.includes('Temperatura'),
        'Máximo de tokens': allText.includes('Máximo de tokens')
      };
      
      console.log('📊 OpenAI Section Content:');
      Object.entries(checks).forEach(([key, found]) => {
        console.log(`   ${found ? '✅' : '❌'} ${key}`);
      });
      
      if (checks['Configurada']) {
        console.log('\n✅ SUCCESS: Configuration is being displayed correctly!');
      } else {
        console.log('\n❌ Configuration data not showing');
        console.log('\nDebugging: Checking form inputs...');
        
        const inputs = await page.locator('input[type="password"]').count();
        const selects = await page.locator('select').count();
        console.log(`   Found ${inputs} password inputs, ${selects} selects`);
      }
    } else {
      console.log('❌ OpenAI button not found');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

run();
