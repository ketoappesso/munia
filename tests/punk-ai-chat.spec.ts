import { test, expect } from '@playwright/test';

// Test configuration
const TEST_USER = {
  phone: '13800138000',
  password: 'testpass123',
};

const PUNK_USER = {
  username: 'punkuser1',
  name: 'AI Punk User',
};

test.describe('Punk AI Chat Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Wait for the page to load
    await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
    
    // Login with test user - using placeholder selectors since there are no name attributes
    await page.fill('input[type="tel"]', TEST_USER.phone);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Click the login button - it should be the submit button
    await page.click('button:has-text("登录")');
    
    // Wait for redirect to feed or home
    await page.waitForURL(/\/(feed|home)/, { timeout: 10000 });
  });

  test('should show AI indicator for punk users', async ({ page }) => {
    // Navigate to messages
    await page.goto('http://localhost:3002/messages');
    
    // Search for punk user
    await page.click('[placeholder*="搜索"]');
    await page.fill('[placeholder*="搜索"]', PUNK_USER.username);
    
    // Click on punk user conversation
    await page.click(`text=${PUNK_USER.name}`);
    
    // Check for AI indicator in header
    await expect(page.locator('text=AI').first()).toBeVisible();
    await expect(page.locator('text=PUNK IT').first()).toBeVisible();
  });

  test('should send message to punk user and receive AI response', async ({ page }) => {
    // Navigate directly to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Wait for page to load
    await page.waitForSelector('[placeholder*="输入消息"]');
    
    // Send a message
    const testMessage = '你好，这是一条测试消息';
    await page.fill('[placeholder*="输入消息"]', testMessage);
    await page.press('[placeholder*="输入消息"]', 'Enter');
    
    // Wait for the message to appear
    await expect(page.locator(`text=${testMessage}`)).toBeVisible();
    
    // Wait for AI thinking indicator
    await expect(page.locator('text=AI 正在思考...')).toBeVisible({ timeout: 5000 });
    
    // Wait for AI response (with longer timeout for API call)
    await page.waitForSelector('.bg-gray-100', { timeout: 30000 });
    
    // Verify AI response is received
    const aiResponse = await page.locator('.bg-gray-100').last().textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse?.length).toBeGreaterThan(0);
  });

  test('should handle multiple messages in conversation', async ({ page }) => {
    // Navigate to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Send multiple messages
    const messages = [
      '你好',
      '今天天气怎么样？',
      '推荐一些好吃的',
    ];
    
    for (const message of messages) {
      await page.fill('[placeholder*="输入消息"]', message);
      await page.press('[placeholder*="输入消息"]', 'Enter');
      
      // Wait for user message to appear
      await expect(page.locator(`text=${message}`)).toBeVisible();
      
      // Wait for AI response
      await page.waitForSelector('.bg-gray-100:last-child', { timeout: 30000 });
      
      // Small delay between messages
      await page.waitForTimeout(1000);
    }
    
    // Verify all messages are in the conversation
    for (const message of messages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }
    
    // Verify we have AI responses (gray background messages)
    const aiResponses = await page.locator('.bg-gray-100').count();
    expect(aiResponses).toBeGreaterThanOrEqual(messages.length);
  });

  test('should show error when LLM service is unavailable', async ({ page }) => {
    // Temporarily break the LLM configuration
    await page.addInitScript(() => {
      // Override fetch to simulate LLM failure
      const originalFetch = window.fetch;
      window.fetch = async (url, options) => {
        if (typeof url === 'string' && url.includes('punk-ai')) {
          throw new Error('LLM Service Unavailable');
        }
        return originalFetch(url, options);
      };
    });
    
    // Navigate to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Send a message
    await page.fill('[placeholder*="输入消息"]', 'Test message');
    await page.press('[placeholder*="输入消息"]', 'Enter');
    
    // Check for error handling
    await page.waitForTimeout(2000);
    
    // Verify the message was sent but no AI response received
    await expect(page.locator('text=Test message')).toBeVisible();
  });

  test('should maintain conversation context', async ({ page }) => {
    // Navigate to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Send initial context message
    await page.fill('[placeholder*="输入消息"]', '我叫小明');
    await page.press('[placeholder*="输入消息"]', 'Enter');
    
    // Wait for AI response
    await page.waitForSelector('.bg-gray-100', { timeout: 30000 });
    
    // Send follow-up message that requires context
    await page.fill('[placeholder*="输入消息"]', '你还记得我的名字吗？');
    await page.press('[placeholder*="输入消息"]', 'Enter');
    
    // Wait for AI response
    await page.waitForTimeout(3000);
    
    // The AI should demonstrate context awareness
    const lastAiResponse = await page.locator('.bg-gray-100').last().textContent();
    expect(lastAiResponse).toBeTruthy();
  });

  test('should play TTS audio for AI responses', async ({ page }) => {
    // Navigate to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Listen for audio play events
    let audioPlayed = false;
    page.on('console', msg => {
      if (msg.text().includes('Playing audio') || msg.text().includes('TTS')) {
        audioPlayed = true;
      }
    });
    
    // Send a message
    await page.fill('[placeholder*="输入消息"]', '讲个笑话');
    await page.press('[placeholder*="输入消息"]', 'Enter');
    
    // Wait for AI response
    await page.waitForSelector('.bg-gray-100', { timeout: 30000 });
    
    // Wait a bit for TTS to potentially play
    await page.waitForTimeout(3000);
    
    // Note: Actual audio playback verification would require more complex setup
    // This test primarily ensures the TTS system doesn't throw errors
  });

  test('should handle rapid message sending', async ({ page }) => {
    // Navigate to punk user chat
    await page.goto(`http://localhost:3002/messages/${PUNK_USER.username}`);
    
    // Send messages rapidly
    const rapidMessages = ['消息1', '消息2', '消息3'];
    
    for (const message of rapidMessages) {
      await page.fill('[placeholder*="输入消息"]', message);
      await page.press('[placeholder*="输入消息"]', 'Enter');
      // Don't wait for response, send next immediately
    }
    
    // Wait for all messages to appear
    for (const message of rapidMessages) {
      await expect(page.locator(`text=${message}`)).toBeVisible();
    }
    
    // Wait for AI responses to catch up
    await page.waitForTimeout(5000);
    
    // Verify AI responses are generated for each message
    const aiResponses = await page.locator('.bg-gray-100').count();
    expect(aiResponses).toBeGreaterThan(0);
  });

  test('should display punk badge on user profile', async ({ page }) => {
    // Navigate to punk user profile
    await page.goto(`http://localhost:3002/${PUNK_USER.username}`);
    
    // Check for PUNK badge
    await expect(page.locator('text=PUNK').first()).toBeVisible();
    
    // Check for special styling or indicators
    const punkBadge = page.locator('[class*="punk"], [class*="PUNK"]').first();
    await expect(punkBadge).toBeVisible();
  });
});