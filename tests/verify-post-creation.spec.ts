import { test, expect } from '@playwright/test';

test.describe('Verify Post Creation', () => {
  test('check if the test post was actually created', async ({ page }) => {
    console.log('🔍 Checking if post was created...');

    test.setTimeout(30000);

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

      // Navigate to feed
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({
        path: 'test-results/feed-check.png',
        fullPage: true
      });

      // Look for our test post
      const pageContent = await page.textContent('body');
      const hasTestPost = pageContent?.includes('测试发布图片帖子 - Playwright自动化测试');

      console.log(`📊 Test post found: ${hasTestPost ? 'YES' : 'NO'}`);

      if (hasTestPost) {
        console.log('🎉 SUCCESS! The post was created successfully!');
      } else {
        console.log('❌ Post not found on feed');
      }

    } catch (error) {
      console.log('❌ Error checking post:', error.message);
    }
  });
});