const puppeteer = require('puppeteer');
const path = require('path');

async function testTOSUpload() {
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3002/login', { waitUntil: 'networkidle2' });
    
    console.log('2. Logging in with credentials...');
    await page.type('input[name="phone"]', '18874748888');
    await page.type('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('3. Login successful, now on:', page.url());
    
    // Click on the post creation area
    console.log('4. Opening post creation...');
    const textareaSelector = 'textarea[placeholder*="What\'s on your mind"], textarea[placeholder*="What\'s happening"]';
    await page.waitForSelector(textareaSelector, { timeout: 10000 });
    await page.click(textareaSelector);
    
    // Find and upload image
    console.log('5. Uploading image...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      const testImagePath = path.join(__dirname, 'tests/test-assets/test-image.jpg');
      await fileInput.uploadFile(testImagePath);
      
      // Wait for image preview
      await page.waitForTimeout(2000);
      
      // Add text to post
      await page.type(textareaSelector, 'Testing TOS image upload functionality');
      
      // Submit post
      console.log('6. Submitting post...');
      await page.click('button:has-text("Post"), button:has-text("Submit"), button:has-text("Share")');
      
      // Wait for post to appear
      await page.waitForTimeout(3000);
      
      // Check the uploaded image URL
      console.log('7. Checking uploaded image URL...');
      const images = await page.$$eval('article img', imgs => 
        imgs.map(img => img.src).filter(src => src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))
      );
      
      console.log('Found images:', images);
      
      // Check if any image uses TOS URL
      const tosImages = images.filter(src => src.includes('xiaoyuan-chat.tos-cn-guangzhou.volces.com'));
      
      if (tosImages.length > 0) {
        console.log('✅ SUCCESS: Image uploaded using TOS!');
        console.log('TOS Image URLs:', tosImages);
      } else {
        console.log('❌ WARNING: No TOS URLs found in uploaded images');
        console.log('All image URLs:', images);
      }
    } else {
      console.log('❌ Could not find file input');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('Test completed. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testTOSUpload();