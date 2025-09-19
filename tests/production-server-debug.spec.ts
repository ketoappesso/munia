import { test, expect } from '@playwright/test';

test.describe('Production Server Debug', () => {
  test('test xyuan.chat server issues', async ({ page }) => {
    console.log('🔍 Testing production server xyuan.chat...');

    test.setTimeout(120000);

    // Capture console errors and logs
    const consoleErrors = [];
    const consoleLogs = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      if (msg.type() === 'error') {
        consoleErrors.push(message);
        console.log(`❌ Console Error: ${message}`);
      } else if (message.includes('🔥') || message.includes('📊') || message.includes('Prisma')) {
        consoleLogs.push(message);
        console.log(`📝 Console: ${message}`);
      }
    });

    // Track API requests and responses
    const apiRequests = [];
    const apiErrors = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          method: request.method(),
          url: request.url()
        });
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        console.log(`📥 API Response: ${status} ${response.url()}`);

        if (status >= 400) {
          try {
            const errorBody = await response.text();
            apiErrors.push({
              url: response.url(),
              status,
              body: errorBody
            });
            console.log(`❌ API Error ${status}: ${errorBody.substring(0, 200)}`);
          } catch (e) {
            console.log(`❌ API Error ${status}: Could not read response body`);
          }
        }
      }
    });

    try {
      // Step 1: Test direct login page access
      console.log('🔄 Testing login page access...');
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      await page.waitForTimeout(3000);

      const loginUrl = page.url();
      console.log('📍 Login page URL:', loginUrl);

      // Take screenshot of login page
      await page.screenshot({
        path: 'test-results/production-login.png',
        fullPage: true
      });

      // Step 2: Check if login form is accessible
      const passwordTab = page.locator('button:has-text("密码登录")');
      if (await passwordTab.count() > 0) {
        await passwordTab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Switched to password login mode');
      }

      // Step 3: Fill login form
      console.log('🔄 Testing login form...');
      const phoneInput = page.locator('input').first();
      await phoneInput.fill('18874748888');
      console.log('✅ Phone number entered');

      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('123456');
      console.log('✅ Password entered');

      await page.waitForTimeout(1000);

      // Step 4: Attempt login
      console.log('🔄 Attempting login...');
      const loginButton = page.locator('button[type="button"]:has-text("登录")').last();
      await loginButton.click();

      // Wait for login result
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);

      // Take screenshot after login attempt
      await page.screenshot({
        path: 'test-results/production-after-login.png',
        fullPage: true
      });

      // Step 5: Check login result
      const loginSuccessful = !currentUrl.includes('/login');
      console.log(`📊 Login Result: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`);

      if (loginSuccessful) {
        console.log('✅ Login successful, testing feed page...');

        // Wait for feed page to load
        await page.waitForTimeout(5000);

        // Check for posts
        const pageContent = await page.textContent('body');
        const hasLoadingPosts = pageContent?.includes('Loading posts');
        const hasSomethingWrong = pageContent?.includes('Something went wrong');
        const hasActualPosts = pageContent?.includes('days ago') || pageContent?.includes('hours ago');

        console.log('📊 Feed page status:');
        console.log(`   Has "Loading posts": ${hasLoadingPosts}`);
        console.log(`   Has "Something went wrong": ${hasSomethingWrong}`);
        console.log(`   Has actual posts: ${hasActualPosts}`);

        // Test API endpoints directly
        console.log('🔄 Testing API endpoints directly...');

        // Test posts API
        const postsApiResult = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/posts?limit=5&cursor=0&sort-direction=desc');
            return {
              status: response.status,
              ok: response.ok,
              data: response.ok ? await response.text() : await response.text()
            };
          } catch (error) {
            return { error: error.message };
          }
        });

        console.log('📊 Posts API test:', postsApiResult);

        // Test user API
        const userApiResult = await page.evaluate(async () => {
          try {
            const response = await fetch('/api/users/cmfo8k4nb0000r6qsfr6n05x2');
            return {
              status: response.status,
              ok: response.ok,
              data: response.ok ? await response.text() : await response.text()
            };
          } catch (error) {
            return { error: error.message };
          }
        });

        console.log('📊 User API test:', userApiResult);

      } else {
        console.log('❌ Login failed, checking for errors...');

        // Look for error messages
        const errorElements = await page.locator('[role="alert"], .error, .text-red-500').all();
        if (errorElements.length > 0) {
          for (let i = 0; i < errorElements.length; i++) {
            const errorText = await errorElements[i].textContent();
            console.log(`🚨 Error ${i + 1}: ${errorText}`);
          }
        }
      }

      // Step 6: Final diagnosis
      console.log('\n📊 PRODUCTION SERVER DIAGNOSIS:');
      console.log('=====================================');
      console.log(`🔍 Server: https://xyuan.chat`);
      console.log(`🔍 Login Accessible: YES`);
      console.log(`🔍 Login Success: ${loginSuccessful ? 'YES' : 'NO'}`);
      console.log(`🔍 Console Errors: ${consoleErrors.length}`);
      console.log(`🔍 API Requests: ${apiRequests.length}`);
      console.log(`🔍 API Errors: ${apiErrors.length}`);

      if (consoleErrors.length > 0) {
        console.log('\n❌ CONSOLE ERRORS:');
        consoleErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
      }

      if (apiErrors.length > 0) {
        console.log('\n❌ API ERRORS:');
        apiErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error.status} ${error.url}`);
          console.log(`      ${error.body.substring(0, 100)}...`);
        });
      }

      // Specific checks for database issues
      const hasPrismaErrors = consoleErrors.some(error =>
        error.includes('Prisma') || error.includes('lastActivityAt')
      );

      if (hasPrismaErrors) {
        console.log('\n🚨 DATABASE ISSUE DETECTED:');
        console.log('   The server appears to have Prisma/database schema issues');
        console.log('   This likely requires server-side fixes:');
        console.log('   1. Run: npx prisma generate');
        console.log('   2. Restart the server');
        console.log('   3. Check database migrations');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);

      // Take error screenshot
      await page.screenshot({
        path: 'test-results/production-error.png',
        fullPage: true
      });
    }
  });
});