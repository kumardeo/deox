import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  sourcemap: true,
  splitting: true,
  bundle: true,
  skipNodeModulesBundle: true,
  dts: true,
  clean: true,
});
