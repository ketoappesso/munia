import { test, expect } from '@playwright/test';

test('Check basic PWA status on https://xyuan.chat', async ({ page }) => {
  console.log('Starting PWA check for https://xyuan.chat');

  await page.goto('https://xyuan.chat');
  await page.waitForLoadState('networkidle');

  console.log('Current URL:', page.url());

  // Check if we can access the page
  const title = await page.title();
  console.log('Page title:', title);

  // Check manifest file existence
  try {
    const manifestResponse = await page.request.get('https://xyuan.chat/manifest.json');
    console.log('Manifest status:', manifestResponse.status());
    if (manifestResponse.ok()) {
      const manifest = await manifestResponse.json();
      console.log('Manifest content:', JSON.stringify(manifest, null, 2));
    }
  } catch (error) {
    console.log('Manifest error:', error);
  }

  // Check service worker file
  try {
    const swResponse = await page.request.get('https://xyuan.chat/sw.js');
    console.log('Service worker status:', swResponse.status());
    if (swResponse.ok()) {
      const swContent = await swResponse.text();
      console.log('Service worker content length:', swContent.length);
      console.log('Service worker first 200 chars:', swContent.substring(0, 200));
    }
  } catch (error) {
    console.log('Service worker error:', error);
  }

  // Check icon files
  try {
    const icon192Response = await page.request.get('https://xyuan.chat/icons/icon-192x192.png');
    console.log('Icon 192 status:', icon192Response.status());

    const icon512Response = await page.request.get('https://xyuan.chat/icons/icon-512x512.png');
    console.log('Icon 512 status:', icon512Response.status());
  } catch (error) {
    console.log('Icon error:', error);
  }

  // Check if PWA meta tags exist in HTML
  const htmlContent = await page.content();
  console.log('Has manifest link:', htmlContent.includes('manifest.json'));
  console.log('Has viewport meta:', htmlContent.includes('name="viewport"'));
  console.log('Has theme-color meta:', htmlContent.includes('theme-color'));
  console.log('Has apple-mobile-web-app meta:', htmlContent.includes('apple-mobile-web-app'));

  // Check service worker support
  const hasServiceWorkerSupport = await page.evaluate(() => {
    return 'serviceWorker' in navigator;
  });
  console.log('Service Worker API available:', hasServiceWorkerSupport);

  // Check if any service worker is registered
  const swRegistration = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          hasRegistration: !!registration,
          scope: registration?.scope,
          updatefound: !!registration?.updatefound,
          active: !!registration?.active
        };
      } catch (error) {
        return { error: error.message };
      }
    }
    return { noSupport: true };
  });
  console.log('Service Worker registration status:', swRegistration);

  // This test always passes - it's just for gathering information
  expect(title).toBeTruthy();
});