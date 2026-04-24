import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Dashboard',
        short_name: 'Dashboard',
        description: 'Personal dashboard with todos, calendar, weather',
        theme_color: '#ffffff',
        background_color: '#f0f2f5',
        display: 'standalone',
        display_override: ['standalone'],
        orientation: 'portrait',
        start_url: '/my-dashboard-frontend/',
        scope: '/my-dashboard-frontend/',
        lang: 'en',
        categories: ['productivity', 'utilities'],
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
      }
    })
  ],
  base: '/my-dashboard-frontend/',
  server: {
    proxy: {
      '/api': {
        target: 'https://mydashboardapi.jprogrammer.online/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})