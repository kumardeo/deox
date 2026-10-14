import type { NavigatorConfig, NavigatorOptions } from './types';

let config: NavigatorConfig | undefined;

export function setConfig(options: NavigatorOptions = {}): void {
	const {
		ssr = typeof window === 'undefined',
		dev = false,
		prefetch = false,
		styles = true,
		fetch: fetchCallback,
	} = options;

	config = {
		isBrowser: ssr === false,
		isDev: dev === true,
		collectClientStyles: styles,
		prefetchEnabled: prefetch === true,
		fetchCallback: async (url, { prefetch = false, ...init } = {}) => {
			if (typeof fetchCallback === 'function') {
				return fetchCallback(url instanceof URL ? url : new URL(url), {
					...init,
					prefetch,
				});
			}
			return fetch(url, init);
		},
	};
}

export function getConfig(): NavigatorConfig {
	if (!config) {
		throw new Error();
	}
	return config;
}

export function hasConfig(): boolean {
	return !!config;
}
