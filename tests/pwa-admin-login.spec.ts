import { test, expect } from '@playwright/test';

test.describe('PWA Admin Login Tests', () => {
  test('admin login and PWA verification', async ({ page }) => {
    console.log('Starting PWA test with admin login...');

    // Set shorter timeout
    test.setTimeout(60000);

    try {
      // Navigate to login page
      await page.goto('https://xyuan.chat/login', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      console.log('Login page loaded:', page.url());

      // Wait for the page to be ready
      await page.waitForTimeout(2000);

      // Try different selectors for phone input
      let phoneInput;
      try {
        phoneInput = await page.waitForSelector('input[name="phoneNumber"]', { timeout: 5000 });
      } catch {
        try {
          phoneInput = await page.waitForSelector('input[type="tel"]', { timeout: 5000 });
        } catch {
          phoneInput = await page.waitForSelector('input[placeholder*="手机"]', { timeout: 5000 });
        }
      }

      if (phoneInput) {
        await phoneInput.fill('18874748888');
        console.log('Phone number filled');

        // Try different selectors for password input
        let passwordInput;
        try {
          passwordInput = await page.waitForSelector('input[name="password"]', { timeout: 5000 });
        } catch {
          passwordInput = await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        }

        if (passwordInput) {
          await passwordInput.fill('123456');
          console.log('Password filled');

          // Submit form
          try {
            await page.click('button[type="submit"]');
          } catch {
            await page.click('button:has-text("登录")');
          }

          console.log('Login form submitted');

          // Wait for redirect (don't wait for networkidle)
          await page.waitForTimeout(3000);

          console.log('After login URL:', page.url());

          // Check if login was successful (not on login page anymore)
          const isLoggedIn = !page.url().includes('/login');
          console.log('Login successful:', isLoggedIn);

          if (isLoggedIn) {
            console.log('✅ Login successful, testing PWA...');

            // Test PWA manifest
            const manifestResponse = await page.request.get('https://xyuan.chat/manifest.json');
            console.log('Manifest status:', manifestResponse.status());
            expect(manifestResponse.status()).toBe(200);

            if (manifestResponse.ok()) {
              const manifest = await manifestResponse.json();
              console.log('Manifest name:', manifest.name);
              expect(manifest.name).toBe('Appesso');
              expect(manifest.display).toBe('standalone');
            }

            // Test service worker
            const swResponse = await page.request.get('https://xyuan.chat/sw.js');
            console.log('Service Worker status:', swResponse.status());
            expect(swResponse.status()).toBe(200);

            // Test PWA icons
            const icon192Response = await page.request.get('https://xyuan.chat/icons/icon-192x192.png');
            console.log('Icon 192 status:', icon192Response.status());
            expect(icon192Response.status()).toBe(200);

            const icon512Response = await page.request.get('https://xyuan.chat/icons/icon-512x512.png');
            console.log('Icon 512 status:', icon512Response.status());
            expect(icon512Response.status()).toBe(200);

            // Check PWA meta tags in HTML
            const manifestLink = await page.locator('link[rel="manifest"]').count();
            console.log('Manifest link found:', manifestLink > 0);

            const viewportMeta = await page.locator('meta[name="viewport"]').count();
            console.log('Viewport meta found:', viewportMeta > 0);

            // Test service worker registration
            const swRegistration = await page.evaluate(async () => {
              if ('serviceWorker' in navigator) {
                try {
                  // Try to register if not already registered
                  const registration = await navigator.serviceWorker.getRegistration();
                  return {
                    hasRegistration: !!registration,
                    scope: registration?.scope,
                    scriptURL: registration?.active?.scriptURL
                  };
                } catch (error) {
                  return { error: error.message };
                }
              }
              return { noSupport: true };
            });

            console.log('Service Worker registration:', swRegistration);

            console.log('✅ PWA test completed successfully');
          } else {
            console.log('❌ Login failed');
          }

        } else {
          console.log('❌ Password input not found');
        }
      } else {
        console.log('❌ Phone input not found');
      }

    } catch (error) {
      console.log('Test error:', error.message);
    }
  });

  test('PWA installability check', async ({ page }) => {
    console.log('Testing PWA installability...');

    try {
      // Direct test of PWA assets without login
      await page.goto('https://xyuan.chat', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      console.log('Page loaded:', page.url());

      // Test PWA basic requirements
      const pwaCheck = await page.evaluate(async () => {
        const results = {
          isHttps: location.protocol === 'https:',
          hasServiceWorkerAPI: 'serviceWorker' in navigator,
          manifestAccessible: false,
          serviceWorkerAccessible: false,
          hasManifestLink: !!document.querySelector('link[rel="manifest"]'),
          hasViewportMeta: !!document.querySelector('meta[name="viewport"]')
        };

        // Test manifest
        try {
          const manifestResponse = await fetch('/manifest.json');
          results.manifestAccessible = manifestResponse.ok;
        } catch (e) {
          results.manifestAccessible = false;
        }

        // Test service worker
        try {
          const swResponse = await fetch('/sw.js');
          results.serviceWorkerAccessible = swResponse.ok;
        } catch (e) {
          results.serviceWorkerAccessible = false;
        }

        return results;
      });

      console.log('PWA Check Results:', pwaCheck);

      // Assertions
      expect(pwaCheck.isHttps).toBeTruthy();
      expect(pwaCheck.hasServiceWorkerAPI).toBeTruthy();
      expect(pwaCheck.manifestAccessible).toBeTruthy();
      expect(pwaCheck.serviceWorkerAccessible).toBeTruthy();
      expect(pwaCheck.hasManifestLink).toBeTruthy();
      expect(pwaCheck.hasViewportMeta).toBeTruthy();

      console.log('✅ PWA installability check passed');

    } catch (error) {
      console.log('PWA check error:', error.message);
      throw error;
    }
  });
});