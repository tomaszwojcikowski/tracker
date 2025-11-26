import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'OnePlus 12 Pro Tracker',
        short_name: 'Tracker',
        description: '21-week progressive strength training program with AI coaching',
        theme_color: '#ef4444',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/tracker/',
        start_url: '/tracker/',
        categories: ['fitness', 'health', 'sports'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cache static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Cache Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Cache Lucide icons
            urlPattern: /^https:\/\/unpkg\.com\/lucide.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lucide-icons',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache workout data with stale-while-revalidate
            urlPattern: /\.(json)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workout-data',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ],
        // Clean up outdated caches
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        clientsClaim: true,
        // Navigations should be handled by the app shell
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: false // Disable in dev to avoid caching issues
      }
    })
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    copyPublicDir: true
  }
})
