import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  splitting: true,
  bundle: true,
  skipNodeModulesBundle: true,
  shims: true,
  dts: true,
  clean: true,
});
