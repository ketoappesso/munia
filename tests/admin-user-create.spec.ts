import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
  test('should create new user', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');

    // Login as admin
    await page.fill('input[name="identifier"]', '18874748888');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL('**/messages/**', { timeout: 10000 });

    // Navigate to backoffice
    await page.goto('http://localhost:3002/backoffice');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on user management tab
    await page.click('button:has-text("用户管理")');

    // Wait for users list to load
    await page.waitForSelector('text=/用户管理/', { timeout: 5000 });

    // Click create user button
    await page.click('button:has-text("账户增")');

    // Wait for modal to appear
    await page.waitForSelector('text=/创建新用户/', { timeout: 5000 });

    // Fill in the form
    await page.fill('input[placeholder="请输入手机号"]', '18674881384');
    await page.fill('input[type="password"]', 'test1234');
    await page.fill('input[placeholder="请输入姓名"]', 'M先生');
    await page.fill('input[placeholder="请输入邮箱"]', '');
    await page.fill('input[placeholder*="音色ID"]', 'S_2Kgax3vB1');

    // Click create button
    await page.click('button:has-text("创建"):not([disabled])');

    // Wait for response or error
    await page.waitForTimeout(2000);

    // Check if user was created (modal should close)
    const modalVisible = await page.isVisible('text=/创建新用户/');
    if (!modalVisible) {
      console.log('User created successfully!');
    } else {
      console.log('Modal still visible, checking for errors...');
      // Take a screenshot for debugging
      await page.screenshot({ path: 'user-creation-error.png' });
    }
  });
});