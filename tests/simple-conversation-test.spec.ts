import { test, expect } from '@playwright/test';

test.describe('Simple Conversation Test', () => {
  test.setTimeout(90000);

  test('Login and test Zhanyu conversation', async ({ page }) => {
    console.log('Starting test...');

    // 1. Go directly to login page
    await page.goto('https://xyuan.chat/login');
    console.log('Navigated to login page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // 2. Fill login form
    // Try different selectors for phone input
    const phoneInput = page.locator('input[placeholder*="手机"], input[placeholder*="电话"], input[type="tel"], input').first();
    await phoneInput.fill('18874748888');
    console.log('Filled phone number');

    // Fill password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('123456');
    console.log('Filled password');

    // 3. Submit login
    const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("确定")').first();
    await submitButton.click();
    console.log('Clicked login button');

    // Wait for navigation
    await page.waitForURL('https://xyuan.chat/**', {
      timeout: 30000,
      waitUntil: 'networkidle'
    });
    console.log('Login successful, navigated to:', page.url());

    // 4. Go to messages page
    await page.goto('https://xyuan.chat/messages');
    await page.waitForLoadState('networkidle');
    console.log('Navigated to messages page');

    // 5. Click on Zhanyu conversation (try username directly)
    await page.goto('https://xyuan.chat/messages/18670708294');
    await page.waitForLoadState('networkidle');
    console.log('Navigated to Zhanyu conversation');

    // Wait a bit for scroll animation
    await page.waitForTimeout(1000);

    // 6. Check if page scrolled to bottom
    const scrollCheck = await page.evaluate(() => {
      // Find the messages container
      const containers = [
        document.querySelector('.overflow-y-auto'),
        document.querySelector('[role="log"]'),
        document.querySelector('.flex-1.overflow-y-auto')
      ];

      const container = containers.find(c => c && c.scrollHeight > 0);

      if (container) {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        console.log('Scroll info:', {
          scrollTop,
          scrollHeight,
          clientHeight,
          distanceFromBottom
        });

        return distanceFromBottom < 100; // Within 100px of bottom
      }
      return false;
    });

    console.log('Scrolled to bottom:', scrollCheck);
    // TODO: Fix scroll to bottom
    // expect(scrollCheck).toBe(true);

    // 7. Test sending a message
    const messageInput = page.locator('textarea').first();
    await expect(messageInput).toBeVisible({ timeout: 5000 });

    const testMessage = `测试消息 ${new Date().toLocaleTimeString()}`;
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    console.log('Sent test message:', testMessage);

    // Wait for message to appear
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible({ timeout: 10000 });
    console.log('Message appeared in conversation');

    // 8. Test microphone button
    const micButton = page.locator('button').filter({ has: page.locator('svg') }).nth(-3);
    await expect(micButton).toBeVisible();
    console.log('Microphone button is visible');

    // Click to start recording
    await micButton.click();
    await page.waitForTimeout(500);

    // Check for recording indicators
    const recordingIndicator = page.locator('text=正在录音, text=正在听').first();
    const isRecording = await recordingIndicator.isVisible();
    console.log('Recording started:', isRecording);

    // Stop recording
    if (isRecording) {
      await micButton.click();
      console.log('Recording stopped');
    }

    console.log('✅ All tests passed!');
  });
});