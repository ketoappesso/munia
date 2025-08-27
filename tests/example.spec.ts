import { test, expect } from '@playwright/test';

test('homepage has title and links to login page', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Munia/);

  // Check if login link exists
  const loginLink = page.getByRole('link', { name: /Login/i });
  await expect(loginLink).toBeVisible();
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');

  // Check if email/phone toggle buttons exist
  const emailTabs = page.getByRole('button', { name: 'Email', exact: true });
  await expect(emailTabs.first()).toBeVisible();

  const phoneTabs = page.getByRole('button', { name: 'Phone', exact: true });
  await expect(phoneTabs.first()).toBeVisible();
});

test('register page loads correctly', async ({ page }) => {
  await page.goto('/register');

  // Check if email/phone mode switch exists
  const emailButton = page.getByRole('button', { name: /Email/i });
  await expect(emailButton).toBeVisible();

  const phoneButton = page.getByRole('button', { name: /Phone/i });
  await expect(phoneButton).toBeVisible();

  // Check for phone-specific registration elements
  await phoneButton.click();
  
  const phoneInput = page.getByLabel(/Phone Number/i);
  await expect(phoneInput).toBeVisible();

  const passwordInput = page.getByLabel(/Password/i);
  await expect(passwordInput).toBeVisible();

  const signUpButton = page.getByRole('button', { name: /Sign up with Phone/i });
  await expect(signUpButton).toBeVisible();
});