import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: ['src/**/*.{js,ts}', '!src/**/*.{test,spec}.{js,ts}'],
		format: 'esm',
		platform: 'neutral',
		sourcemap: true,
		unbundle: true,
		deps: {
			neverBundle: true,
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
