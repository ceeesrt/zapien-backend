import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());
  page.setDefaultTimeout(20000);

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in');

    // Go to chatbots
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    console.log('✅ On /chatbots');

    // Scroll to top to make sure everything is visible
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    console.log('\nChecking for create link...\n');

    // Try different selectors for the create link
    const selectors = [
      'a[href="/chatbots/nuevo"]',
      'a:has-text("Crear chatbot")',
      'a:has-text("Crear")',
      'text=Crear chatbot',
      ':has-text("Crear chatbot")'
    ];

    for (const selector of selectors) {
      try {
        const elem = page.locator(selector).first();
        const visible = await elem.isVisible().catch(() => false);
        const count = await elem.locator(`xpath=self::*`).count().catch(() => 0);
        console.log(`Selector "${selector}": visible=${visible}`);
      } catch (e) {
        console.log(`Selector "${selector}": error`);
      }
    }

    // Try to find ANY element with "nuevo" in any attribute
    const html = await page.content();
    const hasNuevo = html.includes('/chatbots/nuevo');
    console.log(`\nHTML contains '/chatbots/nuevo': ${hasNuevo}`);

    // Get page body HTML to understand structure
    const bodyContent = await page.locator('body').innerHTML();
    const nuevoIndex = bodyContent.indexOf('/chatbots/nuevo');
    if (nuevoIndex >= 0) {
      console.log('\nContext around "/chatbots/nuevo":');
      console.log(bodyContent.substring(Math.max(0, nuevoIndex - 200), nuevoIndex + 200));
    }

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error('Error:', e));
