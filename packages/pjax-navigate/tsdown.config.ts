import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: 'esm',
	platform: 'neutral',
	target: 'es2018',
	sourcemap: false,
	unbundle: false,
	minify: true,
	deps: {
		neverBundle: true,
	},
	dts: true,
	clean: true,
	ignoreWatch: ['.turbo'],
});
