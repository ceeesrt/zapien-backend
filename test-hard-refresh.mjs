import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiCalls = [];
  page.on('response', res => {
    const url = res.url();
    if (url.includes('/openai')) apiCalls.push(url);
  });

  try {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const botId = '6a14bc19b9b34ac019fc8563';
    
    // Hard refresh with Ctrl+Shift+R equivalent
    await page.goto(`http://localhost:5173/chatbots/${botId}`);
    await page.keyboard.press('Control+Shift+R');
    await page.waitForTimeout(4000);

    console.log(`OpenAI endpoint calls: ${apiCalls.length}`);
    apiCalls.forEach(url => console.log(`  ${url.split('/openai')[1]}`));

    if (apiCalls.length > 0) {
      console.log('\n✅ OpenAI config is being fetched!');
    } else {
      console.log('\n❌ Still not calling OpenAI endpoint');
      console.log('\nChecking if id/workspaceId might be the issue...');
      
      // Check if the component has the right props
      const hasId = await page.evaluate(() => window.location.pathname);
      console.log(`Current path: ${hasId}`);
    }

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

run();
