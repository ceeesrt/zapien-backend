import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = [];
  const responses = [];

  page.on('request', req => {
    if (req.url().includes('openai')) {
      requests.push({
        method: req.method(),
        url: req.url(),
        headers: req.headersArray().filter(h => h.name === 'Authorization' || h.name === 'authorization').length > 0
      });
    }
  });

  page.on('response', res => {
    if (res.url().includes('openai')) {
      responses.push({
        url: res.url(),
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

    console.log('\n📡 API Requests/Responses:');
    console.log(`Requests: ${requests.length}`);
    requests.forEach(r => {
      console.log(`  ${r.method} ${r.url.split('/chatbots')[1]} [Auth: ${r.headers}]`);
    });

    console.log(`\nResponses: ${responses.length}`);
    responses.forEach(r => {
      console.log(`  ${r.status} ${r.url.split('/chatbots')[1]}`);
    });

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
