import { defineConfig } from '@ldesign/builder'

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
      name: 'LDesignPlayerCore',
      globals: {
        howler: 'Howl',
        '@ldesign/shared': 'LDesignShared'
      }
    },
  },

  css: {
    extract: true,
    inject: false
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    '@ldesign/shared',
    /^lodash/,
  ],
})


