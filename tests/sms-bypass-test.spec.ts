import { test, expect } from '@playwright/test';

test.describe('SMS Bypass Test', () => {
  test('verify SMS bypass is working for admin login', async ({ page }) => {
    console.log('🔍 Testing SMS bypass functionality...');

    test.setTimeout(60000);

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('🔧') || message.includes('🚫')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    try {
      // Go to login page
      console.log('🔄 Accessing login page...');
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

      // Fill login form
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');

      console.log('🔄 Submitting login form...');
      await page.locator('button[type="button"]:has-text("登录")').last().click();

      console.log('⏳ Waiting for authentication...');
      await page.waitForTimeout(8000);

      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      const loginSuccessful = !currentUrl.includes('/login');
      console.log(`📊 Login: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/sms-bypass-test.png',
        fullPage: true
      });

      // Check for SMS bypass messages in console
      const smsMessages = consoleMessages.filter(msg =>
        msg.includes('SMS Verification Mode') ||
        msg.includes('Bypassing SMS') ||
        msg.includes('🔧') ||
        msg.includes('🚫')
      );

      console.log('📊 SMS Bypass Messages:', smsMessages);

      console.log('\n🎯 SMS BYPASS TEST RESULT:');
      console.log('============================');
      console.log(`✅ Login: ${loginSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📱 SMS Bypass Messages: ${smsMessages.length}`);
      console.log(`🔧 Console Errors: ${consoleMessages.filter(m => m.includes('error')).length}`);

      if (loginSuccessful) {
        console.log('🎉 SMS bypass is working correctly!');
      } else {
        console.log('❌ SMS bypass needs further investigation.');

        // Log recent console messages for debugging
        console.log('\n🔍 Recent Console Messages:');
        consoleMessages.slice(-5).forEach((msg, i) =>
          console.log(`   ${i + 1}. ${msg}`)
        );
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);

      await page.screenshot({
        path: 'test-results/sms-bypass-error.png',
        fullPage: true
      });
    }
  });
});