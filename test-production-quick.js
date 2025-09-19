const { chromium } = require('playwright');
const fs = require('fs');

async function quickProductionTest() {
  console.log('🎯 Quick production image test after environment fix...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/posts')) {
      requests.push({ method: request.method(), url: request.url() });
      console.log(`📡 ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/posts')) {
      console.log(`📡 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Login
    console.log('🔄 Logging in...');
    await page.goto('https://xyuan.chat/auth');
    await page.waitForTimeout(3000);

    await page.fill('input[placeholder*="电话"]', '13374743333');
    await page.fill('input[type="password"]', '123456');
    await page.fill('input[placeholder*="短信"]', '123456');
    await page.click('button:has-text("登录/注册")');

    await page.waitForTimeout(5000);

    if (!page.url().includes('/feed')) {
      await page.goto('https://xyuan.chat/feed');
      await page.waitForTimeout(3000);
    }

    console.log('✅ Logged in successfully');

    // Test image post
    console.log('🔄 Creating image post...');
    await page.click('text="想到啥说啥"');
    await page.waitForTimeout(3000);

    // Fill content
    await page.fill('input[placeholder*="说些啥"], textarea[placeholder*="说些啥"]', '🎉 Final test after TOS_ENDPOINT fix!');

    // Create test image
    const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync('/tmp/quick-test.png', testImage);

    // Upload image
    await page.setInputFiles('input[type="file"]', '/tmp/quick-test.png');
    await page.waitForTimeout(3000);

    // Submit
    console.log('🎯 Submitting post...');
    await page.click('button:has-text("发帖")');
    await page.waitForTimeout(10000);

    // Check results
    const postRequests = requests.filter(req => req.method === 'POST');
    console.log(`📊 POST requests: ${postRequests.length}`);

    if (postRequests.length > 0) {
      console.log('🎉 SUCCESS! Image posting is working!');
    } else {
      console.log('❌ No POST requests detected');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/quick-production-test.png' });

  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  await browser.close();
}

quickProductionTest();