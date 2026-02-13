import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { readFileSync } from 'fs'

// Read version from package.json for reliable build-time injection
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_VERSION__: JSON.stringify(packageJson.version),
  },
  base: '/tracker/',
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    VitePWA({
      // Use injectManifest mode for custom service worker with error handling
      // This allows us to handle IndexedDB errors that occur on OnePlus 12 devices
      // after OAuth redirects
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'apple-touch-icon.svg', 'masked-icon.svg'],
      manifest: {
        name: 'OnePlus 12 Pro Tracker',
        short_name: 'Tracker',
        description: '21-week progressive strength training program with AI coaching',
        theme_color: '#ef4444',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/tracker/',
        start_url: '/tracker/',
        categories: ['fitness', 'health', 'sports'],
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
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
      // injectManifest mode requires different workbox options
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
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
      },
      output: {
        manualChunks: {
          // Vendor chunk for large dependencies
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/database', '@firebase/database'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-ui': ['lucide-react', 'clsx'],
          // Separate chunk for Automerge CRDT library
          'vendor-automerge': ['@automerge/automerge'],
          // Sentry and Material utilities in separate chunks
          'vendor-monitoring': ['@sentry/react'],
          'vendor-material': ['@material/material-color-utilities'],
        }
      }
    },
    copyPublicDir: true,
    // Increase chunk size warning limit since we're code-splitting
    chunkSizeWarningLimit: 600
  }
})
