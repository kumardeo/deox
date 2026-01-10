import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    register: 'src/register/index.ts',
  },
  format: ['esm', 'cjs'],
  platform: 'browser',
  sourcemap: true,
  splitting: true,
  bundle: true,
  skipNodeModulesBundle: true,
  dts: true,
  clean: true,
});
