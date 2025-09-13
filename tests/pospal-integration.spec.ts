import { test, expect } from '@playwright/test';

test.describe('Pospal Integration', () => {
  test('should fetch member info from Pospal API', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');

    // Login with admin account
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', 'password123'); // Use test password
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to My Space page
    await page.goto('http://localhost:3002/my-space');

    // Wait for member info to load
    await page.waitForSelector('[data-testid="member-status"]', { timeout: 10000 });

    // Check that member info is displayed
    const memberStatus = await page.locator('[data-testid="member-status"]').textContent();
    expect(memberStatus).toBeTruthy();

    // Check for member level
    const memberLevel = await page.locator('[data-testid="member-level"]').textContent();
    expect(memberLevel).toBeTruthy();

    // Check for balance display
    const balance = await page.locator('[data-testid="member-balance"]').textContent();
    expect(balance).toContain('余额');

    // Check for face upload section
    const uploadSection = await page.locator('[data-testid="face-upload-section"]');
    await expect(uploadSection).toBeVisible();
  });

  test('should handle face image upload', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');

    // Login with admin account
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to My Space page
    await page.goto('http://localhost:3002/my-space');

    // Wait for page to load
    await page.waitForSelector('[data-testid="face-upload-section"]', { timeout: 10000 });

    // Check upload button exists
    const uploadButton = await page.locator('input[type="file"]');
    await expect(uploadButton).toBeVisible();
  });

  test('should display admin backoffice link for admin user', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');

    // Login with admin account
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Check for backoffice link in menu
    const backofficeLink = await page.locator('a[href="/backoffice"]');
    await expect(backofficeLink).toBeVisible();

    // Navigate to backoffice
    await backofficeLink.click();
    await page.waitForURL('**/backoffice', { timeout: 10000 });

    // Check backoffice page loaded
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('后台');
  });
});