import { test, expect } from '@playwright/test';

test.describe('Localhost Debug Test', () => {
  test('verify debug logs on localhost', async ({ page }) => {
    console.log('🔍 Testing localhost with debug logs...');

    test.setTimeout(60000);

    // Capture console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleLogs.push(message);
      if (message.includes('🔥') || message.includes('🎯') || message.includes('🚀')) {
        console.log(`🖥️  Console: ${message}`);
      }
    });

    try {
      // Navigate to localhost feed page
      console.log('🔄 Navigating to localhost...');
      await page.goto('http://localhost:3002/feed', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(5000);

      const url = page.url();
      console.log('📍 Current URL:', url);

      // Check for our debug logs
      const debugLogs = consoleLogs.filter(log =>
        log.includes('🔥') || log.includes('🎯') || log.includes('🚀')
      );

      console.log('🔍 Debug logs found:', debugLogs.length);
      debugLogs.forEach(log => console.log('   ', log));

      // Check page content
      const pageText = await page.textContent('body');
      console.log('📄 Page content preview:', pageText?.substring(0, 200));

      // Take screenshot
      await page.screenshot({
        path: 'test-results/localhost-debug.png',
        fullPage: true
      });

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});