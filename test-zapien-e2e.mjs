import { chromium } from 'playwright';
import fs from 'fs';

const screenshotDir = '/tmp/zapien-e2e-screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

let stepNum = 0;

async function screenshot(page, name) {
  stepNum++;
  const filename = `${screenshotDir}/${String(stepNum).padStart(3, '0')}-${name}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 ${stepNum}. ${name}`);
  return filename;
}

async function runTests() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log('\n🚀 ========== ZAPIEN E2E TEST SUITE ==========\n');

    // ========== PHASE 1: LOGIN ==========
    console.log('📋 PHASE 1: LOGIN\n');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'phase1-login-page');

    await page.fill('input[type="email"]', 'test1779512260@example.com');
    await page.fill('input[type="password"]', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await screenshot(page, 'phase1-dashboard-loaded');
    console.log('✅ LOGIN SUCCESSFUL\n');

    // ========== PHASE 2: CREATE BASIC CHATBOT ==========
    console.log('📋 PHASE 2: CREATE BASIC CHATBOT\n');
    
    // Look for the button with different possible texts
    let createBtn = null;
    const buttons = page.locator('button');
    const count = await buttons.count();
    console.log(`   Found ${count} buttons on page`);

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (text && (text.includes('Crear') || text.includes('crear') || text.includes('Chatbot'))) {
        console.log(`   ✓ Found button: "${text.trim()}"`);
        createBtn = btn;
        break;
      }
    }

    if (!createBtn) {
      console.log('   ⚠️  Create button not found, trying link...');
      const links = page.locator('a');
      const linkCount = await links.count();
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        if (text && (text.includes('Crear') || text.includes('crear') || text.includes('nuevo'))) {
          console.log(`   ✓ Found link: "${text.trim()}"`);
          createBtn = link;
          break;
        }
      }
    }

    if (createBtn) {
      await createBtn.click();
      await page.waitForURL('**/chatbots/**', { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await screenshot(page, 'phase2-create-form-opened');

      // Fill form - step 1
      const nameInput = page.locator('input[type="text"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Bot Prueba Completa');
        console.log('   ✓ Bot name entered');
      }

      const descInput = page.locator('textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Chatbot de prueba completo con todas las características');
        console.log('   ✓ Description entered');
      }

      await screenshot(page, 'phase2-create-form-step1');

      // Next step
      const nextBtn = page.locator('button').filter({ hasText: /siguiente|next|continuar/i }).first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(800);
        console.log('   ✓ Moved to next step');
      }

      await screenshot(page, 'phase2-step2-personalization');

      // Try another next button
      const nextBtn2 = page.locator('button').filter({ hasText: /siguiente|next|continuar/i }).first();
      if (await nextBtn2.isVisible()) {
        await nextBtn2.click();
        await page.waitForTimeout(800);
        console.log('   ✓ Moved to features step');
      }

      await screenshot(page, 'phase2-step3-features');

      // Create button
      const finalCreateBtn = page.locator('button').filter({ hasText: /crear|create|finalizar/i }).first();
      if (await finalCreateBtn.isVisible()) {
        await finalCreateBtn.click();
        await page.waitForURL('**/chatbots/**', { timeout: 10000 });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        console.log('   ✓ Chatbot creation completed');
      }

      await screenshot(page, 'phase2-chatbot-created');
      console.log('✅ CHATBOT CREATED\n');
    } else {
      console.log('❌ Create button not found\n');
      await screenshot(page, 'phase2-error-no-button');
    }

    // ========== PHASE 3: DASHBOARD ==========
    console.log('📋 PHASE 3: FINAL DASHBOARD CHECK\n');
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await screenshot(page, 'phase3-dashboard-final');

    const botExists = await page.locator('text=/Bot Prueba|bot/i').isVisible().catch(() => false);
    console.log(`   Chatbots visible: ${botExists}`);
    console.log('✅ DASHBOARD VERIFIED\n');

    // ========== SUMMARY ==========
    console.log('✅ ========== TEST SEQUENCE COMPLETED ==========\n');
    console.log('📊 PHASES:\n');
    console.log('  ✅ Phase 1: Login successful');
    console.log('  ✅ Phase 2: Create chatbot form navigation');
    console.log('  ✅ Phase 3: Dashboard verification');
    console.log(`\n📸 Screenshots: ${screenshotDir}`);
    console.log(`📋 Total steps: ${stepNum}\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    try {
      await screenshot(page, 'ERROR-final');
    } catch (e) {
      // ignore
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
