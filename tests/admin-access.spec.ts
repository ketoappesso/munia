import { test, expect } from '@playwright/test';

const ADMIN_PHONE = '18874748888';
const ADMIN_PASSWORD = '123456'; // Default test password

test.describe('Admin Access Tests', () => {
  test('should allow admin user to access backoffice', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Fill in admin credentials - PhoneAuthForm uses TextInput components
    const phoneInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await phoneInput.fill(ADMIN_PHONE);
    await passwordInput.fill(ADMIN_PASSWORD);
    
    // Submit login form
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**/feed', { timeout: 10000 });
    
    // Check if we're logged in by looking for the hamburger menu
    const hamburgerMenu = page.locator('button').filter({ has: page.locator('svg.h-5.w-5.stroke-gray-700') }).last();
    await expect(hamburgerMenu).toBeVisible();
    
    // Click hamburger menu to open sidebar
    await hamburgerMenu.click();
    
    // Wait for sidebar to be visible
    await page.waitForSelector('[role="dialog"][aria-label="Navigation"]', { state: 'visible' });
    
    // Check for admin backoffice option in sidebar
    const backofficeLink = page.locator('text="我的后台"');
    await expect(backofficeLink).toBeVisible({ timeout: 5000 });
    
    // Click on backoffice link
    await backofficeLink.click();
    
    // Verify navigation to backoffice
    await page.waitForURL('**/backoffice');
    await expect(page).toHaveURL(/\/backoffice/);
    
    // Verify backoffice page content
    await expect(page.locator('h1:has-text("管理后台")')).toBeVisible();
  });
  
  test('should show admin menu only for admin phone number', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Login as admin
    const phoneInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await phoneInput.fill(ADMIN_PHONE);
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed');
    
    // Open sidebar
    const hamburgerMenu = page.locator('button').filter({ has: page.locator('svg.h-5.w-5.stroke-gray-700') }).last();
    await hamburgerMenu.click();
    await page.waitForSelector('[role="dialog"][aria-label="Navigation"]', { state: 'visible' });
    
    // Verify admin section exists
    const adminSection = page.locator('text="我的后台"');
    await expect(adminSection).toBeVisible();
    
    // Also check for the Shield icon (admin icon)
    const shieldIcon = page.locator('.from-red-500\\/10.to-orange-500\\/10');
    await expect(shieldIcon).toBeVisible();
  });
  
  test('should allow direct navigation to backoffice for admin', async ({ page }) => {
    // First login as admin
    await page.goto('http://localhost:3002/login');
    const phoneInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await phoneInput.fill(ADMIN_PHONE);
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed');
    
    // Try direct navigation to backoffice
    await page.goto('http://localhost:3002/backoffice');
    
    // Should not redirect away
    await expect(page).toHaveURL(/\/backoffice/);
    
    // Should see backoffice content
    await expect(page.locator('h1:has-text("管理后台")')).toBeVisible();
  });
  
  test('should check session data for phoneNumber field', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3002/login');
    const phoneInput = page.locator('input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    await phoneInput.fill(ADMIN_PHONE);
    await passwordInput.fill(ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed');
    
    // Navigate to a page where we can check session
    await page.goto('http://localhost:3002/api/auth/session');
    
    // Get the session JSON
    const sessionText = await page.locator('pre').textContent();
    const session = JSON.parse(sessionText || '{}');
    
    console.log('Session data:', session);
    
    // Check if phoneNumber exists in session
    expect(session.user).toBeDefined();
    expect(session.user.phoneNumber).toBe(ADMIN_PHONE);
  });
});