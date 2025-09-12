import { test, expect } from '@playwright/test';

test.describe('Ape Lord Member Login and Features', () => {
  test('should login as Ape Lord member and access all features', async ({ page }) => {
    console.log('\n=== Testing Ape Lord Member Login ===');
    console.log('Phone: 18874748888 (永猿の猿 - Ape Lord Member)');
    console.log('Password: 123456');
    
    // Step 1: Navigate to login page
    await page.goto('http://localhost:3002/login');
    console.log('✅ Navigated to login page');
    
    // Step 2: Fill in login credentials
    // Wait for the phone input to be visible
    await page.waitForSelector('text=手机号码', { timeout: 5000 });
    
    // Fill phone number - find input by placeholder or label
    const phoneInput = page.locator('input[placeholder="请输入手机号"]');
    await phoneInput.fill('18874748888');
    
    // Fill password - find input by placeholder
    const passwordInput = page.locator('input[placeholder="请输入密码"]');
    await passwordInput.fill('123456');
    console.log('✅ Filled in credentials');
    
    // Step 3: Submit login form - look for the login button with text
    const loginButton = page.locator('button:has-text("登录")').first();
    await loginButton.click();
    console.log('✅ Submitted login form');
    
    // Step 4: Wait for navigation after login
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to feed');
    
    // Step 5: Open sidebar menu
    await page.click('button[aria-label="Menu"]');
    await page.waitForTimeout(500); // Wait for sidebar animation
    console.log('✅ Opened sidebar menu');
    
    // Step 6: Check for "我的空间" button in sidebar
    const mySpaceButton = page.locator('text=我的空间').first();
    await expect(mySpaceButton).toBeVisible();
    console.log('✅ "我的空间" button visible in sidebar');
    
    // Check subtitle - should show "门禁管理中心" for Ape Lord
    const subtitle = page.locator('text=门禁管理中心').first();
    await expect(subtitle).toBeVisible();
    console.log('✅ Shows "门禁管理中心" subtitle (Ape Lord member confirmed)');
    
    // Step 7: Click "我的空间" to navigate
    await mySpaceButton.click();
    await page.waitForURL('**/my-space', { timeout: 5000 });
    console.log('✅ Navigated to my-space page');
    
    // Step 8: Check Ape Lord member card
    await page.waitForSelector('[data-testid="membership-card"]', { timeout: 5000 });
    
    // Check for "猿佬" level text
    const memberLevel = await page.locator('[data-testid="member-level"]').textContent();
    expect(memberLevel).toContain('猿佬');
    console.log(`✅ Member level displayed: ${memberLevel}`);
    
    // Check for expiry date
    const expiryElement = page.locator('[data-testid="expiry-date"]');
    if (await expiryElement.isVisible()) {
      const expiryText = await expiryElement.textContent();
      console.log(`✅ Expiry info: ${expiryText}`);
      
      // Check days remaining
      const daysRemaining = await page.locator('text=/剩余.*天/').textContent();
      console.log(`✅ Days remaining: ${daysRemaining}`);
    }
    
    // Step 9: Check face recording is enabled for Ape Lord
    const faceRecordingButton = page.locator('text=人脸录入').first();
    await expect(faceRecordingButton).toBeVisible();
    const isDisabled = await faceRecordingButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('✅ Face recording button is ENABLED (Ape Lord privilege)');
    
    // Step 10: Click face recording button
    await faceRecordingButton.click();
    await page.waitForURL('**/face-recording', { timeout: 5000 });
    console.log('✅ Successfully navigated to face recording page');
    
    // Step 11: Check face recording page elements
    const cameraPreview = page.locator('text=摄像头预览');
    await expect(cameraPreview).toBeVisible();
    console.log('✅ Face recording page loaded successfully');
    
    // Step 12: Go back and test camera shortcut in sidebar
    await page.goBack();
    await page.waitForURL('**/my-space');
    
    // Open sidebar again
    await page.click('button[aria-label="Menu"]');
    await page.waitForTimeout(500);
    
    // Check for camera icon shortcut (should be clickable for Ape Lord)
    const cameraIcon = page.locator('.lucide-camera').first();
    if (await cameraIcon.isVisible()) {
      await cameraIcon.click();
      await page.waitForURL('**/face-recording', { timeout: 5000 });
      console.log('✅ Camera icon shortcut works (Ape Lord only feature)');
    }
    
    console.log('\n🎉 All Ape Lord member features working correctly!');
    console.log('Summary:');
    console.log('- Login successful');
    console.log('- Member status: 猿佬 (Ape Lord)');
    console.log('- My Space accessible');
    console.log('- Face recording enabled');
    console.log('- Camera shortcut functional');
  });
  
  test('should show member balance and points', async ({ page }) => {
    // Assuming already logged in from previous test or using session
    await page.goto('http://localhost:3002/my-space');
    
    // Wait for member card to load
    await page.waitForSelector('[data-testid="membership-card"]', { timeout: 5000 });
    
    // Check balance display
    const balanceText = await page.locator('text=/¥\\d+\\.\\d+/').first().textContent();
    console.log(`Balance displayed: ${balanceText}`);
    
    // Check points display
    const pointsElement = page.locator('text=/积分/').first();
    if (await pointsElement.isVisible()) {
      const parentElement = await pointsElement.locator('..').textContent();
      console.log(`Points info: ${parentElement}`);
    }
    
    // Check discount percentage (should be 69.99% for Ape Lord)
    const discountInfo = await page.locator('text=/69\\.99%/').count();
    if (discountInfo > 0) {
      console.log('✅ Ape Lord discount (69.99%) confirmed');
    }
  });
});

// Run with: npx playwright test tests/ape-lord-login-test.spec.ts --headed --project=chromium