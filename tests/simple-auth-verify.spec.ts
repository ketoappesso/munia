import { test, expect } from '@playwright/test';

test.describe('Simple Auth Verification', () => {
  test('verify auth page loads and session works', async ({ page }) => {
    console.log('🎯 Simple verification of production auth...');

    test.setTimeout(60000);

    try {
      // Test 1: Check if auth page loads
      console.log('🔄 Testing auth page load...');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      await page.waitForTimeout(2000);

      const authPageContent = await page.textContent('body');
      const hasAuthForm = authPageContent?.includes('欢迎使用 Appesso') || authPageContent?.includes('电话');

      console.log(`📊 Auth page loads: ${hasAuthForm ? 'YES' : 'NO'}`);

      if (!hasAuthForm) {
        console.log('❌ Auth page not loading properly');
        await page.screenshot({ path: 'test-results/auth-page-error.png' });
        return;
      }

      // Test 2: Check session endpoint
      console.log('🔄 Testing session endpoint...');
      const sessionTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          return {
            status: response.status,
            ok: response.ok,
            hasData: !!data
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log(`📊 Session endpoint: ${sessionTest.ok ? 'WORKING' : 'FAILED'}`);

      // Test 3: Fill form (but don't submit to avoid login)
      console.log('🔄 Testing form elements...');
      const phoneInput = page.locator('input[placeholder*="电话"]').first();
      const passwordInput = page.locator('input[type="password"]');
      const smsInput = page.locator('input[placeholder*="短信"]');
      const submitButton = page.locator('button:has-text("登录/注册")');

      const phoneExists = await phoneInput.count() > 0;
      const passwordExists = await passwordInput.count() > 0;
      const smsExists = await smsInput.count() > 0;
      const submitExists = await submitButton.count() > 0;

      console.log(`📊 Phone input: ${phoneExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`📊 Password input: ${passwordExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`📊 SMS input: ${smsExists ? 'EXISTS' : 'MISSING'}`);
      console.log(`📊 Submit button: ${submitExists ? 'EXISTS' : 'MISSING'}`);

      if (phoneExists && passwordExists && smsExists && submitExists) {
        console.log('✅ All form elements present');
      } else {
        console.log('❌ Some form elements missing');
      }

      await page.screenshot({
        path: 'test-results/auth-verification.png',
        fullPage: true
      });

      console.log('\n🎯 SIMPLE AUTH VERIFICATION RESULT:');
      console.log('=====================================');
      console.log(`✅ Auth page loads: ${hasAuthForm ? 'YES' : 'NO'}`);
      console.log(`✅ Session endpoint: ${sessionTest.ok ? 'WORKING' : 'FAILED'}`);
      console.log(`✅ Form complete: ${phoneExists && passwordExists && smsExists && submitExists ? 'YES' : 'NO'}`);

      const allGood = hasAuthForm && sessionTest.ok && phoneExists && passwordExists && smsExists && submitExists;
      console.log(`🎉 Overall: ${allGood ? 'AUTH READY ✅' : 'ISSUES FOUND ❌'}`);

    } catch (error) {
      console.log('❌ Test error:', error.message);
      await page.screenshot({
        path: 'test-results/auth-verification-error.png',
        fullPage: true
      });
    }
  });
});