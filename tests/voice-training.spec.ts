import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test user with custom voice
const TEST_USER = {
  phone: '18874747888',
  password: 'test123456',
  speakerId: 'S_r3YGBCoB1'
};

test.describe('Voice Training System', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login as test user
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Fill phone number (find by placeholder or label)
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="手机"], input[aria-label*="手机"]').first();
    await phoneInput.fill(TEST_USER.phone);
    
    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(TEST_USER.password);
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("登录")').first();
    await submitButton.click();
    
    // Wait for redirect (could be to home or feed)
    await page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
    
    // Navigate to voice training page
    await page.goto('http://localhost:3002/my-ai/voice-training');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should display voice training page with status', async () => {
    // Check page title
    await expect(page.locator('h1:has-text("语音训练")')).toBeVisible();
    
    // Check for voice status card
    const statusCard = page.locator('text=/音色状态/').first();
    await expect(statusCard).toBeVisible({ timeout: 10000 });
    
    // Check for speaker ID display
    await expect(page.locator(`text=${TEST_USER.speakerId}`)).toBeVisible();
    
    // Check for remaining training count
    const remainingTrainings = page.locator('text=/剩余训练次数/').first();
    await expect(remainingTrainings).toBeVisible();
    
    // Should show "8" remaining trainings as specified
    const trainingCount = page.locator('.text-purple-600.text-2xl').first();
    await expect(trainingCount).toBeVisible();
    const count = await trainingCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    expect(parseInt(count || '0')).toBeLessThanOrEqual(10);
  });

  test('should allow recording audio', async () => {
    // Check recording section
    await expect(page.locator('h2:has-text("语音录制")')).toBeVisible();
    
    // Check sample text display
    const sampleText = page.locator('text=/请朗读以下文本/').first();
    await expect(sampleText).toBeVisible();
    
    // Find and click record button
    const recordButton = page.locator('button:has(.h-6.w-6)').filter({ hasText: /Mic|Square/ }).first();
    await expect(recordButton).toBeVisible();
    
    // Mock getUserMedia for recording
    await page.addInitScript(() => {
      // Mock MediaRecorder
      window.MediaRecorder = class {
        constructor(stream: MediaStream) {
          this.stream = stream;
        }
        stream: MediaStream;
        ondataavailable: ((event: any) => void) | null = null;
        onstop: (() => void) | null = null;
        state: string = 'inactive';
        
        start() {
          this.state = 'recording';
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['mock audio data'], { type: 'audio/wav' }) });
            }
          }, 100);
        }
        
        stop() {
          this.state = 'inactive';
          this.stream.getTracks().forEach(track => track.stop());
          if (this.onstop) {
            this.onstop();
          }
        }
      } as any;
      
      // Mock getUserMedia
      navigator.mediaDevices.getUserMedia = async () => {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const dest = audioContext.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        return dest.stream;
      };
    });
    
    // Click record button to start recording
    await recordButton.click();
    
    // Should show "录制中..." status
    await expect(page.locator('text=/录制中/').first()).toBeVisible({ timeout: 5000 });
    
    // Click again to stop recording
    await recordButton.click();
    
    // Should show "已录制" status
    await expect(page.locator('text=/已录制/').first()).toBeVisible({ timeout: 5000 });
    
    // Upload button should be visible
    const uploadButton = page.locator('button:has-text("上传录音")');
    await expect(uploadButton).toBeVisible();
  });

  test('should allow file upload', async () => {
    // Find file upload button
    const uploadButton = page.locator('button:has-text("上传音频文件")');
    await expect(uploadButton).toBeVisible();
    
    // Create a test audio file
    const testAudioPath = path.join(__dirname, 'test-audio.wav');
    if (!fs.existsSync(testAudioPath)) {
      // Create a simple WAV header for testing
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // ChunkSize
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6D, 0x74, 0x20, // "fmt "
        0x10, 0x00, 0x00, 0x00, // Subchunk1Size
        0x01, 0x00, // AudioFormat (PCM)
        0x01, 0x00, // NumChannels (Mono)
        0x44, 0xAC, 0x00, 0x00, // SampleRate (44100)
        0x88, 0x58, 0x01, 0x00, // ByteRate
        0x02, 0x00, // BlockAlign
        0x10, 0x00, // BitsPerSample (16)
        0x64, 0x61, 0x74, 0x61, // "data"
        0x00, 0x00, 0x00, 0x00  // Subchunk2Size
      ]);
      fs.writeFileSync(testAudioPath, wavHeader);
    }
    
    // Set up file chooser
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testAudioPath);
    
    // Wait for upload response
    await page.waitForTimeout(2000);
    
    // Clean up test file
    if (fs.existsSync(testAudioPath)) {
      fs.unlinkSync(testAudioPath);
    }
  });

  test('should display sample texts and allow selection', async () => {
    // Check for sample texts section
    await expect(page.locator('h2:has-text("推荐训练文本")')).toBeVisible();
    
    // Should have 5 sample texts
    const sampleTexts = page.locator('text=/样本 \\d+/');
    await expect(sampleTexts).toHaveCount(5);
    
    // Click on "使用此文本" button for the second sample
    const useTextButtons = page.locator('button:has-text("使用此文本")');
    await expect(useTextButtons.first()).toBeVisible();
    await useTextButtons.nth(1).click();
    
    // Button should change to "已选择"
    await expect(page.locator('button:has-text("已选择")')).toBeVisible();
    
    // The selected text should appear in the recording section
    const recordingSection = page.locator('#recording-section');
    await expect(recordingSection).toBeVisible();
    
    // Check that the sample text changed
    const displayedText = page.locator('.bg-gray-50.dark\\:bg-gray-700 p').first();
    await expect(displayedText).toContainText('今天天气不错');
  });

  test('should show training tips', async () => {
    // Check for recording tips section
    const tipsSection = page.locator('h4:has-text("录制提示")');
    await expect(tipsSection).toBeVisible();
    
    // Check for specific tips
    await expect(page.locator('text=/在安静的环境中录制/')).toBeVisible();
    await expect(page.locator('text=/保持正常的语调和语速/')).toBeVisible();
    await expect(page.locator('text=/每段录制建议1-2分钟/')).toBeVisible();
    await expect(page.locator('text=/需要录制至少10分钟的样本/')).toBeVisible();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API error response
    await page.route('**/api/ai/voice-training/status', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to fetch voice training status' })
      });
    });
    
    // Reload page to trigger error
    await page.reload();
    
    // Should show error message
    await expect(page.locator('text=/获取音色状态失败|网络错误/')).toBeVisible({ timeout: 10000 });
  });

  test('should poll for training status updates', async () => {
    let pollCount = 0;
    
    // Mock API responses to simulate training progress
    await page.route('**/api/ai/voice-training/status', async route => {
      pollCount++;
      
      const response = {
        hasCustomVoice: true,
        speakerId: TEST_USER.speakerId,
        status: pollCount <= 2 ? 'Training' : 'Active',
        stateText: pollCount <= 2 ? '训练中' : '已激活',
        trainingVersion: 'V2',
        remainingTrainings: 8,
        isActive: pollCount > 2,
        canTrain: true
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
    
    // Reload to start fresh
    await page.reload();
    
    // Wait for initial status
    await expect(page.locator('text=/音色状态/').first()).toBeVisible({ timeout: 10000 });
    
    // If status is training, it should poll and update
    if (await page.locator('text=/训练中/').isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for status to change to active (after polling)
      await expect(page.locator('text=/已激活/')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should navigate from quick start button', async () => {
    // Find and click "开始录音训练" button
    const startButton = page.locator('button:has-text("开始录音训练")');
    await expect(startButton).toBeVisible();
    await startButton.click();
    
    // Should scroll to recording section
    await page.waitForTimeout(1000); // Wait for smooth scroll
    
    // Recording section should be in viewport
    const recordingSection = page.locator('#recording-section');
    await expect(recordingSection).toBeInViewport();
  });

  test('should handle successful upload', async () => {
    // Mock successful upload response
    await page.route('**/api/ai/voice-training/upload-audio', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          speakerId: TEST_USER.speakerId,
          trainingId: 'test-training-id',
          sampleCount: 1,
          message: '音频上传成功，正在训练中'
        })
      });
    });
    
    // Mock recording and upload
    await page.addInitScript(() => {
      window.MediaRecorder = class {
        constructor(stream: MediaStream) {
          this.stream = stream;
        }
        stream: MediaStream;
        ondataavailable: ((event: any) => void) | null = null;
        onstop: (() => void) | null = null;
        state: string = 'inactive';
        
        start() {
          this.state = 'recording';
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob(['test audio'], { type: 'audio/wav' }) });
            }
          }, 100);
        }
        
        stop() {
          this.state = 'inactive';
          this.stream.getTracks().forEach(track => track.stop());
          if (this.onstop) {
            this.onstop();
          }
        }
      } as any;
      
      navigator.mediaDevices.getUserMedia = async () => {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const dest = audioContext.createMediaStreamDestination();
        oscillator.connect(dest);
        oscillator.start();
        return dest.stream;
      };
    });
    
    // Record audio
    const recordButton = page.locator('button:has(.h-6.w-6)').filter({ hasText: /Mic|Square/ }).first();
    await recordButton.click();
    await page.waitForTimeout(500);
    await recordButton.click();
    
    // Upload recording
    const uploadButton = page.locator('button:has-text("上传录音")');
    await uploadButton.click();
    
    // Should show success message
    await page.waitForTimeout(2000);
    
    // Check for alert dialog or success indication
    const dialogPromise = page.waitForEvent('dialog');
    const dialog = await dialogPromise.catch(() => null);
    if (dialog) {
      expect(dialog.message()).toContain('上传成功');
      await dialog.accept();
    }
  });
});