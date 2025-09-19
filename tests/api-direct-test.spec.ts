import { test, expect } from '@playwright/test';

test.describe('API Direct Test', () => {
  test('create post by calling API directly', async ({ page }) => {
    console.log('🎯 Testing by calling /api/posts directly');

    test.setTimeout(120000);

    try {
      // First login to get session/cookies
      await page.goto('https://xyuan.chat/auth', {
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
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);

      console.log('🔄 Creating post via API call...');

      // Create test image file
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');

      // Call the API directly using page.evaluate to access browser context
      const apiResult = await page.evaluate(async (imageBufferArray) => {
        try {
          // Convert array back to buffer
          const imageBuffer = new Uint8Array(imageBufferArray);

          // Create FormData
          const formData = new FormData();
          formData.append('content', '🎉 SUCCESS! Direct API call works! Image post created via /api/posts endpoint');

          // Create a blob from the image buffer
          const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
          formData.append('visualMedia', imageBlob, 'test-image.png');

          console.log('📡 Making POST request to /api/posts...');

          // Make the API call
          const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
            credentials: 'include' // Include session cookies
          });

          const responseText = await response.text();

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
      }, Array.from(imageBuffer));

      console.log('📊 API call result:', apiResult);

      if (apiResult.success) {
        console.log('🎉 SUCCESS! Post created via direct API call!');
        console.log(`📡 Response status: ${apiResult.status}`);
        console.log(`📄 Response: ${apiResult.responseText}`);

        // Wait a moment for the post to be processed
        await page.waitForTimeout(3000);

        // Refresh the feed to see the new post
        await page.reload();
        await page.waitForTimeout(3000);

        // Check if our post appears on the feed
        const pageContent = await page.textContent('body');
        const postVisible = pageContent?.includes('SUCCESS! Direct API call works!');

        console.log(`📊 Post visible on feed: ${postVisible}`);

        await page.screenshot({
          path: 'test-results/after-api-direct-call.png',
          fullPage: true
        });

        if (postVisible) {
          console.log('🎉 COMPLETE SUCCESS! Post created AND visible on feed!');
        } else {
          console.log('⚠️ Post created but not yet visible on feed');
        }

      } else {
        console.log('❌ API call failed');
        console.log(`📡 Status: ${apiResult.status} - ${apiResult.statusText}`);
        console.log(`📄 Error: ${apiResult.error || apiResult.responseText}`);
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});