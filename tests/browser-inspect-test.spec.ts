import { test, expect } from '@playwright/test';

test.describe('Browser DOM Inspection Test', () => {
  test('inspect the actual DOM structure of the modal', async ({ page }) => {
    console.log('🔍 Inspecting DOM structure in real-time...');

    test.setTimeout(120000);

    try {
      // Login and setup
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

      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(5000);

      // Open modal
      const createTextArea = page.locator('text="想到啥说啥"').first();
      await createTextArea.click();
      await page.waitForTimeout(3000);

      // Fill content and upload image
      const modalTextInput = page.locator('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]').first();
      await modalTextInput.fill('DOM inspection test');

      const testImageContent = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
      const imageBuffer = Buffer.from(testImageContent.split(',')[1], 'base64');
      const tempImagePath = '/tmp/inspect-test-image.png';
      require('fs').writeFileSync(tempImagePath, imageBuffer);

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tempImagePath);
      await page.waitForTimeout(3000);

      console.log('📊 Inspecting modal DOM structure...');

      // Get the full HTML of the modal
      const modalHTML = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]') ||
                     document.querySelector('.modal') ||
                     document.querySelector('div:has-text("创建帖子")');
        return modal ? modal.outerHTML : 'Modal not found';
      });

      console.log('📋 Modal HTML structure:');
      console.log(modalHTML);

      // Find all buttons in the modal
      const buttonInfo = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map((btn, index) => ({
          index,
          text: btn.textContent?.trim() || '',
          className: btn.className,
          id: btn.id,
          style: btn.getAttribute('style') || '',
          visible: btn.offsetParent !== null,
          rect: btn.getBoundingClientRect()
        })).filter(btn => btn.visible && btn.rect.width > 0);
      });

      console.log('🔘 All visible buttons:');
      buttonInfo.forEach(btn => {
        console.log(`  ${btn.index}: "${btn.text}" | class="${btn.className}" | id="${btn.id}" | rect=(${Math.round(btn.rect.x)},${Math.round(btn.rect.y)},${Math.round(btn.rect.width)}x${Math.round(btn.rect.height)})`);
      });

      // Look specifically for buttons containing "发站"
      const submitButtons = buttonInfo.filter(btn =>
        btn.text.includes('发站') ||
        btn.text.includes('发布') ||
        btn.text.includes('提交') ||
        btn.className.includes('submit') ||
        btn.className.includes('primary')
      );

      console.log('🎯 Potential submit buttons:');
      submitButtons.forEach(btn => {
        console.log(`  SUBMIT: "${btn.text}" at (${Math.round(btn.rect.x)},${Math.round(btn.rect.y)}) | class="${btn.className}"`);
      });

      // Try clicking each potential submit button
      for (const btnInfo of submitButtons) {
        console.log(`🔄 Attempting to click: "${btnInfo.text}"`);

        try {
          await page.mouse.click(
            btnInfo.rect.x + btnInfo.rect.width / 2,
            btnInfo.rect.y + btnInfo.rect.height / 2
          );
          await page.waitForTimeout(2000);

          console.log(`✅ Clicked "${btnInfo.text}" successfully`);
          break;
        } catch (e) {
          console.log(`❌ Failed to click "${btnInfo.text}": ${e.message}`);
        }
      }

      await page.screenshot({
        path: 'test-results/dom-inspection-result.png',
        fullPage: true
      });

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
});