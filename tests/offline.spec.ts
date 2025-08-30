import { test, expect } from '@playwright/test';
import { createTestUser, login } from './helpers/auth';

test.describe('Offline Functionality', () => {
  test('should queue posts when offline and send when online', async ({ page, context }) => {
    // Create test user
    const user = await createTestUser();
    
    // Login
    await login(page, user.phone, user.password);
    
    // Go offline
    await context.setOffline(true);
    
    // Create a post while offline
    await page.click('button[aria-label="Create new post"]');
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Offline test post');
    await page.click('button:has-text("Post")');
    
    // Verify offline toast message
    await expect(page.getByText('Post queued for offline')).toBeVisible();
    await expect(page.getByText('Your post will be sent when you are back online')).toBeVisible();
    
    // Verify FAB shows offline indicator
    await expect(page.locator('.bg-yellow-500')).toBeVisible();
    await expect(page.getByText('1 post queued')).toBeVisible();
    
    // Go online
    await context.setOffline(false);
    
    // Wait for post to be sent
    await expect(page.getByText('Successfully Posted')).toBeVisible({ timeout: 10000 });
    
    // Verify post appears in feed
    await expect(page.getByText('Offline test post')).toBeVisible();
    
    // Verify FAB indicators are gone
    await expect(page.locator('.bg-yellow-500')).not.toBeVisible();
    await expect(page.getByText('post queued')).not.toBeVisible();
  });

  test('should maintain post order when multiple posts are queued offline', async ({ page, context }) => {
    const user = await createTestUser();
    await login(page, user.phone, user.password);
    
    // Go offline
    await context.setOffline(true);
    
    // Create multiple posts with timestamps
    const posts = [
      { content: 'First offline post', delay: 100 },
      { content: 'Second offline post', delay: 200 },
      { content: 'Third offline post', delay: 300 },
    ];
    
    for (const post of posts) {
      await page.click('button[aria-label="Create new post"]');
      await page.fill('textarea[placeholder="What\'s on your mind?"]', post.content);
      await page.click('button:has-text("Post")');
      await page.waitForTimeout(post.delay);
    }
    
    // Verify all posts are queued
    await expect(page.getByText('3 posts queued')).toBeVisible();
    
    // Go online
    await context.setOffline(false);
    
    // Wait for all posts to be sent
    await expect(page.getByText('Successfully Posted')).toHaveCount(3, { timeout: 15000 });
    
    // Verify posts appear in correct order (newest first)
    const postTexts = await page.locator('[data-testid="post-content"]').allTextContents();
    expect(postTexts[0]).toContain('Third offline post');
    expect(postTexts[1]).toContain('Second offline post');
    expect(postTexts[2]).toContain('First offline post');
  });

  test('should handle network interruptions during posting', async ({ page, context }) => {
    const user = await createTestUser();
    await login(page, user.phone, user.password);
    
    // Start offline
    await context.setOffline(true);
    
    // Create post offline
    await page.click('button[aria-label="Create new post"]');
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Network interruption test');
    await page.click('button:has-text("Post")');
    
    // Briefly go online then offline again (simulate flaky connection)
    await context.setOffline(false);
    await page.waitForTimeout(500);
    await context.setOffline(true);
    
    // Verify post remains queued
    await expect(page.getByText('1 post queued')).toBeVisible();
    
    // Go online for real
    await context.setOffline(false);
    
    // Verify post is eventually sent
    await expect(page.getByText('Successfully Posted')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Network interruption test')).toBeVisible();
  });

  test('should show appropriate error messages for failed posts', async ({ page, context }) => {
    const user = await createTestUser();
    await login(page, user.phone, user.password);
    
    // Mock server to reject posts
    await page.route('**/api/posts', async route => {
      await route.fulfill({ status: 500, body: 'Server error' });
    });
    
    // Create post
    await page.click('button[aria-label="Create new post"]');
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Failing post');
    await page.click('button:has-text("Post")');
    
    // Verify error message
    await expect(page.getByText('Error Creating Post')).toBeVisible();
  });

  test('should handle maximum retry attempts', async ({ page, context }) => {
    const user = await createTestUser();
    await login(page, user.phone, user.password);
    
    // Mock server to always fail
    await page.route('**/api/posts', async route => {
      await route.fulfill({ status: 500, body: 'Server error' });
    });
    
    // Go offline first to queue the post
    await context.setOffline(true);
    await page.click('button[aria-label="Create new post"]');
    await page.fill('textarea[placeholder="What\'s on your mind?"]', 'Max retry test');
    await page.click('button:has-text("Post")');
    
    // Go online - post should fail after max retries
    await context.setOffline(false);
    
    // Verify failure message after retries
    await expect(page.getByText('Failed to send post')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Post could not be sent after multiple attempts')).toBeVisible();
  });
});