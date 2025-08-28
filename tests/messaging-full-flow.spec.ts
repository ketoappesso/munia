import { test, expect } from '@playwright/test';

test.describe('Complete Messaging Workflow - Headless End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should complete entire messaging workflow with auth', async ({ page }) => {
    // 1. Navigate to protected area (should redirect to login)
    await page.goto('http://localhost:3002/messages');
    await expect(page).toHaveURL(/\/login/);

    // 2. Login with test credentials
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Verify redirected to original destination (messages)
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

    // 4. Navigate to existing conversation
    const conversationLink = page.getByRole('link', { name: /testuser2/ });
    await expect(conversationLink).toBeVisible();
    await conversationLink.click();

    // 5. Send message in conversation
    await expect(page).toHaveURL(/\/messages\/testuser2/);
    const messageInput = page.getByPlaceholder('输入消息...');
    await messageInput.fill('Hey User 2! Great to chat again');

    // 6. Send message and verify appear
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Hey User 2! Great to chat again')).toBeVisible();

    // 7. Verify message sent successfully within viewport
    const messageHistory = page.locator('.space-y-3');
    await expect(messageHistory).toBeVisible();

    // 8. Test empty message validation
    await messageInput.fill('   ');
    await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled();

    // 9. Test valid message working again
    await messageInput.fill('Second message test');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Second message test')).toBeVisible();
  });

  test('should handle conversation creation from social features', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Navigate to feed/posts
    await page.goto('http://localhost:3002/feed');
    
    // 3. Find a post from testuser3
    const postFromUser3 = page.locator('article').filter({ hasText: 'testuser3' }).first();
    await expect(postFromUser3).toBeVisible();

    // 4. Navigate to author profile
    await postFromUser3.locator('a[href*="testuser3"]').click();
    await expect(page).toHaveURL(/\/testuser3/);

    // 5. Create conversation via profile
    await page.getByRole('button', { name: 'Message' }).click();

    // 6. Verify conversation opened
    await expect(page).toHaveURL(/\/messages\/testuser3/);

    // 7. Send initiation message
    await page.getByPlaceholder('输入消息...').fill('Loved your post!');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Loved your post!')).toBeVisible();
  });

  test('should validate keyboard navigation and shortcuts', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Navigate to conversation
    await page.goto('http://localhost:3002/messages/testuser4');

    // 3. Test Tab navigation
    const messageInput = page.getByPlaceholder('输入消息...');
    await page.keyboard.press('Tab');
    await expect(messageInput).toBeFocused();

    // 4. Test Enter for sending
    await messageInput.fill('Tab navigation test message');
    await messageInput.press('Enter');
    await expect(page.getByText('Tab navigation test message')).toBeVisible();

    // 5. Test Escape doesn't close (desktop)
    await messageInput.press('Escape');
    await expect(messageInput).toBeVisible();

    // 6. Test continuous sending
    for (let i = 1; i <= 5; i++) {
      await messageInput.fill(`Batch message ${i}`);
      await messageInput.press('Enter');
    }

    // 7. Verify all messages shown
    for (let i = 1; i <= 5; i++) {
      await expect(page.getByText(`Batch message ${i}`)).toBeVisible();
    }
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Navigate to conversation
    await page.goto('http://localhost:3002/messages/testuser5');

    // 3. Simulate network failure
    await page.route('**/api/conversations/**', (route) => {
      route.abort('network error');
    });

    // 4. Attempt to send message
    await page.getByPlaceholder('输入消息...').fill('Network error test');
    await page.getByRole('button', { name: 'Send' }).click();

    // 5. Verify error handling
    const errorIndicator = page.locator('text=Failed to send message');
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should validate UI responsiveness', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 2. Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3002/messages');

    // 3. Verify mobile layout
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();

    // 4. Test mobile message interface
    await page.getByRole('link', { name: /testuser2/ }).click();
    await page.getByPlaceholder('输入消息...').fill('Mobile test message');
    await page.getByRole('button', { name: 'Send' }).click();

    // 5. Verify mobile interaction working
    await expect(page.getByText('Mobile test message')).toBeVisible();
  });
});

// Performance testing
import { test as performanceTest } from '@playwright/test';

performanceTest.describe('Messaging Performance Tests', () => {
  performanceTest('should load conversation within 3 seconds', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    const startTime = Date.now();
    await page.goto('http://localhost:3002/messages/testuser2');
    await page.waitForSelector('[data-testid="message-container"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});