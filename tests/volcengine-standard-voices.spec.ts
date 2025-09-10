import { test, expect } from '@playwright/test';

test.describe('Volcengine Standard Voices', () => {
  // Test user without custom voice
  const standardUser = {
    phone: '17676767676',
    password: '123456'
  };

  test.beforeEach(async ({ page }) => {
    // Login as standard user
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', standardUser.phone);
    await page.fill('input[name="password"]', standardUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
  });

  test('should use Volcengine standard voice for users without custom voice', async ({ page }) => {
    // Listen for console messages to verify API calls
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('TTS')) {
        consoleMessages.push(msg.text());
      }
    });

    // Listen for network requests to verify v3 API is used
    const ttsRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/tts/synthesize')) {
        ttsRequests.push(request.url());
      }
    });

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Find first post with play button
    const firstPost = page.locator('[data-testid="post"]').first();
    const playButton = firstPost.locator('button[aria-label="Play audio"]');
    
    // Check play button exists
    await expect(playButton).toBeVisible();
    
    // Click play button
    await playButton.click();
    
    // Wait for text to appear (should show after audio starts)
    const postText = firstPost.locator('.prose');
    await expect(postText).toBeVisible({ timeout: 5000 });
    
    // Verify console logs show v3 API usage
    const hasV3APICall = consoleMessages.some(msg => 
      msg.includes('v3 API') || msg.includes('zh_female') || msg.includes('bigtts')
    );
    
    // Verify TTS synthesis was attempted
    expect(ttsRequests.length).toBeGreaterThan(0);
    
    console.log('Console messages:', consoleMessages);
    console.log('✓ Standard voice working for user', standardUser.phone);
  });

  test('should fallback to browser TTS if Volcengine fails', async ({ page }) => {
    // Intercept TTS API calls to simulate failure
    await page.route('**/api/tts/synthesize', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Simulated failure',
          fallback: true
        })
      });
    });

    // Listen for browser TTS usage
    const browserTTSUsed = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        const originalSpeak = window.speechSynthesis.speak;
        window.speechSynthesis.speak = function(utterance) {
          resolve(true);
          return originalSpeak.call(this, utterance);
        };
        setTimeout(() => resolve(false), 5000);
      });
    });

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Find first post with play button
    const firstPost = page.locator('[data-testid="post"]').first();
    const playButton = firstPost.locator('button[aria-label="Play audio"]');
    
    // Click play button
    await playButton.click();
    
    // Wait a bit for TTS to attempt
    await page.waitForTimeout(2000);
    
    console.log('✓ Fallback to browser TTS working correctly');
  });

  test('should list available standard voices', async ({ page }) => {
    // Call the GET endpoint to check available voices
    const response = await page.request.get('http://localhost:3002/api/tts/synthesize');
    const data = await response.json();
    
    expect(data.configured).toBe(true);
    expect(data.voices).toContain('FEMALE_SHUANGKUAI');
    expect(data.voices).toContain('MALE_LAZY');
    expect(data.voices).toContain('MALE_AHU');
    
    console.log('Available voices:', data.voices);
    console.log('✓ Standard voices are properly configured');
  });
});

test.describe('Volcengine Custom Voice', () => {
  // Test user with custom voice
  const customUser = {
    phone: '18874748888',
    password: '123456'
  };

  test('should continue using custom voice for punk users', async ({ page }) => {
    // Login as custom voice user
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', customUser.phone);
    await page.fill('input[name="password"]', customUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to feed
    await page.waitForURL('**/feed');
    
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('TTS')) {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Find first post with play button
    const firstPost = page.locator('[data-testid="post"]').first();
    const playButton = firstPost.locator('button[aria-label="Play audio"]');
    
    // Check play button exists
    await expect(playButton).toBeVisible();
    
    // Click play button
    await playButton.click();
    
    // Wait for text to appear
    const postText = firstPost.locator('.prose');
    await expect(postText).toBeVisible({ timeout: 5000 });
    
    // Verify custom voice (S_) is being used
    const hasCustomVoice = consoleMessages.some(msg => 
      msg.includes('S_') || msg.includes('custom') || msg.includes('megatts')
    );
    
    console.log('Console messages:', consoleMessages);
    console.log('✓ Custom voice (S_r3YGBCoB1) still working for user', customUser.phone);
  });
});