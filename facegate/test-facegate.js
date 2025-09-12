const { chromium } = require('@playwright/test');

async function testFacegate() {
  console.log('Starting Facegate test and fix...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    // 2. Login with admin password
    console.log('2. Logging in...');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(2000);
    
    // 3. Navigate to persons page
    console.log('3. Navigating to persons page...');
    await page.goto('http://localhost:5173/persons');
    await page.waitForTimeout(2000);
    
    // 4. Try to add a person
    console.log('4. Adding test person...');
    
    // Fill in phone number
    await page.fill('input[placeholder*="电话"]', '13800138000');
    
    // Fill in name
    await page.fill('input[placeholder*="姓名"]', 'Test User');
    
    // Click add button
    await page.click('button:has-text("添加人员")');
    await page.waitForTimeout(2000);
    
    // Check for errors
    const errorDialog = await page.locator('text=/Failed to add person/i').count();
    if (errorDialog > 0) {
      console.log('❌ Error detected: Failed to add person');
      console.log('Likely cause: Database connection issue');
      
      // Click OK on error dialog if present
      const okButton = await page.locator('button:has-text("OK")');
      if (await okButton.count() > 0) {
        await okButton.click();
      }
    } else {
      console.log('✅ Person added successfully!');
      
      // Check if person appears in the table
      const personRow = await page.locator('td:has-text("13800138000")').count();
      if (personRow > 0) {
        console.log('✅ Person appears in the table');
      }
    }
    
    // 5. Take a screenshot
    console.log('5. Taking screenshot...');
    await page.screenshot({ path: 'facegate-test-result.png' });
    console.log('Screenshot saved as facegate-test-result.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('\n✨ Test completed. Browser will remain open for inspection.');
    console.log('Close the browser window manually when done.');
  }
}

// Run the test
testFacegate().catch(console.error);