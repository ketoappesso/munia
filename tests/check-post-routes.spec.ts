import { test, expect } from '@playwright/test';

test.describe('Check Post Routes and Permissions', () => {
  test('explore different ways to access post creation', async ({ page }) => {
    console.log('🔍 Checking post creation routes and permissions...');

    test.setTimeout(60000);

    try {
      // Login first
      await page.goto('https://xyuan.chat/auth', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await page.waitForTimeout(2000);

      // Fill login form
      await page.locator('input').first().fill('18874748888');
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456');

      await page.locator('button:has-text("登录/注册")').click();
      await page.waitForTimeout(5000);

      // Check user profile/permissions by going to profile
      console.log('📱 Checking user profile...');
      await page.goto('https://xyuan.chat/profile');
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/user-profile.png',
        fullPage: true
      });

      const profileContent = await page.textContent('body');
      console.log(`👤 Profile includes "admin": ${profileContent?.includes('admin') || profileContent?.includes('Admin')}`);
      console.log(`👤 Profile includes "create": ${profileContent?.includes('create') || profileContent?.includes('创建')}`);

      // Try direct routes to post creation
      const routesToTry = [
        '/create',
        '/post/create',
        '/posts/create',
        '/new-post',
        '/write',
        '/compose'
      ];

      for (const route of routesToTry) {
        try {
          console.log(`🔗 Trying route: ${route}`);
          await page.goto(`https://xyuan.chat${route}`, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          const currentUrl = page.url();
          console.log(`   Result URL: ${currentUrl}`);

          if (!currentUrl.includes('/auth') && !currentUrl.includes('/404')) {
            console.log(`   ✅ Route ${route} is accessible!`);
            await page.screenshot({
              path: `test-results/route-${route.replace('/', '')}.png`,
              fullPage: true
            });
          }
        } catch (e) {
          console.log(`   ❌ Route ${route} failed: ${e.message}`);
        }
      }

      // Try with a different admin account
      console.log('🔄 Trying with different account (admin)...');
      await page.goto('https://xyuan.chat/auth');
      await page.waitForTimeout(2000);

      // Try with admin account if we know one
      await page.locator('input').first().fill('13374743333'); // Try the first number from posts
      await page.locator('input[type="password"]').fill('123456');
      await page.locator('input').nth(2).fill('123456');

      await page.locator('button:has-text("登录/注册")').click();
      await page.waitForTimeout(5000);

      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'test-results/admin-feed.png',
        fullPage: true
      });

      // Check if admin account has post creation UI
      const adminInputs = await page.locator('input, textarea').all();
      console.log(`📊 Admin account found ${adminInputs.length} text inputs`);

      for (let i = 0; i < adminInputs.length; i++) {
        const input = adminInputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const isVisible = await input.isVisible();
        if (placeholder && isVisible) {
          console.log(`📝 Admin Input ${i}: placeholder="${placeholder}"`);
        }
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});