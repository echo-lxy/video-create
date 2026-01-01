// Service Worker for caching assets
const CACHE_NAME = 'ai-video-editor-v1';
const ASSETS_TO_CACHE = [
  '/esbuild/esbuild.wasm',
  '/monaco/vs/loader.js',
  '/monaco/vs/editor/editor.main.js',
  '/monaco/vs/editor/editor.main.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

