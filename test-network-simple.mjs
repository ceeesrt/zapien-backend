import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiCalls = [];

  page.on('response', res => {
    const url = res.url();
    if (url.includes('/api/')) {
      apiCalls.push({
        url: url.split('/api/')[1].substring(0, 60),
        status: res.status()
      });
    }
  });

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
    await page.waitForTimeout(3000);

    console.log('\n📡 API Calls made during page load:');
    const openaiCalls = apiCalls.filter(c => c.url.includes('openai'));
    if (openaiCalls.length > 0) {
      console.log('✅ OpenAI endpoint called:');
      openaiCalls.forEach(c => console.log(`   ${c.status} ${c.url}`));
    } else {
      console.log('❌ OpenAI endpoint NOT called');
      console.log('\nOther API calls:');
      apiCalls.slice(0, 10).forEach(c => console.log(`   ${c.status} ${c.url}`));
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
