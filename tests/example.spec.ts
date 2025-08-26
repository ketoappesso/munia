import { test, expect } from '@playwright/test';

test('homepage has title and links to login page', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Munia/);

  // Check if login link exists
  const loginLink = page.getByRole('link', { name: /login/i });
  await expect(loginLink).toBeVisible();
});

test('login page loads correctly', async ({ page }) => {
  await page.goto('/login');

  // Check if email input exists
  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).toBeVisible();

  // Check if password input exists
  const passwordInput = page.getByLabel(/password/i);
  await expect(passwordInput).toBeVisible();

  // Check if login button exists
  const loginButton = page.getByRole('button', { name: /login/i });
  await expect(loginButton).toBeVisible();
});

test('register page loads correctly', async ({ page }) => {
  await page.goto('/register');

  // Check if registration form elements exist
  const nameInput = page.getByLabel(/name/i);
  await expect(nameInput).toBeVisible();

  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).toBeVisible();

  const passwordInput = page.getByLabel(/password/i);
  await expect(passwordInput).toBeVisible();

  const registerButton = page.getByRole('button', { name: /register/i });
  await expect(registerButton).toBeVisible();
});