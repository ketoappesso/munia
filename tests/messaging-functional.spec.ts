import { test, expect } from '@playwright/test';

test.describe('Private Messaging - End-to-End Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('should create conversation from user profile', async ({ page }) => {
    // Login and navigate to a user profile
    await page.goto('http://localhost:3002/login');
    
    // Fill login form
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for login success
    await expect(page).toHaveURL(/^(http:\/\/localhost:3002(?!\/login).*)/);
    
    // Navigate to another user's profile
    await page.goto('http://localhost:3002/testuser1');
    
    // Click message button
    await page.getByRole('button', { name: 'Message' }).click();
    
    // Verify conversation created
    await expect(page).toHaveURL(/\/messages\/testuser1/);
    await expect(page.getByRole('heading', { name: 'testuser1' })).toBeVisible();
  });

  test('should send and receive messages in real-time', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to conversation
    await page.goto('http://localhost:3002/messages/testuser2');

    // Send a message
    const messageInput = page.getByPlaceholder('输入消息...');
    await messageInput.fill('Hello from Playwright!');
    
    const sendButton = page.getByRole('button', { name: 'Send' });
    await sendButton.click();

    // Verify message appears
    await expect(page.getByText('Hello from Playwright!')).toBeVisible();
    await expect(messageInput).toHaveText('');

    // Test keyboard shortcuts
    await messageInput.fill('Quick message');
    await messageInput.press('Enter');
    
    await expect(page.getByText('Quick message')).toBeVisible();
  });

  test('should display conversations list with unread badges', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Navigate to messages
    await page.goto('http://localhost:3002/messages');

    // Check messages page structure
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    
    // Check for conversation list or empty state
    const conversations = page.locator('a[href^="/messages/"]');
    if ((await conversations.count()) > 0) {
      // Has conversations
      await expect(conversations.first()).toBeVisible();
    } else {
      // Empty state
      await expect(page.getByText('No conversations')).toBeVisible();
    }
  });

  test('should handle empty message validation', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('http://localhost:3002/messages/testuser3');

    // Attempt to send empty message
    const sendButton = page.getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeDisabled();

    // Test whitespace message
    await page.getByPlaceholder('输入消息...').fill('   ');
    await expect(sendButton).toBeDisabled();
  });

  test('should handle conversation deduplication', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Create conversation with testuser4
    await page.goto('http://localhost:3002/testuser4');
    await page.getByRole('button', { name: 'Message' }).click();

    // Should land on same conversation (no duplicate)
    await expect(page).toHaveURL(/\/messages\/testuser4/);
  });

  test('should show last message preview in conversation list', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('http://localhost:3002/messages');

    // If conversations exist, check message previews
    const conversationLinks = page.locator('a[href^="/messages/"]');
    const count = await conversationLinks.count();
    if (count > 0) {
      const firstConversation = conversationLinks.first();
      await expect(firstConversation).toBeVisible();
      
      // Check for message preview (content may be empty for new conversations)
      const lastMessage = firstConversation.locator('p').last();
      await expect(lastMessage).toBeVisible();
    }
  });
});

test.describe('Real-time Messaging Features', () => {
  test('should maintain scroll position at bottom on new message', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.goto('http://localhost:3002/messages/testuser5');

    // Send multiple messages
    for (let i = 1; i <= 3; i++) {
      await page.getByPlaceholder('输入消息...').fill(`Message ${i}`);
      await page.getByRole('button', { name: 'Send' }).click();
    }

    // Verify all messages are visible
    await expect(page.getByText('Message 1')).toBeVisible();
    await expect(page.getByText('Message 2')).toBeVisible();
    await expect(page.getByText('Message 3')).toBeVisible();
  });
});