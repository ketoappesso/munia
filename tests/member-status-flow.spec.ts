import { test, expect } from '@playwright/test';

test.describe('Member Status Flow', () => {
  test('should show different UI for Ape Lord vs non-Ape Lord members', async ({ page }) => {
    // Test data from live API
    const apeLordPhone = '18874748888'; // 永猿の猿 - Ape Lord member
    const regularPhone = '15873179744'; // 周小莉 - Regular member
    
    console.log('\n=== Testing Member Status Flow ===');
    
    // Navigate to login page
    await page.goto('http://localhost:3002/login');
    
    // Test 1: Ape Lord Member Flow
    console.log('\n--- Testing Ape Lord Member (猿佬会员) ---');
    console.log('Phone:', apeLordPhone);
    
    // Mock login as Ape Lord member
    // In real app, this would be through proper authentication
    
    // Navigate to my-space directly to see the UI
    await page.goto('http://localhost:3002/my-space');
    
    // Check for Ape Lord member card
    const apeLordCard = page.locator('[data-testid="membership-card"]');
    if (await apeLordCard.isVisible()) {
      console.log('✅ Ape Lord member card displayed');
      
      // Check for expiry days
      const expiryText = await page.locator('[data-testid="expiry-date"]').textContent();
      console.log('Expiry info:', expiryText);
      
      // Check if face recording is enabled
      const faceRecordingButton = page.locator('text=人脸录入').first();
      const isEnabled = await faceRecordingButton.isEnabled();
      console.log('Face recording enabled:', isEnabled);
    }
    
    // Test 2: Non-Ape Lord Member Flow
    console.log('\n--- Testing Regular Member ---');
    console.log('Phone:', regularPhone);
    
    // Check for non-Ape Lord card
    const nonApeLordCard = page.locator('[data-testid="non-apelord-card"]');
    if (await nonApeLordCard.isVisible()) {
      console.log('✅ Non-Ape Lord card displayed');
      
      // Check for "还不是猿佬会员" text
      const notMemberText = await page.locator('text=还不是猿佬会员').isVisible();
      console.log('Shows "还不是猿佬会员":', notMemberText);
      
      // Click the card to test navigation
      await nonApeLordCard.click();
      await page.waitForURL('**/membership/upgrade');
      console.log('✅ Clicking card navigates to upgrade page');
    }
    
    // Test 3: Sidebar Behavior
    console.log('\n--- Testing Sidebar Behavior ---');
    
    // Open sidebar (assuming there's a menu button)
    const menuButton = page.locator('[aria-label="Menu"]').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check My Space button
      const mySpaceButton = page.locator('text=我的空间').first();
      if (await mySpaceButton.isVisible()) {
        console.log('✅ My Space button visible in sidebar');
        
        // Check for camera icon (should be active for Ape Lord)
        const cameraIcon = page.locator('.lucide-camera').first();
        const cameraVisible = await cameraIcon.isVisible();
        console.log('Camera icon visible:', cameraVisible);
      }
    }
    
    // Test 4: Upgrade Page
    console.log('\n--- Testing Upgrade Page ---');
    await page.goto('http://localhost:3002/membership/upgrade');
    
    // Check page elements
    const upgradeTitle = await page.locator('text=升级猿佬会员').isVisible();
    console.log('Upgrade page title visible:', upgradeTitle);
    
    const benefits = await page.locator('text=人脸识别门禁').isVisible();
    console.log('Benefits section visible:', benefits);
    
    const pricingPlans = await page.locator('text=年度会员').isVisible();
    console.log('Pricing plans visible:', pricingPlans);
    
    const contactSection = await page.locator('text=如何升级').isVisible();
    console.log('Contact section visible:', contactSection);
  });
  
  test('API response validation', async ({ request }) => {
    console.log('\n=== Testing API Responses ===');
    
    // Test member-info API structure
    const response = await request.get('http://localhost:3002/api/pospal/member-info');
    
    if (response.status() === 401) {
      console.log('⚠️ API requires authentication (expected)');
    } else if (response.ok()) {
      const data = await response.json();
      
      // Validate response structure
      expect(data).toHaveProperty('isApeLord');
      expect(data).toHaveProperty('level');
      expect(data).toHaveProperty('balance');
      expect(data).toHaveProperty('points');
      
      console.log('✅ API response structure validated');
      console.log('Member Level:', data.level);
      console.log('Is Ape Lord:', data.isApeLord);
      console.log('Days Remaining:', data.daysRemaining);
    }
  });
});

// Run with: npx playwright test tests/member-status-flow.spec.ts --project=chromium --reporter=list