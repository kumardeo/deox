import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'node',
  sourcemap: true,
  shims: true,
  splitting: true,
  bundle: false,
  dts: true,
  clean: true,
});
