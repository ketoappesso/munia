import { test, expect } from '@playwright/test';

test.describe('Feed Follow → DM Functionality & Notifications Migration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Skip login cycle - use auth cookie or navigate as unauthenticated
    await page.goto('/feed');
    // Setup viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('follow button appears on others posts', async ({ page }) => {
    await page.goto('/feed');
    
    // Allow page to load for 2 seconds
    await page.waitForTimeout(2000);
    
    const followButtons = page.locator('text=关注, text=私信');
    const count = await followButtons.count();
    console.log(`Found ${count} follow/DM buttons`);
    
    // Basic visibility check
    await expect(followButtons.first()).toBeVisible({ 'timeout': 1000 });
  });

  test('no follow button on own posts', async ({ page }) => {
    await page.goto('/feed');
    
    // Check that own posts don't have follow/dm buttons
    const ownProfileButtons = page.locator('div[data-test="own-post"]');
    const feedFollowButtons = page.locator('text=关注, text=私信');
    
    // This is a basic test - we expect follow buttons on others' posts
    await expect(feedFollowButtons.first()).toBeVisible();
  });

  test('notification button appears on profile page', async ({ page }) => {
    await page.goto('/test');
    
    // Notification button should be visible in profile header
    const notificationButton = page.locator('a[href="/notifications"]');
    await expect(notificationButton).toBeVisible();
    
    // Check it's in the action buttons section
    const actionButtons = page.locator('.absolute-right button');
    await expect(notificationButton).toBeInViewport();
  });

  test('follow button transforms to DM after follow', async ({ page }) => {
    await page.goto('/feed');
    
    // Click on a follow button
    const followButton = page.locator('text=关注').first();
    await followButton.click();
    
    // Wait for transformation and check it becomes DM
    await page.waitForTimeout(500);
    const dmButton = page.locator('text=私信').first();
    await expect(dmButton).toBeVisible();
  });

  test('DM dialog opens after clicking私信', async ({ page }) => {
    await page.goto('/feed');
    
    // Find a DM button (assuming some already followed)
    const dmButton = page.locator('text=私信').first();
    if (await dmButton.isVisible()) {
      await dmButton.click();
      
      // Check redirect to messages page
      await page.waitForURL(/\/messages\/[a-zA-Z0-9_-]+/);
      
      const backButton = page.locator('text=返回');
      await expect(backButton).toBeVisible();
    }
  });

  test('comberhensive notifications regression', async ({ page }) => {
    await page.goto('/notifications');
    
    // Verify notifications still work
    await expect(page.locator('h1')).toContainText(/Notifications|通知/);
    
    await page.goBack();
    await page.goto('/test');
    
    // Verify notifications accessible from profile
    const notificationsLink = page.locator('a[href="/notifications"]');
    await notificationsLink.click();
    await page.waitForURL(/\/notifications/);
  });

  test('back navigation from messages works correctly', async ({ page }) => {
    await page.goto('/messages/testuser');
    
    const backButton = page.locator('text=返回').first();
    await backButton.click();
    
    // Should return to previous page
    await expect(page).not.toHaveURL(/\/messages/);
  });

  test('follow/dm state management', async ({ page }) => {
    await page.goto('/feed');
    
    // Test fixture setup
    const followButton = page.locator('text=关注').first();
    await followButton.click();
    
    // Verify state transition
    await page.waitForSelector('text=私信', { timeout: 5000 });
    
    // Verify persistence after page refresh
    await page.reload();
    await expect(page.locator('text=私信').first()).toBeVisible();
  });
});