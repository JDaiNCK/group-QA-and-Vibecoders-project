import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Bind explicitly to IPv4. Vite defaults to `localhost`, which resolves to
    // ::1 only on Windows, and Playwright's webServer readiness probe dials
    // 127.0.0.1.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Proxy the Laravel API so the SPA and the API share an origin in dev and
    // in Playwright. Relative '/api/...' URLs in the client therefore work
    // identically here and in production behind Laravel.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
