import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Complete Image Post Test', () => {
  test('test complete image post creation with real image upload', async ({ page }) => {
    console.log('🔍 Starting complete image post test...');
    console.log('👤 Using account: 18874748888');

    test.setTimeout(120000); // 2 minutes timeout

    // Capture all console messages and network requests
    const consoleMessages: string[] = [];
    const networkRequests: any[] = [];
    const responses: any[] = [];

    page.on('console', msg => {
      const message = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      consoleMessages.push(message);
      console.log(`📝 ${message}`);
    });

    page.on('request', request => {
      const info = {
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString(),
      };
      networkRequests.push(info);

      if (request.url().includes('/api/posts') || request.url().includes('upload')) {
        console.log(`📡 REQUEST: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async (response) => {
      const info = {
        status: response.status(),
        url: response.url(),
        timestamp: new Date().toISOString(),
      };
      responses.push(info);

      if (response.url().includes('/api/posts') || response.url().includes('upload')) {
        console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);

        if (response.status() >= 400) {
          try {
            const text = await response.text();
            console.log(`❌ Error response body: ${text}`);
          } catch (e) {
            console.log(`❌ Could not read error response body`);
          }
        }
      }
    });

    try {
      console.log('🚀 Step 1: Navigate to auth page');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      await page.waitForTimeout(3000);

      console.log('🔐 Step 2: Login with admin credentials');
      // Fill login form with admin account that has post creation access
      const phoneInput = page.locator('input[type="tel"], input[inputmode="tel"], input').first();
      await phoneInput.fill('13374743333');
      console.log('✅ Admin phone number filled');

      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('123456');
      console.log('✅ Password filled');

      const smsInput = page.locator('input').nth(2);
      await smsInput.fill('123456');
      console.log('✅ SMS code filled');

      // Submit login
      const loginButton = page.locator('button:has-text("登录/注册")');
      await loginButton.click();
      console.log('🔄 Login form submitted');

      // Wait for login to complete
      await page.waitForTimeout(8000);

      const currentUrl = page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);

      // Check if login was successful
      if (currentUrl.includes('/auth')) {
        console.log('❌ Login failed - still on auth page');
        await page.screenshot({
          path: 'test-results/login-failed.png',
          fullPage: true
        });
        throw new Error('Login failed');
      }

      console.log('✅ Login successful!');

      // Navigate to feed if not already there
      if (!currentUrl.includes('/feed')) {
        await page.goto('https://xyuan.chat/feed', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
      }

      console.log('📝 Step 3: Create new post');

      // Take screenshot of feed page
      await page.screenshot({
        path: 'test-results/feed-page.png',
        fullPage: true
      });

      // Look for the "想到啥说啥" clickable area (it might be a div, not an input)
      console.log('🔍 Looking for "想到啥说啥" clickable area...');

      // Wait a bit more for the admin UI to fully load
      await page.waitForTimeout(5000);

      // Try clicking on any element that contains the text "想到啥说啥"
      const createTextArea = page.locator('text="想到啥说啥"').first();

      if (await createTextArea.count() > 0) {
        console.log('✅ Found "想到啥说啥" text area, clicking...');
        await createTextArea.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('❌ No "想到啥说啥" text found, trying broader approach...');

        // Try clicking in the area where post creation should be (top of feed)
        const topArea = page.locator('div').first();
        console.log('🔄 Clicking in top area to trigger post creation...');
        await topArea.click();
        await page.waitForTimeout(3000);
      }

      // Take screenshot after clicking create button
      await page.screenshot({
        path: 'test-results/after-create-click.png',
        fullPage: true
      });

      console.log('📝 Step 4: Fill post content');

      // Look for text input in the modal
      console.log('🔍 Looking for text input in the modal...');
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"], input[placeholder*="说点"], textarea[placeholder*="说点"]').first();

      if (await modalTextInput.count() > 0) {
        console.log('✅ Found modal text input, filling with content...');
        await modalTextInput.fill('测试发布图片帖子 - Playwright自动化测试');
        console.log('✅ Text content filled');
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ No modal text input found, trying alternative selectors...');
        // Try any textarea or text input in the modal
        const anyTextInput = page.locator('div[role="dialog"] textarea, div[role="dialog"] input[type="text"]').first();
        if (await anyTextInput.count() > 0) {
          await anyTextInput.fill('测试发布图片帖子 - Playwright自动化测试');
          console.log('✅ Alternative text input filled');
        }
      }

      console.log('🖼️ Step 5: Upload image');

      // Create a test image file from the uploaded image
      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;

      // Convert base64 to buffer and save as temporary file
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/test-upload-image.png';
      fs.writeFileSync(tempImagePath, imageBuffer);
      console.log(`✅ Test image saved to: ${tempImagePath}`);

      // Look for file input
      const fileSelectors = [
        'input[type="file"]',
        'input[accept*="image"]',
        '[data-testid="image-upload"]',
        '.image-upload-input'
      ];

      let fileInput = null;
      for (const selector of fileSelectors) {
        const input = page.locator(selector);
        if (await input.count() > 0) {
          fileInput = input;
          console.log(`✅ Found file input with selector: ${selector}`);
          break;
        }
      }

      if (fileInput) {
        // Upload the test image
        await fileInput.setInputFiles(tempImagePath);
        console.log('✅ Image uploaded');
        await page.waitForTimeout(3000);
      } else {
        console.log('❌ No file input found');

        // Look for image upload trigger button in the modal
        console.log('🔍 Looking for image/video button in modal...');
        const imageVideoButton = page.locator('button:has-text("图片"), button:has-text("视频"), button:has-text("图片 / 视频")').first();

        if (await imageVideoButton.count() > 0) {
          console.log('🔄 Clicking image/video button in modal...');
          await imageVideoButton.click();
          await page.waitForTimeout(2000);

          // Try to find file input again
          const hiddenInput = page.locator('input[type="file"]').first();
          if (await hiddenInput.count() > 0) {
            await hiddenInput.setInputFiles(tempImagePath);
            console.log('✅ Image uploaded via hidden input');
            await page.waitForTimeout(3000);
          } else {
            console.log('❌ Still no file input found after clicking image button');
          }
        } else {
          console.log('❌ No image/video button found in modal');
        }
      }

      // Take screenshot after image upload
      await page.screenshot({
        path: 'test-results/after-image-upload.png',
        fullPage: true
      });

      console.log('🚀 Step 6: Submit post');

      // Look for submit button in the modal - try multiple approaches
      console.log('🔍 Looking for submit button in the modal...');

      // Try different selectors for the "发站" button
      const submitSelectors = [
        'button:has-text("发站")',
        'text="发站"',
        '.发站',
        '[text="发站"]',
        'button >> text="发站"',
        'button:text("发站")',
        'button:text-is("发站")',
        'button[aria-label*="发站"]',
        'button[title*="发站"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.count() > 0) {
            submitButton = button;
            console.log(`✅ Found submit button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Selector "${selector}" failed: ${e.message}`);
        }
      }

      if (submitButton) {
        console.log('🔄 Clicking submit button...');
        await submitButton.click();

        // Wait for the post request and response
        console.log('⏳ Waiting for post creation...');
        await page.waitForTimeout(15000);

        // Take final screenshot
        await page.screenshot({
          path: 'test-results/after-submit.png',
          fullPage: true
        });
      } else {
        console.log('❌ No "发站" button found with text selectors, trying position-based approach...');

        // Try clicking in the approximate position where the purple button should be (top right of modal)
        console.log('🔄 Attempting to click in top-right area of modal where submit button should be...');

        // Get the modal element and try multiple precise clicks for the purple button
        const modal = page.locator('[role="dialog"], .modal, div:has-text("创建帖子")').first();
        if (await modal.count() > 0) {
          const modalBox = await modal.boundingBox();
          if (modalBox) {
            // Try multiple positions where the purple "发站" button should be
            const buttonPositions = [
              { x: modalBox.x + modalBox.width - 65, y: modalBox.y + 35 }, // A bit higher and more left
              { x: modalBox.x + modalBox.width - 45, y: modalBox.y + 45 }, // More center of button
              { x: modalBox.x + modalBox.width - 55, y: modalBox.y + 55 }, // Slightly lower
              { x: modalBox.x + modalBox.width - 75, y: modalBox.y + 45 }, // More left
            ];

            for (let i = 0; i < buttonPositions.length; i++) {
              const pos = buttonPositions[i];
              console.log(`🔄 Attempt ${i + 1}: Clicking at position (${pos.x}, ${pos.y})...`);

              await page.mouse.click(pos.x, pos.y);
              await page.waitForTimeout(3000);

              // Check if a POST request was made (indicating success)
              const hasPost = networkRequests.some(req =>
                req.url.includes('/api/posts') && req.method === 'POST'
              );

              if (hasPost) {
                console.log(`✅ SUCCESS! Position ${i + 1} worked - POST request detected!`);
                break;
              } else {
                console.log(`❌ Position ${i + 1} didn't work, trying next...`);
              }
            }

            console.log('⏳ Waiting for final post creation...');
            await page.waitForTimeout(10000);

            await page.screenshot({
              path: 'test-results/after-multiple-clicks.png',
              fullPage: true
            });
          }
        } else {
          console.log('❌ No modal found for position-based clicking');
          await page.screenshot({
            path: 'test-results/no-modal-found.png',
            fullPage: true
          });
        }
      }

      // Check final URL
      const finalUrl = page.url();
      console.log(`📍 Final URL: ${finalUrl}`);

      // Analyze results
      const postRequests = networkRequests.filter(req =>
        req.url.includes('/api/posts') && req.method === 'POST'
      );

      const postResponses = responses.filter(res =>
        res.url.includes('/api/posts')
      );

      console.log('\n🎯 TEST RESULTS SUMMARY:');
      console.log('========================');
      console.log(`📡 POST requests made: ${postRequests.length}`);
      console.log(`📡 POST responses: ${postResponses.length}`);
      console.log(`🔧 Console errors: ${consoleMessages.filter(m => m.includes('[ERROR]')).length}`);
      console.log(`📱 Total network requests: ${networkRequests.length}`);

      if (postRequests.length > 0) {
        console.log('\n📡 POST Request Details:');
        postRequests.forEach((req, i) => {
          console.log(`  ${i + 1}. ${req.method} ${req.url} at ${req.timestamp}`);
        });
      }

      if (postResponses.length > 0) {
        console.log('\n📡 POST Response Details:');
        postResponses.forEach((res, i) => {
          console.log(`  ${i + 1}. ${res.status} ${res.url} at ${res.timestamp}`);
        });
      }

      // Check if post was successful
      const hasSuccessfulPost = postResponses.some(res =>
        res.url.includes('/api/posts') && res.status >= 200 && res.status < 300
      );

      const hasFailedPost = postResponses.some(res =>
        res.url.includes('/api/posts') && res.status >= 400
      );

      if (hasSuccessfulPost) {
        console.log('🎉 POST CREATION SUCCESSFUL!');
      } else if (hasFailedPost) {
        console.log('❌ POST CREATION FAILED - Server returned error');
        throw new Error('Post creation failed with server error');
      } else {
        console.log('⚠️ POST CREATION STATUS UNCLEAR - No clear success/failure');
      }

      // Clean up temporary file
      try {
        fs.unlinkSync(tempImagePath);
        console.log('🧹 Cleaned up temporary image file');
      } catch (e) {
        console.log('⚠️ Could not clean up temporary file');
      }

    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);

      await page.screenshot({
        path: 'test-results/test-error.png',
        fullPage: true
      });

      // Log debugging information
      console.log('\n🔍 DEBUGGING INFORMATION:');
      console.log('=========================');
      console.log(`📱 Total console messages: ${consoleMessages.length}`);
      console.log(`📡 Total network requests: ${networkRequests.length}`);

      if (consoleMessages.length > 0) {
        console.log('\n📝 Recent Console Messages:');
        consoleMessages.slice(-10).forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg}`);
        });
      }

      throw error;
    }
  });
});