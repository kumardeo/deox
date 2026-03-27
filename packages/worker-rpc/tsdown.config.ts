import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    register: 'src/register/index.ts',
  },
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
