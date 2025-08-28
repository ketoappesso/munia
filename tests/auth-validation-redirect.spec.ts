import { test, expect } from '@playwright/test';

test.describe('Authentication Validation and Redirect Flow', () => {
  test('should prevent access to messages without authentication', async ({ page }) => {
    await page.goto('http://localhost:3002/messages');
    
    // Verify redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    
    // Verify redirect parameter
    const url = new URL(page.url());
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.has('redirect')).toBe(true);
  });

  test('should maintain redirect chain after successful login', async ({ page }) => {
    // Try to access protected route
    await page.goto('http://localhost:3002/messages/testuser1');
    
    // Should redirect to login
    const loginUrl = page.url();
    expect(loginUrl).toContain('/login');
    
    // Login success should redirect to original destination
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should end up at original destination
    await expect(page).toHaveURL(/\/messages\/testuser1/);
  });

  test('should handle OAuth authentication flow properly', async ({ page }) => {
    await page.goto('http://localhost:3002/login');
    
    // Check for OAuth providers
    const githubButton = page.getByRole('button', { name: /github/i });
    const googleButton = page.getByRole('button', { name: /google/i });
    
    // Should have OAuth options visible
    await expect(page.getByText('Or continue with')).toBeVisible();
    
    // Test redirect capabilities for OAuth
    await githubButton.click();
    
    // Should redirect to GitHub OAuth
    await expect(page.url()).toMatch(/github\.com\/.*auth/);
  });

  test('should validate registration form fields', async ({ page }) => {
    await page.goto('http://localhost:3002/register');
    
    // Test empty field validation
    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await expect(submitButton).toBeDisabled();

    // Test phone format validation
    await page.getByLabel('Phone Number').fill('123');
    await expect(page.getByText('Invalid phone')).toBeVisible();
    
    await page.getByLabel('Phone Number').fill('13800138000');
    await expect(page.getByText('Invalid phone')).not.toBeVisible();
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    // Simulate expired session
    await page.evaluate(() => {
      document.cookie = 'next-auth.session-token=expired; max-age=0';
    });
    
    await page.goto('http://localhost:3002/messages');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain login state across page navigation', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.getByLabel('Phone Number').fill('13800138000');
    await page.getByLabel('Password').fill('testpass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Navigate to several pages
    await page.goto('http://localhost:3002/feeds');
    await expect(page.getByText('主页')).toBeVisible();
    
    await page.goto('http://localhost:3002/messages');
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
  });
});