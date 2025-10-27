import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // 开发阶段直接引用源码，方便调试
      '@ldesign/player-react': resolve(__dirname, '../src/index.ts'),
      '@ldesign/player-core': resolve(__dirname, '../../core/src/index.ts'),

      // 也可以指向构建产物（取消下面注释）
      // '@ldesign/player-react': resolve(__dirname, '../es/index.js'),
      // '@ldesign/player-core': resolve(__dirname, '../../core/es/index.js'),
    }
  },

  server: {
    port: 8083,
    open: true
  },

  build: {
    outDir: 'dist'
  }
})
