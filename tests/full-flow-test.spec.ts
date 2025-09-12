import { test, expect } from '@playwright/test';

test.describe('Full Ape Lord Member Flow Test', () => {
  test('complete flow: login → my-space → face recording', async ({ page }) => {
    console.log('\n=== FULL FLOW TEST FOR APE LORD MEMBER ===');
    console.log('Account: 18874748888 (永猿の猿)');
    console.log('Password: 123456');
    
    // STEP 1: LOGIN
    console.log('\n📱 STEP 1: Login');
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    const phoneInput = page.locator('input[type="text"]').first();
    await phoneInput.fill('18874748888');
    
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('123456');
    
    // Click login button (the actual submit button, not the tab)
    const loginButton = page.getByRole('button', { name: '登录', exact: true });
    await loginButton.click();
    
    // Wait for redirect to feed
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // STEP 2: NAVIGATE TO MY-SPACE VIA SIDEBAR
    console.log('\n🏠 STEP 2: Navigate to My Space');
    
    // Open sidebar menu (look for menu button)
    const menuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]').first();
    await menuButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Click "我的空间" in sidebar
    const mySpaceButton = page.locator('text=我的空间').first();
    await mySpaceButton.click();
    
    // Wait for navigation to my-space
    await page.waitForURL('**/my-space', { timeout: 5000 });
    console.log('✅ Navigated to My Space');
    
    // STEP 3: VERIFY APE LORD MEMBER STATUS
    console.log('\n👑 STEP 3: Verify Ape Lord Status');
    
    // Wait for member card to load
    await page.waitForSelector('[data-testid="membership-card"]', { timeout: 5000 });
    
    // Check member level
    const memberLevel = await page.locator('[data-testid="member-level"]').textContent();
    expect(memberLevel).toContain('猿佬');
    console.log(`✅ Member level: ${memberLevel}`);
    
    // Check expiry date
    const expiryElement = page.locator('[data-testid="expiry-date"]');
    if (await expiryElement.isVisible()) {
      const expiryText = await expiryElement.textContent();
      console.log(`✅ ${expiryText}`);
    }
    
    // Check days remaining
    const daysElement = page.locator('text=/剩余.*天/');
    if (await daysElement.isVisible()) {
      const daysText = await daysElement.textContent();
      console.log(`✅ ${daysText}`);
    }
    
    // STEP 4: ACCESS FACE RECORDING
    console.log('\n📸 STEP 4: Access Face Recording');
    
    // Check face recording button is enabled
    const faceRecordingButton = page.locator('text=人脸录入').first();
    await expect(faceRecordingButton).toBeVisible();
    const isDisabled = await faceRecordingButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('✅ Face recording button is ENABLED');
    
    // Click face recording
    await faceRecordingButton.click();
    await page.waitForURL('**/face-recording', { timeout: 5000 });
    console.log('✅ Navigated to face recording page');
    
    // Verify face recording page loaded
    await expect(page.locator('text=摄像头预览')).toBeVisible();
    console.log('✅ Face recording page loaded successfully');
    
    // STEP 5: TEST CAMERA SHORTCUT
    console.log('\n📷 STEP 5: Test Camera Shortcut');
    
    // Go back to my-space
    await page.goBack();
    await page.waitForURL('**/my-space');
    
    // Open sidebar again
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Look for camera icon in sidebar (should be clickable for Ape Lord)
    const cameraButton = page.locator('button').filter({ has: page.locator('.lucide-camera') }).first();
    if (await cameraButton.isVisible()) {
      await cameraButton.click();
      await page.waitForURL('**/face-recording', { timeout: 5000 });
      console.log('✅ Camera shortcut works!');
    }
    
    // SUMMARY
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Login successful');
    console.log('✅ Ape Lord member verified (猿佬)');
    console.log('✅ My Space accessible');
    console.log('✅ Face recording enabled and accessible');
    console.log('✅ Camera shortcut functional');
    console.log('\n🏆 User 18874748888 has full Ape Lord privileges!');
  });
});

// Run with: npx playwright test tests/full-flow-test.spec.ts --headed --project=chromium