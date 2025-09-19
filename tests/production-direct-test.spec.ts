import { test, expect } from '@playwright/test';

test.describe('Production Direct Access Test', () => {
  test('test direct access to feed page', async ({ page }) => {
    console.log('🔍 Testing direct access to production feed...');

    test.setTimeout(60000);

    // Capture all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('🔍') || message.includes('📊')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    try {
      // Go directly to feed page
      console.log('🔄 Accessing feed page directly...');
      await page.goto('https://xyuan.chat/feed', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(8000);

      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/production-direct-access.png',
        fullPage: true
      });

      // Get page content
      const pageContent = await page.textContent('body');

      console.log('📄 Page content analysis:');
      console.log('   Contains "Loading posts":', pageContent?.includes('Loading posts') || false);
      console.log('   Contains "Something went wrong":', pageContent?.includes('Something went wrong') || false);
      console.log('   Contains posts content:', pageContent?.includes('days ago') || pageContent?.includes('Keto') || false);
      console.log('   Contains login redirect:', currentUrl.includes('/login'));

      // Test API access from the page
      const apiResult = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/posts?limit=2&cursor=0&sort-direction=desc');
          return {
            status: response.status,
            ok: response.ok,
            data: response.ok ? await response.text() : 'Error response'
          };
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log('📊 API Access Test:', {
        status: apiResult.status,
        ok: apiResult.ok,
        hasData: apiResult.data && apiResult.data.length > 10
      });

      // Check for specific error patterns
      const errorPatterns = [
        'Something went wrong',
        'Loading posts',
        'Prisma',
        'lastActivityAt',
        'Error:'
      ];

      const foundErrors = errorPatterns.filter(pattern =>
        pageContent?.includes(pattern) ||
        consoleMessages.some(msg => msg.includes(pattern))
      );

      console.log('\n📊 PRODUCTION DIRECT ACCESS RESULT:');
      console.log('====================================');
      console.log('🔍 Direct feed access:', !currentUrl.includes('/login') ? 'SUCCESS' : 'REDIRECTED TO LOGIN');
      console.log('🔍 API Status:', apiResult.ok ? 'WORKING' : 'ERROR');
      console.log('🔍 Found Error Patterns:', foundErrors.length > 0 ? foundErrors.join(', ') : 'None');
      console.log('🔍 Console Messages:', consoleMessages.length);

      if (foundErrors.length === 0 && apiResult.ok) {
        console.log('🎉 Production server appears to be working correctly!');
      } else {
        console.log('❌ Issues found:', foundErrors);
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});