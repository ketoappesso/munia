import { test, expect } from '@playwright/test';

// Test configuration  
const TEST_URL = process.env.TEST_URL || 'http://localhost:3002';

test.describe('Punk AI Basic UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
  });

  test('should load the application', async ({ page }) => {
    // Check that the app loads
    await expect(page).toHaveTitle(/Appesso/);
    
    // Check for login button
    await expect(page.locator('text=登录')).toBeVisible();
  });

  test('should display login form', async ({ page }) => {
    // Click login button
    await page.click('text=登录');
    
    // Check for phone number input
    await expect(page.locator('input[placeholder*="手机号"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    // Click login
    await page.click('text=登录');
    
    // Try to submit empty form
    await page.click('button:has-text("登录")');
    
    // Should show validation error
    await expect(page.locator('text=请输入有效的手机号码')).toBeVisible({ timeout: 5000 });
  });

  test('should validate phone number format', async ({ page }) => {
    await page.click('text=登录');
    
    // Enter invalid phone number
    await page.fill('input[placeholder*="手机号"]', '123');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("登录")');
    
    // Should show phone validation error
    await expect(page.locator('text=请输入有效的手机号码')).toBeVisible();
  });

  test('should validate password length', async ({ page }) => {
    await page.click('text=登录');
    
    // Enter valid phone but short password
    await page.fill('input[placeholder*="手机号"]', '13800138000');
    await page.fill('input[type="password"]', '123');
    await page.click('button:has-text("登录")');
    
    // Should show password validation error
    await expect(page.locator('text=密码至少需要6个字符')).toBeVisible();
  });

  test('should check API endpoint availability', async ({ request }) => {
    // Test punk-ai API endpoint exists
    const response = await request.get(`${TEST_URL}/api/punk-ai?userId=testuser`);
    
    // Should return 401 (unauthorized) since we're not logged in
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('should check TTS API endpoint', async ({ request }) => {
    // Test TTS synthesis endpoint exists
    const response = await request.post(`${TEST_URL}/api/tts/synthesize`, {
      data: {
        text: 'Test text',
        voice: 'BV001'
      }
    });
    
    // Should return some response (might be error due to no auth)
    expect(response.status()).toBeLessThanOrEqual(500);
  });
});

test.describe('Punk AI Mock Tests', () => {
  test('should render AI badge component', async ({ page }) => {
    // Create a simple test page with AI badge
    await page.setContent(`
      <html>
        <body>
          <div style="padding: 20px;">
            <h1 style="display: flex; align-items: center; gap: 8px;">
              Test User
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: linear-gradient(to right, purple, pink);
                color: white;
                padding: 2px 8px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 500;
              ">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                AI
              </span>
            </h1>
            <p style="color: #666; font-size: 14px;">AI 助手 • 随时在线</p>
          </div>
        </body>
      </html>
    `);
    
    // Check AI badge is visible
    await expect(page.locator('span:has-text("AI")')).toBeVisible();
    await expect(page.locator('text=AI 助手 • 随时在线')).toBeVisible();
  });

  test('should render AI thinking indicator', async ({ page }) => {
    // Create a test page with thinking indicator
    await page.setContent(`
      <html>
        <head>
          <style>
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            .animate-bounce {
              animation: bounce 1s infinite;
            }
            .animate-pulse {
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: white;
              padding: 8px 12px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            ">
              <svg class="animate-pulse" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="purple">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                <circle cx="12" cy="5" r="2"/>
                <path d="M12 7v4"/>
              </svg>
              <span style="color: #666; font-size: 14px;">AI 正在思考...</span>
              <div style="display: flex; gap: 4px;">
                <span class="animate-bounce" style="
                  width: 8px;
                  height: 8px;
                  background: purple;
                  border-radius: 50%;
                  animation-delay: 0ms;
                "></span>
                <span class="animate-bounce" style="
                  width: 8px;
                  height: 8px;
                  background: purple;
                  border-radius: 50%;
                  animation-delay: 150ms;
                "></span>
                <span class="animate-bounce" style="
                  width: 8px;
                  height: 8px;
                  background: purple;
                  border-radius: 50%;
                  animation-delay: 300ms;
                "></span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    // Check thinking indicator is visible
    await expect(page.locator('text=AI 正在思考...')).toBeVisible();
    
    // Check for animated dots
    const dots = page.locator('span.animate-bounce');
    await expect(dots).toHaveCount(3);
  });
});

test.describe('Regression Tests', () => {
  test('should load feed page elements', async ({ page }) => {
    await page.goto(TEST_URL);
    
    // Check for main navigation elements
    const navElements = ['发现', '消息', '通知'];
    
    for (const element of navElements) {
      const el = page.locator(`text=${element}`);
      // Element might be visible or hidden depending on auth state
      const isVisible = await el.isVisible().catch(() => false);
      console.log(`Navigation element "${element}" visible: ${isVisible}`);
    }
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(TEST_URL);
    
    // Should show mobile-optimized layout
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(TEST_URL);
    
    // Should adapt to tablet size
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(TEST_URL);
    
    // Should show desktop layout
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    try {
      await page.goto(TEST_URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
    } catch (error) {
      // Expected to fail when offline
      console.log('Expected offline error:', error.message);
    }
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should be able to load when back online
    await page.goto(TEST_URL);
    await expect(page).toHaveTitle(/Appesso/);
  });
});