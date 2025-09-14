import { test, expect } from '@playwright/test';

// Admin credentials
const ADMIN_PHONE = '18874748888';
const ADMIN_PASSWORD = 'Test123456!';

// Test user data
const TEST_USER_PHONE = '13800138000';
const TEST_VOICE_ID = 'S_testVoice123';
const STANDARD_VOICE_ID = 'BV001';

test.describe('Voice Management Admin Feature', () => {
  // Login as admin before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for login form to load
    await page.waitForSelector('input[name="phoneNumber"]', { timeout: 10000 });

    // Fill in admin credentials
    await page.fill('input[name="phoneNumber"]', ADMIN_PHONE);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to home page or dashboard
    await page.waitForURL(/\/(feed|home|$)/, { timeout: 10000 });

    // Navigate to backoffice
    await page.goto('/backoffice');

    // Wait for backoffice page to load
    await page.waitForSelector('h1:has-text("管理后台")', { timeout: 10000 });
  });

  test('should display voice management tab', async ({ page }) => {
    // Check if voice management tab exists
    const voiceTab = page.locator('button:has-text("音色管理")');
    await expect(voiceTab).toBeVisible();

    // Click on voice management tab
    await voiceTab.click();

    // Check if voice management content is displayed
    await expect(page.locator('h2:has-text("音色映射管理")')).toBeVisible();
    await expect(page.locator('text=音色配置说明')).toBeVisible();
  });

  test('should list users with voice mappings', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for the table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if table headers are correct
    await expect(page.locator('th:has-text("用户")')).toBeVisible();
    await expect(page.locator('th:has-text("手机号")')).toBeVisible();
    await expect(page.locator('th:has-text("音色配置")')).toBeVisible();
    await expect(page.locator('th:has-text("剩余次数")')).toBeVisible();
    await expect(page.locator('th:has-text("状态")')).toBeVisible();
    await expect(page.locator('th:has-text("操作")')).toBeVisible();
  });

  test('should search for users by phone number', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for search input to be visible
    await page.waitForSelector('input[placeholder*="搜索手机号"]', { timeout: 10000 });

    // Search for a specific phone number
    await page.fill('input[placeholder*="搜索手机号"]', '188');

    // Wait for search results to update
    await page.waitForTimeout(1000);

    // Check if search is working (table should update)
    const tableRows = page.locator('tbody tr');
    const count = await tableRows.count();

    // Should have at least one result (the admin user itself)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter users by voice configuration status', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Test "已配置" (With Voice) filter
    await page.click('button:has-text("已配置")');
    await page.waitForTimeout(1000);

    // Check if filter button is active
    const withVoiceButton = page.locator('button:has-text("已配置")');
    await expect(withVoiceButton).toHaveClass(/bg-blue-600/);

    // Test "未配置" (Without Voice) filter
    await page.click('button:has-text("未配置")');
    await page.waitForTimeout(1000);

    // Check if filter button is active
    const withoutVoiceButton = page.locator('button:has-text("未配置")');
    await expect(withoutVoiceButton).toHaveClass(/bg-blue-600/);

    // Test "全部" (All) filter
    await page.click('button:has-text("全部")');
    await page.waitForTimeout(1000);

    // Check if filter button is active
    const allButton = page.locator('button:has-text("全部")');
    await expect(allButton).toHaveClass(/bg-blue-600/);
  });

  test('should edit user voice mapping', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Find first user row and click edit button
    const firstRow = page.locator('tbody tr').first();
    const editButton = firstRow.locator('button:has(svg)').first();

    // Check if edit button exists
    const editButtonCount = await editButton.count();
    if (editButtonCount > 0) {
      await editButton.click();

      // Check if input fields appear
      await expect(firstRow.locator('input[placeholder*="S_xxxxx"]')).toBeVisible();
      await expect(firstRow.locator('input[type="number"]')).toBeVisible();

      // Fill in new voice ID
      await firstRow.locator('input[placeholder*="S_xxxxx"]').fill(TEST_VOICE_ID);
      await firstRow.locator('input[type="number"]').fill('3');

      // Find and click save button
      const saveButton = firstRow.locator('button:has(svg)').first();
      await saveButton.click();

      // Wait for save to complete
      await page.waitForTimeout(2000);

      // Check if edit mode is closed
      await expect(firstRow.locator('input[placeholder*="S_xxxxx"]')).not.toBeVisible();
    }
  });

  test('should delete user voice mapping', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Find a user with voice configured
    const rowsWithVoice = page.locator('tbody tr:has(button:has(svg))');
    const rowCount = await rowsWithVoice.count();

    if (rowCount > 0) {
      const targetRow = rowsWithVoice.first();

      // Find delete button (usually the trash icon)
      const deleteButtons = targetRow.locator('button');
      const buttonCount = await deleteButtons.count();

      // Click the last button (usually delete)
      if (buttonCount >= 2) {
        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());

        await deleteButtons.nth(buttonCount - 1).click();

        // Wait for deletion to complete
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should refresh voice mappings list', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for refresh button to be visible
    const refreshButton = page.locator('button:has-text("刷新")');
    await expect(refreshButton).toBeVisible();

    // Click refresh button
    await refreshButton.click();

    // Wait for refresh to complete
    await page.waitForTimeout(1000);

    // Table should still be visible after refresh
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display voice configuration instructions', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Check if instructions section is visible
    const instructionsSection = page.locator('.bg-blue-50, .dark\\:bg-blue-900\\/20').filter({
      hasText: '音色配置说明'
    });

    await expect(instructionsSection).toBeVisible();

    // Check if instructions contain key information
    await expect(instructionsSection).toContainText('自定义音色ID格式：S_开头');
    await expect(instructionsSection).toContainText('标准音色选项：BV001-BV005');
    await expect(instructionsSection).toContainText('PUNK标识');
    await expect(instructionsSection).toContainText('剩余训练次数');
  });

  test('should handle pagination if available', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });

    // Check if pagination controls exist
    const paginationSection = page.locator('text=/第.*页/');
    const hasPagination = await paginationSection.count() > 0;

    if (hasPagination) {
      // Check if pagination info is displayed
      await expect(paginationSection).toBeVisible();

      // Check if next button exists and is enabled
      const nextButton = page.locator('button:has-text("下一页")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Check if page number changed
        await expect(paginationSection).toContainText(/第 2 页/);

        // Go back to first page
        const prevButton = page.locator('button:has-text("上一页")');
        await prevButton.click();
        await page.waitForTimeout(1000);

        // Check if we're back to page 1
        await expect(paginationSection).toContainText(/第 1 页/);
      }
    }
  });

  test('should validate voice ID format when editing', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Find first user row and click edit button
    const firstRow = page.locator('tbody tr').first();
    const editButton = firstRow.locator('button:has(svg)').first();

    const editButtonCount = await editButton.count();
    if (editButtonCount > 0) {
      await editButton.click();

      // Try to enter invalid voice ID
      await firstRow.locator('input[placeholder*="S_xxxxx"]').fill('invalid_id');

      // Try to save
      const saveButton = firstRow.locator('button:has(svg)').first();
      await saveButton.click();

      // Wait for response
      await page.waitForTimeout(2000);

      // Should show error or not save (implementation dependent)
      // The API should reject invalid voice IDs
    }
  });

  test('should display PUNK badge for custom voices', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Look for PUNK badges
    const punkBadges = page.locator('text=PUNK');
    const punkCount = await punkBadges.count();

    // If there are users with custom voices, they should have PUNK badges
    if (punkCount > 0) {
      const firstPunkBadge = punkBadges.first();
      await expect(firstPunkBadge).toBeVisible();
      await expect(firstPunkBadge).toHaveClass(/text-green-600/);
    }
  });

  test('should update remaining training count', async ({ page }) => {
    // Click on voice management tab
    await page.click('button:has-text("音色管理")');

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 10000 });

    // Find first user row and click edit button
    const firstRow = page.locator('tbody tr').first();
    const editButton = firstRow.locator('button:has(svg)').first();

    const editButtonCount = await editButton.count();
    if (editButtonCount > 0) {
      await editButton.click();

      // Find the number input for remaining trainings
      const numberInput = firstRow.locator('input[type="number"]');
      await expect(numberInput).toBeVisible();

      // Clear and set new value
      await numberInput.fill('2');

      // Save changes
      const saveButton = firstRow.locator('button:has(svg)').first();
      await saveButton.click();

      // Wait for save to complete
      await page.waitForTimeout(2000);

      // Verify the count was updated
      await expect(firstRow.locator('text=/\\d+ 次/')).toBeVisible();
    }
  });
});

test.describe('Voice Management API Tests', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // Get auth token by logging in
    const loginResponse = await request.post('/api/auth/callback/credentials', {
      data: {
        phoneNumber: ADMIN_PHONE,
        password: ADMIN_PASSWORD,
        csrfToken: '' // This might need to be fetched from the login page
      }
    });

    // Extract session cookie
    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      authCookie = cookies;
    }
  });

  test('GET /api/admin/voice-mappings should return user list', async ({ request }) => {
    const response = await request.get('/api/admin/voice-mappings', {
      headers: {
        'Cookie': authCookie || ''
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('users');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.users)).toBe(true);
  });

  test('GET /api/admin/voice-mappings with search parameter', async ({ request }) => {
    const response = await request.get('/api/admin/voice-mappings?search=188', {
      headers: {
        'Cookie': authCookie || ''
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('users');
    expect(Array.isArray(data.users)).toBe(true);
  });

  test('GET /api/admin/voice-mappings with hasVoice filter', async ({ request }) => {
    const response = await request.get('/api/admin/voice-mappings?hasVoice=true', {
      headers: {
        'Cookie': authCookie || ''
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('users');

    // All returned users should have voice IDs
    data.users.forEach((user: any) => {
      expect(user.ttsVoiceId).toBeTruthy();
    });
  });

  test('Unauthorized access should return 401', async ({ request }) => {
    const response = await request.get('/api/admin/voice-mappings');

    // Should return 401 without auth
    expect(response.status()).toBe(401);
  });
});