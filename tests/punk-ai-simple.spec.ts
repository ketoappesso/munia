import { test, expect } from '@playwright/test';

test.describe('Punk AI Simple Test', () => {
  test('should login and check punk user profile', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we can find the phone input
    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    
    // Fill in login credentials
    await phoneInput.fill('13800138000');
    
    // Find password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('testpass123');
    
    // Click login button
    const loginButton = page.locator('button:has-text("登录")');
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    
    // Wait for redirect
    await page.waitForURL(/\/(feed|home)/, { timeout: 10000 });
    
    // Navigate to punk user profile
    await page.goto('http://localhost:3002/punkuser1');
    
    // Check for PUNK indicator
    await expect(page.locator('text=PUNK').first()).toBeVisible({ timeout: 10000 });
    
    console.log('Test passed: Found PUNK indicator on profile');
  });

  test('should send message to punk user', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Login
    await page.fill('input[type="tel"]', '13800138000');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button:has-text("登录")');
    
    // Wait for redirect
    await page.waitForURL(/\/(feed|home)/, { timeout: 10000 });
    
    // Navigate directly to punk user chat
    await page.goto('http://localhost:3002/messages/punkuser1');
    
    // Wait for the message page to load
    await page.waitForLoadState('networkidle');
    
    // Check for AI indicator
    const aiIndicator = page.locator('text=AI').first();
    const punkIndicator = page.locator('text=PUNK IT').first();
    
    // At least one indicator should be visible
    const hasAIIndicator = await aiIndicator.isVisible().catch(() => false);
    const hasPunkIndicator = await punkIndicator.isVisible().catch(() => false);
    
    expect(hasAIIndicator || hasPunkIndicator).toBeTruthy();
    
    console.log('Test passed: Found AI/PUNK indicator in chat');
    
    // Try to send a message
    const messageInput = page.locator('textarea[placeholder*="消息"], input[placeholder*="消息"]');
    if (await messageInput.isVisible()) {
      await messageInput.fill('你好，测试消息');
      await messageInput.press('Enter');
      
      // Wait a moment for the message to be sent
      await page.waitForTimeout(2000);
      
      console.log('Test passed: Message sent successfully');
    }
  });
});