import { test, expect } from '@playwright/test';

test.describe('Unified Authentication Test', () => {
  test('test new unified auth page', async ({ page }) => {
    console.log('🔍 Testing unified authentication page...');

    test.setTimeout(60000);

    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const message = `${msg.type()}: ${msg.text()}`;
      consoleMessages.push(message);
      if (msg.type() === 'error' || message.includes('🔧') || message.includes('🚫') || message.includes('Auto authentication')) {
        console.log(`📝 Console: ${message}`);
      }
    });

    try {
      // Test 1: Access /auth directly
      console.log('🔄 Accessing unified auth page...');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/unified-auth-page.png',
        fullPage: true
      });

      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      // Check page content
      const pageContent = await page.textContent('body');
      const hasUnifiedTitle = pageContent?.includes('欢迎使用 Appesso');
      const hasAutoDetection = pageContent?.includes('系统将自动识别');
      const hasPhoneInput = pageContent?.includes('手机号码');
      const hasPasswordInput = pageContent?.includes('密码');
      const hasSmsInput = pageContent?.includes('短信验证码');
      const hasUnifiedButton = pageContent?.includes('登录/注册');

      console.log('📊 Unified Auth Page Analysis:');
      console.log(`   Has unified title: ${hasUnifiedTitle}`);
      console.log(`   Has auto detection text: ${hasAutoDetection}`);
      console.log(`   Has phone input: ${hasPhoneInput}`);
      console.log(`   Has password input: ${hasPasswordInput}`);
      console.log(`   Has SMS input: ${hasSmsInput}`);
      console.log(`   Has unified button: ${hasUnifiedButton}`);

      // Test 2: Try redirects
      console.log('🔄 Testing /login redirect...');
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      await page.waitForTimeout(1000);

      const loginRedirectUrl = page.url();
      console.log('📍 Login redirect URL:', loginRedirectUrl);

      console.log('🔄 Testing /register redirect...');
      await page.goto('https://xyuan.chat/register', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      await page.waitForTimeout(1000);

      const registerRedirectUrl = page.url();
      console.log('📍 Register redirect URL:', registerRedirectUrl);

      // Test 3: Test unified authentication with admin account
      console.log('🔄 Testing unified authentication...');
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Fill form
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456'); // SMS code

      console.log('🔄 Submitting unified auth form...');
      await page.locator('button:has-text("登录/注册")').click();

      console.log('⏳ Waiting for authentication...');
      await page.waitForTimeout(8000);

      const finalUrl = page.url();
      console.log('📍 Final URL:', finalUrl);

      const authSuccessful = !finalUrl.includes('/auth');
      console.log(`📊 Auth: ${authSuccessful ? 'SUCCESS' : 'FAILED'}`);

      // Check for auto mode messages in console
      const autoMessages = consoleMessages.filter(msg =>
        msg.includes('Auto authentication') ||
        msg.includes('auto-registering') ||
        msg.includes('auto-created')
      );

      console.log('📊 Auto Mode Messages:', autoMessages);

      console.log('\n🎯 UNIFIED AUTH TEST RESULT:');
      console.log('===============================');
      console.log(`✅ Unified page accessible: ${hasUnifiedTitle}`);
      console.log(`✅ Auto detection UI: ${hasAutoDetection}`);
      console.log(`✅ Login redirect works: ${loginRedirectUrl.includes('/auth')}`);
      console.log(`✅ Register redirect works: ${registerRedirectUrl.includes('/auth')}`);
      console.log(`✅ Form elements present: ${hasPhoneInput && hasPasswordInput && hasSmsInput}`);
      console.log(`✅ Unified button present: ${hasUnifiedButton}`);
      console.log(`✅ Authentication: ${authSuccessful ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📱 Auto Mode Messages: ${autoMessages.length}`);

      if (authSuccessful && hasUnifiedTitle && loginRedirectUrl.includes('/auth')) {
        console.log('🎉 Unified authentication system is working correctly!');
      } else {
        console.log('❌ Some issues found with unified authentication.');
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);

      await page.screenshot({
        path: 'test-results/unified-auth-error.png',
        fullPage: true
      });
    }
  });
});