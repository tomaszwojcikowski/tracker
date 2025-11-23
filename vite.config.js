import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/tracker/',
  plugins: [react()],
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
