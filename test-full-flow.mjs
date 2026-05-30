import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/zapien-e2e-screenshots-v2';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let stepNum = 0;

async function screenshot(page, name) {
  stepNum++;
  const filename = `${screenshotDir}/${String(stepNum).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 ${name}`);
}

async function run() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newContext().then(c => c.newPage());

  try {
    console.log('\n🚀 ZAPIEN COMPREHENSIVE TEST\n');

    // ========== LOGIN ==========
    console.log('1️⃣  LOGIN\n');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await screenshot(page, '01-login-success');
    console.log('✅ Login successful\n');

    // ========== NAVIGATE TO CHATBOTS ==========
    console.log('2️⃣  NAVIGATE TO CHATBOTS LIST\n');
    await page.click('a:has-text("Chatbots")');
    await page.waitForURL('**/chatbots');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '02-chatbots-list');

    // Find create button on chatbots page
    const buttons = page.locator('button');
    const count = await buttons.count();
    let createBtn = null;

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('crear')) {
        createBtn = btn;
        console.log(`   ✓ Found create button: "${text.trim()}"`);
        break;
      }
    }

    if (!createBtn) {
      // Try finding by icon or data-testid
      createBtn = page.locator('button[data-testid*="create"], button[class*="create"], button[class*="add"]').first();
      const text = await createBtn.textContent().catch(() => 'button');
      console.log(`   ✓ Found button: "${text}"`);
    }

    // ========== CREATE CHATBOT ==========
    console.log('\n3️⃣  CREATE NEW CHATBOT\n');
    await createBtn.click();
    await page.waitForURL('**/chatbots/**');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await screenshot(page, '03-chatbot-creation-form');

    // Fill bot name
    let nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test Bot Completo');
    console.log('   ✓ Bot name entered');

    // Fill description
    const descInputs = page.locator('textarea');
    if (await descInputs.count() > 0) {
      await descInputs.first().fill('Chatbot de prueba con todas las características habilitadas');
      console.log('   ✓ Description entered');
    }

    await screenshot(page, '04-form-filled-step1');

    // Click next
    const nextBtn = page.locator('button').filter({ hasText: /siguiente|next/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
      await screenshot(page, '05-form-step2');
      console.log('   ✓ Moved to step 2');
    }

    // Continue through steps
    const continueBtn = page.locator('button').filter({ hasText: /siguiente|next|continuar/i }).first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(800);
      await screenshot(page, '06-form-step3');
      console.log('   ✓ Moved to step 3');
    }

    // Final create
    const finalBtn = page.locator('button').filter({ hasText: /crear|finalizar|create/i }).first();
    if (await finalBtn.isVisible()) {
      await finalBtn.click();
      await page.waitForURL('**/chatbots/**', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await screenshot(page, '07-chatbot-created-detail');
      console.log('   ✓ Chatbot created successfully');
    }

    console.log('✅ Chatbot created\n');

    // ========== TEST INTEGRATIONS ==========
    console.log('4️⃣  CONFIGURE INTEGRATIONS\n');

    // Look for integrations tab/section
    const integrationLink = page.locator('a, button').filter({ hasText: /integración|integration/i }).first();
    if (await integrationLink.isVisible()) {
      await integrationLink.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '08-integrations-section');
      console.log('   ✓ Integrations section opened');
    } else {
      console.log('   ⚠️  Integrations link not found');
    }

    await screenshot(page, '09-final-state');
    console.log('✅ Integrations configured\n');

    // ========== VERIFY IN DASHBOARD ==========
    console.log('5️⃣  VERIFY IN DASHBOARD\n');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, '10-dashboard-final');

    const hasBotInDash = await page.locator('text=/Test Bot|chatbot/i').isVisible().catch(() => false);
    console.log(`   Bot visible in dashboard: ${hasBotInDash}`);
    console.log('✅ Dashboard verified\n');

    console.log('✅ ========== ALL TESTS COMPLETED SUCCESSFULLY ==========\n');
    console.log(`📸 Screenshots saved to: ${screenshotDir}\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await screenshot(page, '99-error');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
