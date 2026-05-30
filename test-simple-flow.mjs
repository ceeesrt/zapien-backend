import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(c => c.newPage());

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login successful');

    // Go to chatbots
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('✅ Navigated to chatbots');

    // Try clicking on different parts of the page
    const page_url = page.url();
    console.log(`Current URL: ${page_url}`);

    // Try common patterns for add button
    try {
      // Pattern 1: Button with + icon
      const addBtn = page.locator('[class*="add"], [class*="plus"], [class*="create"], [aria-label*="add"], [aria-label*="crear"]').first();
      if (await addBtn.isVisible()) {
        console.log('Found add/create button');
        await addBtn.click();
        await page.waitForURL('**/chatbots/**');
        console.log('✅ Chatbot creation form opened');
      }
    } catch (e) {
      console.log('⚠️  Could not find add button:', e.message);
    }

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error('Error:', e));
