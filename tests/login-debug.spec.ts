import { test, expect } from '@playwright/test';

test.describe('Login Debug Test', () => {
  test('debug admin login 18874748888', async ({ page }) => {
    console.log('🔍 Starting login debug test...');

    test.setTimeout(60000);

    try {
      // Navigate to login page
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      console.log('✅ Login page loaded:', page.url());

      // Take screenshot of login page
      await page.screenshot({
        path: 'test-results/login-page-debug.png',
        fullPage: true
      });

      // Get detailed form information
      const formInfo = await page.evaluate(() => {
        const form = document.querySelector('form');
        const inputs = Array.from(document.querySelectorAll('input'));
        const buttons = Array.from(document.querySelectorAll('button'));

        return {
          pageTitle: document.title,
          pageUrl: window.location.href,
          hasForm: !!form,
          formHTML: form?.outerHTML || 'No form found',
          inputCount: inputs.length,
          buttonCount: buttons.length,
          inputs: inputs.map((input, index) => ({
            index,
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            id: input.id,
            className: input.className,
            value: input.value,
            required: input.required,
            disabled: input.disabled,
            outerHTML: input.outerHTML
          })),
          buttons: buttons.map((button, index) => ({
            index,
            type: button.type,
            textContent: button.textContent?.trim(),
            className: button.className,
            disabled: button.disabled,
            outerHTML: button.outerHTML
          })),
          bodyText: document.body.innerText.substring(0, 500)
        };
      });

      console.log('📋 Page Information:');
      console.log('   Title:', formInfo.pageTitle);
      console.log('   URL:', formInfo.pageUrl);
      console.log('   Has Form:', formInfo.hasForm);
      console.log('   Input Count:', formInfo.inputCount);
      console.log('   Button Count:', formInfo.buttonCount);

      console.log('\n📝 Inputs Details:');
      formInfo.inputs.forEach((input, i) => {
        console.log(`   Input ${i + 1}:`, {
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id,
          required: input.required,
          disabled: input.disabled
        });
      });

      console.log('\n🔘 Buttons Details:');
      formInfo.buttons.forEach((button, i) => {
        console.log(`   Button ${i + 1}:`, {
          type: button.type,
          text: button.textContent,
          disabled: button.disabled
        });
      });

      // Try to fill the login form with multiple strategies
      console.log('\n🔐 Attempting login with phone 18874748888...');

      let loginAttempted = false;
      let loginError = null;

      // Strategy 1: Try by input index (most likely to work)
      try {
        console.log('🔄 Strategy 1: Fill by input index...');

        // Fill first input (phone)
        await page.fill('input:nth-of-type(1)', '18874748888');
        console.log('   ✅ Phone filled in first input');

        // Fill second input (password)
        await page.fill('input:nth-of-type(2)', '123456');
        console.log('   ✅ Password filled in second input');

        // Click login button (look for "登录" text)
        await page.click('button:has-text("登录")');
        console.log('   ✅ Login button clicked');

        loginAttempted = true;

        // Wait for navigation or error
        await page.waitForTimeout(3000);

        const currentUrl = page.url();
        console.log('   📍 Current URL after login attempt:', currentUrl);

        if (currentUrl !== 'https://xyuan.chat/login' && !currentUrl.includes('/login')) {
          console.log('   🎉 Login appears successful - redirected away from login page');
        } else {
          console.log('   ❌ Still on login page - login may have failed');

          // Check for error messages
          const errorMessages = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive');
            return Array.from(errorElements).map(el => el.textContent?.trim()).filter(text => text);
          });

          if (errorMessages.length > 0) {
            console.log('   🚨 Error messages found:', errorMessages);
            loginError = errorMessages.join(', ');
          } else {
            console.log('   ⚠️  No specific error messages found');
          }
        }

      } catch (error1) {
        console.log('   ❌ Strategy 1 failed:', error1.message);
        loginError = error1.message;

        // Strategy 2: Try by React Aria IDs
        try {
          console.log('🔄 Strategy 2: Fill by React Aria IDs...');

          // Use the specific IDs we found
          if (formInfo.inputs.length >= 2) {
            const phoneId = formInfo.inputs[0].id;
            const passwordId = formInfo.inputs[1].id;

            if (phoneId) {
              await page.fill(`#${phoneId}`, '18874748888');
              console.log('   ✅ Phone filled using ID:', phoneId);
            }

            if (passwordId) {
              await page.fill(`#${passwordId}`, '123456');
              console.log('   ✅ Password filled using ID:', passwordId);
            }

            await page.click('button:has-text("登录")');
            console.log('   ✅ Login button clicked');

            loginAttempted = true;

            await page.waitForTimeout(3000);
            const currentUrl2 = page.url();
            console.log('   📍 Current URL after strategy 2:', currentUrl2);

            if (currentUrl2 !== 'https://xyuan.chat/login') {
              console.log('   🎉 Strategy 2 successful - redirected');
            } else {
              console.log('   ❌ Strategy 2 failed - still on login page');
            }
          }

        } catch (error2) {
          console.log('   ❌ Strategy 2 failed:', error2.message);
          loginError = error2.message;
        }
      }

      // Take screenshot after login attempt
      await page.screenshot({
        path: 'test-results/after-login-attempt.png',
        fullPage: true
      });

      // Final status check
      const finalUrl = page.url();
      const isLoggedIn = !finalUrl.includes('/login');

      console.log('\n📊 Login Test Summary:');
      console.log('   Login Attempted:', loginAttempted);
      console.log('   Final URL:', finalUrl);
      console.log('   Appears Logged In:', isLoggedIn);
      console.log('   Login Error:', loginError || 'None');

      // Check for any network errors in console
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text());
        }
      });

      console.log('\n🌐 Console Errors:', consoleLogs.length > 0 ? consoleLogs : 'None');

      if (!isLoggedIn && loginAttempted) {
        console.log('\n❌ LOGIN FAILED - DIAGNOSIS:');
        console.log('   1. Phone number 18874748888 was entered');
        console.log('   2. Password 123456 was entered');
        console.log('   3. Login button was clicked');
        console.log('   4. User was not redirected away from login page');
        console.log('   5. Possible causes:');
        console.log('      - Invalid credentials');
        console.log('      - Account disabled');
        console.log('      - Server-side validation error');
        console.log('      - JavaScript error preventing form submission');

        if (loginError) {
          console.log('   6. Error message:', loginError);
        }
      }

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});