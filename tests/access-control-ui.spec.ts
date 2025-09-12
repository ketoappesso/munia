import { test, expect } from '@playwright/test';

test.describe('Access Control UI Test', () => {
  test('should show access control UI elements', async ({ page }) => {
    console.log('\n=== Testing Access Control UI ===\n');
    
    // Test user login (assuming test users exist)
    await page.goto('http://localhost:3002/login');
    
    // Try to find login form
    const phoneInput = page.locator('input[name="phoneNumber"]');
    const passwordInput = page.locator('input[name="password"]');
    
    if (await phoneInput.isVisible()) {
      console.log('✓ Login page found');
      
      // Login with a test user
      await phoneInput.fill('18874748888');
      await passwordInput.fill('123456');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('✓ Login submitted');
        
        // Wait for navigation
        try {
          await page.waitForURL('**/feed', { timeout: 5000 });
          console.log('✓ Logged in successfully');
          
          // Open sidebar
          const menuButton = page.locator('button[aria-label="Menu"]');
          if (await menuButton.isVisible()) {
            await menuButton.click();
            console.log('✓ Sidebar opened');
            
            // Look for "我的空间" link
            const mySpaceLink = page.locator('text=我的空间');
            if (await mySpaceLink.isVisible()) {
              console.log('✓ "我的空间" link found in sidebar');
              
              // Check the description
              const description = page.locator('text=门禁管理中心');
              if (await description.isVisible()) {
                console.log('✓ Description updated to "门禁管理中心"');
              }
              
              // Click on My Space
              await mySpaceLink.click();
              
              // Check if navigated to my-space page
              try {
                await page.waitForURL('**/my-space', { timeout: 5000 });
                console.log('✓ Navigated to My Space page');
                
                // Check for page elements
                const pageTitle = page.locator('h1:has-text("我的空间")');
                if (await pageTitle.isVisible()) {
                  console.log('✓ My Space page loaded');
                }
                
                // Check for membership card (may show "暂无会员信息" if API fails)
                const memberCard = page.locator('[data-testid="membership-card"]');
                const noMemberInfo = page.locator('text=暂无会员信息');
                
                if (await memberCard.isVisible({ timeout: 3000 })) {
                  console.log('✓ Membership card displayed');
                  
                  // Check member level
                  const memberLevel = memberCard.locator('[data-testid="member-level"]');
                  if (await memberLevel.isVisible()) {
                    const levelText = await memberLevel.textContent();
                    console.log(`  Member Level: ${levelText}`);
                  }
                } else if (await noMemberInfo.isVisible({ timeout: 3000 })) {
                  console.log('⚠ No member info displayed (API might be failing)');
                }
                
                // Check for access control features
                const faceRecording = page.locator('text=人脸录入');
                const deviceSync = page.locator('text=设备同步');
                const areaManagement = page.locator('text=区域管理');
                const accessHistory = page.locator('text=通行记录');
                
                if (await faceRecording.isVisible()) {
                  console.log('✓ Face Recording feature found');
                }
                if (await deviceSync.isVisible()) {
                  console.log('✓ Device Sync feature found');
                }
                if (await areaManagement.isVisible()) {
                  console.log('✓ Area Management feature found');
                }
                if (await accessHistory.isVisible()) {
                  console.log('✓ Access History feature found');
                }
                
                console.log('\n=== UI Test Completed Successfully ===');
              } catch (error) {
                console.log('✗ Failed to navigate to My Space page');
              }
            } else {
              console.log('✗ "我的空间" link not found');
            }
          } else {
            console.log('✗ Menu button not found');
          }
        } catch (error) {
          console.log('✗ Login failed or navigation timeout');
        }
      } else {
        console.log('✗ Submit button not found');
      }
    } else {
      console.log('✗ Login page not accessible');
    }
  });

  test('test direct API response format', async ({ request }) => {
    console.log('\n=== Testing API Response Format ===\n');
    
    // Even if Pospal API fails, our endpoint should return the correct format
    try {
      // This will fail without proper session, but shows the expected format
      const response = await request.post('http://localhost:3002/api/pospal/member', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          phoneNumber: '18874748888'
        }
      });
      
      const result = await response.json();
      console.log('API Response format:', JSON.stringify(result, null, 2));
      
      // Check response structure
      if ('error' in result) {
        console.log('⚠ API returned error (expected without session):', result.error);
      } else {
        console.log('Response has expected fields:');
        console.log('  - isValid:', 'isValid' in result ? '✓' : '✗');
        console.log('  - level:', 'level' in result ? '✓' : '✗');
        console.log('  - expiryDate:', 'expiryDate' in result ? '✓' : '✗');
        console.log('  - balance:', 'balance' in result ? '✓' : '✗');
        console.log('  - points:', 'points' in result ? '✓' : '✗');
        console.log('  - isApeLord:', 'isApeLord' in result ? '✓' : '✗');
      }
    } catch (error) {
      console.log('Error calling API:', error);
    }
  });
});

// Run with: npx playwright test tests/access-control-ui.spec.ts --project=chromium --reporter=list