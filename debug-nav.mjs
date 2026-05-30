import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // First visit to chatbots
    console.log('\n=== FIRST VISIT TO /CHATBOTS ===\n');
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const createLink = page.locator('a[href="/chatbots/nuevo"]');
    console.log(`Create link visible: ${await createLink.isVisible().catch(() => false)}`);
    console.log(`Create link count: ${await createLink.count()}`);

    // Get all links
    const allLinks = page.locator('a');
    console.log(`Total links: ${await allLinks.count()}`);

    const links = await allLinks.all();
    for (let i = 0; i < Math.min(10, links.length); i++) {
      const href = await links[i].getAttribute('href');
      const text = await links[i].textContent();
      console.log(`  Link ${i+1}: "${text.trim()}" -> ${href}`);
    }

    // Check if there's any element with "nuevo"
    const nuevoElements = page.locator(':has-text("nuevo")');
    console.log(`Elements with 'nuevo': ${await nuevoElements.count()}`);

  } finally {
    await browser.close();
  }
}

run().catch(e => console.error('Error:', e));
