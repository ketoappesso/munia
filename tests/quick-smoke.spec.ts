import { test, expect } from '@playwright/test';

test.describe('Registration Quick Smoke Test', () => {
  test('register page loads with phone registration enabled', async ({ page }) => {
    await page.goto('/register');

    // Basic page load assertion
    await expect(page).toHaveTitle('Appesso | Register');

    // Check header
    await expect(page.getByRole('heading', { name: 'Sign Up' })).toBeVisible();

    // Check form mode switching exists
    const emailButton = page.getByRole('button', { name: 'Email', exact: true });
    const phoneButton = page.getByRole('button', { name: 'Phone', exact: true });
    
    await expect(emailButton).toHaveCount(2); // Tabs are duplicated on login/register
    await expect(phoneButton).toHaveCount(2);

    // Test phone mode
    await phoneButton.first().click();
    
    // Phone inputs should be visible
    const phoneNumberInput = page.getByLabel('Phone Number');
    await expect(phoneNumberInput).toBeVisible();
    
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();

    // Test that form accepts various phone formats
    await phoneNumberInput.fill('1234567890');
    await passwordInput.fill('password123');
    
    // Validation should pass
    await expect(page.locator('text=Phone number must be at least 10 characters')).toHaveCount(0);
  });

  test('phone validation works with relaxed format', async ({ page }) => {
    await page.goto('/register');

    // Go to phone mode
    await page.getByRole('button', { name: 'Phone', exact: true }).first().click();
    
    const phoneInput = page.getByLabel('Phone Number');
    
    // Test various valid formats we now accept
    const formats = [
      '+1 (234) 567-8900',
      '123-456-7890', 
      '(123) 456-7890',
      '+1234567890'
    ];
    
    for (const format of formats) {
      await phoneInput.fill(format);
      await page.waitForTimeout(100); // Small delay for validation
      
      const errorVisible = await page.locator('text=Invalid phone number').isVisible();
      expect(errorVisible).toBe(false);
    }
  });
});