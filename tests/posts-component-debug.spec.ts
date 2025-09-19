import { test, expect } from '@playwright/test';

test.describe('Posts Component Debug', () => {
  test('debug Posts component initialization', async ({ page }) => {
    console.log('🔍 Debugging Posts component initialization...');

    test.setTimeout(60000);

    // Capture console errors specifically
    const consoleErrors = [];
    const consoleWarnings = [];
    const consoleLogs = [];

    page.on('console', msg => {
      const message = msg.text();
      const type = msg.type();

      if (type === 'error') {
        consoleErrors.push(message);
        console.log(`❌ Console Error: ${message}`);
      } else if (type === 'warning') {
        consoleWarnings.push(message);
        console.log(`⚠️  Console Warning: ${message}`);
      } else if (type === 'log' && (message.includes('🔍') || message.includes('📊') || message.includes('Fetching'))) {
        consoleLogs.push(message);
        console.log(`📝 Console Log: ${message}`);
      }
    });

    // Track network requests to posts API
    const postsApiRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/posts')) {
        postsApiRequests.push({
          url: request.url(),
          method: request.method()
        });
        console.log(`📤 Posts API Request: ${request.method()} ${request.url()}`);
      }
    });

    // Track network responses from posts API
    const postsApiResponses = [];
    page.on('response', async response => {
      if (response.url().includes('/api/posts')) {
        try {
          const body = await response.text();
          postsApiResponses.push({
            url: response.url(),
            status: response.status(),
            body: body.substring(0, 200)
          });
          console.log(`📥 Posts API Response: ${response.status()} ${response.url()}`);
          console.log(`📄 Body preview: ${body.substring(0, 100)}...`);
        } catch (e) {
          console.log(`❌ Could not read response body: ${e.message}`);
        }
      }
    });

    try {
      // Step 1: Go directly to login
      console.log('🔄 Going to login page...');
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Switch to password mode
      const passwordTab = page.locator('button:has-text("密码登录")');
      if (await passwordTab.count() > 0) {
        await passwordTab.click();
        await page.waitForTimeout(1000);
      }

      // Quick login
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('button[type="button"]:has-text("登录")').last().click();

      // Wait for redirect
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });

      console.log('✅ Logged in successfully');

      // Step 2: Wait for feed page to fully load
      await page.waitForTimeout(5000);

      console.log('🔄 Analyzing Posts component state...');

      // Step 3: Check for Posts component in DOM
      const postsComponentExists = await page.evaluate(() => {
        // Look for Posts component elements
        const postsContainer = document.querySelector('[class*="flex flex-col"]');
        const gridContainer = document.querySelector('[class*="grid grid-cols-1"]');
        const postElements = document.querySelectorAll('[data-testid="post"], .post, article');
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');

        return {
          postsContainer: !!postsContainer,
          gridContainer: !!gridContainer,
          postElementsCount: postElements.length,
          loadingElementsCount: loadingElements.length,
          bodyText: document.body.textContent?.substring(0, 500) || ''
        };
      });

      console.log('🔍 Posts component analysis:', postsComponentExists);

      // Step 4: Check if React Query is working
      const reactQueryStatus = await page.evaluate(() => {
        // Try to trigger a manual query
        if (window.fetch) {
          return 'Fetch available';
        }
        return 'Fetch not available';
      });

      console.log('🔍 React Query status:', reactQueryStatus);

      // Step 5: Wait for potential lazy loading
      console.log('⏳ Waiting for potential lazy loading...');
      await page.waitForTimeout(10000);

      // Step 6: Check again for posts
      const finalCheck = await page.evaluate(() => {
        const postElements = document.querySelectorAll('[data-testid="post"], .post, article, [class*="post"]');
        const errorElements = document.querySelectorAll('[role="alert"], .error, [class*="error"]');
        const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');

        return {
          postElementsCount: postElements.length,
          errorElementsCount: errorElements.length,
          loadingElementsCount: loadingElements.length,
          hasGenericLoading: !!document.querySelector('*:contains("Loading posts")'),
          hasSomethingWrong: !!document.querySelector('*:contains("Something went wrong")')
        };
      });

      console.log('🔍 Final component check:', finalCheck);

      // Step 7: Force trigger posts API call manually
      console.log('🔄 Manually triggering posts API...');
      const manualApiResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/posts?limit=10&cursor=0&sort-direction=desc', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });

          const data = await response.json();
          return {
            success: true,
            status: response.status,
            postsCount: data.length,
            firstPostContent: data[0]?.content || 'No content'
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      console.log('🔍 Manual API result:', manualApiResult);

      // Final summary
      console.log('\n📊 POSTS COMPONENT DEBUG SUMMARY:');
      console.log('=======================================');
      console.log(`🔍 Console Errors: ${consoleErrors.length}`);
      console.log(`🔍 Console Warnings: ${consoleWarnings.length}`);
      console.log(`🔍 Console Logs: ${consoleLogs.length}`);
      console.log(`🔍 Posts API Requests: ${postsApiRequests.length}`);
      console.log(`🔍 Posts API Responses: ${postsApiResponses.length}`);
      console.log(`🔍 Posts Component Exists: ${postsComponentExists.postsContainer}`);
      console.log(`🔍 Post Elements Found: ${finalCheck.postElementsCount}`);
      console.log(`🔍 Error Elements Found: ${finalCheck.errorElementsCount}`);
      console.log(`🔍 Loading Elements Found: ${finalCheck.loadingElementsCount}`);
      console.log(`🔍 Manual API Success: ${manualApiResult.success}`);

      if (consoleErrors.length > 0) {
        console.log('\n❌ CONSOLE ERRORS:');
        consoleErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
      }

      if (postsApiRequests.length === 0) {
        console.log('\n❌ ISSUE FOUND: Posts component is not making API requests!');
        console.log('   This suggests the useInfiniteQuery hook is not executing.');
        console.log('   Possible causes:');
        console.log('   1. React Query provider not properly initialized');
        console.log('   2. Posts component not rendering');
        console.log('   3. Conditional rendering preventing Posts from mounting');
        console.log('   4. JavaScript error preventing execution');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});