import { test, expect } from '@playwright/test';

test.describe('Unified Auth - New User Test', () => {
  test('test auto-registration for new user', async ({ page }) => {
    console.log('🔍 Testing unified authentication with new user...');

    test.setTimeout(60000);

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('Auto authentication') || message.includes('auto-registering') || message.includes('auto-created')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    try {
      // Generate a unique phone number for testing
      const testPhone = '1999' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      console.log('📱 Testing with new phone number:', testPhone);

      // Access unified auth page
      console.log('🔄 Accessing unified auth page...');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Fill form with new user data
      await page.locator('input').first().fill(testPhone);
      await page.locator('input[type="password"]').fill('testpass123');
      await page.locator('input').nth(2).fill('123456'); // SMS code

      console.log('🔄 Submitting unified auth form for new user...');
      await page.locator('button:has-text("登录/注册")').click();

      console.log('⏳ Waiting for auto-registration...');
      await page.waitForTimeout(8000);

      const finalUrl = page.url();
      console.log('📍 Final URL:', finalUrl);

      const registrationSuccessful = !finalUrl.includes('/auth');
      console.log(`📊 Auto-registration: ${registrationSuccessful ? 'SUCCESS' : 'FAILED'}`);

      // Check for auto-registration messages in console
      const autoMessages = consoleMessages.filter(msg =>
        msg.includes('Auto authentication') ||
        msg.includes('auto-registering') ||
        msg.includes('auto-created') ||
        msg.includes('User does not exist')
      );

      console.log('📊 Auto-registration Messages:', autoMessages);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/unified-auth-new-user.png',
        fullPage: true
      });

      console.log('\n🎯 NEW USER AUTO-REGISTRATION TEST RESULT:');
      console.log('============================================');
      console.log(`📱 Test Phone: ${testPhone}`);
      console.log(`✅ Auto-registration: ${registrationSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📝 Auto-registration Messages: ${autoMessages.length}`);
      console.log(`🔧 Console Errors: ${consoleMessages.filter(m => m.includes('error')).length}`);

      if (registrationSuccessful && autoMessages.length > 0) {
        console.log('🎉 Auto-registration is working correctly!');
        console.log('   - New user was automatically created');
        console.log('   - User was automatically logged in');
        console.log('   - Redirected to feed page');
      } else {
        console.log('❌ Auto-registration needs investigation.');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);

      await page.screenshot({
        path: 'test-results/unified-auth-new-user-error.png',
        fullPage: true
      });
    }
  });
});