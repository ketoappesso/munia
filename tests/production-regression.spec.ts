import { test, expect } from '@playwright/test';

// Use production URL
const PROD_URL = 'https://xyuan.chat';
const TEST_USER = {
  phone: '18874748888',
  password: '123456'
};

test.describe('Production Regression Tests', () => {
  test('should access homepage', async ({ page }) => {
    await page.goto(PROD_URL);
    await expect(page).toHaveURL(PROD_URL + '/');

    // Check if redirected to login or feed
    const url = page.url();
    expect([`${PROD_URL}/`, `${PROD_URL}/login`, `${PROD_URL}/feed`]).toContain(url);
  });

  test('should login successfully', async ({ page }) => {
    await page.goto(PROD_URL + '/login');

    // Fill login form
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to feed
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Verify we're on feed page
    expect(page.url()).toBe(`${PROD_URL}/feed`);
  });

  test('should access feed page after login', async ({ page }) => {
    // First login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Check feed page elements
    await expect(page.locator('text=关注').or(page.locator('text=Following'))).toBeVisible();
    await expect(page.locator('text=发现').or(page.locator('text=Discover'))).toBeVisible();
    await expect(page.locator('text=任务').or(page.locator('text=Tasks'))).toBeVisible();
  });

  test('should access messages page', async ({ page }) => {
    // First login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Navigate to messages
    await page.goto(PROD_URL + '/messages');
    await expect(page).toHaveURL(`${PROD_URL}/messages`);

    // Check messages page loaded
    await expect(page.locator('h1:has-text("消息")').or(page.locator('h1:has-text("Messages")'))).toBeVisible();
  });

  test('should access profile page', async ({ page }) => {
    // First login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Navigate to profile
    await page.goto(PROD_URL + '/18874748888');

    // Check profile page elements
    await expect(page.locator('text=粉丝').or(page.locator('text=Followers'))).toBeVisible();
    await expect(page.locator('text=关注').or(page.locator('text=Following'))).toBeVisible();
  });

  test('should handle session expiry gracefully', async ({ page, context }) => {
    // First login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Clear cookies to simulate session expiry
    await context.clearCookies();

    // Try to access protected page
    await page.goto(PROD_URL + '/feed');

    // Should redirect to login
    await page.waitForURL(`${PROD_URL}/login`, { timeout: 10000 });
    expect(page.url()).toBe(`${PROD_URL}/login`);
  });

  test('should show responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Check for mobile-specific elements
    // Should NOT have desktop MenuBar visible
    const menuBar = page.locator('.md\\:flex.hidden'); // Desktop MenuBar
    await expect(menuBar).not.toBeVisible();

    // Should have bottom navigation on mobile
    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    if (await bottomNav.count() > 0) {
      await expect(bottomNav).toBeVisible();
    }
  });

  test('should show desktop layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Navigate to messages to check MenuBar
    await page.goto(PROD_URL + '/messages');

    // Should have desktop MenuBar visible
    const menuBar = page.locator('.md\\:flex').first();
    await expect(menuBar).toBeVisible();
  });

  test('should create and view a post', async ({ page }) => {
    // Login
    await page.goto(PROD_URL + '/login');
    await page.fill('input[name="phone"]', TEST_USER.phone);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${PROD_URL}/feed`, { timeout: 10000 });

    // Click create post button
    const createPostButton = page.locator('button:has-text("发布内容")').or(page.locator('button:has-text("Create Post")'));
    await createPostButton.click();

    // Fill post content
    const timestamp = Date.now();
    const postContent = `Test post from regression test - ${timestamp}`;
    await page.fill('textarea', postContent);

    // Submit post
    await page.click('button:has-text("发布")');

    // Wait for modal to close
    await page.waitForTimeout(2000);

    // Check if post appears in feed
    await expect(page.locator(`text=${postContent}`)).toBeVisible({ timeout: 10000 });
  });
});