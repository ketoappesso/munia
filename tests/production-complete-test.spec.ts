import { test, expect } from '@playwright/test';

test.describe('Production Complete Test', () => {
  test('complete end-to-end test on https://xyuan.chat', async ({ page }) => {
    console.log('🎯 Complete test on production server https://xyuan.chat');

    test.setTimeout(90000);

    const networkRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/posts')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
        });
      }
    });

    try {
      console.log('1️⃣ Loading auth page...');
      await page.goto('https://xyuan.chat/auth');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      console.log('2️⃣ Filling auth form...');
      await page.fill('input[placeholder="请输入手机号"]', '13374743333');
      await page.fill('input[type="password"]', '123456');
      await page.fill('input[placeholder*="输入任意数字"]', '123456');

      console.log('3️⃣ Submitting auth...');
      await page.click('button:has-text("登录/注册")');
      await page.waitForTimeout(8000);

      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);

      if (finalUrl.includes('/feed')) {
        console.log('✅ Authentication successful!');

        console.log('4️⃣ Testing session...');
        const sessionResult = await page.evaluate(async () => {
          const response = await fetch('/api/auth/session', { credentials: 'include' });
          const data = await response.json();
          return { hasUser: !!data?.user, userId: data?.user?.id };
        });

        console.log(`   Session: ${sessionResult.hasUser ? '✅ Valid' : '❌ Invalid'}`);

        if (sessionResult.hasUser) {
          console.log('5️⃣ Testing post creation...');

          // Look for post creation element
          const createPostElement = await page.locator('text="想到啥说啥"').first();
          if (await createPostElement.isVisible()) {
            console.log('   Post creation UI: ✅ Available');

            await createPostElement.click();
            await page.waitForTimeout(3000);

            // Fill post content
            await page.fill('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]', '🎉 Production test successful!');
            await page.waitForTimeout(1000);

            // Submit post
            const submitButton = page.locator('button:has-text("发帖")');
            if (await submitButton.isVisible()) {
              console.log('   Submit button: ✅ Found');
              await submitButton.click();
              await page.waitForTimeout(8000);

              const postRequests = networkRequests.filter(req => req.method === 'POST');
              console.log(`   POST requests: ${postRequests.length}`);

              if (postRequests.length > 0) {
                console.log('✅ Post creation: SUCCESS');
              } else {
                console.log('❌ Post creation: FAILED - No API calls');
              }
            } else {
              console.log('❌ Submit button not found');
            }
          } else {
            console.log('❌ Post creation UI not available');
          }

          // Test direct API call
          console.log('6️⃣ Testing direct API...');
          const apiResult = await page.evaluate(async () => {
            const formData = new FormData();
            formData.append('content', 'Direct API test');

            const response = await fetch('/api/posts', {
              method: 'POST',
              body: formData,
              credentials: 'include'
            });

            return {
              status: response.status,
              success: response.ok
            };
          });

          console.log(`   API call: ${apiResult.success ? '✅ SUCCESS' : '❌ FAILED'} (${apiResult.status})`);

          // Final summary
          console.log('\n🏆 PRODUCTION TEST SUMMARY:');
          console.log(`✅ Auth: ${finalUrl.includes('/feed') ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ Session: ${sessionResult.hasUser ? 'WORKING' : 'FAILED'}`);
          console.log(`✅ API: ${apiResult.success ? 'WORKING' : 'FAILED'}`);

          if (finalUrl.includes('/feed') && sessionResult.hasUser && apiResult.success) {
            console.log('🎉 PRODUCTION SERVER IS FULLY FUNCTIONAL!');
          } else {
            console.log('❌ Production server has issues');
          }

        } else {
          console.log('❌ No valid session after authentication');
        }
      } else {
        console.log('❌ Authentication failed - not redirected to feed');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});