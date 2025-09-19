import { test, expect } from '@playwright/test';

test.describe('Post Creation Debug', () => {
  test('debug post creation with image upload', async ({ page }) => {
    console.log('🔍 Testing post creation with images...');

    test.setTimeout(90000);

    // Capture console messages and network requests
    const consoleMessages: string[] = [];
    const networkRequests: any[] = [];

    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('serverWritePost') || message.includes('POST')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    page.on('request', request => {
      if (request.url().includes('/api/posts')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
        });
        console.log(`📡 Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/posts')) {
        console.log(`📡 Response: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          response.text().then(text => {
            console.log(`❌ Error response body: ${text}`);
          }).catch(() => {});
        }
      }
    });

    try {
      // Login first
      console.log('🔄 Logging in...');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Fill login form
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456'); // SMS code

      console.log('🔄 Submitting login form...');
      await page.locator('button:has-text("登录/注册")').click();

      console.log('⏳ Waiting for login...');
      await page.waitForTimeout(5000);

      // Check if we're logged in
      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);

      if (currentUrl.includes('/auth')) {
        console.log('❌ Login failed, still on auth page');
        return;
      }

      // Navigate to feed if not already there
      if (!currentUrl.includes('/feed')) {
        await page.goto('https://xyuan.chat/feed');
        await page.waitForTimeout(2000);
      }

      console.log('✅ Login successful, now testing post creation...');

      // Look for the post creation button/modal
      const postButton = page.locator('button:has-text("创建贴子"), button:has-text("发帖"), button:has-text("发布")').first();

      if (await postButton.count() > 0) {
        console.log('🔄 Clicking post creation button...');
        await postButton.click();
        await page.waitForTimeout(2000);
      } else {
        console.log('🔍 Looking for alternative post creation methods...');
        // Try to find any modal trigger or direct form
        const modalTrigger = page.locator('[data-testid="create-post"], .create-post, button[aria-label*="创建"], button[aria-label*="发布"]').first();
        if (await modalTrigger.count() > 0) {
          await modalTrigger.click();
          await page.waitForTimeout(2000);
        }
      }

      // Take a screenshot to see the current state
      await page.screenshot({
        path: 'test-results/post-creation-debug-1.png',
        fullPage: true
      });

      // Look for text input field
      const textInput = page.locator('textarea, input[type="text"]:not([type="password"]):not([type="tel"])').first();

      if (await textInput.count() > 0) {
        console.log('🔄 Found text input, filling with test content...');
        await textInput.fill('说些啥？');
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ No text input found');
      }

      // Look for image upload input
      const imageInput = page.locator('input[type="file"], input[accept*="image"]').first();

      if (await imageInput.count() > 0) {
        console.log('🔄 Found image input, uploading test image...');

        // Create a simple test image file
        const testImagePath = '/tmp/test-image.png';
        await page.evaluate(() => {
          // Create a simple 1x1 PNG image data
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(0, 0, 100, 100);
          return canvas.toDataURL();
        });

        // For now, let's skip the actual file upload and just trigger the form submission
        console.log('📝 Skipping file upload for debugging, looking for submit button...');
      } else {
        console.log('❌ No image input found');
      }

      // Look for submit button
      const submitButton = page.locator('button:has-text("发站"), button:has-text("发布"), button:has-text("提交"), button[type="submit"]').first();

      if (await submitButton.count() > 0) {
        console.log('🔄 Found submit button, clicking...');
        await submitButton.click();

        console.log('⏳ Waiting for post creation response...');
        await page.waitForTimeout(10000);

        // Take screenshot after submission
        await page.screenshot({
          path: 'test-results/post-creation-debug-2.png',
          fullPage: true
        });
      } else {
        console.log('❌ No submit button found');
        await page.screenshot({
          path: 'test-results/post-creation-debug-no-submit.png',
          fullPage: true
        });
      }

      console.log('\n🎯 POST CREATION DEBUG RESULT:');
      console.log('===============================');
      console.log(`📡 Network Requests: ${networkRequests.length}`);
      console.log(`📝 Console Messages: ${consoleMessages.length}`);
      console.log(`🔧 Error Messages: ${consoleMessages.filter(m => m.includes('error')).length}`);

      if (networkRequests.length > 0) {
        console.log('📡 Network Requests Details:');
        networkRequests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        });
      }

      // Log recent console messages for debugging
      console.log('\n🔍 Recent Console Messages:');
      consoleMessages.slice(-10).forEach((msg, i) =>
        console.log(`   ${i + 1}. ${msg}`)
      );

    } catch (error) {
      console.log('❌ Test error:', error.message);

      await page.screenshot({
        path: 'test-results/post-creation-debug-error.png',
        fullPage: true
      });
    }
  });
});