import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      // Rule 1: Proxy cho API
      '/api': {
        target: 'http://localhost:8080', // Your Spring Boot backend
        changeOrigin: true,
        secure: false,
      },
      // THÊM MỚI: Rule 2: Proxy cho file uploads
      '/uploads': {
        target: 'http://localhost:8080', // Cùng backend
        changeOrigin: true,
        secure: false,
      },
    }
  }
})