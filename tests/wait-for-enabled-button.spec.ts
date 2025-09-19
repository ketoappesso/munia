import { test, expect } from '@playwright/test';

test.describe('Wait for Enabled Button Test', () => {
  test('wait for button to be enabled then click it', async ({ page }) => {
    console.log('🎯 Testing by waiting for button to be enabled');

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

      // Fill content FIRST
      console.log('📝 Filling post content...');
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
      await modalTextInput.fill('Final success test with enabled button!');
      await page.waitForTimeout(2000);

      // Upload image SECOND
      console.log('🖼️ Uploading test image...');
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/enabled-button-test.png';
      require('fs').writeFileSync(tempImagePath, imageBuffer);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tempImagePath);
      await page.waitForTimeout(3000);

      console.log('⏳ Waiting for button to become enabled...');

      // Wait for the button to NOT be disabled
      const submitButton = page.locator('button:has-text("发帖")').first();

      // Wait up to 10 seconds for button to be enabled
      await page.waitForFunction(
        () => {
          const button = document.querySelector('button:has-text("发帖")') as HTMLButtonElement;
          return button && !button.disabled;
        },
        { timeout: 10000 }
      ).catch(() => {
        console.log('⚠️ Button did not become enabled in 10 seconds');
      });

      // Check button state
      const isButtonDisabled = await submitButton.isDisabled();
      console.log(`📊 Button disabled state: ${isButtonDisabled}`);

      await page.screenshot({
        path: 'test-results/before-enabled-click.png',
        fullPage: true
      });

      if (!isButtonDisabled) {
        console.log('✅ Button is enabled! Attempting click...');

        // Try multiple click approaches
        console.log('🔄 Approach 1: Regular click...');
        await submitButton.click();
        await page.waitForTimeout(3000);

        if (networkRequests.filter(req => req.method === 'POST').length === 0) {
          console.log('🔄 Approach 2: Force click...');
          await submitButton.click({ force: true });
          await page.waitForTimeout(3000);
        }

        if (networkRequests.filter(req => req.method === 'POST').length === 0) {
          console.log('🔄 Approach 3: Double click...');
          await submitButton.dblclick();
          await page.waitForTimeout(3000);
        }

        if (networkRequests.filter(req => req.method === 'POST').length === 0) {
          console.log('🔄 Approach 4: Click via JavaScript...');
          await submitButton.evaluate(button => button.click());
          await page.waitForTimeout(3000);
        }

      } else {
        console.log('❌ Button is still disabled');

        // Debug: Check what's preventing enable
        const debugInfo = await page.evaluate(() => {
          const textInput = document.querySelector('textarea, input[type="text"]') as HTMLInputElement;
          const fileInputs = document.querySelectorAll('input[type="file"]');

          return {
            textContent: textInput?.value || '',
            textContentLength: textInput?.value?.length || 0,
            fileInputCount: fileInputs.length,
            hasFiles: Array.from(fileInputs).some((input: any) => input.files?.length > 0)
          };
        });

        console.log('🔍 Debug info:', debugInfo);
      }

      console.log('⏳ Final wait for POST requests...');
      await page.waitForTimeout(10000);

      await page.screenshot({
        path: 'test-results/after-enabled-click.png',
        fullPage: true
      });

      // Final check
      const postRequests = networkRequests.filter(req => req.method === 'POST');
      console.log(`\n🏁 FINAL RESULT: ${postRequests.length} POST requests made`);

      if (postRequests.length > 0) {
        console.log('🎉 IMAGE POST CREATION SUCCESSFUL!');
        postRequests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
        });
      } else {
        console.log('❌ Image post creation failed - no POST requests');
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});