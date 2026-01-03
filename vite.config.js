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
      },
      '/yahoo-news': {
        target: 'https://news.yahoo.co.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yahoo-news/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
          'Cookie': 'B=aofa11tiu89b4&b=3&s=md; XB=aofa11tiu89b4&b=3&s=md; A=43a2l85iu89b4&sd=A&t=1709450596&u=1729930005&v=1'
        }
      }
    }
  }
})