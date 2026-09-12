import fs from 'fs';
import path from 'path';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

async function runPwaTests() {
  console.log('=======================================================');
  console.log(' WEBHUNT PRODUCTION PROGRESSIVE WEB APP (PWA) SUITE ');
  console.log('=======================================================\n');

  // --- 1. Web App Manifest Validation ---
  console.log('--- 1. Web App Manifest Specification ---');
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  assert(fs.existsSync(manifestPath), 'public/manifest.json exists on filesystem');

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifestContent.name === 'WebHunt', 'Manifest name is "WebHunt"');
  assert(manifestContent.short_name === 'WebHunt', 'Manifest short_name is "WebHunt"');
  assert(manifestContent.display === 'standalone', 'Display mode is "standalone"');
  assert(manifestContent.start_url === '/', 'start_url is "/"');
  assert(manifestContent.theme_color === '#000000', 'theme_color matches WebHunt black palette');
  assert(manifestContent.background_color === '#000000', 'background_color matches WebHunt black palette');
  assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length >= 4, 'Manifest includes standard icon definitions');

  const has192 = manifestContent.icons.some((i: any) => i.sizes === '192x192' && i.src === '/icons/icon-192.png');
  const has512 = manifestContent.icons.some((i: any) => i.sizes === '512x512' && i.src === '/icons/icon-512.png');
  const hasMaskable = manifestContent.icons.some((i: any) => i.purpose === 'maskable');
  assert(has192, 'Manifest contains 192x192 icon');
  assert(has512, 'Manifest contains 512x512 icon');
  assert(hasMaskable, 'Manifest contains maskable icon definition');

  // --- 2. Icon Binary Integrity Checks ---
  console.log('\n--- 2. Icon Asset Binaries & Format Integrity ---');
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const requiredIcons = [
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'maskable-192.png',
    'maskable-512.png',
  ];

  for (const iconName of requiredIcons) {
    const iconPath = path.join(process.cwd(), 'public', 'icons', iconName);
    assert(fs.existsSync(iconPath), `Icon exists: public/icons/${iconName}`);
    const buf = fs.readFileSync(iconPath);
    assert(buf.subarray(0, 8).equals(PNG_MAGIC), `Valid PNG magic header for ${iconName}`);
    assert(buf.length > 500, `Icon file size is non-empty (${buf.length} bytes)`);
  }

  // --- 3. Service Worker Architecture & Caching Policy ---
  console.log('\n--- 3. Service Worker Implementation & Policy ---');
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  assert(fs.existsSync(swPath), 'public/sw.js exists');

  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes('CACHE_NAME'), 'Service worker specifies versioned cache');
  assert(swContent.includes('skipWaiting'), 'Service worker implements immediate skipWaiting activation');
  assert(swContent.includes('clients.claim'), 'Service worker implements clients.claim');

  // Critical Security & Data Integrity Check:
  assert(swContent.includes('/api/'), 'Service worker checks API route prefixes');
  assert(swContent.includes('Next-Action'), 'Service worker excludes Server Action POST requests from caching');
  assert(
    swContent.includes('offline: true') || swContent.includes('503'),
    'Service worker provides truthful offline error without fabricating lead data'
  );
  assert(
    swContent.includes('You are currently offline') || swContent.includes('You Are Currently Offline'),
    'Service worker includes clear user-facing offline message'
  );

  // --- 4. Root Layout & Apple/iOS PWA Metadata ---
  console.log('\n--- 4. Layout & Apple Standalone Metadata ---');
  const layoutPath = path.join(process.cwd(), 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(layoutContent.includes('manifest: "/manifest.json"') || layoutContent.includes("manifest: '/manifest.json'"), 'Layout exports manifest link');
  assert(layoutContent.includes('appleWebApp'), 'Layout exports Apple Web App configuration');
  assert(layoutContent.includes('PwaRegister'), 'Layout includes PwaRegister component');
  assert(layoutContent.includes('viewportFit'), 'Viewport includes cover fit for mobile display cutouts');

  // --- 5. Edge Middleware Route Exemptions ---
  console.log('\n--- 5. Middleware Exemption Audit ---');
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  assert(middlewareContent.includes('/sw.js'), 'Middleware allows /sw.js');
  assert(middlewareContent.includes('/manifest.json'), 'Middleware allows /manifest.json');
  assert(middlewareContent.includes('/icons/'), 'Middleware allows /icons/');

  console.log('\n=======================================================');
  console.log('🎉 ALL PWA INTEGRATION & AUDIT TESTS PASSED 100%!');
  console.log('=======================================================\n');
}

runPwaTests().catch((err) => {
  console.error('PWA Test failure:', err);
  process.exit(1);
});
