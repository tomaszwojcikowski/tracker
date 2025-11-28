/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// Use skipWaiting to activate new service worker immediately
self.skipWaiting();

// Claim clients immediately
clientsClaim();

// Clean up old caches
cleanupOutdatedCaches();

// Precache and route assets from the manifest
// The manifest is injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);

// Navigation route - serve cached index.html for navigation requests
const navigationRoute = new NavigationRoute(
    new NetworkFirst({
        cacheName: 'pages-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    }),
    {
        denylist: [/^\/api\//],
    }
);
registerRoute(navigationRoute);

// Cache Google Fonts stylesheets
// Note: Removed ExpirationPlugin to avoid IndexedDB errors on some devices
registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Cache Google Fonts webfonts
registerRoute(
    /^https:\/\/fonts\.gstatic\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Cache Lucide icons
registerRoute(
    /^https:\/\/unpkg\.com\/lucide.*/i,
    new CacheFirst({
        cacheName: 'lucide-icons',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Cache workout data with stale-while-revalidate
registerRoute(
    /\.(json)$/i,
    new StaleWhileRevalidate({
        cacheName: 'workout-data',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

/**
 * Check if an error is an IndexedDB backing store error
 * This error occurs on some devices (e.g., OnePlus 12) when IndexedDB
 * fails to initialize properly after OAuth redirect
 *
 * Note: This function is intentionally duplicated from src/utils/oauth.ts
 * because service workers are built separately and can't import from
 * the main app bundle. Keep both versions in sync if changes are needed.
 */
function isIndexedDBBackingStoreError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as { name?: string; message?: string };
    if (err.name !== 'UnknownError') return false;

    const message = String(err.message || '');
    return (
        message.includes('IndexedDB') ||
        message.includes('indexedDB') ||
        message.includes('backing store')
    );
}

// Global unhandled rejection handler to prevent IndexedDB errors from crashing the service worker
// This specifically handles the case where IndexedDB fails to open on OnePlus 12 devices
// after returning from OAuth redirect
self.addEventListener('unhandledrejection', (event) => {
    if (isIndexedDBBackingStoreError(event.reason)) {
        // Prevent the error from being logged as an unhandled rejection
        event.preventDefault();
        console.warn('SW: IndexedDB error suppressed (expected on some devices after OAuth redirect):', (event.reason as Error).message);
        return;
    }

    // Log other unhandled rejections for debugging
    console.error('SW: Unhandled promise rejection:', event.reason);
});

// Handle skip waiting message from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
