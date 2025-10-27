import { defineConfig } from '@ldesign/builder'
import react from '@vitejs/plugin-react'

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
      name: 'LDesignPlayerReact',
    },
  },

  plugins: [react()],

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,

  external: [
    'react',
    'react-dom',
    '@ldesign/player-core',
    '@ldesign/shared',
    /^lodash/,
  ],
})


