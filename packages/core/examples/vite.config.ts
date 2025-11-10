import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // 开发阶段直接引用源码，方便调试
      '@ldesign/player-core': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core/audio': resolve(__dirname, '../src/audio'),
      '@ldesign/player-core/core': resolve(__dirname, '../src/core'),
      '@ldesign/player-core/video': resolve(__dirname, '../src/video'),
      '@ldesign/player-core/types': resolve(__dirname, '../src/types'),
      '@ldesign/player-core/utils': resolve(__dirname, '../src/utils'),

      // 也可以指向构建产物（取消下面注释）
      // '@ldesign/player-core': resolve(__dirname, '../es/index.js'),
    }
  },
  server: {
    port: 8889,
    host: '0.0.0.0', // 监听所有接口，包括 IPv4
    open: '/index.html'
  },
  build: {
    outDir: 'dist'
  }
})

