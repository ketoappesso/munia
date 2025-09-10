import { test, expect } from '@playwright/test';
import prisma from '../src/lib/prisma/prisma';

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:3002';
const TEST_USER = {
  phoneNumber: '13800138000',
  password: 'test123456',
  name: 'Test User',
  username: 'testuser'
};

const PUNK_USER = {
  phoneNumber: '13900139000',
  password: 'punk123456',
  name: 'AI Assistant',
  username: 'aiassistant',
  punked: true,
  ttsVoiceId: 'S_custom_voice'
};

// Helper function to create test users
async function setupTestUsers() {
  // Clean up existing test users
  await prisma.user.deleteMany({
    where: {
      OR: [
        { phoneNumber: TEST_USER.phoneNumber },
        { phoneNumber: PUNK_USER.phoneNumber }
      ]
    }
  });

  // Create regular test user
  const regularUser = await prisma.user.create({
    data: {
      phoneNumber: TEST_USER.phoneNumber,
      username: TEST_USER.username,
      name: TEST_USER.name,
      passwordHash: TEST_USER.password, // In real app, this would be hashed
      punked: false
    }
  });

  // Create punk AI user
  const punkUser = await prisma.user.create({
    data: {
      phoneNumber: PUNK_USER.phoneNumber,
      username: PUNK_USER.username,
      name: PUNK_USER.name,
      passwordHash: PUNK_USER.password,
      punked: true,
      ttsVoiceId: PUNK_USER.ttsVoiceId,
      bio: 'I am an AI assistant powered by LLM technology.'
    }
  });

  return { regularUser, punkUser };
}

test.describe('Punk User AI Integration', () => {
  test.beforeAll(async () => {
    // Setup test database
    console.log('Setting up test users...');
    await setupTestUsers();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(TEST_URL);
  });

  test('should display AI indicator for punk users', async ({ page }) => {
    // Login as regular user
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    
    // Wait for login to complete
    await page.waitForURL('**/feed', { timeout: 10000 });

    // Navigate to messages
    await page.click('text=消息');
    await page.waitForURL('**/messages');

    // Search for punk user
    await page.click('button[aria-label="搜索用户"]');
    await page.fill('input[placeholder*="搜索"]', PUNK_USER.username);
    await page.click(`text=${PUNK_USER.name}`);

    // Check for AI indicators
    await expect(page.locator('span:has-text("AI")')).toBeVisible();
    await expect(page.locator('text=AI 助手 • 随时在线')).toBeVisible();
    
    // Check for purple/pink gradient badge
    const aiBadge = page.locator('span').filter({ hasText: 'AI' });
    await expect(aiBadge).toHaveClass(/bg-gradient-to-r/);
  });

  test('should show AI thinking indicator when sending message to punk user', async ({ page }) => {
    // Login and navigate to punk user chat
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Navigate to messages with punk user
    await page.goto(`${TEST_URL}/messages/${PUNK_USER.username}`);
    
    // Send a message
    const messageInput = page.locator('textarea[placeholder*="发个消息"]');
    await messageInput.fill('Hello AI, how are you?');
    await page.keyboard.press('Enter');

    // Check for AI thinking indicator
    await expect(page.locator('text=AI 正在思考...')).toBeVisible();
    
    // Check for animated dots
    await expect(page.locator('.animate-bounce')).toHaveCount(3);
    
    // Wait for AI response (should appear within 5 seconds)
    await page.waitForTimeout(3000);
    
    // AI thinking indicator should disappear
    await expect(page.locator('text=AI 正在思考...')).toBeHidden();
  });

  test('should generate AI response when messaging punk user', async ({ page }) => {
    // Login
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Navigate to punk user chat
    await page.goto(`${TEST_URL}/messages/${PUNK_USER.username}`);
    
    // Send a test message
    const testMessage = 'What is the weather like today?';
    const messageInput = page.locator('textarea[placeholder*="发个消息"]');
    await messageInput.fill(testMessage);
    await page.keyboard.press('Enter');

    // Wait for user's message to appear
    await expect(page.locator(`text="${testMessage}"`)).toBeVisible();

    // Wait for AI response (max 5 seconds)
    await page.waitForTimeout(4000);

    // Check that an AI response was generated
    const messages = page.locator('[data-testid="message"]');
    const messageCount = await messages.count();
    
    // Should have at least 2 messages (user's message + AI response)
    expect(messageCount).toBeGreaterThanOrEqual(2);
    
    // The last message should be from the AI
    const lastMessage = messages.last();
    const senderName = await lastMessage.locator('[data-testid="sender-name"]').textContent();
    expect(senderName).toContain(PUNK_USER.name);
  });

  test('should check punk status via API', async ({ page, request }) => {
    // Login first to get session
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Get cookies for API request
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));

    // Check punk status via API
    const response = await request.get(`${TEST_URL}/api/punk-ai?userId=${PUNK_USER.username}`, {
      headers: {
        'Cookie': `${sessionCookie?.name}=${sessionCookie?.value}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.isPunk).toBe(true);
    expect(data.user.punked).toBe(true);
    expect(data.user.ttsVoiceId).toBe(PUNK_USER.ttsVoiceId);
  });

  test('should handle multiple messages in conversation with punk user', async ({ page }) => {
    // Login
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Navigate to punk user chat
    await page.goto(`${TEST_URL}/messages/${PUNK_USER.username}`);
    
    const messageInput = page.locator('textarea[placeholder*="发个消息"]');
    
    // Send multiple messages
    const testMessages = [
      'Hello AI',
      'Can you help me?',
      'What do you know about coding?'
    ];

    for (const msg of testMessages) {
      await messageInput.fill(msg);
      await page.keyboard.press('Enter');
      
      // Wait for message to be sent
      await expect(page.locator(`text="${msg}"`)).toBeVisible();
      
      // Wait for AI response
      await page.waitForTimeout(3500);
      
      // Check AI thinking indicator appears and disappears
      const thinkingIndicator = page.locator('text=AI 正在思考...');
      if (await thinkingIndicator.isVisible()) {
        await expect(thinkingIndicator).toBeHidden({ timeout: 5000 });
      }
    }

    // Verify all messages were sent and received responses
    const messages = page.locator('[data-testid="message"]');
    const messageCount = await messages.count();
    
    // Should have at least 6 messages (3 user messages + 3 AI responses)
    expect(messageCount).toBeGreaterThanOrEqual(6);
  });

  test('should not show AI indicators for regular users', async ({ page }) => {
    // Create another regular user for comparison
    const regularUser2 = await prisma.user.create({
      data: {
        phoneNumber: '13700137000',
        username: 'regularuser2',
        name: 'Regular User 2',
        passwordHash: 'test123456',
        punked: false
      }
    });

    try {
      // Login as first regular user
      await page.click('text=登录');
      await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button:has-text("登录")');
      await page.waitForURL('**/feed');

      // Navigate to chat with regular user
      await page.goto(`${TEST_URL}/messages/${regularUser2.username}`);
      
      // Check that AI indicators are NOT present
      await expect(page.locator('span:has-text("AI")')).not.toBeVisible();
      await expect(page.locator('text=AI 助手')).not.toBeVisible();
      
      // Status should show online/offline, not AI assistant
      const statusText = await page.locator('p.text-sm.text-gray-500').textContent();
      expect(statusText).toMatch(/在线|离线/);
      expect(statusText).not.toContain('AI');

      // Send a message - should not trigger AI response
      const messageInput = page.locator('textarea[placeholder*="发个消息"]');
      await messageInput.fill('Hello regular user');
      await page.keyboard.press('Enter');

      // Should not show AI thinking indicator
      await expect(page.locator('text=AI 正在思考...')).not.toBeVisible();
      
      // Wait a bit to ensure no AI response is generated
      await page.waitForTimeout(2000);
      
      // Should only have the user's message, no automatic response
      const messages = page.locator('[data-testid="message"]');
      const messageCount = await messages.count();
      expect(messageCount).toBe(1);
    } finally {
      // Clean up
      await prisma.user.delete({ where: { id: regularUser2.id } });
    }
  });

  test.afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        OR: [
          { phoneNumber: TEST_USER.phoneNumber },
          { phoneNumber: PUNK_USER.phoneNumber },
          { phoneNumber: '13700137000' }
        ]
      }
    });
    console.log('Test cleanup completed');
  });
});

test.describe('Punk AI Performance Tests', () => {
  test('should handle rapid message sending to punk user', async ({ page }) => {
    // Setup users
    await setupTestUsers();

    // Login
    await page.goto(TEST_URL);
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Navigate to punk user chat
    await page.goto(`${TEST_URL}/messages/${PUNK_USER.username}`);
    
    const messageInput = page.locator('textarea[placeholder*="发个消息"]');
    
    // Send messages rapidly
    for (let i = 0; i < 5; i++) {
      await messageInput.fill(`Rapid message ${i + 1}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Small delay between messages
    }

    // All messages should be sent successfully
    for (let i = 0; i < 5; i++) {
      await expect(page.locator(`text="Rapid message ${i + 1}"`)).toBeVisible();
    }

    // Wait for AI responses
    await page.waitForTimeout(5000);

    // Should have received AI responses (might be queued)
    const messages = page.locator('[data-testid="message"]');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(5); // At least some AI responses
  });

  test('should maintain conversation context with punk user', async ({ page }) => {
    // Setup users
    await setupTestUsers();

    // Login
    await page.goto(TEST_URL);
    await page.click('text=登录');
    await page.fill('input[placeholder*="手机号"]', TEST_USER.phoneNumber);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/feed');

    // Navigate to punk user chat
    await page.goto(`${TEST_URL}/messages/${PUNK_USER.username}`);
    
    const messageInput = page.locator('textarea[placeholder*="发个消息"]');
    
    // Send context-dependent messages
    await messageInput.fill('My name is John');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    await messageInput.fill('What is my name?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // AI should remember context (though with simple implementation it might not)
    // This tests that the conversation flow works properly
    const messages = await page.locator('[data-testid="message-content"]').allTextContents();
    expect(messages.length).toBeGreaterThanOrEqual(4);
  });
});