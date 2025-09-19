import { test, expect } from '@playwright/test';

test.describe('Direct React Call Test', () => {
  test('call the React function directly', async ({ page }) => {
    console.log('🎯 Testing by calling React functions directly');

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

      // Fill content
      console.log('📝 Filling post content...');
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
      await modalTextInput.fill('Direct React call test - should work!');
      await page.waitForTimeout(2000);

      // Upload image
      console.log('🖼️ Uploading test image...');
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/direct-react-test.png';
      require('fs').writeFileSync(tempImagePath, imageBuffer);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tempImagePath);
      await page.waitForTimeout(3000);

      console.log('🔄 Attempting direct React function calls...');

      // Try to call the React function directly via JavaScript evaluation
      const result = await page.evaluate(() => {
        // Look for React Fiber nodes to find the component instance
        const findReactComponent = (element: any): any => {
          // Check for React Fiber properties
          for (const key in element) {
            if (key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber')) {
              return element[key];
            }
          }
          return null;
        };

        // Find the submit button
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitButton = buttons.find(btn => btn.textContent?.includes('发帖'));

        if (submitButton) {
          console.log('Found submit button:', submitButton.textContent);

          // Try to find React component
          const reactComponent = findReactComponent(submitButton);
          console.log('React component:', reactComponent);

          // Try multiple click approaches
          try {
            // Approach 1: Regular click
            submitButton.click();
            console.log('Clicked button normally');

            // Approach 2: Dispatch click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            submitButton.dispatchEvent(clickEvent);
            console.log('Dispatched click event');

            // Approach 3: Trigger onPress if it exists
            if (reactComponent && reactComponent.memoizedProps && reactComponent.memoizedProps.onPress) {
              reactComponent.memoizedProps.onPress();
              console.log('Called onPress directly');
            }

            return { success: true, buttonFound: true, reactComponent: !!reactComponent };

          } catch (error) {
            console.log('Error in click approaches:', error);
            return { success: false, error: error.message, buttonFound: true };
          }

        } else {
          console.log('Submit button not found');
          console.log('Available buttons:', buttons.map(btn => btn.textContent));
          return { success: false, buttonFound: false, availableButtons: buttons.map(btn => btn.textContent) };
        }
      });

      console.log('📊 Direct React call result:', result);

      await page.waitForTimeout(10000);

      await page.screenshot({
        path: 'test-results/after-direct-react-call.png',
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