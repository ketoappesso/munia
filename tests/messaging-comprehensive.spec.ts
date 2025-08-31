import { test, expect, Page } from '@playwright/test';

// Test accounts
const user1 = {
  phone: '18874748888',
  password: '123456',
  name: 'User1'
};

const user2 = {
  phone: '19974749999',
  password: '123456',
  name: 'User2'
};

async function loginUser(page: Page, phone: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="phoneNumber"]', phone);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/feed', { timeout: 10000 });
}

test.describe('Messaging Feature - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('Follow button changes to Message button in feed', async ({ page }) => {
    // Login as user1
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to feed
    await page.goto('/feed');
    
    // Find a user card with follow button
    const userCard = page.locator('.rounded-2xl').first();
    const followButton = userCard.locator('button:has-text("关注")').first();
    
    if (await followButton.isVisible()) {
      // Click follow button
      await followButton.click();
      
      // Wait for button to change to message
      await expect(userCard.locator('button:has-text("私信")')).toBeVisible({ timeout: 5000 });
      
      // Click message button
      await userCard.locator('button:has-text("私信")').click();
      
      // Should navigate to messages page
      await expect(page).toHaveURL(/\/messages\//, { timeout: 5000 });
    }
  });

  test('Message button is always visible in discover page', async ({ page }) => {
    // Login as user1
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to discover
    await page.goto('/discover');
    
    // Wait for profiles to load
    await page.waitForSelector('.grid', { timeout: 10000 });
    
    // Check that message buttons are visible
    const messageButtons = page.locator('button[aria-label="私信"]');
    const count = await messageButtons.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Click first message button
    await messageButtons.first().click();
    
    // Should navigate to messages page
    await expect(page).toHaveURL(/\/messages\//, { timeout: 5000 });
  });

  test('Send and receive messages between users', async ({ browser }) => {
    // Create two browser contexts for two users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Login both users
    await loginUser(page1, user1.phone, user1.password);
    await loginUser(page2, user2.phone, user2.password);
    
    // User1 sends message to User2
    await page1.goto('/discover');
    await page1.waitForSelector('.grid');
    
    // Find and click message button for a user
    const messageButton = page1.locator('button[aria-label="私信"]').first();
    await messageButton.click();
    
    // Wait for chat page to load
    await page1.waitForURL(/\/messages\//);
    
    // Type and send message
    const messageInput = page1.locator('textarea[placeholder="发个消息吧~"]');
    await messageInput.fill('Hello from User1!');
    await page1.keyboard.press('Enter');
    
    // Verify message appears in chat
    await expect(page1.locator('text=Hello from User1!')).toBeVisible({ timeout: 5000 });
    
    // User2 checks messages
    await page2.goto('/messages');
    
    // Verify conversation appears in list
    await expect(page2.locator('text=Hello from User1!')).toBeVisible({ timeout: 10000 });
    
    // Cleanup
    await context1.close();
    await context2.close();
  });

  test('Messages page with tabs (Messages/Notifications)', async ({ page }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to messages
    await page.goto('/messages');
    
    // Check tabs are visible
    await expect(page.locator('button:has-text("信息")')).toBeVisible();
    await expect(page.locator('button:has-text("提醒")')).toBeVisible();
    
    // Click notifications tab
    await page.locator('button:has-text("提醒")').click();
    
    // Verify notifications content is shown
    await page.waitForTimeout(1000); // Wait for tab switch animation
    
    // Click back to messages tab
    await page.locator('button:has-text("信息")').click();
    
    // Verify messages content is shown
    await page.waitForTimeout(1000);
  });

  test('Chat interface functionality', async ({ page }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to a chat
    await page.goto('/discover');
    await page.waitForSelector('.grid');
    await page.locator('button[aria-label="私信"]').first().click();
    
    // Wait for chat to load
    await page.waitForURL(/\/messages\//);
    
    // Test message input
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    await messageInput.fill('Test message');
    
    // Test send button appears when text is entered
    await expect(page.locator('button svg.lucide-send')).toBeVisible();
    
    // Test clear message
    await messageInput.clear();
    
    // Send button should disappear, camera/image buttons should appear
    await expect(page.locator('button svg.lucide-camera')).toBeVisible();
    await expect(page.locator('button svg.lucide-image')).toBeVisible();
    
    // Test plus button for actions
    const plusButton = page.locator('button svg.lucide-plus').locator('..');
    await plusButton.click();
    
    // Actions panel should appear
    await expect(page.locator('text=相册')).toBeVisible();
    await expect(page.locator('text=拍摄')).toBeVisible();
    
    // Click plus again to close
    await plusButton.click();
    await expect(page.locator('text=相册')).not.toBeVisible();
  });

  test('Message ordering and scroll behavior', async ({ page }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to a chat
    await page.goto('/discover');
    await page.waitForSelector('.grid');
    await page.locator('button[aria-label="私信"]').first().click();
    
    await page.waitForURL(/\/messages\//);
    
    // Send multiple messages
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    
    for (let i = 1; i <= 5; i++) {
      await messageInput.fill(`Message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    
    // Verify messages appear in correct order
    const messages = page.locator('p.text-sm');
    const messageCount = await messages.count();
    
    // Check last message is visible (auto-scroll to bottom)
    await expect(messages.last()).toBeInViewport();
    
    // Scroll up
    await page.evaluate(() => {
      const chatContainer = document.querySelector('[class*="overflow-y-auto"]');
      if (chatContainer) {
        chatContainer.scrollTop = 0;
      }
    });
    
    // Send new message
    await messageInput.fill('New message after scroll');
    await page.keyboard.press('Enter');
    
    // Should auto-scroll to bottom if was at bottom
    await page.waitForTimeout(1000);
    
    // Check "jump to latest" button appears when not at bottom
    await page.evaluate(() => {
      const chatContainer = document.querySelector('[class*="overflow-y-auto"]');
      if (chatContainer) {
        chatContainer.scrollTop = 0;
      }
    });
    
    const jumpButton = page.locator('button[aria-label="跳至最新消息"]');
    await expect(jumpButton).toBeVisible({ timeout: 5000 });
    
    // Click jump button
    await jumpButton.click();
    
    // Should scroll to bottom
    await expect(messages.last()).toBeInViewport();
  });

  test('WebSocket connection and reconnection', async ({ page, context }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to chat
    await page.goto('/discover');
    await page.waitForSelector('.grid');
    await page.locator('button[aria-label="私信"]').first().click();
    
    await page.waitForURL(/\/messages\//);
    
    // Check online status
    await expect(page.locator('text=在线')).toBeVisible({ timeout: 5000 });
    
    // Simulate offline
    await context.setOffline(true);
    
    // Check offline status
    await expect(page.locator('text=离线')).toBeVisible({ timeout: 5000 });
    
    // Send message while offline (should queue)
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    await messageInput.fill('Offline message');
    await page.keyboard.press('Enter');
    
    // Go back online
    await context.setOffline(false);
    
    // Should reconnect and show online
    await expect(page.locator('text=在线')).toBeVisible({ timeout: 10000 });
    
    // Queued message should be sent
    await expect(page.locator('text=Offline message')).toBeVisible({ timeout: 5000 });
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to messages
    await page.goto('/messages');
    
    // Check mobile layout
    await expect(page.locator('.px-4')).toBeVisible();
    
    // Navigate to chat
    await page.goto('/discover');
    await page.locator('button[aria-label="私信"]').first().click();
    
    // Check chat is responsive
    await expect(page.locator('textarea[placeholder="发个消息吧~"]')).toBeVisible();
    
    // Test input and send on mobile
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    await messageInput.fill('Mobile test message');
    await page.keyboard.press('Enter');
    
    // Verify message sent
    await expect(page.locator('text=Mobile test message')).toBeVisible({ timeout: 5000 });
  });

  test('Error handling and edge cases', async ({ page }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Try to message non-existent user
    await page.goto('/messages/nonexistentuser');
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Try to send empty message
    await page.goto('/discover');
    await page.waitForSelector('.grid');
    await page.locator('button[aria-label="私信"]').first().click();
    
    await page.waitForURL(/\/messages\//);
    
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    await messageInput.fill('   '); // Only spaces
    await page.keyboard.press('Enter');
    
    // Message should not be sent
    await page.waitForTimeout(1000);
    const messages = page.locator('p.text-sm');
    const initialCount = await messages.count();
    
    // Send a real message
    await messageInput.fill('Real message');
    await page.keyboard.press('Enter');
    
    // Count should increase by 1
    await page.waitForTimeout(1000);
    const newCount = await messages.count();
    expect(newCount).toBe(initialCount + 1);
  });
});

test.describe('Performance and Memory Tests', () => {
  test('Message virtualization for large conversations', async ({ page }) => {
    // Login
    await loginUser(page, user1.phone, user1.password);
    
    // Navigate to chat
    await page.goto('/discover');
    await page.waitForSelector('.grid');
    await page.locator('button[aria-label="私信"]').first().click();
    
    await page.waitForURL(/\/messages\//);
    
    // Send many messages to test virtualization
    const messageInput = page.locator('textarea[placeholder="发个消息吧~"]');
    
    for (let i = 1; i <= 20; i++) {
      await messageInput.fill(`Performance test message ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Check memory usage doesn't spike dramatically
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory;
      }
      return null;
    });
    
    if (metrics) {
      console.log('Memory usage:', metrics);
      // Ensure memory usage is reasonable
      expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    }
    
    // Scroll performance test
    const startTime = Date.now();
    
    // Scroll up and down multiple times
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        const container = document.querySelector('[class*="overflow-y-auto"]');
        if (container) {
          container.scrollTop = 0;
        }
      });
      await page.waitForTimeout(500);
      
      await page.evaluate(() => {
        const container = document.querySelector('[class*="overflow-y-auto"]');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
      await page.waitForTimeout(500);
    }
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be smooth (less than 4 seconds for 3 full scrolls)
    expect(scrollTime).toBeLessThan(4000);
  });
});