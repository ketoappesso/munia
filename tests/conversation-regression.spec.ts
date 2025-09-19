import { test, expect } from '@playwright/test';

test.describe('Conversation Regression Tests', () => {
  test.setTimeout(60000); // Increase timeout to 60 seconds
  test('should login and test conversation with Zhanyu', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('https://xyuan.chat');

    // 2. Login with provided credentials
    // Check if we need to login or already logged in
    try {
      await page.waitForSelector('text=登录', { timeout: 5000 });
      await page.click('text=登录');
      await page.waitForURL('**/login');
    } catch {
      // Maybe already on login page or logged in
      const currentUrl = page.url();
      if (!currentUrl.includes('/login') && !currentUrl.includes('/messages')) {
        await page.goto('https://xyuan.chat/login');
      }
    }

    // Fill in phone number
    await page.fill('input[name="identifier"]', '18874748888');

    // Fill in password
    await page.fill('input[type="password"]', '123456');

    // Click login button
    await page.click('button:has-text("登录")');

    // Wait for redirect to home
    await page.waitForURL('https://xyuan.chat/**', { timeout: 10000 });

    // 3. Navigate to messages
    await page.goto('https://xyuan.chat/messages');
    await page.waitForLoadState('networkidle');

    // 4. Find and click on Zhanyu conversation
    await page.click('text=Zhanyu');
    await page.waitForURL('**/messages/**');

    // 5. Test scroll to bottom - verify latest messages are visible
    await page.waitForTimeout(500); // Wait for scroll animation
    const messagesContainer = page.locator('[role="log"], .messages-container, div:has(> div > div > [class*="message"])').first();

    // Check if scrolled to bottom
    const isAtBottom = await page.evaluate(() => {
      const container = document.querySelector('[role="log"], .messages-container, div:has(> div > div > [class*="message"])') ||
                       document.querySelector('.flex-1.overflow-y-auto');
      if (container) {
        const threshold = 100; // pixels from bottom
        return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
      }
      return false;
    });

    expect(isAtBottom).toBe(true);
    console.log('✓ Page scrolled to latest messages');

    // 6. Test sending a message
    const testMessage = `测试消息 ${Date.now()}`;
    const textarea = page.locator('textarea[placeholder*="发个消息"]');
    await textarea.fill(testMessage);

    // Send message (Enter key or send button)
    await page.keyboard.press('Enter');

    // Verify message was sent
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 5000 });
    console.log('✓ Message sent successfully');

    // 7. Test voice input button
    const micButton = page.locator('button:has(svg[class*="Mic"])').first();
    await expect(micButton).toBeVisible();

    // Click mic button to start recording
    await micButton.click();

    // Check if recording indicators appear
    await expect(page.locator('text=正在录音')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=正在听')).toBeVisible({ timeout: 3000 });

    // Check if input field is focused
    const isFocused = await textarea.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
    console.log('✓ Voice input activated and input focused');

    // Stop recording
    await micButton.click();
    await expect(page.locator('text=正在录音')).not.toBeVisible({ timeout: 3000 });
    console.log('✓ Voice recording stopped');

    // 8. Test quick actions
    const plusButton = page.locator('button:has(svg[class*="Plus"])').first();
    await plusButton.click();

    // Check if quick actions menu appears
    await expect(page.locator('text=红包')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=相册')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=拍摄')).toBeVisible({ timeout: 3000 });
    console.log('✓ Quick actions menu working');

    // Close quick actions
    await plusButton.click();

    // 9. Test image upload buttons
    const cameraButton = page.locator('button:has(svg[class*="Camera"])').first();
    await expect(cameraButton).toBeVisible();

    const imageButton = page.locator('button:has(svg[class*="Image"])').first();
    await expect(imageButton).toBeVisible();
    console.log('✓ Image upload buttons visible');

    // 10. Verify conversation features
    // Check if messages are displayed
    const messages = page.locator('[class*="message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
    console.log(`✓ ${messageCount} messages displayed`);

    // Check if user avatars are visible
    const avatars = page.locator('img[alt*="Avatar"], img[class*="avatar"]');
    const avatarCount = await avatars.count();
    expect(avatarCount).toBeGreaterThan(0);
    console.log('✓ User avatars displayed');

    console.log('🎉 All conversation regression tests passed!');
  });

  test('should test responsive behavior', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('https://xyuan.chat/login');
    await page.fill('input[name="identifier"]', '18874748888');
    await page.fill('input[type="password"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForURL('https://xyuan.chat/**');

    await page.goto('https://xyuan.chat/messages/18670708294');
    await page.waitForLoadState('networkidle');

    // Verify mobile layout
    const textarea = page.locator('textarea[placeholder*="发个消息"]');
    await expect(textarea).toBeVisible();

    const micButton = page.locator('button:has(svg[class*="Mic"])').first();
    await expect(micButton).toBeVisible();

    console.log('✓ Mobile responsive layout working');
  });
});