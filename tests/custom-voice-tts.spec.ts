import { test, expect } from '@playwright/test';

test.describe('Custom Voice TTS Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to feed page
    await page.goto('http://localhost:3002/feed');
    await page.waitForLoadState('networkidle');
  });

  test('should correctly identify and use custom voice for user 18874748888', async ({ page }) => {
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Listen for console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Listen for network requests to TTS API
    const ttsRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/tts/synthesize')) {
        ttsRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
    });

    // Listen for network responses from TTS API
    const ttsResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/tts/synthesize')) {
        try {
          const body = await response.json();
          ttsResponses.push({
            url: response.url(),
            status: response.status(),
            body: body
          });
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });

    // Find post from user 18874748888 (Keto)
    const ketoPost = page.locator('[data-testid="post"]').filter({ 
      hasText: '18874748888' 
    }).first();
    
    // Check if post exists
    await expect(ketoPost).toBeVisible();
    
    // Click play button on the post
    const playButton = ketoPost.locator('button').filter({ hasText: /播放|Play/i }).first();
    await expect(playButton).toBeVisible();
    
    // Click play button
    await playButton.click();
    
    // Wait for TTS request
    await page.waitForTimeout(2000);
    
    // Check console logs for voice selection
    const voiceSelectionLog = consoleLogs.find(log => 
      log.includes('Post author voice selection:') && 
      log.includes('18874748888')
    );
    
    console.log('Voice selection log:', voiceSelectionLog);
    
    // Verify custom voice was selected
    expect(voiceSelectionLog).toBeTruthy();
    expect(voiceSelectionLog).toContain('S_r3YGBCoB1');
    expect(voiceSelectionLog).toContain('usingCustom: true');
    
    // Check TTS API request
    if (ttsRequests.length > 0) {
      const lastRequest = ttsRequests[ttsRequests.length - 1];
      console.log('TTS Request:', lastRequest);
      
      if (lastRequest.postData) {
        const requestBody = JSON.parse(lastRequest.postData);
        console.log('Request voice:', requestBody.voice);
        
        // Verify custom voice ID was sent
        expect(requestBody.voice).toBe('S_r3YGBCoB1');
      }
    }
    
    // Check TTS API response
    if (ttsResponses.length > 0) {
      const lastResponse = ttsResponses[ttsResponses.length - 1];
      console.log('TTS Response status:', lastResponse.status);
      console.log('TTS Response success:', lastResponse.body?.success);
      
      // Check if response was successful
      expect(lastResponse.status).toBe(200);
      
      if (lastResponse.body) {
        // Check if audio data was returned
        if (lastResponse.body.audio) {
          console.log('Audio data length:', lastResponse.body.audio.length);
          
          // Check if audio is not silence (not all same pattern)
          const audioSample = lastResponse.body.audio.substring(0, 100);
          const isSilence = audioSample === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
          
          if (isSilence) {
            console.warn('⚠️ WARNING: API returned silence audio data for custom voice S_r3YGBCoB1');
            console.warn('This indicates the custom voice ID may be invalid or expired');
          }
        }
      }
    }
    
    // Check for playback errors
    const playbackError = consoleLogs.find(log => 
      log.includes('Playback was interrupted') || 
      log.includes('Audio error')
    );
    
    if (playbackError) {
      console.log('Playback error detected:', playbackError);
      
      // Check if it fell back to browser TTS
      const fallbackLog = consoleLogs.find(log => 
        log.includes('falling back to browser TTS')
      );
      
      if (fallbackLog) {
        console.log('Fell back to browser TTS due to invalid audio data');
      }
    }
  });

  test('should test direct API call with custom voice', async ({ request }) => {
    // Test direct API call
    const response = await request.post('http://localhost:3002/api/tts/synthesize', {
      data: {
        text: '测试自定义语音',
        voice: 'S_r3YGBCoB1',
        speed: 1.1,
        volume: 1.0,
        pitch: 1.0,
        encoding: 'mp3'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const result = await response.json();
    console.log('Direct API test result:', {
      success: result.success,
      hasAudio: !!result.audio,
      audioLength: result.audio?.length,
      cached: result.cached,
      fallback: result.fallback
    });
    
    if (result.audio) {
      // Check if audio is silence
      const audioSample = result.audio.substring(0, 100);
      const isSilence = audioSample === '//PkxAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      
      if (isSilence) {
        console.error('❌ CRITICAL: Custom voice S_r3YGBCoB1 returns silence!');
        console.error('Possible causes:');
        console.error('1. Voice ID is invalid or expired');
        console.error('2. Authentication credentials are incorrect');
        console.error('3. Voice is not accessible with current app ID');
      } else {
        console.log('✅ Custom voice returns valid audio data');
      }
    }
  });
});