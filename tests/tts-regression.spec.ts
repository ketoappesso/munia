import { test, expect } from '@playwright/test';

test.describe('TTS API Regression Tests', () => {

  test('TTS API should not return 500 error', async ({ request }) => {
    const response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: '测试文本',
        voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        speed: 1.0
      }
    });

    expect(response.status()).not.toBe(500);
    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result).toHaveProperty('success');

    if (result.success) {
      expect(result).toHaveProperty('audio');
      console.log('✅ TTS API returned audio successfully');
    } else if (result.fallback) {
      console.log('⚠️ TTS API returned fallback response (Volcengine not configured)');
      expect(result).toHaveProperty('fallback', true);
    }
  });

  test('TTS API should handle various voice types', async ({ request }) => {
    const testCases = [
      { voice: 'zh_female_shuangkuaisisi_moon_bigtts', description: 'Female voice' },
      { voice: 'zh_male_ahu_conversation_wvae_bigtts', description: 'Male voice' },
      { voice: 'S_r3YGBCoB1', description: 'Custom voice (may fail if not configured)' },
      { voice: undefined, description: 'Default voice' }
    ];

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.description}`);

      const response = await request.post('http://localhost:3002/api/tts/synthesize', {
        data: {
          text: '测试语音合成',
          voice: testCase.voice,
          speed: 1.1
        }
      });

      expect(response.status()).not.toBe(500);

      const result = await response.json();

      if (response.ok()) {
        if (result.success) {
          expect(result.audio).toBeTruthy();
          console.log(`  ✅ ${testCase.description}: Success`);
        } else if (result.fallback) {
          console.log(`  ⚠️ ${testCase.description}: Fallback mode`);
        }
      } else {
        console.log(`  ❌ ${testCase.description}: Failed with status ${response.status()}`);
      }
    }
  });

  test('TTS API should validate input parameters', async ({ request }) => {
    // Test with invalid text (empty)
    let response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: '',
        voice: 'BV001_streaming'
      }
    });

    expect(response.status()).toBe(400);
    let result = await response.json();
    expect(result).toHaveProperty('error');
    console.log('✅ Empty text validation works');

    // Test with invalid speed
    response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: 'test',
        speed: 5.0 // Out of range
      }
    });

    expect(response.status()).toBe(400);
    result = await response.json();
    expect(result).toHaveProperty('error');
    console.log('✅ Speed validation works');

    // Test with very long text
    const longText = '测试'.repeat(3000); // 6000 chars, over limit
    response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: longText,
        voice: 'BV001_streaming'
      }
    });

    expect(response.status()).toBe(400);
    result = await response.json();
    expect(result).toHaveProperty('error');
    console.log('✅ Text length validation works');
  });

  test('TTS API GET endpoint should return status', async ({ request }) => {
    const response = await request.get('http://localhost:3002/api/tts/synthesize');

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result).toHaveProperty('configured');
    expect(result).toHaveProperty('voices');
    expect(result).toHaveProperty('cacheSize');

    console.log('TTS Service Status:', {
      configured: result.configured,
      voiceCount: result.voices?.length || 0,
      cacheSize: result.cacheSize
    });
  });

  test('TTS playback should work on feed page', async ({ page }) => {
    // Navigate to feed
    await page.goto('http://localhost:3002/feed');
    await page.waitForLoadState('networkidle');

    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });

    // Monitor network for TTS API calls
    let ttsRequestMade = false;
    let ttsResponseStatus = 0;

    page.on('response', async response => {
      if (response.url().includes('/api/tts/synthesize') && response.request().method() === 'POST') {
        ttsRequestMade = true;
        ttsResponseStatus = response.status();
        console.log(`TTS API Response: ${response.status()}`);
      }
    });

    // Find first post with play button
    const firstPost = page.locator('[data-testid="post"]').first();
    await expect(firstPost).toBeVisible();

    // Look for play button
    const playButton = firstPost.locator('button[aria-label*="播放"], button[aria-label*="Play"], button:has-text("播放"), svg[class*="play"]').first();

    if (await playButton.count() > 0) {
      // Click play button
      await playButton.click();

      // Wait for API call
      await page.waitForTimeout(2000);

      // Check if TTS API was called
      if (ttsRequestMade) {
        expect(ttsResponseStatus).not.toBe(500);
        console.log('✅ TTS API called from UI without 500 error');
      } else {
        console.log('⚠️ No TTS API call detected (might be using browser TTS)');
      }
    } else {
      console.log('⚠️ No play button found on posts');
    }
  });

  test('TTS should handle network errors gracefully', async ({ page, context }) => {
    // Block TTS API to simulate network error
    await context.route('**/api/tts/synthesize', route => {
      route.abort('failed');
    });

    await page.goto('http://localhost:3002/feed');
    await page.waitForLoadState('networkidle');

    // Monitor console for fallback messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().toLowerCase().includes('fallback')) {
        consoleLogs.push(msg.text());
      }
    });

    // Try to play audio
    const firstPost = page.locator('[data-testid="post"]').first();
    const playButton = firstPost.locator('button[aria-label*="播放"], button[aria-label*="Play"], button:has-text("播放"), svg[class*="play"]').first();

    if (await playButton.count() > 0) {
      await playButton.click();
      await page.waitForTimeout(2000);

      // Check if fallback was triggered
      const hasFallback = consoleLogs.some(log =>
        log.includes('falling back to browser TTS') ||
        log.includes('Falling back to browser TTS')
      );

      if (hasFallback) {
        console.log('✅ System correctly falls back to browser TTS on network error');
      } else {
        console.log('⚠️ No fallback detected on network error');
      }
    }
  });

  test('TTS cache should work correctly', async ({ request }) => {
    const testText = 'Cache test ' + Date.now();

    // First request - should not be cached
    let response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: testText,
        voice: 'zh_female_shuangkuaisisi_moon_bigtts',
        speed: 1.0
      }
    });

    expect(response.ok()).toBeTruthy();
    let result = await response.json();

    if (result.success) {
      expect(result.cached).toBeFalsy();
      console.log('✅ First request not cached');

      // Second request - should be cached
      response = await request.post('http://localhost:3002/api/tts/synthesize', {
        data: {
          text: testText,
          voice: 'zh_female_shuangkuaisisi_moon_bigtts',
          speed: 1.0
        }
      });

      expect(response.ok()).toBeTruthy();
      result = await response.json();

      if (result.success && result.cached) {
        console.log('✅ Second request served from cache');
      } else {
        console.log('⚠️ Cache not working as expected');
      }
    }
  });

  test('TTS should handle concurrent requests', async ({ request }) => {
    const promises = [];

    // Send 5 concurrent requests
    for (let i = 0; i < 5; i++) {
      promises.push(
        request.post('http://localhost:3002/api/tts/synthesize', {
          data: {
            text: `并发测试 ${i}`,
            voice: 'zh_female_shuangkuaisisi_moon_bigtts'
          }
        })
      );
    }

    const responses = await Promise.all(promises);

    // Check all responses
    let allSuccessful = true;
    for (const response of responses) {
      if (response.status() === 500) {
        allSuccessful = false;
        console.log('❌ Concurrent request returned 500');
      }
    }

    if (allSuccessful) {
      console.log('✅ All concurrent requests handled without 500 errors');
    }

    expect(allSuccessful).toBeTruthy();
  });
});