import { test, expect } from '@playwright/test';

test.describe('Localhost Authentication Test', () => {
  test('test authentication on localhost', async ({ page }) => {
    console.log('🎯 Testing authentication on localhost:3002');

    test.setTimeout(120000);

    try {
      // Login with admin account on localhost
      await page.goto('http://localhost:3002/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);
      await page.locator('input').first().fill('13374743333');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456');
      await page.locator('button:has-text("登录/注册")').click();
      await page.waitForTimeout(5000);

      // Navigate to feed to ensure session is active
      await page.goto('http://localhost:3002/feed');
      await page.waitForTimeout(3000);

      console.log('🔍 Debugging localhost session state...');

      // Get session info on localhost
      const sessionDebugInfo = await page.evaluate(async () => {
        // Check NextAuth session
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const sessionData = await sessionResponse.json();

        // Check server user endpoint
        const serverUserResponse = await fetch('/api/debug/server-user', {
          credentials: 'include'
        });
        const serverUserData = serverUserResponse.ok ? await serverUserResponse.json() : null;

        return {
          sessionData: sessionData,
          sessionStatus: sessionResponse.status,
          serverUserData: serverUserData,
          serverUserStatus: serverUserResponse.status,
          cookies: document.cookie,
          currentUrl: window.location.href
        };
      });

      console.log('📊 Localhost session debug info:', sessionDebugInfo);

      // Check what cookies are available
      const allCookies = await page.context().cookies();
      console.log('📊 Localhost cookies:', allCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 30) + '...',
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure
      })));

      // Try direct API call on localhost
      console.log('🔄 Testing direct API call on localhost...');

      const apiResult = await page.evaluate(async () => {
        try {
          // Create test data
          const formData = new FormData();
          formData.append('content', 'Localhost authentication test post');

          console.log('📡 Making POST request to localhost /api/posts...');

          const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          const responseText = await response.text();
          console.log('📡 Response status:', response.status);
          console.log('📡 Response text:', responseText);

          return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            responseText: responseText,
            headers: Object.fromEntries(response.headers.entries())
          };

        } catch (error) {
          console.error('API call error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });

      console.log('📊 Localhost API result:', apiResult);

      await page.screenshot({
        path: 'test-results/localhost-auth-test.png',
        fullPage: true
      });

      // If session is working, try the image post creation
      if (sessionDebugInfo.sessionData?.user) {
        console.log('✅ Session authenticated! Attempting image post creation...');

        // Navigate to feed and try creating a post
        await page.goto('http://localhost:3002/feed');
        await page.waitForTimeout(3000);

        // Open modal by clicking "想到啥说啥"
        console.log('🔄 Opening post creation modal...');
        const createTextArea = page.locator('text="想到啥说啥"').first();
        await createTextArea.click();
        await page.waitForTimeout(3000);

        // Fill content
        console.log('📝 Filling post content...');
        const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
        await modalTextInput.fill('🎉 LOCALHOST SUCCESS! Image post with authentication!');
        await page.waitForTimeout(1000);

        // Upload image
        console.log('🖼️ Uploading test image...');
        const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
        const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
        const tempImagePath = '/tmp/localhost-auth-test.png';
        require('fs').writeFileSync(tempImagePath, imageBuffer);

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(tempImagePath);
        await page.waitForTimeout(3000);

        // Click submit button
        console.log('🎯 Clicking submit button...');
        const submitButton = page.locator('button:has-text("发帖")').first();
        await submitButton.click();
        await page.waitForTimeout(5000);

        await page.screenshot({
          path: 'test-results/localhost-post-created.png',
          fullPage: true
        });

        console.log('🎉 Image post creation attempted on localhost!');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});