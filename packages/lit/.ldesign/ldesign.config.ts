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
      name: 'LDesignPlayerLit',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'lit',
    'lit/decorators.js',
    'lit/directives/class-map.js',
    'lit/directives/style-map.js',
    '@ldesign/player-core',
    '@ldesign/shared',
    /^lodash/,
  ],
})

