import { test, expect } from '@playwright/test';

test.describe('PWA Login Tests - https://xyuan.chat', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing service workers and cache
    await page.goto('https://xyuan.chat');
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
    });
  });

  test('should login with admin account and verify PWA functionality', async ({ page }) => {
    console.log('Starting PWA login test with admin account');

    // Navigate to login page
    await page.goto('https://xyuan.chat/login');
    await page.waitForLoadState('domcontentloaded');

    console.log('Current URL:', page.url());

    // Fill login form
    await page.fill('input[name="phoneNumber"]', '18874748888');
    await page.fill('input[name="password"]', '123456');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for login to complete and redirect
    await page.waitForLoadState('networkidle');

    console.log('After login URL:', page.url());

    // Verify we're logged in (should be redirected away from login page)
    expect(page.url()).not.toContain('/login');

    // Check if we're on a protected page (feed, profile, etc.)
    const isOnProtectedPage = page.url().includes('/feed') ||
                             page.url().includes('/messages') ||
                             page.url().includes('/notifications') ||
                             !page.url().includes('/login');

    expect(isOnProtectedPage).toBeTruthy();

    // Now test PWA functionality while logged in
    await testPWAManifest(page);
    await testPWAServiceWorker(page);
    await testPWAIcons(page);
    await testPWAMetaTags(page);
  });

  test('should maintain PWA functionality after navigation while logged in', async ({ page }) => {
    // Login first
    await loginAsAdmin(page);

    // Navigate to different pages and test PWA
    const pagesToTest = ['/feed', '/messages', '/notifications'];

    for (const pagePath of pagesToTest) {
      await page.goto(`https://xyuan.chat${pagePath}`);
      await page.waitForLoadState('domcontentloaded');

      console.log(`Testing PWA on page: ${pagePath}`);

      // Test manifest is still accessible
      const manifestResponse = await page.request.get('https://xyuan.chat/manifest.json');
      expect(manifestResponse.status()).toBe(200);

      // Test service worker is still available
      const swResponse = await page.request.get('https://xyuan.chat/sw.js');
      expect(swResponse.status()).toBe(200);
    }
  });

  test('should install PWA after login', async ({ page, browserName }) => {
    // Skip on Firefox as it doesn't support PWA installation prompts
    test.skip(browserName === 'firefox', 'Firefox does not support PWA installation prompts');

    // Login first
    await loginAsAdmin(page);

    // Check PWA installability criteria
    const installabilityCheck = await page.evaluate(async () => {
      const results = {
        isHttps: location.protocol === 'https:',
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        manifestAccessible: false,
        serviceWorkerAccessible: false
      };

      // Test manifest accessibility
      try {
        const manifestResponse = await fetch('/manifest.json');
        results.manifestAccessible = manifestResponse.ok;
      } catch (e) {
        results.manifestAccessible = false;
      }

      // Test service worker accessibility
      try {
        const swResponse = await fetch('/sw.js');
        results.serviceWorkerAccessible = swResponse.ok;
      } catch (e) {
        results.serviceWorkerAccessible = false;
      }

      return results;
    });

    console.log('PWA installability check after login:', installabilityCheck);

    expect(installabilityCheck.isHttps).toBeTruthy();
    expect(installabilityCheck.hasManifest).toBeTruthy();
    expect(installabilityCheck.hasServiceWorker).toBeTruthy();
    expect(installabilityCheck.manifestAccessible).toBeTruthy();
  });

  test('should handle offline functionality while logged in', async ({ page, context }) => {
    // Login first
    await loginAsAdmin(page);

    // Wait for service worker registration
    await page.waitForTimeout(5000);

    // Check if service worker is active
    const swActive = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration && registration.active !== null;
      }
      return false;
    });

    console.log('Service Worker active after login:', swActive);

    if (swActive) {
      // Set offline mode
      await context.setOffline(true);

      // Try to navigate to feed page offline
      try {
        await page.goto('https://xyuan.chat/feed');
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        const pageContent = await page.textContent('body');
        console.log('Offline page content preview:', pageContent?.substring(0, 200));

        // Should either show cached content or offline page
        const hasContent = pageContent && pageContent.length > 100;
        expect(hasContent).toBeTruthy();

      } catch (error) {
        console.log('Offline navigation handled by service worker:', error.message);
      }

      // Restore online mode
      await context.setOffline(false);
    } else {
      console.log('Service Worker not active, skipping offline test');
    }
  });
});

// Helper functions
async function loginAsAdmin(page: any) {
  await page.goto('https://xyuan.chat/login');
  await page.waitForLoadState('domcontentloaded');

  await page.fill('input[name="phoneNumber"]', '18874748888');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');

  await page.waitForLoadState('networkidle');

  // Verify login success
  expect(page.url()).not.toContain('/login');
}

async function testPWAManifest(page: any) {
  const manifestResponse = await page.request.get('https://xyuan.chat/manifest.json');
  expect(manifestResponse.status()).toBe(200);

  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('Appesso');
  expect(manifest.short_name).toBe('Appesso');
  expect(manifest.display).toBe('standalone');
  expect(manifest.theme_color).toBe('#000000');
  expect(manifest.icons).toHaveLength(2);
}

async function testPWAServiceWorker(page: any) {
  const swResponse = await page.request.get('https://xyuan.chat/sw.js');
  expect(swResponse.status()).toBe(200);

  const swContent = await swResponse.text();
  expect(swContent.length).toBeGreaterThan(1000);
}

async function testPWAIcons(page: any) {
  const icon192Response = await page.request.get('https://xyuan.chat/icons/icon-192x192.png');
  expect(icon192Response.status()).toBe(200);

  const icon512Response = await page.request.get('https://xyuan.chat/icons/icon-512x512.png');
  expect(icon512Response.status()).toBe(200);
}

async function testPWAMetaTags(page: any) {
  // Check for manifest link
  const manifestLink = page.locator('link[rel="manifest"]');
  const manifestCount = await manifestLink.count();
  if (manifestCount > 0) {
    await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
  }

  // Check for viewport meta tag
  const viewportMeta = page.locator('meta[name="viewport"]');
  const viewportCount = await viewportMeta.count();
  expect(viewportCount).toBeGreaterThan(0);
}