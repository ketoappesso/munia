import { test, expect } from '@playwright/test';

test.describe('Correct Button Test', () => {
  test('click the correct 发帖 button to create image post', async ({ page }) => {
    console.log('🎯 Testing with CORRECT button text: 发帖 (not 发站)');

    test.setTimeout(120000);

    // Capture network requests
    const networkRequests: any[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/posts')) {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          timestamp: new Date().toISOString(),
        });
        console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/posts')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          response.text().then(text => {
            console.log(`❌ Error response: ${text}`);
          }).catch(() => {});
        }
      }
    });

    try {
      // Login with admin account
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

      // Navigate to feed
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(5000);

      // Open modal by clicking "想到啥说啥"
      console.log('🔄 Opening post creation modal...');
      const createTextArea = page.locator('text="想到啥说啥"').first();
      await createTextArea.click();
      await page.waitForTimeout(3000);

      // Fill content
      console.log('📝 Filling post content...');
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
      await modalTextInput.fill('🎉 SUCCESS! Correct button test - 发帖 button works!');
      await page.waitForTimeout(1000);

      // Upload image
      console.log('🖼️ Uploading test image...');
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/correct-button-test.png';
      require('fs').writeFileSync(tempImagePath, imageBuffer);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tempImagePath);
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/before-correct-button-click.png',
        fullPage: true
      });

      // NOW CLICK THE CORRECT BUTTON: "发帖"
      console.log('🎯 Looking for CORRECT button: 发帖');
      const correctSubmitButton = page.locator('button:has-text("发帖")').first();

      if (await correctSubmitButton.count() > 0) {
        console.log('✅ FOUND the correct 发帖 button!');
        console.log('🔄 Clicking 发帖 button...');

        await correctSubmitButton.click();

        console.log('⏳ Waiting for POST request to /api/posts...');
        await page.waitForTimeout(10000);

        // Check if POST request was made
        const postRequests = networkRequests.filter(req => req.method === 'POST');
        console.log(`📊 POST requests made: ${postRequests.length}`);

        if (postRequests.length > 0) {
          console.log('🎉 SUCCESS! POST request detected!');
          console.log('📡 POST requests:');
          postRequests.forEach((req, i) => {
            console.log(`  ${i + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
          });
        } else {
          console.log('❌ No POST requests detected yet');
        }

      } else {
        console.log('❌ STILL cannot find 发帖 button!');

        // Debug: show all buttons
        const allButtonTexts = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.map(btn => btn.textContent?.trim() || '').filter(text => text);
        });

        console.log('🔍 All button texts found:', allButtonTexts);
      }

      await page.screenshot({
        path: 'test-results/after-correct-button-click.png',
        fullPage: true
      });

      // Final check
      const finalPostRequests = networkRequests.filter(req => req.method === 'POST');
      console.log(`\n🏁 FINAL RESULT: ${finalPostRequests.length} POST requests made`);

      if (finalPostRequests.length > 0) {
        console.log('🎉 IMAGE POST CREATION SUCCESSFUL!');
      } else {
        console.log('❌ Image post creation failed - no POST requests');
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});