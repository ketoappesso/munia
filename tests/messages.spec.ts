import { test, expect } from '@playwright/test';

test.describe('Messages Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/messages');
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('messages page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    await expect(page.getByText('Your conversations will appear here')).toBeVisible();
  });

  test('navigate to individual message conversation', async ({ page }) => {
    // This test assumes there are sample conversations
    await page.waitForTimeout(1000);
    
    // Check if any conversation exists
    const conversationLinks = page.getByRole('link', { name: /@\w+/ });
    const count = await conversationLinks.count();
    
    if (count > 0) {
      await conversationLinks.first().click();
      await expect(page).toHaveURL(/\/messages\/\w+/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('message interface has modern design elements', async ({ page }) => {
    await page.goto('/messages/testuser');
    
    // Check modern header design
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByText('在线')).toBeVisible();
    
    // Check message bubbles
    const incomingMessages = page.locator('.bg-white, .dark\:bg-gray-800');
    const outgoingMessages = page.locator('.bg-blue-500');
    
    await expect(incomingMessages.first()).toBeVisible();
    await expect(outgoingMessages.first()).toBeVisible();
    
    // Check modern input area
    await expect(page.getByLabel('输入消息...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('back navigation returns to messages list', async ({ page }) => {
    await page.goto('/messages/testuser');
    
    // Click back button
    await page.getByRole('button', { name: 'Back' }).click();
    
    // Should return to messages list, not previous page
    await expect(page).toHaveURL('/messages');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  });

  test('message input and send functionality', async ({ page }) => {
    await page.goto('/messages/testuser');
    
    const messageInput = page.getByLabel('输入消息...');
    const sendButton = page.getByRole('button', { name: 'Send' });
    
    // Test input field
    await messageInput.fill('Test message');
    await expect(messageInput).toHaveValue('Test message');
    
    // Test send button state
    await expect(sendButton).not.toBeDisabled();
    
    // Test empty message
    await messageInput.fill('');
    await expect(sendButton).toBeDisabled();
  });

  test('keyboard shortcuts work', async ({ page }) => {
    await page.goto('/messages/testuser');
    
    const messageInput = page.getByLabel('输入消息...');
    
    // Test Enter key sends message
    await messageInput.fill('Test enter key');
    await messageInput.press('Enter');
    
    // Input should clear after sending
    await expect(messageInput).toHaveValue('');
  });
});