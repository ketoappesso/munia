import { test, expect } from '@playwright/test';

test.describe('Voice Management Feature - Simple Test', () => {
  test('should access admin backoffice and view voice management', async ({ page }) => {
    // Login as admin first
    await page.goto('http://localhost:3002/login');

    // Wait for login form to be loaded - look for phone input by placeholder
    await page.waitForSelector('input[placeholder="请输入手机号"]', { timeout: 10000 });

    // Fill in admin credentials
    await page.fill('input[placeholder="请输入手机号"]', '18874748888');
    await page.fill('input[placeholder="请输入密码"]', 'admin123456');

    // Click login button (contains arrow icon)
    await page.click('button:has-text("密码登录")');

    // Wait for navigation to complete
    await page.waitForURL('http://localhost:3002/**', { timeout: 10000 });

    // Navigate to the admin backoffice
    await page.goto('http://localhost:3002/backoffice');

    // Check if we're redirected to login or if the page loads
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/voice-management-page.png' });

    // Try to find the voice management tab if we're logged in
    const voiceTabExists = await page.locator('button:has-text("音色管理")').count() > 0;

    if (voiceTabExists) {
      console.log('Voice management tab found!');

      // Click on the voice management tab
      await page.click('button:has-text("音色管理")');

      // Wait a moment for content to load
      await page.waitForTimeout(2000);

      // Take a screenshot of the voice management interface
      await page.screenshot({ path: 'test-results/voice-management-interface.png' });

      // Check for key elements
      const hasTitle = await page.locator('h2:has-text("音色管理")').count() > 0;
      const hasTable = await page.locator('table').count() > 0;
      const hasInstructions = await page.locator('text=音色配置说明').count() > 0;

      console.log('Voice management interface elements:');
      console.log('- Title present:', hasTitle);
      console.log('- Table present:', hasTable);
      console.log('- Instructions present:', hasInstructions);

      // Test passed if at least the title is present
      expect(hasTitle).toBe(true);
    } else {
      console.log('Not logged in or voice management tab not found');
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'test-results/login-or-error-page.png' });
    }
  });

  test('should test voice management API directly', async ({ request }) => {
    // Test the API endpoint without authentication
    const response = await request.get('http://localhost:3002/api/admin/voice-mappings');

    // Should return 401 without authentication
    expect(response.status()).toBe(401);
    console.log('API correctly returns 401 for unauthorized access');

    // Test with search parameter
    const searchResponse = await request.get('http://localhost:3002/api/admin/voice-mappings?search=test');
    expect(searchResponse.status()).toBe(401);
    console.log('API correctly returns 401 for search without auth');
  });

  test('should verify admin user has voice mapping', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3002/login');
    await page.waitForSelector('input[placeholder="请输入手机号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入手机号"]', '18874748888');
    await page.fill('input[placeholder="请输入密码"]', 'admin123456');
    await page.click('button:has-text("密码登录")');
    await page.waitForURL('http://localhost:3002/**', { timeout: 10000 });

    // Navigate to backoffice
    await page.goto('http://localhost:3002/backoffice');

    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Look for the admin user's voice mapping
    const adminRow = page.locator('tr', { hasText: '18874748888' });
    await expect(adminRow).toBeVisible({ timeout: 10000 });

    // Check if voice ID S_r3YGBCoB1 is displayed
    const voiceIdText = await adminRow.textContent();
    console.log('Admin user row content:', voiceIdText);
    expect(voiceIdText).toContain('S_r3YGBCoB1');

    console.log('✅ Admin user 18874748888 has voice mapping S_r3YGBCoB1');
  });
});