import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // 开发阶段直接引用源码，方便调试
      '@ldesign/player-vue': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),

      // 也可以指向构建产物（取消下面注释）
      // '@ldesign/player-vue': resolve(__dirname, '../es/index.js'),
      // '@ldesign/player-core': resolve(__dirname, '../../core/es/index.js'),
    }
  },

  server: {
    port: 8082,
    open: true
  },

  build: {
    outDir: 'dist'
  }
})

