import { getConfig } from './config';
import { PAGE_LOAD_EVENT, PREFETCH_ATTR } from './constants';
import type { PrefetchOptions } from './types';

// Track prefetched URLs so we don't prefetch twice
const prefetchedUrls = new Set<string>();
// Track listened anchors so we don't attach duplicated listeners
const listenedAnchors = new WeakSet<HTMLAnchorElement>();

// User-defined config for prefetch. The values are injected by vite-plugin-prefetch
// and can be undefined if not configured. But it will be set a fallback value in `init()`.
let prefetchAll = false;
let defaultStrategy = 'hover';
let clientPrerender = false;

let isPrefetchInitialized = false;

function debug(phase: string, message: string): void {
	const { isDev } = getConfig();

	if (isDev) {
		console.debug(
			`[pjax-navigate:${phase}]`,
			message,
			`${performance.now().toFixed(2)}ms`,
		);
	}
}

interface InitPrefetchOptions {
	defaultStrategy?: string;
	prefetchAll?: boolean;
	clientPrerender?: boolean;
}

/**
 * Initialize the prefetch script, only works once.
 *
 * @param defaultOpts Default options for prefetching if not already set by the user config.
 */
export function initPrefetch(defaultOpts?: InitPrefetchOptions): void {
	const { isBrowser } = getConfig();

	if (!isBrowser) {
		return;
	}

	// Init only once
	if (isPrefetchInitialized) {
		return;
	}

	isPrefetchInitialized = true;

	debug('prefetch', 'Initializing prefetch script');

	// Fallback default values if not set by user config
	prefetchAll ??= defaultOpts?.prefetchAll ?? false;
	defaultStrategy ??= defaultOpts?.defaultStrategy ?? 'hover';
	clientPrerender ??= defaultOpts?.clientPrerender ?? false;

	// In the future, perhaps we can enable treeshaking specific unused strategies
	initTapStrategy();
	initHoverStrategy();
	initViewportStrategy();
	initLoadStrategy();
}

/**
 * Prefetch links with higher priority when the user taps on them
 */
function initTapStrategy(): void {
	for (const event of ['touchstart', 'mousedown']) {
		document.addEventListener(
			event,
			(e) => {
				const anchor = (e.target as Element).closest('a');
				if (elMatchesStrategy(anchor, 'tap')) {
					prefetch(anchor.href, { ignoreSlowConnection: true });
				}
			},
			{ passive: true },
		);
	}
}

/**
 * Prefetch links with higher priority when the user hovers over them
 */
function initHoverStrategy(): void {
	let timeout: number;

	// Handle focus listeners
	document.body.addEventListener(
		'focusin',
		(e) => {
			const anchor = (e.target as Element).closest('a');
			if (elMatchesStrategy(anchor, 'hover')) {
				handleHoverIn(anchor.href);
			}
		},
		{ passive: true },
	);
	document.body.addEventListener('focusout', handleHoverOut, { passive: true });

	// Handle hover listeners. Re-run each time on page load.
	onPageLoad(() => {
		for (const anchor of Array.from(document.getElementsByTagName('a'))) {
			// Skip if already listening
			if (listenedAnchors.has(anchor)) {
				continue;
			}
			// Add listeners for anchors matching the strategy
			if (elMatchesStrategy(anchor, 'hover')) {
				listenedAnchors.add(anchor);
				anchor.addEventListener(
					'mouseenter',
					(e) => {
						handleHoverIn((e.currentTarget as HTMLAnchorElement).href);
					},
					{ passive: true },
				);
				anchor.addEventListener('mouseleave', handleHoverOut, {
					passive: true,
				});
			}
		}
	});

	function handleHoverIn(href: string) {
		// Debounce hover prefetches by 80ms
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			prefetch(href);
		}, 80) as unknown as number;
	}

	// Cancel prefetch if the user hovers away
	function handleHoverOut() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = 0;
		}
	}
}

/**
 * Prefetch links with lower priority as they enter the viewport
 */
function initViewportStrategy(): void {
	let observer: IntersectionObserver;

	onPageLoad(() => {
		for (const anchor of Array.from(document.getElementsByTagName('a'))) {
			// Skip if already listening
			if (listenedAnchors.has(anchor)) {
				continue;
			}
			// Observe for anchors matching the strategy
			if (elMatchesStrategy(anchor, 'viewport')) {
				listenedAnchors.add(anchor);
				observer ??= createViewportIntersectionObserver();
				observer.observe(anchor);
			}
		}
	});
}

function createViewportIntersectionObserver(): IntersectionObserver {
	const timeouts = new WeakMap<HTMLAnchorElement, number>();

	return new IntersectionObserver((entries, observer) => {
		for (const entry of entries) {
			const anchor = entry.target as HTMLAnchorElement;
			const timeout = timeouts.get(anchor);
			// Prefetch if intersecting
			if (entry.isIntersecting) {
				// Debounce viewport prefetches by 300ms
				if (timeout) {
					clearTimeout(timeout);
				}
				timeouts.set(
					anchor,
					setTimeout(() => {
						observer.unobserve(anchor);
						timeouts.delete(anchor);
						prefetch(anchor.href);
					}, 300) as unknown as number,
				);
			} else {
				// If exited viewport but haven't prefetched, cancel it
				if (timeout) {
					clearTimeout(timeout);
					timeouts.delete(anchor);
				}
			}
		}
	});
}

/**
 * Prefetch links with lower priority when page load
 */
function initLoadStrategy(): void {
	onPageLoad(() => {
		for (const anchor of Array.from(document.getElementsByTagName('a'))) {
			if (elMatchesStrategy(anchor, 'load')) {
				// Prefetch every link in this page
				prefetch(anchor.href);
			}
		}
	});
}

/**
 * Prefetch a URL so it's cached when the user navigates to it.
 *
 * @param url A full or partial URL string based on the current `location.href`. They are only fetched if:
 *   - The user is online
 *   - The user is not in data saver mode
 *   - The URL is within the same origin
 *   - The URL is not the current page
 *   - The URL has not already been prefetched
 * @param opts Additional options for prefetching.
 */
function prefetch($url: string, opts?: PrefetchOptions): void {
	const { fetchCallback } = getConfig();

	// Remove url hash to avoid prefetching the same URL multiple times
	const url = $url.replace(/#.*/, '');

	const ignoreSlowConnection = opts?.ignoreSlowConnection ?? false;
	if (!canPrefetchUrl(url, ignoreSlowConnection)) {
		return;
	}
	prefetchedUrls.add(url);

	// Prefetch with speculationrules if `clientPrerender` is enabled and supported
	// NOTE: This condition is tree-shaken if `clientPrerender` is false as its a static value
	if (clientPrerender && HTMLScriptElement.supports?.('speculationrules')) {
		debug(
			'prefetch',
			`Prefetching ${url} with <script type="speculationrules">`,
		);
		appendSpeculationRules(url, opts?.eagerness ?? 'immediate');
	}
	// Prefetch with link if supported
	else if (document.createElement('link').relList?.supports?.('prefetch')) {
		debug('prefetch', `Prefetching ${url} with <link rel="prefetch">`);
		const link = document.createElement('link');
		link.rel = 'prefetch';
		link.setAttribute('href', url);
		document.head.append(link);
	}
	// Otherwise, fallback prefetch with fetch
	else {
		debug('prefetch', `Prefetching ${url} with fetch`);

		fetchCallback(url, { priority: 'low', trigger: 'prefetch' });
	}
}

function canPrefetchUrl(url: string, ignoreSlowConnection: boolean): boolean {
	// Skip prefetch if offline
	if (!navigator.onLine) {
		return false;
	}

	// Skip prefetch if using data saver mode or slow connection
	if (!ignoreSlowConnection && isSlowConnection()) {
		return false;
	}

	// Else check if URL is within the same origin, not the current page, and not already prefetched
	try {
		const urlObj = new URL(url, location.href);
		return (
			location.origin === urlObj.origin &&
			(location.pathname !== urlObj.pathname ||
				location.search !== urlObj.search) &&
			!prefetchedUrls.has(url)
		);
	} catch {}
	return false;
}

function elMatchesStrategy(
	el: EventTarget | null,
	strategy: string,
): el is HTMLAnchorElement {
	// @ts-expect-error access unknown property this way as it's more performant
	if (el?.tagName !== 'A') {
		return false;
	}
	const attrValue = (el as HTMLElement).getAttribute(PREFETCH_ATTR);

	// Out-out if `prefetchAll` is enabled
	if (attrValue === 'false') {
		return false;
	}

	// Fallback to tap strategy if using data saver mode or slow connection
	if (
		strategy === 'tap' &&
		(attrValue != null || prefetchAll) &&
		isSlowConnection()
	) {
		return true;
	}

	// If anchor has no dataset but we want to prefetch all, or has dataset but no value,
	// check against fallback default strategy
	if ((attrValue == null && prefetchAll) || attrValue === '') {
		return strategy === defaultStrategy;
	}
	// Else if dataset is explicitly defined, check against it
	if (attrValue === strategy) {
		return true;
	}
	// Else, no match
	return false;
}

function isSlowConnection(): boolean {
	if ('connection' in navigator) {
		const conn = navigator.connection as {
			saveData: boolean;
			effectiveType: string;
		};
		return conn.saveData === true || /2g/.test(conn.effectiveType);
	}
	return false;
}

/**
 * Listen to page loads and handle Astro's View Transition specific events
 */
function onPageLoad(callback: () => void): void {
	callback();
	// Ignore first call of `astro-page-load` as we already call `cb` above.
	// We have to call `cb` eagerly as View Transitions may not be enabled.
	let firstLoad = false;
	document.addEventListener(PAGE_LOAD_EVENT, () => {
		if (!firstLoad) {
			firstLoad = true;
			return;
		}
		callback();
	});
}

/**
 * Appends a `<script type="speculationrules">` tag to the head of the
 * document that prerenders the `url` passed in.
 *
 * Modifying the script and appending a new link does not trigger the prerender.
 * A new script must be added for each `url`.
 *
 * @param url The url of the page to prerender.
 *
 * @param eagerness Hint to the browser as to how eagerly it should prefetch/prerender link targets
 */
function appendSpeculationRules(
	url: string,
	eagerness: PrefetchOptions['eagerness'],
): void {
	const script = document.createElement('script');
	script.type = 'speculationrules';
	// nosemgrep: javascript.lang.security.audit.unknown-value-with-script-tag.unknown-value-with-script-tag
	// This writes JSON via textContent, not executable JavaScript source.
	script.textContent = JSON.stringify({
		prerender: [
			{
				source: 'list',
				urls: [url],
				eagerness: eagerness,
			},
		],
		// Currently, adding `prefetch` is required to fallback if `prerender` fails.
		// Possibly will be automatic in the future, in which case it can be removed.
		// https://github.com/WICG/nav-speculation/issues/162#issuecomment-1977818473
		prefetch: [
			{
				source: 'list',
				urls: [url],
				eagerness: eagerness,
			},
		],
	});
	document.head.append(script);
}
