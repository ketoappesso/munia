import { test, expect } from '@playwright/test';

test('verify feed page responsive design', async ({ page }) => {
  // Navigate to login page on localhost
  await page.goto('http://localhost:3002/login');

  // Wait for login page to load
  await page.waitForSelector('input[name="phoneNumber"]', { timeout: 10000 });

  // Login with credentials
  await page.fill('input[name="phoneNumber"]', '18874748888');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('**/feed', { timeout: 10000 });

  // Check desktop layout (sidebar should be visible on desktop viewport)
  await page.setViewportSize({ width: 1280, height: 720 });

  // Check for left sidebar on desktop - MenuBar component
  const desktopSidebar = page.locator('.md\\:sticky.md\\:w-\\[212px\\]');
  await expect(desktopSidebar).toBeVisible({ timeout: 5000 });

  // Check for two-column grid on desktop
  const gridContainer = page.locator('.grid.lg\\:grid-cols-2');
  await expect(gridContainer).toBeVisible({ timeout: 5000 });

  // Check mobile layout (bottom navigation should be visible)
  await page.setViewportSize({ width: 375, height: 667 });

  // Check for bottom navigation on mobile
  const mobileNav = page.locator('.fixed.bottom-0.z-\\[2\\]');
  await expect(mobileNav).toBeVisible({ timeout: 5000 });

  // Sidebar should not be visible on mobile
  await expect(desktopSidebar).not.toBeVisible();

  console.log('✅ Feed page responsive design verified successfully!');
});