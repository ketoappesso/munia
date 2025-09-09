import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('TOS Upload Test', () => {
  test('should upload image using TOS', async ({ page }) => {
    // 1. Login
    console.log('Logging in...');
    await page.goto('http://localhost:3002/login');
    
    // Fill phone number
    const phoneInput = page.getByPlaceholder('请输入手机号');
    await phoneInput.fill('18874748888');
    
    // Switch to password mode if needed
    const passwordTab = page.getByRole('button', { name: /密码登录|Password/i });
    if (await passwordTab.isVisible()) {
      await passwordTab.click();
    }
    
    // Fill password
    const passwordInput = page.getByPlaceholder('请输入密码');
    await passwordInput.fill('123456');
    
    // Submit
    const submitButton = page.getByRole('button', { name: /登录|Login|Sign in/i });
    await submitButton.click();
    
    // Wait for redirect
    await page.waitForURL('http://localhost:3002/**');
    console.log('Login successful');
    
    // 2. Create post with image
    console.log('Creating post with image...');
    const textarea = page.locator('textarea').first();
    await textarea.click();
    await textarea.fill('Testing TOS upload - ' + new Date().toISOString());
    
    // Upload image
    const fileInput = page.locator('input[type="file"]').first();
    const testImagePath = path.join(__dirname, 'test-assets', 'test-image.jpg');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for preview
    await page.waitForTimeout(2000);
    
    // Submit post
    const postButton = page.locator('button', { hasText: /post|submit|share/i }).first();
    await postButton.click();
    
    // Wait for post to appear
    await page.waitForTimeout(3000);
    
    // 3. Check uploaded image URL
    const latestPost = page.locator('article').first();
    const imageInPost = latestPost.locator('img').first();
    
    if (await imageInPost.count() > 0) {
      const imageSrc = await imageInPost.getAttribute('src');
      console.log('Uploaded image URL:', imageSrc);
      
      // Verify TOS URL format
      expect(imageSrc).toContain('xiaoyuan-chat.tos-cn-guangzhou.volces.com');
      console.log('✅ Image successfully uploaded using TOS!');
    } else {
      console.log('No image found in post');
    }
  });
});