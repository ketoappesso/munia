import { test, expect } from '@playwright/test';

test.describe('Voice Training Status', () => {
  test('should display voice training status for phone 18874748888', async ({ page }) => {
    // Login as the test user with phone 18874748888
    await page.goto('http://localhost:3002/login');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form using placeholder text
    await page.fill('input[placeholder="请输入手机号"]', '18874748888');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    
    // Click the login button (first button on the page)
    await page.click('button:has-text("登录")');
    
    // Wait for redirect after login
    await page.waitForURL('**/home', { timeout: 10000 });
    
    // Navigate to voice training page
    await page.goto('http://localhost:3002/my-ai/voice-training');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the voice status card is displayed
    const voiceStatusCard = page.locator('text=音色状态').first();
    await expect(voiceStatusCard).toBeVisible({ timeout: 10000 });
    
    // Check for speaker ID
    const speakerIdElement = page.locator('text=音色ID').locator('..').locator('div').nth(1);
    await expect(speakerIdElement).toContainText('S_r3YGBCoB1');
    
    // Check for status
    const statusElement = page.locator('text=状态').locator('..').locator('div').nth(1);
    await expect(statusElement).toContainText('已激活');
    
    // Check for version
    const versionElement = page.locator('text=版本').locator('..').locator('div').nth(1);
    await expect(versionElement).toContainText('V2');
    
    // Check for remaining trainings (should be 8)
    const remainingElement = page.locator('text=剩余训练次数').locator('..').locator('div').nth(1);
    await expect(remainingElement).toContainText('8');
    
    // Check that recording section is visible
    await expect(page.locator('text=语音录制')).toBeVisible();
    
    // Check that sample texts are visible
    await expect(page.locator('text=推荐训练文本')).toBeVisible();
    
    console.log('✅ Voice training page displays correctly for phone 18874748888');
    console.log('✅ Shows 8 remaining trainings as expected');
    console.log('✅ Shows V2 version and Active status');
  });
  
  test('should allow recording and display controls', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[placeholder="请输入手机号"]', '18874748888');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForURL('**/home', { timeout: 10000 });
    
    // Navigate to voice training page
    await page.goto('http://localhost:3002/my-ai/voice-training');
    await page.waitForLoadState('networkidle');
    
    // Check recording button is visible
    const recordButton = page.locator('button').filter({ hasText: /开始录音训练/ });
    await expect(recordButton).toBeVisible();
    
    // Check upload button is visible
    const uploadButton = page.locator('button').filter({ hasText: /上传音频文件/ });
    await expect(uploadButton).toBeVisible();
    
    // Click to start recording training
    await recordButton.click();
    
    // Should scroll to recording section
    await expect(page.locator('#recording-section')).toBeInViewport();
    
    // Check sample text is displayed
    const sampleText = page.locator('text=请朗读以下文本:');
    await expect(sampleText).toBeVisible();
    
    console.log('✅ Recording controls are functional');
  });
});