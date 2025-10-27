import { defineConfig } from '@ldesign/builder'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  input: 'src/index.ts',

  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'LDesignPlayerVue',
    },
  },

  plugins: [vue()],

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'vue',
    '@ldesign/player-core',
    '@ldesign/shared',
    /^lodash/,
  ],
})


