/**
 * WebHunt Production Progressive Web App Service Worker
 * Conservative Caching Policy:
 * - Static Assets: Cache-First / Stale-While-Revalidate
 * - Dynamic Lead Radar & APIs: Strictly Network-Only (No stale lead data)
 * - Navigation: Network-First with graceful Offline Fallback
 */

const CACHE_NAME = 'webhunt-v1-static';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png',
];

// 1. Install Event: Precache static core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching app shell assets');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[ServiceWorker] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Conservative routing
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Only handle standard http and https requests (ignore chrome-extension:, moz-extension:, data:, blob:, etc.)
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  const url = new URL(request.url);

  // 2. Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // A. Strictly Network-Only for dynamic APIs, Auth, and Server Actions
  if (
    url.pathname.startsWith('/api/') ||
    request.headers.get('Next-Action') ||
    url.searchParams.has('_rsc')
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Live lead scanning and data updates require an active internet connection.',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // B. Cache-First for static immutable assets (_next/static, icons, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cache and update in background (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // C. Network-Only for HTML Page Navigation with Clean Offline Fallback
  // (Prevents caching authenticated HTML or leaking user session data across sessions)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
            `<!DOCTYPE html>
            <html lang="en" class="dark">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
              <title>WebHunt | Offline</title>
              <style>
                body {
                  margin: 0;
                  padding: 32px 16px;
                  background-color: #000000;
                  color: #F8F3F0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 80vh;
                  text-align: center;
                }
                .card {
                  max-width: 440px;
                  background-color: #0D0D0D;
                  border: 1px solid rgba(248,243,240,0.15);
                  border-radius: 24px;
                  padding: 32px 24px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.8);
                }
                .icon-box {
                  width: 56px;
                  height: 56px;
                  border-radius: 16px;
                  background-color: #161616;
                  border: 1px solid rgba(0,72,187,0.3);
                  color: #0048BB;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin: 0 auto 16px auto;
                  font-size: 24px;
                }
                h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #F8F3F0; }
                p { font-size: 13px; line-height: 20px; color: #A8A196; margin: 0 0 24px 0; }
                button {
                  background-color: #0048BB;
                  color: #FFFFFF;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 12px;
                  font-size: 13px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: background-color 0.2s;
                }
                button:hover { background-color: #00388A; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon-box">⚡</div>
                <h1>You Are Currently Offline</h1>
                <p>WebHunt live lead discovery radar requires an active internet connection to scan real-world data and public APIs.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }
          );
        })
    );
    return;
  }
});
