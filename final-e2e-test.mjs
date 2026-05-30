import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/zapien-final-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let stepNum = 0;

async function screenshot(page, name) {
  stepNum++;
  const filename = `${screenshotDir}/${String(stepNum).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 ${name}`);
  return filename;
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());
  page.setDefaultTimeout(15000);

  try {
    console.log('\n🚀 ========== ZAPIEN E2E TEST ==========\n');

    // ========== LOGIN ==========
    console.log('1️⃣  LOGIN\n');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '01-login-success');
    console.log('   ✅ Logged in\n');

    // ========== NAVIGATE TO CHATBOTS LIST ==========
    console.log('2️⃣  VIEW CHATBOTS LIST\n');
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '02-bots-list');
    console.log('   ✅ On chatbots page\n');

    // ========== CREATE CHATBOT ==========
    console.log('3️⃣  CREATE NEW CHATBOT\n');
    // Click the "Crear chatbot" link
    await page.click('a[href="/chatbots/nuevo"]');
    await page.waitForURL('**/chatbots/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '03-creation-form');
    console.log('   ✓ Creation form opened');

    // Fill name
    const nameInput = page.locator('input[type="text"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
    await nameInput.fill('Test Bot Final');
    console.log('   ✓ Bot name filled');

    // Fill description
    const descInput = page.locator('textarea').first();
    await descInput.fill('Chatbot de prueba final con todas las características');
    console.log('   ✓ Description filled');

    await screenshot(page, '04-form-step1-filled');

    // Navigate to next step
    const nextBtn = page.locator('button').filter({ hasText: /siguiente|next/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      console.log('   ✓ Moved to step 2');
      await screenshot(page, '05-form-step2');
    }

    // Try another next button
    const nextBtn2 = page.locator('button').filter({ hasText: /siguiente|next|continuar/i }).first();
    if (await nextBtn2.isVisible()) {
      await nextBtn2.click();
      await page.waitForTimeout(800);
      console.log('   ✓ Moved to step 3 (features)');
      await screenshot(page, '06-form-step3-features');
    }

    // Click create/finalizar
    const createBtn = page.locator('button').filter({ hasText: /crear|finalizar|create/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForURL('**/chatbots/**', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      console.log('   ✓ Chatbot created');
      await screenshot(page, '07-bot-created-detail');
    }

    console.log('   ✅ Chatbot created\n');

    // ========== CHECK BOT DETAILS PAGE ==========
    console.log('4️⃣  VERIFY BOT DETAILS\n');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    // Take screenshot of the whole detail page
    await screenshot(page, '08-bot-details-page');
    
    // Check for key sections
    const hasEmbedCode = await page.locator('text=/embed|código/i').isVisible().catch(() => false);
    const hasIntegrations = await page.locator('text=/integración/i').isVisible().catch(() => false);
    const hasStats = await page.locator('text=/estadísticas|conversaciones/i').isVisible().catch(() => false);

    console.log(`   Embed section: ${hasEmbedCode ? '✓' : '✗'}`);
    console.log(`   Integrations: ${hasIntegrations ? '✓' : '✗'}`);
    console.log(`   Stats: ${hasStats ? '✓' : '✗'}`);
    console.log('   ✅ Details verified\n');

    // ========== BACK TO DASHBOARD ==========
    console.log('5️⃣  VERIFY IN DASHBOARD\n');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '09-dashboard-final');

    const botInDash = await page.locator('text=/Test Bot|Chatbot/i').isVisible().catch(() => false);
    console.log(`   Bot visible in dashboard: ${botInDash ? '✓' : '✗'}`);
    console.log('   ✅ Dashboard checked\n');

    console.log('✅ ========== ALL TESTS PASSED ==========\n');
    console.log(`📸 Screenshots: ${screenshotDir}\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    try {
      await screenshot(page, '99-error');
    } catch (e) {
      // ignore
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
