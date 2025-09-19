import { test, expect } from '@playwright/test';

test.describe('Debug Submit Button', () => {
  test('inspect the submit button DOM structure', async ({ page }) => {
    console.log('🔍 Debugging submit button...');

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

      // Click image/video button to open modal
      const imageVideoButton = page.locator('button:has-text("图片"), button:has-text("视频"), [aria-label*="图片"]').first();
      if (await imageVideoButton.count() > 0) {
        await imageVideoButton.click();
        await page.waitForTimeout(2000);
      }

      // Take screenshot of modal
      await page.screenshot({
        path: 'test-results/debug-modal.png',
        fullPage: true
      });

      // Get all buttons in the modal and inspect them
      const allButtons = await page.locator('button').all();
      console.log(`📊 Found ${allButtons.length} buttons total`);

      for (let i = 0; i < allButtons.length; i++) {
        const button = allButtons[i];
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        if (text && text.trim()) {
          console.log(`🔘 Button ${i}: "${text.trim()}" (visible: ${isVisible})`);
        }
      }

      // Try different ways to find the submit button
      const submitSelectors = [
        'button:has-text("发站")',
        'button[text="发站"]',
        'button:contains("发站")',
        '[role="dialog"] button:has-text("发站")',
        '.modal button:has-text("发站")',
        'button >> text="发站"',
        'button >> text=/发站/',
        'button:text-is("发站")'
      ];

      for (const selector of submitSelectors) {
        try {
          const count = await page.locator(selector).count();
          console.log(`🔍 Selector "${selector}": found ${count} matches`);
          if (count > 0) {
            const text = await page.locator(selector).first().textContent();
            console.log(`   ✅ Text content: "${text}"`);
          }
        } catch (e) {
          console.log(`   ❌ Selector failed: ${e.message}`);
        }
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});