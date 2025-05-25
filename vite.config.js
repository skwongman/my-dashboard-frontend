import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
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