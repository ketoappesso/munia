import { test, expect } from '@playwright/test';

test('Simple login test for 18874748888', async ({ page }) => {
  console.log('\n=== Simple Login Test ===');
  console.log('Account: 18874748888');
  console.log('Password: 123456');
  
  // Navigate to login page
  await page.goto('http://localhost:3002/login');
  console.log('✅ On login page');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Debug: Take screenshot to see what's on the page
  await page.screenshot({ path: 'login-page.png' });
  console.log('📸 Screenshot saved as login-page.png');
  
  // Try to find any input field
  const inputs = await page.locator('input').count();
  console.log(`Found ${inputs} input fields on the page`);
  
  // Try different selectors for phone input
  let phoneInput;
  
  // Try by type=tel
  phoneInput = page.locator('input[type="tel"]');
  if (await phoneInput.count() > 0) {
    console.log('Found phone input by type="tel"');
    await phoneInput.fill('18874748888');
  } else {
    // Try by any visible text input (first one is usually phone)
    phoneInput = page.locator('input[type="text"]').first();
    if (await phoneInput.count() > 0) {
      console.log('Found phone input by type="text"');
      await phoneInput.fill('18874748888');
    } else {
      // Try just first input
      phoneInput = page.locator('input').first();
      console.log('Using first input field for phone');
      await phoneInput.fill('18874748888');
    }
  }
  
  console.log('✅ Filled phone number');
  
  // Find password input
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill('123456');
  console.log('✅ Filled password');
  
  // Find and click submit button
  // We need the actual login button, not the tab button
  // The actual login button has both the text "登录" and is the larger button
  const submitButton = page.getByRole('button', { name: '登录', exact: true });
  
  await submitButton.click();
  console.log('✅ Clicked submit button');
  
  // Wait for navigation or error
  try {
    await page.waitForURL('**/feed', { timeout: 10000 });
    console.log('✅ Successfully logged in!');
    
    // Now test my-space navigation
    await page.goto('http://localhost:3002/my-space');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of my-space page
    await page.screenshot({ path: 'my-space-page.png' });
    console.log('📸 My-space page screenshot saved');
    
    // Check if we see Ape Lord member card
    const memberCard = page.locator('text=/猿佬/');
    if (await memberCard.count() > 0) {
      console.log('✅ Ape Lord member card displayed!');
      const cardText = await memberCard.textContent();
      console.log('Member status:', cardText);
    }
    
  } catch (error) {
    console.log('❌ Login failed or navigation timeout');
    
    // Check for error messages
    const errorMessage = await page.locator('text=/错误|失败/').first().textContent().catch(() => null);
    if (errorMessage) {
      console.log('Error message:', errorMessage);
    }
    
    // Take screenshot of error state
    await page.screenshot({ path: 'login-error.png' });
    console.log('📸 Error screenshot saved as login-error.png');
  }
});

// Run with: npx playwright test tests/simple-login-test.spec.ts --headed --project=chromium