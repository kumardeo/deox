import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'browser',
  target: 'es2018',
  sourcemap: true,
  unbundle: false,
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: true,
  clean: true,
  ignoreWatch: ['.turbo'],
});
