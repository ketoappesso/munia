import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Upload with TOS', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phone"]', '18874748888');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home
    await page.waitForURL('http://localhost:3002/');
  });

  test('should upload image and display with TOS URL', async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:3002/');
    
    // Click on the create post area
    await page.click('textarea[placeholder*="What\'s on your mind"]');
    
    // Create a test image file path
    const testImagePath = path.join(__dirname, 'test-assets', 'test-image.jpg');
    
    // Upload an image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image preview to appear
    await page.waitForSelector('img[alt*="Uploaded"]', { timeout: 10000 });
    
    // Post the content
    await page.fill('textarea[placeholder*="What\'s on your mind"]', 'Test post with TOS image upload');
    await page.click('button:has-text("Post")');
    
    // Wait for the post to appear
    await page.waitForSelector('text=Test post with TOS image upload', { timeout: 10000 });
    
    // Check if the image is displayed with TOS URL
    const postedImage = page.locator('article').first().locator('img').first();
    await expect(postedImage).toBeVisible();
    
    // Get the image source
    const imageSrc = await postedImage.getAttribute('src');
    console.log('Uploaded image URL:', imageSrc);
    
    // Verify it uses the TOS URL format
    expect(imageSrc).toMatch(/https:\/\/xiaoyuan-chat\.tos-cn-guangzhou\.volces\.com\//);
  });

  test('should handle profile photo upload with TOS', async ({ page }) => {
    // Navigate to profile edit page
    await page.goto('http://localhost:3002/edit-profile');
    
    // Upload profile photo
    const profilePhotoInput = page.locator('input[type="file"][accept*="image"]').first();
    const testImagePath = path.join(__dirname, 'test-assets', 'profile-photo.jpg');
    await profilePhotoInput.setInputFiles(testImagePath);
    
    // Wait for upload to complete
    await page.waitForTimeout(2000);
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Check if profile photo is updated with TOS URL
    await page.goto('http://localhost:3002/');
    const profileImg = page.locator('img[alt*="Profile"]').first();
    const profileSrc = await profileImg.getAttribute('src');
    
    console.log('Profile photo URL:', profileSrc);
    expect(profileSrc).toMatch(/https:\/\/xiaoyuan-chat\.tos-cn-guangzhou\.volces\.com\//);
  });
});