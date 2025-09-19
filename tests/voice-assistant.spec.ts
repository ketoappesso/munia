import { test, expect } from '@playwright/test';

test.describe('Voice Assistant Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    // Perform login
    await page.click('text=登录');
    await page.fill('input[name="phone"]', '13800138000');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect after successful login
    await page.waitForURL(/\/(messages|feed)/);
  });

  test('should display voice assistant page', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');

    // Check page title
    await expect(page.locator('h1')).toContainText('智能语音助手');

    // Check feature cards are displayed
    await expect(page.locator('text=实时语音对话')).toBeVisible();
    await expect(page.locator('text=多角色切换')).toBeVisible();
    await expect(page.locator('text=音色克隆')).toBeVisible();

    // Check start button
    const startButton = page.locator('button:has-text("开始体验")');
    await expect(startButton).toBeVisible();
  });

  test('should open voice assistant modal', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');

    // Click start button
    await page.click('button:has-text("开始体验")');

    // Check modal appears
    await expect(page.locator('.fixed.inset-0')).toBeVisible();

    // Check close button
    const closeButton = page.locator('button:has(svg[class*="X"])');
    await expect(closeButton).toBeVisible();

    // Check VoiceAssistant component is rendered
    await expect(page.locator('[data-testid="voice-assistant-component"]')).toBeVisible();
  });

  test('should close voice assistant modal', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');

    // Open modal
    await page.click('button:has-text("开始体验")');
    await expect(page.locator('.fixed.inset-0')).toBeVisible();

    // Close modal
    await page.click('button:has(svg[class*="X"])');

    // Check modal is closed
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
    await expect(page.locator('button:has-text("开始体验")')).toBeVisible();
  });

  test('should check WebSocket connection to voice service', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');

    // Monitor WebSocket connections
    const wsPromise = page.waitForEvent('websocket');

    // Open voice assistant
    await page.click('button:has-text("开始体验")');

    // Wait for WebSocket connection
    const ws = await wsPromise;
    expect(ws.url()).toContain('wss://xyuan.chat/voice-ws/');

    // Check WebSocket is connected
    await page.waitForTimeout(1000);

    // Verify connection status indicator
    await expect(page.locator('[data-testid="connection-status"]')).toHaveAttribute('data-status', 'connected');
  });

  test('should fetch voice devices from API', async ({ page, request }) => {
    // Test API endpoint directly
    const response = await request.get('https://xyuan.chat/api/voice/devices');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('devices');
    expect(Array.isArray(data.devices)).toBeTruthy();
  });

  test('should fetch voice roles from API', async ({ page, request }) => {
    // Test API endpoint directly
    const response = await request.get('https://xyuan.chat/api/voice/roles');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('roles');
    expect(Array.isArray(data.roles)).toBeTruthy();
  });

  test('should handle microphone permissions', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    await page.goto('https://xyuan.chat/voice-assistant');
    await page.click('button:has-text("开始体验")');

    // Wait for component to load
    await page.waitForSelector('[data-testid="voice-assistant-component"]');

    // Check microphone button is enabled
    const micButton = page.locator('[data-testid="mic-button"]');
    await expect(micButton).toBeVisible();
    await expect(micButton).toBeEnabled();
  });

  test('should display conversation messages', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');
    await page.click('button:has-text("开始体验")');

    // Wait for component
    await page.waitForSelector('[data-testid="voice-assistant-component"]');

    // Check messages container exists
    const messagesContainer = page.locator('[data-testid="messages-container"]');
    await expect(messagesContainer).toBeVisible();

    // Check welcome message if exists
    const welcomeMessage = messagesContainer.locator('text=/欢迎|您好|开始/');
    if (await welcomeMessage.count() > 0) {
      await expect(welcomeMessage.first()).toBeVisible();
    }
  });

  test('should switch between voice roles', async ({ page }) => {
    await page.goto('https://xyuan.chat/voice-assistant');
    await page.click('button:has-text("开始体验")');

    // Wait for component
    await page.waitForSelector('[data-testid="voice-assistant-component"]');

    // Look for role selector
    const roleSelector = page.locator('[data-testid="role-selector"]');
    if (await roleSelector.count() > 0) {
      await expect(roleSelector).toBeVisible();

      // Click to open role options
      await roleSelector.click();

      // Check role options are displayed
      await expect(page.locator('[data-testid="role-option"]').first()).toBeVisible();
    }
  });

  test('should handle voice recording', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    await page.goto('https://xyuan.chat/voice-assistant');
    await page.click('button:has-text("开始体验")');

    // Wait for component
    await page.waitForSelector('[data-testid="voice-assistant-component"]');

    // Click microphone button to start recording
    const micButton = page.locator('[data-testid="mic-button"]');
    await micButton.click();

    // Check recording state
    await expect(micButton).toHaveAttribute('data-recording', 'true');

    // Stop recording
    await micButton.click();

    // Check recording stopped
    await expect(micButton).toHaveAttribute('data-recording', 'false');
  });
});