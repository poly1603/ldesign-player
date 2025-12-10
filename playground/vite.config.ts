import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ldesign/player-core': resolve(__dirname, '../packages/core/src'),
      '@ldesign/player-vue': resolve(__dirname, '../packages/vue/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
})
