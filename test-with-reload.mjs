import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiCalls = [];

  page.on('response', res => {
    const url = res.url();
    if (url.includes('/api/')) {
      const shortUrl = url.split('/api/')[1].substring(0, 70);
      apiCalls.push({ url: shortUrl, status: res.status() });
    }
  });

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Clear previous API calls
    apiCalls.length = 0;

    // Navigate to bot and FORCE reload
    const botId = '6a14bc19b9b34ac019fc8563';
    await page.goto(`http://localhost:5173/chatbots/${botId}`, { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    console.log('\n📡 API Calls after reload:');
    apiCalls.forEach(c => {
      const isOpenai = c.url.includes('openai');
      const indicator = isOpenai ? '✅' : '  ';
      console.log(`${indicator} ${c.status} ${c.url}`);
    });

    const hasOpenai = apiCalls.some(c => c.url.includes('openai'));
    if (hasOpenai) {
      console.log('\n✅ SUCCESS! OpenAI endpoint was called');
    } else {
      console.log('\n❌ OpenAI endpoint still not called');
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
