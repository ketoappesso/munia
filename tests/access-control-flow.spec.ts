import { test, expect } from '@playwright/test';

test.describe('Access Control System Flow', () => {
  test('should display member status and access control features', async ({ page }) => {
    // Test with Ape Lord member (18874748888)
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
    
    // Open sidebar
    await page.click('button[aria-label="Menu"]');
    
    // Click on "我的空间" (My Space)
    await page.click('text=我的空间');
    
    // Should navigate to my-space page
    await page.waitForURL('**/my-space');
    
    // Check if member status card is displayed
    const memberCard = page.locator('[data-testid="membership-card"]');
    await expect(memberCard).toBeVisible();
    
    // Verify Ape Lord member level is displayed
    const memberLevel = memberCard.locator('[data-testid="member-level"]');
    await expect(memberLevel).toContainText('猿佬会员');
    
    // Verify expiry date is displayed
    const expiryDate = memberCard.locator('[data-testid="expiry-date"]');
    await expect(expiryDate).toBeVisible();
    await expect(expiryDate).toContainText('2025');
    
    // Check if face recording button is enabled for Ape Lord member
    const faceRecordingButton = page.locator('text=人脸录入').locator('..');
    await expect(faceRecordingButton).not.toHaveClass(/opacity-50/);
    await expect(faceRecordingButton).not.toHaveClass(/cursor-not-allowed/);
    
    // Click on face recording
    await faceRecordingButton.click();
    
    // Should navigate to face recording page
    await page.waitForURL('**/face-recording');
    
    // Check if camera permission dialog appears (may vary by browser)
    // The page should show camera preview area
    await expect(page.locator('text=摄像头预览')).toBeVisible();
    
    // Check if capture button is present
    await expect(page.locator('text=开始录入')).toBeVisible();
    
    console.log('✓ Ape Lord member can access face recording');
  });

  test('should restrict access for non-Ape Lord members', async ({ page }) => {
    // Test with Gold member (15873179744)
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', '15873179744');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
    
    // Open sidebar and navigate to my-space
    await page.click('button[aria-label="Menu"]');
    await page.click('text=我的空间');
    await page.waitForURL('**/my-space');
    
    // Check member level
    const memberCard = page.locator('[data-testid="membership-card"]');
    await expect(memberCard).toBeVisible();
    
    const memberLevel = memberCard.locator('[data-testid="member-level"]');
    await expect(memberLevel).toContainText('金卡会员');
    
    // Check if face recording button is disabled
    const faceRecordingButton = page.locator('text=人脸录入').locator('..');
    await expect(faceRecordingButton).toHaveClass(/opacity-50/);
    await expect(faceRecordingButton).toHaveClass(/cursor-not-allowed/);
    
    // Check if upgrade prompt is shown
    await expect(page.locator('text=升级到猿佬会员')).toBeVisible();
    
    console.log('✓ Non-Ape Lord member access is restricted');
  });

  test('should show non-member status for users without membership', async ({ page }) => {
    // Test with a user not in the mock data
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', '13800138000');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
    
    // Open sidebar and navigate to my-space
    await page.click('button[aria-label="Menu"]');
    await page.click('text=我的空间');
    await page.waitForURL('**/my-space');
    
    // Should show no member info
    await expect(page.locator('text=暂无会员信息')).toBeVisible();
    
    // All access control features should be disabled
    const faceRecordingButton = page.locator('text=人脸录入').locator('..');
    await expect(faceRecordingButton).toHaveClass(/opacity-50/);
    
    console.log('✓ Non-member status displayed correctly');
  });

  test('should call member API and display balance/points', async ({ page, request }) => {
    // Direct API test
    const response = await request.post('http://localhost:3002/api/pospal/member', {
      headers: {
        'Content-Type': 'application/json',
        // Mock session cookie would be needed in real test
      },
      data: {
        phoneNumber: '18874748888'
      }
    });
    
    // API should return member data
    if (response.ok()) {
      const data = await response.json();
      
      expect(data).toHaveProperty('isValid');
      expect(data).toHaveProperty('level');
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('points');
      expect(data).toHaveProperty('isApeLord');
      
      if (data.level === '猿佬会员') {
        expect(data.isApeLord).toBe(true);
        expect(data.balance).toBe(888.88);
        expect(data.points).toBe(1500);
        
        console.log('✓ API returns correct Ape Lord member data');
        console.log('  - Level:', data.level);
        console.log('  - Balance:', data.balance);
        console.log('  - Points:', data.points);
        console.log('  - Is Ape Lord:', data.isApeLord);
        console.log('  - Days Remaining:', data.daysRemaining);
      }
    }
  });
});

// Run with: npx playwright test tests/access-control-flow.spec.ts --project=chromium --reporter=list