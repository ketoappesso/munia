import { test, expect } from '@playwright/test';

test.describe('Final Submit Button Test', () => {
  test('try all possible ways to click the submit button', async ({ page }) => {
    console.log('🔍 Testing all ways to submit the post...');

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

      // Open modal
      const createTextArea = page.locator('text="想到啥说啥"').first();
      await createTextArea.click();
      await page.waitForTimeout(3000);

      // Fill content
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
      await modalTextInput.fill('Final test - 发站 button testing');
      await page.waitForTimeout(1000);

      // Upload image
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/final-test-image.png';
      require('fs').writeFileSync(tempImagePath, imageBuffer);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tempImagePath);
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/final-before-submit.png',
        fullPage: true
      });

      console.log('🚀 Testing different submit approaches...');

      // APPROACH 1: Try Enter key
      console.log('🔄 Approach 1: Pressing Enter key...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      if (networkRequests.some(req => req.method === 'POST')) {
        console.log('✅ SUCCESS with Enter key!');
        return;
      }

      // APPROACH 2: Try Ctrl+Enter (common submit shortcut)
      console.log('🔄 Approach 2: Pressing Ctrl+Enter...');
      await page.keyboard.press('Control+Enter');
      await page.waitForTimeout(3000);

      if (networkRequests.some(req => req.method === 'POST')) {
        console.log('✅ SUCCESS with Ctrl+Enter!');
        return;
      }

      // APPROACH 3: Tab to the button and press Enter
      console.log('🔄 Approach 3: Tab navigation to button...');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);

      if (networkRequests.some(req => req.method === 'POST')) {
        console.log('✅ SUCCESS with Tab navigation!');
        return;
      }

      // APPROACH 4: CSS-based selectors for purple/submit buttons
      console.log('🔄 Approach 4: CSS-based button selectors...');
      const cssSelectors = [
        'button[class*="purple"]',
        'button[class*="submit"]',
        'button[class*="primary"]',
        'button[style*="background"]',
        'button[style*="purple"]',
        '[class*="submit-button"]',
        '[class*="post-button"]',
        '.btn-primary',
        '.btn-submit',
        '.submit',
        '.primary'
      ];

      for (const selector of cssSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            console.log(`🔄 Trying CSS selector: ${selector}`);
            await button.click();
            await page.waitForTimeout(3000);

            if (networkRequests.some(req => req.method === 'POST')) {
              console.log(`✅ SUCCESS with CSS selector: ${selector}!`);
              return;
            }
          }
        } catch (e) {
          // Ignore selector errors
        }
      }

      // APPROACH 5: Force click on any button in top-right area
      console.log('🔄 Approach 5: Force clicking any buttons in modal...');
      const allButtons = await page.locator('button').all();

      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        try {
          const isVisible = await button.isVisible();
          const box = await button.boundingBox();

          // Only try buttons that are in the modal area (roughly right side of screen)
          if (isVisible && box && box.x > 800) {
            const text = await button.textContent();
            console.log(`🔄 Force clicking button ${i}: "${text}" at (${box.x}, ${box.y})`);

            await button.click({ force: true });
            await page.waitForTimeout(3000);

            if (networkRequests.some(req => req.method === 'POST')) {
              console.log(`✅ SUCCESS with force click on button: "${text}"!`);
              return;
            }
          }
        } catch (e) {
          // Continue to next button
        }
      }

      // APPROACH 6: Form submission
      console.log('🔄 Approach 6: Form submission...');
      const form = page.locator('form').first();
      if (await form.count() > 0) {
        await form.evaluate(form => form.submit());
        await page.waitForTimeout(3000);
      }

      const finalPostRequests = networkRequests.filter(req => req.method === 'POST');
      console.log(`📊 Final result: ${finalPostRequests.length} POST requests made`);

      await page.screenshot({
        path: 'test-results/final-after-all-attempts.png',
        fullPage: true
      });

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});