import { test, expect } from '@playwright/test';

test.describe('Session Debug Test', () => {
  test('debug session and authentication flow', async ({ page }) => {
    console.log('🎯 Testing session authentication debug');

    test.setTimeout(120000);

    try {
      // Login with admin account
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);
      await page.locator('input').first().fill('13374743333');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456');
      await page.locator('button:has-text("登录/注册")').click();
      await page.waitForTimeout(5000);

      // Navigate to feed to ensure session is active
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);

      console.log('🔍 Debugging session state...');

      // Get all cookies and session info
      const sessionDebugInfo = await page.evaluate(async () => {
        // Check NextAuth session
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const sessionData = await sessionResponse.json();

        // Check server user endpoint
        const serverUserResponse = await fetch('/api/debug/server-user', {
          credentials: 'include'
        }).catch(() => ({ ok: false, status: 404, statusText: 'Endpoint not found' }));

        return {
          sessionData: sessionData,
          sessionStatus: sessionResponse.status,
          cookies: document.cookie,
          serverUserStatus: serverUserResponse.ok ? 'available' : 'not available',
          userAgent: navigator.userAgent,
          currentUrl: window.location.href
        };
      });

      console.log('📊 Session debug info:', sessionDebugInfo);

      // Check what cookies are available
      const allCookies = await page.context().cookies();
      console.log('📊 Browser cookies:', allCookies.map(c => ({
        name: c.name,
        value: c.value.substring(0, 30) + '...',
        domain: c.domain,
        path: c.path,
        httpOnly: c.httpOnly,
        secure: c.secure
      })));

      // Try direct API call with detailed error logging
      console.log('🔄 Testing direct API call...');

      const apiResult = await page.evaluate(async () => {
        try {
          // Create test data
          const formData = new FormData();
          formData.append('content', 'Session debug test post');

          console.log('📡 Making POST request to /api/posts...');

          const response = await fetch('/api/posts', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          const responseText = await response.text();
          console.log('📡 Response status:', response.status);
          console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
          console.log('📡 Response text:', responseText);

          return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            responseText: responseText,
            headers: Object.fromEntries(response.headers.entries())
          };

        } catch (error) {
          console.error('API call error:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });

      console.log('📊 API result:', apiResult);

      // Also test the session endpoint directly
      const sessionCheck = await page.evaluate(async () => {
        const sessionResponse = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const sessionData = await sessionResponse.json();
        return {
          sessionValid: !!sessionData.user,
          sessionUser: sessionData.user,
          sessionExpires: sessionData.expires
        };
      });

      console.log('📊 Session check:', sessionCheck);

      await page.screenshot({
        path: 'test-results/session-debug-test.png',
        fullPage: true
      });

    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  });
});