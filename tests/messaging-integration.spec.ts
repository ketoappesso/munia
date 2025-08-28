import { test, expect } from '@playwright/test';

test.describe('Messaging Cross-User Integration Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with fresh session
    await page.context().clearCookies();
  });

  test('should complete conversation lifecycle end-to-end', async ({ browser }) => {
    // Create two browser contexts for different users
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();

    try {
      // User 1: Login and navigate to User 2's profile
      await user1Page.goto('http://localhost:3002/login');
      await user1Page.getByLabel('Phone Number').fill('13800138001');
      await user1Page.getByLabel('Password').fill('Test@Pass123');
      await user1Page.getByRole('button', { name: 'Sign In' }).click();

      await user1Page.goto('http://localhost:3002/testuser2');
      await user1Page.getByRole('button', { name: 'Message' }).click();

      // Verify conversation created
      await expect(user1Page).toHaveURL(/\/messages\/testuser2/);

      // User 1: Send first message ✅
      await user1Page.getByPlaceholder('输入消息...').fill('Hi User 2! First message');
      await user1Page.getByRole('button', { name: 'Send' }).click();
      await expect(user1Page.getByText('Hi User 2! First message')).toBeVisible();

      // User 2: Login and check messages
      await user2Page.goto('http://localhost:3002/login');
      await user2Page.getByLabel('Phone Number').fill('13800138002');
      await user2Page.getByLabel('Password').fill('Test@Pass123');
      await user2Page.getByRole('button', { name: 'Sign In' }).click();

      // User 2: Should see notification indicator
      await user2Page.goto('http://localhost:3002/messages');
      const conversationWithUser1 = user2Page.locator('a[href*="testuser1"]');
      await expect(conversationWithUser1).toBeVisible();

      // User 2: Open conversation and see message ✅
      await conversationWithUser1.click();
      await expect(user2Page.getByText('Hi User 2! First message')).toBeVisible();

      // User 2: Reply to message
      await user2Page.getByPlaceholder('输入消息...').fill('Thanks User 1! Looking good');
      await user2Page.getByRole('button', { name: 'Send' }).click();
      await expect(user2Page.getByText('Thanks User 1! Looking good')).toBeVisible();

      // User 1: Verify reply received
      await user1Page.reload();
      await expect(user1Page.getByText('Thanks User 1! Looking good')).toBeVisible();

    } finally {
      // Cleanup
      await user1Context.close();
      await user2Context.close();
    }
  });

  test('should handle conversation creation without duplicates', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Create conversation multiple times - should not duplicate
    await page.goto('http://localhost:3002/testuser2');
    await page.getByRole('button', { name: 'Message' }).click();
    
    const firstUrl = page.url();
    await page.goBack();
    await page.getByRole('button', { name: 'Message' }).click();  // Try again
    
    await expect(page.url()).toBe(firstUrl);  // Same conversation ID
  });

  test('should validate message input and send state', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('http://localhost:3002/messages/testuser3');

    const messageInput = page.getByPlaceholder('输入消息...');
    const sendButton = page.getByRole('button', { name: 'Send' });

    // Initial state
    await expect(sendButton).toBeDisabled();

    // Validation states
    await messageInput.fill('   ');
    await expect(sendButton).toBeDisabled();

    await messageInput.fill('');
    await expect(sendButton).toBeDisabled();

    await messageInput.fill('Valid message');
    await expect(sendButton).toBeEnabled();

    await messageInput.fill('Message with newline\n');
    await messageInput.press('Enter');
    await expect(page.getByText('Message with newline')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138001');
    await page.getByLabel('Password').fill('Test@Pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('http://localhost:3002/messages/testuser4');

    // Simulate network error
    await page.route('**/api/conversations/**', route => {
      route.abort('network error');
    });

    // Should show appropriate error state
    await page.getByPlaceholder('输入消息...').fill('Test error handling');
    await page.getByRole('button', { name: 'Send' }).click();
    
    // Should show error indicator
    await expect(page.locator('text=Failed to send')).toBeVisible();
  });
});