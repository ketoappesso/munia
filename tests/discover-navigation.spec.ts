import { test, expect } from '@playwright/test';

test.describe('Discover Navigation Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/feed');
    await page.setViewportSize({ width: 375, height: 812 }); // Mobile viewport
    
    // Wait for page to load
    await page.waitForTimeout(2000);
  });

  test('should have + icon button on feed page', async ({ page }) => {
    const plusButton = page.locator('a[href="/discover"]');
    await expect(plusButton).toBeVisible();
    
    const plusIcon = plusButton.locator('svg');
    await expect(plusIcon).toBeVisible();
  });

  test('should navigate to discover page when + icon is clicked', async ({ page }) => {
    const plusButton = page.locator('a[href="/discover"]');
    await plusButton.click();
    
    // Wait for navigation and check URL
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/discover');
    
    // Check if discover content is visible
    const discoverContent = page.locator('div:has-text("Discover"), h1:has-text("Discover")');
    await expect(discoverContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have back arrow instead of hamburger on discover page', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(2000);
    
    // Look for back button specifically
    const backButton = page.locator('button:has(svg[fill="gray"])');
    await expect(backButton).toBeVisible({ timeout: 10000 });
    
    // Should not have hamburger menu (settings button)
    const settingsButton = page.locator('button:has-text("Settings")');
    await expect(settingsButton).not.toBeVisible();
  });

  test('should navigate back to feed when back arrow is clicked', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(2000);
    
    const backButton = page.locator('button:has(svg[fill="gray"])');
    await backButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    // Should navigate back to feed page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/feed');
  });

  test('should not have discover in bottom navigation bar', async ({ page }) => {
    // Check that discover is not in the visible navigation
    const discoverLinks = page.locator('a[href="/discover"]');
    const discoverLinkCount = await discoverLinks.count();
    
    // Should only have the + icon, not in menu bar
    expect(discoverLinkCount).toBe(1);
    
    // Verify the + icon is in the header, not menu bar
    const headerDiscoverLink = page.locator('div:has(> a[href="/discover"])');
    await expect(headerDiscoverLink).toBeVisible();
  });

  test('should maintain discover page functionality', async ({ page }) => {
    await page.goto('/discover');
    await page.waitForTimeout(2000);
    
    // Verify discover page components are still functional
    const discoverTitle = page.locator('div:has-text("Discover"), h1:has-text("Discover")');
    await expect(discoverTitle.first()).toBeVisible({ timeout: 10000 });
    
    // Check for search functionality
    const searchElements = page.locator('input, button').filter({ hasText: /search|Search/i });
    await expect(searchElements.first()).toBeVisible({ timeout: 10000 });
    
    // Check for discover content
    const discoverContent = page.locator('div:has-text("Discover"), [data-test*="discover"]');
    await expect(discoverContent.first()).toBeVisible({ timeout: 10000 });
  });
});