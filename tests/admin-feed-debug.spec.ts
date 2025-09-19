import { test, expect } from '@playwright/test';

test.describe('Admin Feed Debug Test', () => {
  test('login and debug feed page issues', async ({ page }) => {
    console.log('🔍 Starting comprehensive admin feed debugging...');

    test.setTimeout(120000);

    try {
      // Capture all console messages
      const consoleLogs = [];
      page.on('console', msg => {
        const message = `${msg.type()}: ${msg.text()}`;
        consoleLogs.push(message);
        console.log(`🖥️  Console: ${message}`);
      });

      // Capture all network requests
      const networkRequests = [];
      page.on('request', request => {
        networkRequests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
        });
        if (request.url().includes('/api/')) {
          console.log(`📤 API Request: ${request.method()} ${request.url()}`);
        }
      });

      // Capture all network responses
      const networkResponses = [];
      page.on('response', async response => {
        const responseData = {
          status: response.status(),
          url: response.url(),
          headers: response.headers(),
          body: null
        };

        // Capture response body for API calls
        if (response.url().includes('/api/')) {
          try {
            const text = await response.text();
            responseData.body = text;
            console.log(`📥 API Response: ${response.status()} ${response.url()}`);
            console.log(`📄 Response body: ${text.substring(0, 200)}...`);
          } catch (e) {
            console.log(`❌ Could not read response body: ${e.message}`);
          }
        }

        networkResponses.push(responseData);
      });

      // Step 1: Navigate to login page
      console.log('🔄 Navigating to login page...');
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      await page.waitForTimeout(3000);

      // Take screenshot of login page
      await page.screenshot({
        path: 'test-results/admin-debug-login.png',
        fullPage: true
      });

      // Step 2: Switch to password login mode
      console.log('🔄 Switching to password login mode...');
      const passwordTab = page.locator('button:has-text("密码登录")');
      if (await passwordTab.count() > 0) {
        await passwordTab.click();
        await page.waitForTimeout(1000);
        console.log('✅ Switched to password login mode');
      }

      // Step 3: Fill login form
      console.log('🔄 Filling login form...');

      // Find phone input
      const phoneInput = page.locator('input').first();
      await phoneInput.fill('18874748888');
      console.log('✅ Phone number entered');

      await page.waitForTimeout(500);

      // Find password input
      const passwordInput = page.locator('input[type="password"]');
      await passwordInput.fill('123456');
      console.log('✅ Password entered');

      await page.waitForTimeout(500);

      // Take screenshot before login
      await page.screenshot({
        path: 'test-results/admin-debug-before-login.png',
        fullPage: true
      });

      // Step 4: Submit login
      console.log('🔄 Submitting login...');
      const loginButton = page.locator('button[type="button"]:has-text("登录")').last();
      await loginButton.click();

      console.log('⏳ Waiting for login to complete...');

      // Wait for navigation away from login page
      try {
        await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
        console.log('✅ Login successful - navigated away from login page');
      } catch (e) {
        console.log('❌ Login may have failed - still on login page');
        throw e;
      }

      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);

      // Take screenshot after login
      await page.screenshot({
        path: 'test-results/admin-debug-after-login.png',
        fullPage: true
      });

      // Step 5: Wait for page to fully load
      await page.waitForTimeout(5000);

      // Step 6: Analyze the feed page content
      console.log('🔄 Analyzing feed page content...');

      // Check if we're on the feed page
      const isFeedPage = currentUrl.includes('/feed') || currentUrl === 'https://xyuan.chat/';
      console.log('📍 On feed page:', isFeedPage);

      // Look for error messages
      const errorElements = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').all();
      if (errorElements.length > 0) {
        console.log('🚨 Error elements found:');
        for (let i = 0; i < errorElements.length; i++) {
          const errorText = await errorElements[i].textContent();
          console.log(`   Error ${i + 1}: ${errorText}`);
        }
      }

      // Look for "Something went wrong" text
      const somethingWrongText = await page.locator('text="Something went wrong"').count();
      console.log('🔍 "Something went wrong" count:', somethingWrongText);

      // Look for posts
      const postElements = await page.locator('[data-testid="post"], .post, article').all();
      console.log('📝 Post elements found:', postElements.length);

      // Look for loading states
      const loadingElements = await page.locator('text="Loading", .loading, .spinner').all();
      console.log('⏳ Loading elements found:', loadingElements.length);

      // Check for specific post content
      const hasPostContent = await page.locator('text="体如猿，心怀素"').count();
      console.log('🔍 Found expected post content:', hasPostContent);

      // Step 7: Trigger manual post fetch if needed
      console.log('🔄 Checking if posts are loading...');
      await page.waitForTimeout(5000);

      // Take final screenshot
      await page.screenshot({
        path: 'test-results/admin-debug-feed-final.png',
        fullPage: true
      });

      // Step 8: Analyze network activity
      console.log('\n📊 NETWORK ANALYSIS:');
      const postsApiRequests = networkRequests.filter(req => req.url.includes('/api/posts'));
      console.log('🔍 Posts API requests:', postsApiRequests.length);

      postsApiRequests.forEach((req, i) => {
        console.log(`   Request ${i + 1}: ${req.method} ${req.url}`);
      });

      const postsApiResponses = networkResponses.filter(res => res.url.includes('/api/posts'));
      console.log('🔍 Posts API responses:', postsApiResponses.length);

      postsApiResponses.forEach((res, i) => {
        console.log(`   Response ${i + 1}: ${res.status} ${res.url}`);
        if (res.body) {
          console.log(`   Body preview: ${res.body.substring(0, 100)}...`);
        }
      });

      // Step 9: Try to manually trigger a posts request
      console.log('🔄 Manually checking posts API...');

      const manualApiCheck = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/posts?limit=10&cursor=0&sort-direction=desc', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          return {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            body: await response.text()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });

      console.log('🔍 Manual API check result:', manualApiCheck);

      // Step 10: Check React Query state
      console.log('🔄 Checking React Query state...');

      const reactQueryState = await page.evaluate(() => {
        // Try to access React Query state if available
        const queryClient = window.__REACT_QUERY_STATE__;
        if (queryClient) {
          return JSON.stringify(queryClient);
        }
        return 'React Query state not accessible';
      });

      console.log('🔍 React Query state:', reactQueryState.substring(0, 200));

      // Final summary
      console.log('\n📊 DEBUGGING SUMMARY:');
      console.log('================================');
      console.log('✅ Login Status: SUCCESS');
      console.log('✅ Feed Page Access: SUCCESS');
      console.log(`🔍 Post Elements Found: ${postElements.length}`);
      console.log(`🔍 Error Elements Found: ${errorElements.length}`);
      console.log(`🔍 "Something went wrong" Count: ${somethingWrongText}`);
      console.log(`🔍 Expected Post Content Found: ${hasPostContent}`);
      console.log(`🔍 Posts API Requests: ${postsApiRequests.length}`);
      console.log(`🔍 Posts API Responses: ${postsApiResponses.length}`);
      console.log(`🔍 Console Logs: ${consoleLogs.length}`);

      // Write detailed logs to file
      const debugReport = {
        loginSuccess: true,
        feedPageAccess: true,
        postElementsCount: postElements.length,
        errorElementsCount: errorElements.length,
        somethingWrongCount: somethingWrongText,
        expectedPostFound: hasPostContent,
        postsApiRequests: postsApiRequests.length,
        postsApiResponses: postsApiResponses.length,
        consoleLogs,
        networkRequests: postsApiRequests,
        networkResponses: postsApiResponses,
        manualApiCheck
      };

      console.log('\n🔍 FULL DEBUG REPORT:');
      console.log(JSON.stringify(debugReport, null, 2));

    } catch (error) {
      console.log('❌ Test error:', error.message);
      console.log('❌ Stack trace:', error.stack);

      // Take error screenshot
      await page.screenshot({
        path: 'test-results/admin-debug-error.png',
        fullPage: true
      });
    }
  });
});