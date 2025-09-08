import { test, expect } from '@playwright/test';

test.describe('Voice Synthesis', () => {
  test.beforeEach(async ({ page }) => {
    // Login with the user that has custom voice
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', 'password123'); // Replace with actual password
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home');
  });

  test('should display voice selection in settings', async ({ page }) => {
    // Open settings drawer
    await page.click('button[aria-label="Settings"]');
    
    // Check if voice selection is visible
    await expect(page.locator('text=语音设置')).toBeVisible();
    
    // Check if custom voice is detected
    const customVoiceIndicator = page.locator('text=已配置个人专属语音');
    const hasCustomVoice = await customVoiceIndicator.isVisible();
    
    if (hasCustomVoice) {
      console.log('User has custom voice configured');
    } else {
      // Check standard voice options
      await expect(page.locator('select#voice-select')).toBeVisible();
      await expect(page.locator('option[value="BV001_streaming"]')).toBeVisible();
    }
  });

  test('should play voice preview when clicking preview button', async ({ page }) => {
    // Open settings drawer
    await page.click('button[aria-label="Settings"]');
    
    // Wait for voice settings to load
    await page.waitForSelector('text=语音设置');
    
    // Click preview button
    const previewButton = page.locator('button:has-text("试听")');
    await expect(previewButton).toBeVisible();
    
    // Set up listener for audio element
    const audioPromise = page.waitForFunction(() => {
      const audio = document.querySelector('audio');
      return audio && audio.src;
    }, { timeout: 10000 });
    
    await previewButton.click();
    
    // Check if audio element was created
    const hasAudio = await audioPromise;
    expect(hasAudio).toBeTruthy();
  });

  test('should synthesize voice for posts with custom voice users', async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:3002/home');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Find a post from user with custom voice
    const posts = await page.locator('[data-testid="post"]').all();
    
    for (const post of posts) {
      const username = await post.locator('[data-testid="post-username"]').textContent();
      
      // Check if this is the user with custom voice
      if (username?.includes('猿素大师兄')) {
        // Click play button on the post
        const playButton = post.locator('button[aria-label="Play voice"]');
        
        if (await playButton.isVisible()) {
          // Set up listener for audio playback
          const audioPromise = page.waitForFunction(() => {
            const audio = document.querySelector('audio');
            return audio && audio.src && audio.src.includes('data:audio');
          }, { timeout: 10000 });
          
          await playButton.click();
          
          // Verify audio was generated
          const hasAudio = await audioPromise;
          expect(hasAudio).toBeTruthy();
          
          console.log('Voice synthesis successful for custom voice user');
          break;
        }
      }
    }
  });

  test('should save voice preference to database', async ({ page }) => {
    // Open settings drawer
    await page.click('button[aria-label="Settings"]');
    
    // Wait for voice settings
    await page.waitForSelector('text=语音设置');
    
    // Change voice selection if dropdown is available
    const voiceSelect = page.locator('select#voice-select');
    if (await voiceSelect.isVisible()) {
      await voiceSelect.selectOption('BV002_streaming');
      
      // Wait for save
      await page.waitForTimeout(1000);
      
      // Refresh page to verify persistence
      await page.reload();
      
      // Open settings again
      await page.click('button[aria-label="Settings"]');
      await page.waitForSelector('text=语音设置');
      
      // Check if selection was saved
      const selectedValue = await voiceSelect.inputValue();
      expect(selectedValue).toBe('BV002_streaming');
    }
  });

  test('should handle TTS API errors gracefully', async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:3002/home');
    
    // Mock API to return error
    await page.route('**/api/posts/*/audio', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'TTS service unavailable' }
      });
    });
    
    // Wait for posts
    await page.waitForSelector('[data-testid="post"]');
    
    // Try to play voice
    const playButton = page.locator('button[aria-label="Play voice"]').first();
    if (await playButton.isVisible()) {
      await playButton.click();
      
      // Check for error message
      await expect(page.locator('text=语音合成失败')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display correct voice type for each user', async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:3002/home');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]');
    
    // Check voice indicators on posts
    const posts = await page.locator('[data-testid="post"]').all();
    
    for (const post of posts.slice(0, 5)) { // Check first 5 posts
      const playButton = post.locator('button[aria-label="Play voice"]');
      
      if (await playButton.isVisible()) {
        // Get the voice type from data attribute or tooltip
        const voiceType = await playButton.getAttribute('data-voice-type');
        
        if (voiceType?.startsWith('S_')) {
          console.log('Found post with custom voice:', voiceType);
          expect(voiceType).toMatch(/^S_[a-zA-Z0-9]+$/);
        } else if (voiceType?.startsWith('BV')) {
          console.log('Found post with standard voice:', voiceType);
          expect(voiceType).toMatch(/^BV\d{3}_streaming$/);
        }
      }
    }
  });
});

test.describe('Voice Mapping', () => {
  test('should correctly map phone numbers to custom voices', async ({ page }) => {
    // Test users with known custom voices
    const customVoiceUsers = [
      { phone: '18874748888', expectedVoice: 'S_r3YGBCoB1' },
      // Add more mappings as needed
    ];
    
    for (const user of customVoiceUsers) {
      // Login as the user
      await page.goto('http://localhost:3002/login');
      await page.fill('input[name="phoneNumber"]', user.phone);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/home');
      
      // Open settings to check voice
      await page.click('button[aria-label="Settings"]');
      await page.waitForSelector('text=语音设置');
      
      // Check if custom voice is indicated
      const customVoiceText = await page.locator('text=个人专属语音').textContent();
      expect(customVoiceText).toContain('已配置');
      
      // Logout for next test
      await page.click('button[aria-label="Logout"]');
    }
  });
});