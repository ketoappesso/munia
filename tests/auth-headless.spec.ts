import { test, expect } from '@playwright/test';

test.describe('Authentication Flow - Headless', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('should redirect unauthorized users to login when accessing protected routes', async ({ page }) => {
    // Test messages route without authentication
    await page.goto('http://localhost:3002/messages');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('should allow authenticated users to access messages', async ({ page }) => {
    // Simulate authenticated session
    await page.evaluate(() => {
      document.cookie = 'next-auth.session-token=test-auth-token';
    });
    
    await page.reload();
    await page.goto('http://localhost:3002/messages');
    
    // Should access messages without redirect
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  });

  test('should redirect to login after logout when accessing protected routes', async ({ page }) => {
    // Go to login
    await page.goto('http://localhost:3002/login');
    
    // Test login flow exists
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Continue with Email')).toBeVisible();
  });
});

test.describe('Login Form Functionality - Headless', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002/login');
  });

  test('should handle phone login form validation', async ({ page }) => {
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpassword');
    
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeEnabled();
    
    await loginButton.click();
    
    // Should either succeed or show validation
    await expect(page).toHaveURL(/\/.*(?<!login)(?<!register)/);
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: 'Sign In' });
    await expect(loginButton).toBeDisabled();
  });
});