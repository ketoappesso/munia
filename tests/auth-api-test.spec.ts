import { test, expect } from '@playwright/test';

test.describe('Production Auth API Test', () => {
  test('test authentication and API on https://xyuan.chat', async ({ page }) => {
    console.log('🎯 Testing authentication on production server https://xyuan.chat');

    test.setTimeout(60000);

    try {
      // Test 1: Check if auth page loads
      console.log('1️⃣ Testing auth page...');
      await page.goto('https://xyuan.chat/auth', { timeout: 10000 });
      await page.waitForTimeout(2000);

      const hasAuthPage = await page.textContent('body').then(text =>
        text?.includes('欢迎使用 Appesso') || false
      );
      console.log(`   Auth page loads: ${hasAuthPage ? '✅' : '❌'}`);

      // Test 2: Quick session endpoint test
      console.log('2️⃣ Testing session endpoint...');
      const sessionTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          return { ok: response.ok, hasUser: !!data.user };
        } catch (error) {
          return { error: error.message };
        }
      });
      console.log(`   Session endpoint: ${sessionTest.ok ? '✅' : '❌'}`);

      if (hasAuthPage && sessionTest.ok) {
        console.log('3️⃣ Testing quick authentication...');

        // Fill form quickly
        await page.locator('input[placeholder="请输入手机号"]').fill('13374743333');
        await page.locator('input[type="password"]').fill('123456');
        await page.locator('input[placeholder*="输入任意数字"]').fill('123456');
        await page.locator('button:has-text("登录/注册")').click();

        await page.waitForTimeout(5000);

        // Check result
        const currentUrl = page.url();
        const authSuccess = currentUrl.includes('/feed');
        console.log(`   Authentication: ${authSuccess ? '✅' : '❌'}`);

        if (authSuccess) {
          // Test API call
          console.log('4️⃣ Testing API with authentication...');
          const apiTest = await page.evaluate(async () => {
            try {
              const formData = new FormData();
              formData.append('content', 'API test from production');

              const response = await fetch('/api/posts', {
                method: 'POST',
                body: formData,
                credentials: 'include'
              });

              return {
                status: response.status,
                ok: response.ok,
                unauthorized: response.status === 401
              };
            } catch (error) {
              return { error: error.message };
            }
          });

          console.log(`   API call status: ${apiTest.status}`);
          console.log(`   API authenticated: ${!apiTest.unauthorized ? '✅' : '❌'}`);

          console.log('\n🏆 PRODUCTION TEST RESULTS:');
          console.log(`✅ Auth page: ${hasAuthPage ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ Session endpoint: ${sessionTest.ok ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ Authentication: ${authSuccess ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ API authentication: ${!apiTest.unauthorized ? 'WORKING' : 'FAILED'}`);

          if (hasAuthPage && sessionTest.ok && authSuccess && !apiTest.unauthorized) {
            console.log('🎉 PRODUCTION SERVER IS FULLY FUNCTIONAL!');
          } else {
            console.log('❌ Some issues remain on production server');
          }
        }
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});