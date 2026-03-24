import { defineConfig } from 'tsdown';

export default defineConfig((_) => ({
  entry: ['src/**/*.{ts,js}'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  target: 'es2018',
  sourcemap: true,
  unbundle: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: true,
  clean: true,
  shims: true,
  ignoreWatch: ['.turbo'],
}));
