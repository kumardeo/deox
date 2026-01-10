import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'neutral',
    sourcemap: true,
    splitting: true,
    bundle: true,
    skipNodeModulesBundle: true,
    dts: true,
    clean: true,
  },
  {
    entry: {
      'blogger-feed': 'src/iife.ts',
    },
    format: 'iife',
    platform: 'browser',
    sourcemap: true,
    splitting: false,
    bundle: true,
    minify: true,
    outExtension: () => ({
      js: '.min.js',
    }),
  },
]);
