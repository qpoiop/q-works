import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.png'],
      manifest: {
        name: '팀 작업 관리',
        short_name: '작업관리',
        description: '개인 할 일과 팀 공개 업무, 마일스톤과 타임라인을 한 곳에서 관리하세요.',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#eef0f3',
        theme_color: '#3563e8',
        icons: [
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: { vendor: ['react', 'react-dom'] }
      }
    }
  },
  server: {
    proxy: { '/api': 'http://localhost:8787' }
  }
})
