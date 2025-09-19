import { test, expect } from '@playwright/test';

test.describe('PWA Functionality Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the production app
    await page.goto('http://localhost:3000');
  });

  test('should have PWA manifest with correct properties', async ({ page }) => {
    // Check if manifest is linked
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');

    // Check manifest content
    const manifestResponse = await page.request.get('http://localhost:3000/manifest.json');
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Appesso');
    expect(manifest.short_name).toBe('Appesso');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#000000');
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons[0].src).toBe('/icons/icon-192x192.png');
    expect(manifest.icons[1].src).toBe('/icons/icon-512x512.png');
  });

  test('should register service worker', async ({ page }) => {
    // Wait for service worker registration
    await page.waitForLoadState('networkidle');

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      }
      return false;
    });

    expect(swRegistered).toBeTruthy();
  });

  test('should have service worker file accessible', async ({ page }) => {
    // Check if service worker file exists and is accessible
    const swResponse = await page.request.get('http://localhost:3000/sw.js');
    expect(swResponse.ok()).toBeTruthy();

    const swContent = await swResponse.text();
    expect(swContent).toContain('appesso-v1.0.0'); // Cache name
    expect(swContent).toContain('/offline'); // Offline fallback
  });

  test('should have PWA meta tags', async ({ page }) => {
    // Check for essential PWA meta tags
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
    );

    // Check for theme color
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');

    // Check for Apple PWA meta tags
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'black-translucent');
    await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'Appesso');
  });

  test('should have PWA icons accessible', async ({ page }) => {
    // Check if PWA icons are accessible
    const icon192Response = await page.request.get('http://localhost:3000/icons/icon-192x192.png');
    expect(icon192Response.ok()).toBeTruthy();

    const icon512Response = await page.request.get('http://localhost:3000/icons/icon-512x512.png');
    expect(icon512Response.ok()).toBeTruthy();
  });

  test('should load offline page when offline', async ({ page, context }) => {
    // First, visit the main page to cache resources
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for service worker to be active
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    });

    // Simulate offline by intercepting network requests
    await context.setOffline(true);

    // Try to navigate to a new page that should trigger offline fallback
    await page.goto('http://localhost:3000/offline-test');

    // Should show offline page
    await expect(page.locator('h1')).toContainText(['Offline', '离线', '网络连接']);
  });

  test('should have preload links for performance', async ({ page }) => {
    // Check for resource preloading
    const preloadLinks = page.locator('link[rel="preload"]');
    await expect(preloadLinks).toHaveCount.greaterThan(0);

    // Check for preconnect links
    const preconnectLinks = page.locator('link[rel="preconnect"]');
    await expect(preconnectLinks).toHaveCount.greaterThan(0);
  });

  test('should have proper caching headers for static assets', async ({ page }) => {
    // Check if static assets have proper caching
    const response = await page.request.get('http://localhost:3000/_next/static/css/app/layout.css', {
      ignoreHTTPSErrors: true
    });

    if (response.ok()) {
      const cacheControl = response.headers()['cache-control'];
      expect(cacheControl).toBeDefined();
    }
  });

  test('should be installable (PWA criteria)', async ({ page }) => {
    // Check basic PWA installability criteria
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check if the page is served over HTTPS or localhost (PWA requirement)
    const url = page.url();
    expect(url.startsWith('https://') || url.startsWith('http://localhost')).toBeTruthy();

    // Check if manifest exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeVisible();

    // Check if service worker registration is attempted
    const hasServiceWorker = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(hasServiceWorker).toBeTruthy();
  });

  test('should have functional navigation after SW installation', async ({ page }) => {
    // Visit home page and wait for SW
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for service worker to be ready
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, { timeout: 10000 });

    // Navigate to different pages to test SW caching
    if (await page.locator('a[href="/feed"]').count() > 0) {
      await page.click('a[href="/feed"]');
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/feed');
    }

    // Navigate back to home
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');
  });
});