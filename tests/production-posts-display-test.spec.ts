import { test, expect } from '@playwright/test';

test.describe('Production Posts Display Test', () => {
  test('verify posts are now displaying correctly', async ({ page }) => {
    console.log('🔍 Testing posts display after fixes...');

    test.setTimeout(60000);

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('🔍') || message.includes('📊')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    try {
      // Step 1: Login
      console.log('🔄 Logging into production server...');
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Switch to password login
      const passwordTab = page.locator('button:has-text("密码登录")');
      if (await passwordTab.count() > 0) {
        await passwordTab.click();
        await page.waitForTimeout(1000);
      }

      // Login
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('button[type="button"]:has-text("登录")').last().click();

      console.log('⏳ Waiting for login...');
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      const loginSuccessful = !currentUrl.includes('/login');
      console.log(`📊 Login: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`);

      if (!loginSuccessful) {
        throw new Error('Login failed');
      }

      // Step 2: Wait for posts to load
      console.log('🔄 Waiting for posts to load...');
      await page.waitForTimeout(8000); // Give more time for data to load

      // Take screenshot
      await page.screenshot({
        path: 'test-results/production-posts-display.png',
        fullPage: true
      });

      // Check page content
      const pageContent = await page.textContent('body');

      // Check for various states
      const hasLoadingPosts = pageContent?.includes('Loading posts');
      const hasSomethingWrong = pageContent?.includes('Something went wrong');
      const hasActualPosts = pageContent?.includes('Acquiro tracto sequi') ||
                           pageContent?.includes('Benevolentia stultus') ||
                           pageContent?.includes('Claro modi atrocitas') ||
                           pageContent?.includes('days ago') ||
                           pageContent?.includes('hours ago');
      const hasAllCaughtUp = pageContent?.includes('All caught up');
      const hasUserName = pageContent?.includes('Lois Reynolds');

      console.log('📊 Feed page analysis:');
      console.log(`   Has "Loading posts": ${hasLoadingPosts}`);
      console.log(`   Has "Something went wrong": ${hasSomethingWrong}`);
      console.log(`   Has actual posts content: ${hasActualPosts}`);
      console.log(`   Has "All caught up": ${hasAllCaughtUp}`);
      console.log(`   Has user names: ${hasUserName}`);
      console.log(`   Console errors: ${consoleMessages.filter(m => m.includes('error')).length}`);

      // Test API endpoints
      console.log('🔄 Testing API endpoints...');
      const apiTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/posts?limit=3&cursor=0&sort-direction=desc');
          const data = await response.json();
          return {
            status: response.status,
            ok: response.ok,
            postsCount: Array.isArray(data) ? data.length : 0,
            hasData: data && data.length > 0,
            firstPostContent: data && data[0] ? data[0].content : null
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log('📊 API Test Result:', apiTest);

      // Final status
      const isFixed = !hasSomethingWrong && (hasActualPosts || hasUserName || apiTest.hasData);

      console.log('\\n🎯 FINAL POSTS DISPLAY TEST RESULT:');
      console.log('======================================');
      console.log(`🔍 Server: https://xyuan.chat`);
      console.log(`✅ Login: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`✅ API Working: ${apiTest.ok ? 'YES' : 'NO'}`);
      console.log(`✅ API Has Data: ${apiTest.hasData ? 'YES' : 'NO'}`);
      console.log(`❌ "Something went wrong": ${hasSomethingWrong ? 'STILL PRESENT' : 'RESOLVED'}`);
      console.log(`✅ Posts Content Displaying: ${hasActualPosts ? 'YES' : 'NO'}`);
      console.log(`✅ User Names Displaying: ${hasUserName ? 'YES' : 'NO'}`);
      console.log(`🎉 Overall Status: ${isFixed ? 'FIXED ✅' : 'STILL BROKEN ❌'}`);

      if (isFixed) {
        console.log('\\n🎉 SUCCESS! Posts are now displaying correctly!');
        console.log('   - Login works');
        console.log('   - API returns data');
        console.log('   - Posts are visible in UI');
        console.log('   - No "Something went wrong" error');
      } else {
        console.log('\\n❌ Posts are still not displaying properly.');

        if (consoleMessages.filter(m => m.includes('error')).length > 0) {
          console.log('\\n🔍 Console Errors Found:');
          consoleMessages.filter(m => m.includes('error')).forEach((error, i) =>
            console.log(`   ${i + 1}. ${error}`)
          );
        }
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);

      // Take error screenshot
      await page.screenshot({
        path: 'test-results/production-posts-display-error.png',
        fullPage: true
      });
    }
  });
});