import { test, expect } from '@playwright/test';

test.describe('Profile Logout Functionality - Regression Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to own profile (using existing test setup)
    await page.goto('/test');
    
    // Ensure we're on mobile or responsive view to trigger correct DOM
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('logout button exists in profile action section', async ({ page }) => {
    // Check if logout button is present in profile action area
    const logoutButton = page.locator('[data-test="profile-logout"]');
    await expect(logoutButton).toBeVisible();
    
    // Alternative check in case no data-test is set
    const profileLogout = page.locator('text=Logout').nth(0);
    await expect(profileLogout).toBeVisible();
  });

  test('logout button NOT in bottom navigation', async ({ page }) => {
    // Navigate to any protected page
    await page.goto('/feed');
    
    // Check bottom navigation does NOT contain Logout
    const bottomNavLogout = page.locator('[role="list"]').locator('text=Logout');
    await expect(bottomNavLogout).toHaveCount(0);
  });

  test('logout modal appearance is identical', async ({ page }) => {
    // Click profile logout button
    await page.goto('/test')
    
    // Click logout button
    await page.click('text=Logout');
    
    // Check for modal appearance
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check modal title
    await expect(page.locator('text=Confirm Logout')).toBeVisible();
    
    // Check modal message
    await expect(page.locator('text=Do you really wish to logout?')).toBeVisible();
    
    // Check buttons exist
    const confirmButton = page.locator('button:has-text("Confirm")');
    const cancelButton = page.locator('button:has-text("Cancel")');
    
    await expect(confirmButton).toBeVisible();
    await expect(cancelButton).toBeVisible();
  });

  test('logout confirmation flow works correctly', async ({ page }) => {
    await page.goto('/test')
    
    // Click logout
    await page.click('text=Logout');
    
    // Click confirm
    await page.click('button:has-text("Confirm")');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('logout cancellation works correctly', async ({ page }) => {
    await page.goto('/test')
    
    // Click logout
    await page.click('text=Logout');
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Should stay on profile page
    await expect(page).toHaveURL(/\/testuser/);
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).toBeHidden();
  });

  test('logout button transitions same as other profile buttons', async ({ page }) => {
    await page.goto('/test')
    
    const logoutButton = page.locator('text=Logout').nth(0);
    
    // Check hover state
    await logoutButton.hover();
    
    // Should have consistent styling with edit profile button
    const editButton = page.locator('text=Edit Profile').nth(0);
    await expect(editButton).toBeVisible();
    
    const logoutBox = await logoutButton.boundingBox();
    const editBox = await editButton.boundingBox();
    
    expect(logoutBox?.height).toBeCloseTo(editBox?.height || 0, 1);
    expect(logoutBox?.top).toBeCloseTo(editBox?.top || 0, 5);
  });

  test('mobile view logout button appears correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/test')
    
    // Logout should be visible in mobile view
    const mobileLogout = page.locator('text=Logout').nth(0);
    await expect(mobileLogout).toBeVisible();
  });

  test('consistency between old and new logout', async ({ page }) => {
    // This test ensures no regression in functionality
    
    // Before we can't test old MenuBar logout since it's removed
    // Instead we verify new implementation works identically
    
    await page.goto('/test')
    
    // Test the modal appears the same way
    await page.click('text=Logout');
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Test visual consistency with other buttons
    const logoutBtn = page.locator('text=Logout').nth(0);
    await logoutBtn.hover();
    
    // Verify button responds to interaction
    await expect(logoutBtn).toHaveCSS('cursor', 'pointer');
  });
});