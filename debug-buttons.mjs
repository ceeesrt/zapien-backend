import { chromium } from 'playwright';

async function debug() {
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
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get all buttons
    const buttons = page.locator('button');
    const count = await buttons.count();
    console.log('ALL BUTTONS ON DASHBOARD:\n');
    
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      const isVisible = await btn.isVisible().catch(() => false);
      console.log(`${i+1}. "${text.trim()}" - visible: ${isVisible}`);
    }

    // Also check for links
    const links = page.locator('a');
    const linkCount = await links.count();
    console.log('\n\nALL LINKS:\n');
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const isVisible = await link.isVisible().catch(() => false);
      console.log(`${i+1}. "${text.trim()}" (${href}) - visible: ${isVisible}`);
    }

  } finally {
    await browser.close();
  }
}

debug().catch(e => console.error('Error:', e));
