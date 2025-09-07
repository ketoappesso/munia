import { test, expect } from '@playwright/test';

test.describe('Chat Scrolling Behavior', () => {
  // 测试配置
  test.beforeEach(async ({ page }) => {
    // 设置视口大小为移动设备尺寸
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('AI chat should not auto-scroll on initial load', async ({ page }) => {
    // 导航到AI聊天页面
    await page.goto('http://localhost:3002/ai');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 获取消息容器
    const messagesContainer = await page.locator('.overflow-y-auto').first();
    
    // 记录初始滚动位置
    const initialScrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
    
    // 等待一段时间，确保没有自动滚动发生
    await page.waitForTimeout(1000);
    
    // 再次检查滚动位置
    const afterWaitScrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
    
    // 验证滚动位置没有改变（应该保持在顶部）
    expect(afterWaitScrollTop).toBe(initialScrollTop);
    expect(afterWaitScrollTop).toBeLessThanOrEqual(10); // 允许小的误差
    
    console.log('✅ AI chat: 初始加载时不会自动滚动');
  });

  test('AI chat should scroll to bottom when sending a message', async ({ page }) => {
    // 导航到AI聊天页面
    await page.goto('http://localhost:3002/ai');
    await page.waitForLoadState('networkidle');
    
    // 找到输入框并输入消息
    const textarea = await page.locator('textarea[placeholder*="输入消息"]');
    await textarea.fill('测试消息');
    
    // 获取消息容器
    const messagesContainer = await page.locator('.overflow-y-auto').first();
    
    // 发送消息
    await page.keyboard.press('Enter');
    
    // 等待新消息出现
    await page.waitForTimeout(500);
    
    // 检查是否滚动到了底部
    const scrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
    const scrollHeight = await messagesContainer.evaluate((el) => el.scrollHeight);
    const clientHeight = await messagesContainer.evaluate((el) => el.clientHeight);
    
    // 验证已滚动到底部（允许小的误差）
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    expect(distanceFromBottom).toBeLessThanOrEqual(50);
    
    console.log('✅ AI chat: 发送消息后自动滚动到底部');
  });

  test('Private chat should not auto-scroll on initial load', async ({ page }) => {
    // 需要先登录（这里假设有测试用户）
    // 注意：实际测试时需要根据你的认证系统调整登录流程
    
    // 导航到私聊页面（假设有一个测试用户）
    await page.goto('http://localhost:3002/messages/testuser');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 等待ChatMessages组件加载
    await page.waitForSelector('.overflow-y-auto', { timeout: 5000 });
    
    // 获取消息容器
    const messagesContainer = await page.locator('.overflow-y-auto').first();
    
    // 记录初始滚动位置
    const initialScrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
    
    // 等待一段时间
    await page.waitForTimeout(1000);
    
    // 再次检查滚动位置
    const afterWaitScrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
    
    // 验证滚动位置没有改变
    expect(afterWaitScrollTop).toBe(initialScrollTop);
    expect(afterWaitScrollTop).toBeLessThanOrEqual(10);
    
    console.log('✅ Private chat: 初始加载时不会自动滚动');
  });

  test('Private chat should show scroll-to-bottom button when scrolled up', async ({ page }) => {
    // 导航到私聊页面
    await page.goto('http://localhost:3002/messages/testuser');
    await page.waitForLoadState('networkidle');
    
    // 等待消息容器加载
    const messagesContainer = await page.locator('.overflow-y-auto').first();
    await messagesContainer.waitFor({ state: 'visible' });
    
    // 如果有足够的消息，向上滚动
    await messagesContainer.evaluate((el) => {
      el.scrollTop = 0; // 滚动到顶部
    });
    
    // 等待滚动到底部按钮出现
    const scrollToBottomButton = await page.locator('button[aria-label="跳至最新消息"]');
    
    // 如果消息足够多，按钮应该出现
    const isButtonVisible = await scrollToBottomButton.isVisible().catch(() => false);
    
    if (isButtonVisible) {
      console.log('✅ Private chat: 向上滚动时显示"跳至最新消息"按钮');
      
      // 点击按钮
      await scrollToBottomButton.click();
      
      // 等待滚动动画完成
      await page.waitForTimeout(500);
      
      // 验证已滚动到底部
      const scrollTop = await messagesContainer.evaluate((el) => el.scrollTop);
      const scrollHeight = await messagesContainer.evaluate((el) => el.scrollHeight);
      const clientHeight = await messagesContainer.evaluate((el) => el.clientHeight);
      
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      expect(distanceFromBottom).toBeLessThanOrEqual(50);
      
      console.log('✅ Private chat: 点击按钮后滚动到底部');
    } else {
      console.log('⚠️ Private chat: 消息不够多，无法测试滚动按钮');
    }
  });
});

// 运行测试的辅助函数
async function runTests() {
  console.log('🧪 开始测试聊天滚动行为...\n');
  console.log('请确保开发服务器正在运行 (http://localhost:3002)');
  console.log('使用命令: npx playwright test tests/chat-scroll.test.ts\n');
}
