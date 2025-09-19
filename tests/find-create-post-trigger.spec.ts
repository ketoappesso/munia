import { test, expect } from '@playwright/test';

test.describe('Find Create Post Trigger', () => {
  test('search for any way to create a post', async ({ page }) => {
    console.log('🔍 Searching for create post trigger...');

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

      // Navigate to feed
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);

      // Take screenshot of feed
      await page.screenshot({
        path: 'test-results/feed-search.png',
        fullPage: true
      });

      // Search for any text inputs
      const textInputs = await page.locator('input, textarea').all();
      console.log(`📊 Found ${textInputs.length} text inputs`);

      for (let i = 0; i < textInputs.length; i++) {
        const input = textInputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const type = await input.getAttribute('type');
        const isVisible = await input.isVisible();
        console.log(`📝 Input ${i}: type="${type}", placeholder="${placeholder}", visible=${isVisible}`);
      }

      // Search for clickable elements that might trigger post creation
      const clickableSelectors = [
        '[placeholder*="想到"]',
        '[placeholder*="说啥"]',
        '[placeholder*="发布"]',
        '[placeholder*="说些"]',
        'button:has-text("发布")',
        'button:has-text("创建")',
        'button:has-text("写")',
        'button:has-text("+")',
        '.create',
        '.post',
        '.write',
        '.add',
        '[data-testid*="create"]',
        '[data-testid*="post"]',
        '[aria-label*="创建"]',
        '[aria-label*="发布"]',
        '[aria-label*="写"]'
      ];

      for (const selector of clickableSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            console.log(`✅ Found potential trigger: "${selector}" (${count} matches)`);
            const element = page.locator(selector).first();
            const text = await element.textContent();
            const isVisible = await element.isVisible();
            console.log(`   Text: "${text}", Visible: ${isVisible}`);
          }
        } catch (e) {
          // Ignore selector errors
        }
      }

      // Check if there's a floating action button or similar
      const floatingButtons = await page.locator('button[style*="position"], .fixed, .absolute').all();
      console.log(`🎯 Found ${floatingButtons.length} positioned buttons`);

      // Try scrolling to see if post creation appears
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'test-results/top-of-feed.png',
        fullPage: false
      });

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});