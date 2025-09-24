import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
  },
  {
    entry: {
      'blogger-feed': 'src/iife.ts',
    },
    format: 'iife',
    splitting: false,
    sourcemap: true,
    bundle: true,
    minify: true,
    outExtension: () => ({
      js: '.min.js',
    }),
  },
]);
