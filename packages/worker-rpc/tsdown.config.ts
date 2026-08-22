import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/**/*.{js,ts}', '!src/**/*.{test,spec}.{js,ts}'],
	format: 'esm',
	platform: 'browser',
	sourcemap: true,
	unbundle: true,
	deps: {
		neverBundle: true,
	},
	dts: true,
	clean: true,
	ignoreWatch: ['.turbo'],
});
