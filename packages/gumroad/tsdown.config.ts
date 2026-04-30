import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'neutral',
    target: 'es2018',
    sourcemap: true,
    unbundle: false,
    deps: {
      skipNodeModulesBundle: true,
    },
    dts: true,
    clean: true,
    ignoreWatch: ['.turbo'],
  },
  {
    entry: {
      gumroad: 'src/iife.ts',
    },
    format: 'iife',
    platform: 'browser',
    target: 'es2018',
    outputOptions: { entryFileNames: '[name].min.js' },
    sourcemap: true,
    unbundle: false,
    deps: {
      alwaysBundle: /./,
    },
    minify: true,
    ignoreWatch: ['.turbo'],
  },
]);
