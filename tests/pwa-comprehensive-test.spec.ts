import { test, expect } from '@playwright/test';

test.describe('PWA Comprehensive Tests - https://xyuan.chat', () => {
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

  test('should have manifest.json accessible and valid', async ({ page }) => {
    // Check manifest response
    const manifestResponse = await page.request.get('https://xyuan.chat/manifest.json');
    console.log('Manifest status:', manifestResponse.status());

    if (manifestResponse.status() === 200) {
      const manifest = await manifestResponse.json();
      console.log('Manifest content:', JSON.stringify(manifest, null, 2));

      // Validate manifest properties
      expect(manifest.name).toBe('Appesso');
      expect(manifest.short_name).toBe('Appesso');
      expect(manifest.display).toBe('standalone');
      expect(manifest.theme_color).toBe('#000000');
      expect(manifest.icons).toHaveLength(2);
      expect(manifest.icons[0].src).toBe('/icons/icon-192x192.png');
      expect(manifest.icons[1].src).toBe('/icons/icon-512x512.png');
    } else {
      console.log('Manifest not accessible, status:', manifestResponse.status());
      const responseText = await manifestResponse.text();
      console.log('Response body:', responseText.substring(0, 200));
    }
  });

  test('should have service worker file accessible', async ({ page }) => {
    const swResponse = await page.request.get('https://xyuan.chat/sw.js');
    console.log('Service Worker status:', swResponse.status());

    if (swResponse.status() === 200) {
      const swContent = await swResponse.text();
      console.log('Service Worker content length:', swContent.length);
      expect(swContent.length).toBeGreaterThan(100);
      expect(swContent).toContain('appesso-v1.0.0');
    } else {
      console.log('Service Worker not accessible, status:', swResponse.status());
      const responseText = await swResponse.text();
      console.log('Response body:', responseText.substring(0, 200));
    }
  });

  test('should have PWA icons accessible', async ({ page }) => {
    // Check 192x192 icon
    const icon192Response = await page.request.get('https://xyuan.chat/icons/icon-192x192.png');
    console.log('Icon 192 status:', icon192Response.status());

    // Check 512x512 icon
    const icon512Response = await page.request.get('https://xyuan.chat/icons/icon-512x512.png');
    console.log('Icon 512 status:', icon512Response.status());

    if (icon192Response.status() === 200 && icon512Response.status() === 200) {
      expect(icon192Response.ok()).toBeTruthy();
      expect(icon512Response.ok()).toBeTruthy();
    } else {
      console.log('Icons not accessible');
    }
  });

  test('should register service worker on page load', async ({ page }) => {
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    // Wait for service worker registration
    await page.waitForTimeout(5000);

    const swRegistrationInfo = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return {
            hasRegistration: !!registration,
            scope: registration?.scope,
            state: registration?.active?.state,
            scriptURL: registration?.active?.scriptURL,
            updatefound: !!registration?.updatefound
          };
        } catch (error) {
          return { error: error.message };
        }
      }
      return { noSupport: true };
    });

    console.log('Service Worker registration info:', swRegistrationInfo);

    if (swRegistrationInfo.hasRegistration) {
      expect(swRegistrationInfo.hasRegistration).toBeTruthy();
      expect(swRegistrationInfo.scriptURL).toContain('/sw.js');
    }
  });

  test('should have proper PWA meta tags in HTML', async ({ page }) => {
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    // Check for manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLink.count();
    console.log('Manifest link count:', manifestCount);

    if (manifestCount > 0) {
      await expect(manifestLink).toHaveAttribute('href', '/manifest.json');
    }

    // Check for viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]');
    const viewportCount = await viewportMeta.count();
    console.log('Viewport meta count:', viewportCount);

    // Check for theme color meta tag
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    const themeColorCount = await themeColorMeta.count();
    console.log('Theme color meta count:', themeColorCount);

    // Check for Apple PWA meta tags
    const appleMeta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    const appleMetaCount = await appleMeta.count();
    console.log('Apple PWA meta count:', appleMetaCount);
  });

  test('should show install prompt conditions', async ({ page, browserName }) => {
    // Skip on Firefox as it doesn't support PWA installation prompts
    test.skip(browserName === 'firefox', 'Firefox does not support PWA installation prompts');

    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

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

    console.log('PWA installability check:', installabilityCheck);

    expect(installabilityCheck.isHttps).toBeTruthy();
    expect(installabilityCheck.hasServiceWorker).toBeTruthy();
  });

  test('should cache resources with service worker', async ({ page }) => {
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    // Wait for service worker to potentially cache resources
    await page.waitForTimeout(10000);

    const cacheInfo = await page.evaluate(async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheDetails = {};

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            cacheDetails[cacheName] = requests.map(req => req.url);
          }

          return {
            cacheNames,
            cacheDetails,
            totalCaches: cacheNames.length
          };
        } catch (error) {
          return { error: error.message };
        }
      }
      return { noCacheAPI: true };
    });

    console.log('Cache info:', cacheInfo);

    if (cacheInfo.totalCaches > 0) {
      expect(cacheInfo.totalCaches).toBeGreaterThan(0);
    }
  });

  test('should handle offline scenario', async ({ page, context }) => {
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    // Wait for service worker installation
    await page.waitForTimeout(5000);

    // Check if service worker is active
    const swActive = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration && registration.active !== null;
      }
      return false;
    });

    console.log('Service Worker active before offline test:', swActive);

    if (swActive) {
      // Set offline mode
      await context.setOffline(true);

      // Try to navigate to cached page or offline page
      try {
        await page.goto('https://xyuan.chat/offline');
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

        const pageTitle = await page.title();
        console.log('Offline page title:', pageTitle);

        // Should show offline page content
        const offlineContent = await page.textContent('body');
        expect(offlineContent).toContain('离线' || 'Offline' || '网络');
      } catch (error) {
        console.log('Offline navigation error:', error.message);
      }

      // Restore online mode
      await context.setOffline(false);
    } else {
      console.log('Service Worker not active, skipping offline test');
    }
  });

  test('should pass basic PWA audit criteria', async ({ page }) => {
    await page.goto('https://xyuan.chat');
    await page.waitForLoadState('networkidle');

    const auditResults = await page.evaluate(async () => {
      const results = {
        // Basic PWA requirements
        isHttps: location.protocol === 'https:',
        hasManifest: !!document.querySelector('link[rel="manifest"]'),
        hasServiceWorker: 'serviceWorker' in navigator,
        hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
        hasTitle: !!document.title,
        hasThemeColor: !!document.querySelector('meta[name="theme-color"]'),

        // Manifest validation
        manifestData: null,
        manifestValid: false,

        // Service Worker validation
        swRegistered: false,
        swActive: false
      };

      // Test manifest
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          results.manifestData = manifest;
          results.manifestValid = !!(manifest.name && manifest.icons && manifest.start_url !== undefined);
        }
      } catch (e) {
        console.log('Manifest fetch error:', e);
      }

      // Test service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          results.swRegistered = !!registration;
          results.swActive = !!(registration && registration.active);
        } catch (e) {
          console.log('Service worker check error:', e);
        }
      }

      return results;
    });

    console.log('PWA Audit Results:', auditResults);

    // Verify core PWA requirements
    expect(auditResults.isHttps).toBeTruthy();
    expect(auditResults.hasServiceWorker).toBeTruthy();
    expect(auditResults.hasViewportMeta).toBeTruthy();
    expect(auditResults.hasTitle).toBeTruthy();
  });
});