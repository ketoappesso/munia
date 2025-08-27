import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('register page loads and accepts phone registration', async ({ page }) => {
    await page.goto('/register');

    // Verify the title
    await expect(page).toHaveTitle(/Munia.*Sign Up/);

    // Check if the main elements are present
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    // Test phone registration mode
    const phoneTab = page.getByRole('button', { name: 'Phone' }).first();
    await expect(phoneTab).toBeVisible();
    await phoneTab.click();

    // Check phone registration elements
    await expect(page.getByLabel('Phone Number')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up with Phone' })).toBeVisible();

    // Test phone number validation
    const phoneInput = page.getByLabel('Phone Number');
    const passwordInput = page.getByLabel('Password');

    // Test valid phone number format
    await phoneInput.fill('+1-123-456-7890');
    await passwordInput.fill('password123');

    // Validation should show as valid (no error)
    const errorMessages = await page.locator('[aria-invalid="true"]').count();
    expect(errorMessages).toBe(0);
  });

  test('phone number validation accepts various formats', async ({ page }) => {
    await page.goto('/register');

    // Switch to phone mode
    await page.getByRole('button', { name: 'Phone' }).first().click();
    
    const phoneInput = page.getByLabel('Phone Number');

    // Test valid formats
    const validFormats = [
      '+1234567890',
      '123-456-7890',
      '(123) 456-7890',
      '123 456 7890',
      '+1 234 567 8900'
    ];

    for (const format of validFormats) {
      await phoneInput.fill(format);
      await page.getByLabel('Password').fill('test123456');
      
      // Should not show validation error for valid formats
      const errorText = await page.textContent('[data-testid="error-message"]');
      expect(errorText).not.toContain('Invalid phone number');
    }

    // Test invalid formats
    await phoneInput.fill('123');
    await page.getByLabel('Password').fill('test123456');
    
    // Should show validation error
    const lengthError = await page.locator('text=Phone number must be at least 10 characters');
    expect(await lengthError.count()).toBeGreaterThan(0);
  });

  test('email registration mode is available', async ({ page }) => {
    await page.goto('/register');

    // Default should show email tab
    const emailTab = page.getByRole('button', { name: 'Email' }).first();
    expect(emailTab).toBeVisible();

    // Email input should be visible by default
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});