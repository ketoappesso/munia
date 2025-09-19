import { test, expect } from '@playwright/test';

test.describe('Voice Recognition Test', () => {
  test('Test voice adapter connection', async ({ page }) => {
    // 1. 登录
    await page.goto('https://xyuan.chat/login');
    await page.fill('input[placeholder*="手机"], input[type="tel"]', '18874748888');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    // 2. 等待跳转
    await page.waitForURL('https://xyuan.chat/**', { timeout: 30000 });
    
    // 3. 进入对话页面
    await page.goto('https://xyuan.chat/messages/18670708294');
    await page.waitForLoadState('networkidle');
    
    // 4. 测试WebSocket连接
    const wsConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        const ws = new WebSocket('wss://xyuan.chat/voice-ws');
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          ws.send(JSON.stringify({ type: 'config' }));
          resolve(true);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          resolve(false);
        };
        
        setTimeout(() => resolve(false), 5000);
      });
    });
    
    expect(wsConnected).toBe(true);
    console.log('Voice adapter WebSocket connection test:', wsConnected ? '✅ PASS' : '❌ FAIL');
  });
});
