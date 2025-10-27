import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // 开发阶段直接引用源码，方便调试
      '@ldesign/player-lit': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-lit/define': resolve(__dirname, '../src/define.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),

      // 也可以指向构建产物（取消下面注释）
      // '@ldesign/player-lit': resolve(__dirname, '../es/index.js'),
      // '@ldesign/player-core': resolve(__dirname, '../../core/es/index.js'),
    }
  },

  server: {
    port: 8084,
    open: true
  },

  build: {
    outDir: 'dist'
  }
})
