import { getConfig, hasConfig, setConfig } from './config';
import {
	AFTER_SWAP_EVENT,
	DIRECTION_ATTR,
	ENABLED_META,
	EXECUTED_ATTR,
	FALLBACK_ATTR,
	FALLBACK_META,
	HISTORY_ATTR,
	PAGE_LOAD_EVENT,
	PERSIST_ATTR,
	RELOAD_ATTR,
	VITE_DEV_ID_ATTR,
} from './constants';
import {
	doPreparation,
	doSwap,
	type TransitionBeforePreparationEvent,
	triggerEvent,
	updateScrollPosition,
} from './events';
import { initPrefetch } from './prefetch';
import { detectScriptExecuted, isExecutableScript } from './swap';
import type {
	Direction,
	Fallback,
	HistoryState,
	NavigateOptions,
	Navigation,
	NavigatorOptions,
	Transition,
} from './types';

// The previous navigation that might still be in processing
let mostRecentNavigation: Navigation | undefined;
// The previous transition that might still be in processing
let mostRecentTransition: Transition | undefined;
// When we traverse the history, the window.location is already set to the new location.
// This variable tells us where we came from
let originalLocation: URL;

// The History API does not tell you if navigation is forward or back, so
// you can figure it using an index. On pushState the index is incremented so you
// can use that to determine popstate if going forward or back.
let currentHistoryIndex = 0;

let navigateOnServerWarned = false;

let parser: DOMParser;

function supportsViewTransitions(): boolean {
	const { isBrowser } = getConfig();
	return isBrowser && !!document.startViewTransition;
}

function transitionEnabledOnThisPage(): boolean {
	const { isBrowser } = getConfig();
	return isBrowser && !!document.querySelector(`meta[name="${ENABLED_META}"]`);
}

function getTransitionFallbackFromThisPage(): Fallback {
	const { isBrowser } = getConfig();
	if (isBrowser) {
		const el = document.querySelector(`meta[name="${FALLBACK_META}"]`);
		if (el) {
			return el.getAttribute('content') as Fallback;
		}
	}
	return 'animate';
}

function isSamePage(a: URL, b: URL): boolean {
	return a.pathname === b.pathname && a.search === b.search;
}

/**
 * Announces the new page title to screen readers via an `aria-live` region.
 */
function announce(): void {
	const div = document.createElement('div');
	div.setAttribute('aria-live', 'assertive');
	div.setAttribute('aria-atomic', 'true');
	div.setAttribute(
		'style',
		'position: absolute; left: 0; top: 0; clip: rect(0 0 0 0); clip-path: inset(50%); overflow: hidden; white-space: nowrap; width: 1px; height: 1px;',
	);
	document.body.append(div);

	setTimeout(
		() => {
			const title =
				document.title ||
				document.querySelector('h1')?.textContent ||
				location.pathname;
			div.textContent = title;
		},
		// Much thought went into this magic number; the gist is that screen readers
		// need to see that the element changed and might not do so if it happens
		// too quickly.
		60,
	);
}

/**
 * Returns the contents of the page or null if the router can't deal with it.
 */
async function fetchHTML(
	url: string,
	init?: RequestInit,
): Promise<null | {
	html: string;
	redirected?: string;
	mediaType: DOMParserSupportedType;
}> {
	const { fetchCallback } = getConfig();

	try {
		const res = await fetchCallback(url, init);

		const contentType = res.headers.get('content-type') ?? '';
		// drop potential charset (+ other name/value pairs) as parser needs the mediaType
		const mediaType = contentType.split(';', 1)[0].trim();
		// the DOMParser can handle two types of HTML
		if (mediaType !== 'text/html' && mediaType !== 'application/xhtml+xml') {
			// everything else (e.g. audio/mp3) will be handled by the browser but not by us
			return null;
		}

		const html = await res.text();
		return {
			html,
			redirected: res.redirected ? res.url : undefined,
			mediaType,
		};
	} catch {
		// can't fetch, let someone else deal with it.
		return null;
	}
}

function runScripts(): Promise<void> {
	let wait = Promise.resolve();
	let needsWaitForInlineModuleScript = false;

	const scripts = Array.from(document.getElementsByTagName('script'));

	// The original code made the assumption that all inline scripts are directly executed when inserted into the DOM.
	// This is not true for inline module scripts, which are deferred but still executed in order.
	// inline module scripts cannot be awaited for with onload.
	// Thus to be able to wait for the execution of all scripts, we make sure that the last inline module script
	// is always followed by an external module script
	for (const script of scripts) {
		if (
			!script.hasAttribute(EXECUTED_ATTR) &&
			script.getAttribute('type') === 'module'
		) {
			needsWaitForInlineModuleScript = script.getAttribute('src') === null;
		}
	}

	if (needsWaitForInlineModuleScript) {
		document.body.insertAdjacentHTML(
			'beforeend',
			`<script type="module" src="data:application/javascript,"/>`,
		);
	}

	for (const script of scripts) {
		if (script.hasAttribute(EXECUTED_ATTR) || !isExecutableScript(script)) {
			continue;
		}

		const newScript = document.createElement('script');
		newScript.innerHTML = script.innerHTML;
		for (const attr of Array.from(script.attributes)) {
			if (attr.name === 'src') {
				const promise = new Promise<void>((resolve) => {
					newScript.onload = () => resolve();
					newScript.onerror = () => resolve();
				});
				wait = wait.then(() => promise);
			}
			newScript.setAttribute(attr.name, attr.value);
		}
		newScript.setAttribute(EXECUTED_ATTR, '');
		script.replaceWith(newScript);
	}

	return wait;
}

function preloadStyleLinks(newDocument: Document): Promise<void>[] {
	const links: Promise<void>[] = [];

	for (const el of newDocument.head.querySelectorAll('link[rel=stylesheet]')) {
		const href = el.getAttribute('href');
		const persistId = el.getAttribute(PERSIST_ATTR);

		if (
			href &&
			// Do not preload links that are already on the page.
			!document.querySelector(
				`link[rel=stylesheet][href="${href}"]${persistId ? `, [${PERSIST_ATTR}="${persistId}"]` : ''}`,
			)
		) {
			const link = document.createElement('link');
			link.setAttribute('rel', 'preload');
			link.setAttribute('as', 'style');
			link.setAttribute('href', href);

			links.push(
				new Promise<void>((resolve) => {
					for (const evName of ['load', 'error']) {
						link.addEventListener(evName, () => {
							resolve();
						});
					}
					document.head.append(link);
				}),
			);
		}
	}

	return links;
}

/**
 * Add a new entry to the browser history.
 * This also sets the new page in the browser address bar.
 * Sets the scroll position according to the hash fragment of the new location.
 */
function moveToLocation(
	to: URL,
	from: URL,
	options: NavigateOptions,
	pageTitleForBrowserHistory: string,
	historyState?: HistoryState,
) {
	const intraPage = isSamePage(from, to);

	const targetPageTitle = document.title;
	document.title = pageTitleForBrowserHistory;

	let scrolledToTop = false;
	if (to.href !== location.href && !historyState) {
		if (options.history === 'replace') {
			const current = history.state;
			history.replaceState(
				{
					...options.state,
					index: current.index,
					scrollX: current.scrollX,
					scrollY: current.scrollY,
				},
				'',
				to.href,
			);
		} else {
			history.pushState(
				{
					...options.state,
					index: ++currentHistoryIndex,
					scrollX: 0,
					scrollY: 0,
				},
				'',
				to.href,
			);
		}
	}

	document.title = targetPageTitle;
	// now we are on the new page for non-history navigation!
	// (with history navigation page change happens before popstate is fired)
	originalLocation = to;

	// freshly loaded pages start from the top
	if (!intraPage) {
		window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
		scrolledToTop = true;
	}

	if (historyState) {
		window.scrollTo(historyState.scrollX, historyState.scrollY);
	} else {
		if (to.hash) {
			// because we are already on the target page ...
			// ... what comes next is an intra-page navigation
			// that won't reload the page but instead scroll to the fragment
			history.scrollRestoration = 'auto';
			const savedState = history.state;
			location.href = to.href; // this kills the history state on Firefox
			if (!history.state) {
				history.replaceState(savedState, ''); // this restores the history state
				if (intraPage) {
					window.dispatchEvent(new PopStateEvent('popstate'));
				}
			}
		} else {
			if (!scrolledToTop) {
				scrollTo({ left: 0, top: 0, behavior: 'instant' });
			}
		}
		history.scrollRestoration = 'manual';
	}
}

// replace head and body of the windows document with contents from newDocument
// if !popstate, update the history entry and scroll position according to toLocation
// if popState is given, this holds the scroll position for history navigation
// if fallback === "animate" then simulate view transitions
async function updateDOM(
	preparationEvent: TransitionBeforePreparationEvent,
	options: NavigateOptions,
	currentTransition: Transition,
	historyState?: HistoryState,
	fallback?: Fallback,
): Promise<void> {
	async function animate(phase: string) {
		function isInfinite(animation: Animation) {
			const effect = animation.effect;
			if (!effect || !(effect instanceof KeyframeEffect) || !effect.target) {
				return false;
			}
			const style = window.getComputedStyle(
				effect.target,
				effect.pseudoElement,
			);
			return style.animationIterationCount === 'infinite';
		}
		const currentAnimations = document.getAnimations();
		// Trigger view transition animations waiting for FALLBACK_ATTR
		document.documentElement.setAttribute(FALLBACK_ATTR, phase);
		const nextAnimations = document.getAnimations();
		const newAnimations = nextAnimations.filter(
			(a) => !currentAnimations.includes(a) && !isInfinite(a),
		);
		// Wait for all new animations to finish (resolved or rejected).
		// Do not reject on canceled ones.
		return Promise.allSettled(newAnimations.map((a) => a.finished));
	}

	const animateFallbackOld = async () => {
		if (
			fallback === 'animate' &&
			!currentTransition.transitionSkipped &&
			!preparationEvent.signal.aborted
		) {
			try {
				await animate('old');
			} catch {
				// animate might reject as a consequence of a call to skipTransition()
				// ignored on purpose
			}
		}
	};

	const pageTitleForBrowserHistory = document.title; // document.title will be overridden by swap()
	const swapEvent = await doSwap(
		preparationEvent,
		currentTransition.viewTransition as ViewTransition,
		animateFallbackOld,
	);
	moveToLocation(
		swapEvent.to,
		swapEvent.from,
		options,
		pageTitleForBrowserHistory,
		historyState,
	);
	triggerEvent(AFTER_SWAP_EVENT);

	// Resolve the finished promise of the simulation's ViewTransition.
	// For 'animate', wait for the new-page animation to complete first.
	// For other fallback modes (e.g. 'swap'), resolve immediately — no animation needed.
	if (
		fallback === 'animate' &&
		!currentTransition.transitionSkipped &&
		!swapEvent.signal.aborted
	) {
		animate('new').finally(() => {
			currentTransition.viewTransitionFinished?.();
		});
	} else {
		currentTransition.viewTransitionFinished?.();
	}
}

function abortAndRecreateMostRecentNavigation(): Navigation {
	mostRecentNavigation?.controller.abort();
	mostRecentNavigation = {
		controller: new AbortController(),
	};
	return mostRecentNavigation;
}

async function transition(
	direction: Direction,
	from: URL,
	to: URL,
	options: NavigateOptions,
	historyState?: HistoryState,
	hasUAVisualTransition = false,
): Promise<void> {
	const { isDev, collectClientStyles } = getConfig();

	// The most recent navigation always has precedence
	// Yes, there can be several navigation instances as the user can click links
	// while we fetch content or simulate view transitions. Even synchronous creations are possible
	// e.g. by calling navigate() from a transition event.
	// Invariant: all but the most recent navigation are already aborted.
	const currentNavigation = abortAndRecreateMostRecentNavigation();

	// not ours
	if (!transitionEnabledOnThisPage() || location.origin !== to.origin) {
		if (currentNavigation === mostRecentNavigation) {
			mostRecentNavigation = undefined;
		}
		location.href = to.href;
		return;
	}

	const navigationType = historyState
		? 'traverse'
		: options.history === 'replace'
			? 'replace'
			: 'push';

	if (navigationType !== 'traverse') {
		updateScrollPosition({ scrollX, scrollY });
	}

	if (isSamePage(from, to) && !options.formData) {
		if (
			(direction !== 'back' && to.hash) ||
			(direction === 'back' && from.hash)
		) {
			moveToLocation(to, from, options, document.title, historyState);
			if (currentNavigation === mostRecentNavigation) {
				mostRecentNavigation = undefined;
			}
			return;
		}
	}

	const prepEvent = await doPreparation(
		from,
		to,
		direction,
		navigationType,
		options.sourceElement,
		options.info,
		currentNavigation.controller.signal,
		options.formData,
		defaultLoader,
	);
	if (prepEvent.defaultPrevented || prepEvent.signal.aborted) {
		if (currentNavigation === mostRecentNavigation) {
			mostRecentNavigation = undefined;
		}

		if (!prepEvent.signal.aborted) {
			// not aborted -> delegate to browser
			location.href = to.href;
		}

		// and / or exit
		return;
	}

	async function defaultLoader(
		preparationEvent: TransitionBeforePreparationEvent,
	) {
		const href = preparationEvent.to.href;
		const init: RequestInit = { signal: preparationEvent.signal };

		if (preparationEvent.formData) {
			init.method = 'POST';

			const form =
				preparationEvent.sourceElement instanceof HTMLFormElement
					? preparationEvent.sourceElement
					: preparationEvent.sourceElement instanceof HTMLElement &&
							'form' in preparationEvent.sourceElement
						? (preparationEvent.sourceElement.form as HTMLFormElement)
						: preparationEvent.sourceElement?.closest('form');

			// Form elements without enctype explicitly set default to application/x-www-form-urlencoded.
			// In order to maintain compatibility with Astro 4.x, we need to check the value of enctype
			// on the attributes property rather than accessing .enctype directly. Astro 5.x may
			// introduce defaulting to application/x-www-form-urlencoded as a breaking change, and then
			// we can access .enctype directly.
			//
			// Note: getNamedItem can return null in real life, even if TypeScript doesn't think so, hence
			// the ?.
			init.body =
				from !== undefined &&
				Reflect.get(HTMLFormElement.prototype, 'attributes', form).getNamedItem(
					'enctype',
				)?.value === 'application/x-www-form-urlencoded'
					? new URLSearchParams(preparationEvent.formData as any)
					: preparationEvent.formData;
		}

		const response = await fetchHTML(href, init);
		// If there is a problem fetching the new page, just do an MPA navigation to it.
		if (response === null) {
			preparationEvent.preventDefault();
			return;
		}

		// if there was a redirection, show the final URL in the browser's address bar
		if (response.redirected) {
			const redirectedTo = new URL(response.redirected);
			// but do not redirect cross origin
			if (redirectedTo.origin !== preparationEvent.to.origin) {
				preparationEvent.preventDefault();
				return;
			}
			// preserve fragment
			const fragment = preparationEvent.to.hash;
			preparationEvent.to = redirectedTo;
			preparationEvent.to.hash = fragment;
		}

		parser ??= new DOMParser();

		preparationEvent.newDocument = parser.parseFromString(
			response.html,
			response.mediaType,
		);

		// The next line might look like a hack,
		// but it is actually necessary as noscript elements
		// and their contents are returned as markup by the parser,
		// see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString
		for (const el of preparationEvent.newDocument.querySelectorAll(
			'noscript',
		)) {
			el.remove();
		}

		// If ClientRouter is not enabled on the incoming page, do a full page load to it.
		// Unless this was a form submission, in which case we do not want to trigger another mutation.
		if (
			!preparationEvent.newDocument.querySelector(
				`meta[name="${ENABLED_META}"]`,
			) &&
			!preparationEvent.formData
		) {
			preparationEvent.preventDefault();
			return;
		}

		const links = preloadStyleLinks(preparationEvent.newDocument);
		if (links.length && !preparationEvent.signal.aborted) {
			await Promise.all(links);
		}

		if (isDev && !preparationEvent.signal.aborted && collectClientStyles) {
			await prepareForClientOnlyStyles(
				preparationEvent.newDocument,
				preparationEvent.to,
				preparationEvent.signal,
			);
		}
	}

	async function abortAndRecreateMostRecentTransition(): Promise<Transition> {
		if (mostRecentTransition) {
			if (mostRecentTransition.viewTransition) {
				try {
					mostRecentTransition.viewTransition.skipTransition();
				} catch {
					// might throw AbortError DOMException. Ignored on purpose.
				}
				try {
					// UpdateCallbackDone might already been settled, i.e. if the previous transition finished updating the DOM.
					// Could not take long, we wait for it to avoid parallel updates
					// (which are very unlikely as long as swap() is not async).
					await mostRecentTransition.viewTransition.updateCallbackDone;
				} catch {
					// There was an error in the update callback of the transition which we cancel.
					// Ignored on purpose
				}
			}
		}
		mostRecentTransition = { transitionSkipped: false };
		return mostRecentTransition;
	}

	const currentTransition = await abortAndRecreateMostRecentTransition();

	if (prepEvent.signal.aborted) {
		if (currentNavigation === mostRecentNavigation) {
			mostRecentNavigation = undefined;
		}
		return;
	}

	document.documentElement.setAttribute(DIRECTION_ATTR, prepEvent.direction);
	if (supportsViewTransitions() && !hasUAVisualTransition) {
		// This automatically cancels any previous transition
		// We also already took care that the earlier update callback got through
		currentTransition.viewTransition = document.startViewTransition(
			async () =>
				await updateDOM(prepEvent, options, currentTransition, historyState),
		);
	} else {
		// Simulation mode requires a bit more manual work.
		// Also used when PopStateEvent.hasUAVisualTransition indicates the browser already
		// provided a visual transition (e.g. Safari swipe gesture) — in that case, fallback
		// is "swap" to skip animations.
		const updateDone = (async () => {
			// Immediately paused to set up the ViewTransition object for Fallback mode
			await Promise.resolve(); // hop through the micro task queue
			await updateDOM(
				prepEvent,
				options,
				currentTransition,
				historyState,
				hasUAVisualTransition ? 'swap' : getTransitionFallbackFromThisPage(),
			);
			return undefined;
		})();

		// When the updateDone promise is settled,
		// we have run and awaited all swap functions and the after-swap event
		// This qualifies for "updateCallbackDone".
		//
		// For the build in ViewTransition, "ready" settles shortly after "updateCallbackDone",
		// i.e. after all pseudo elements are created and the animation is about to start.
		// In simulation mode the "old" animation starts before swap,
		// the "new" animation starts after swap. That is not really comparable.
		// Thus we go with "very, very shortly after updateCallbackDone" and make both equal.
		//
		// "finished" resolves after all animations are done.
		currentTransition.viewTransition = {
			updateCallbackDone: updateDone, // this is about correct
			ready: updateDone, // good enough
			// Finished promise could have been done better: finished rejects iff updateDone does.
			// Our simulation always resolves, never rejects.
			finished: new Promise(
				(r) => (currentTransition.viewTransitionFinished = r as () => void),
			), // see end of updateDOM
			skipTransition: () => {
				currentTransition.transitionSkipped = true;
				// This cancels all animations of the simulation
				document.documentElement.removeAttribute(FALLBACK_ATTR);
			},
			types: new Set<string>(), // empty by default
		};
	}

	// In earlier versions was then'ed on viewTransition.ready which would not execute
	// if the visual part of the transition has errors or was skipped
	currentTransition.viewTransition?.updateCallbackDone.finally(async () => {
		await runScripts();
		triggerEvent(PAGE_LOAD_EVENT);
		announce();
	});

	// finished.ready and finished.finally are the same for the simulation but not
	// necessarily for native view transition, where finished rejects when updateCallbackDone does.
	currentTransition.viewTransition?.finished.finally(() => {
		currentTransition.viewTransition = undefined;
		if (currentTransition === mostRecentTransition) {
			mostRecentTransition = undefined;
		}
		if (currentNavigation === mostRecentNavigation) {
			mostRecentNavigation = undefined;
		}
		document.documentElement.removeAttribute(DIRECTION_ATTR);
		document.documentElement.removeAttribute(FALLBACK_ATTR);
	});

	try {
		// Compatibility:
		// In an earlier version we awaited viewTransition.ready, which includes animation setup.
		// Scripts that depend on the view transition pseudo elements should hook on viewTransition.ready.
		await currentTransition.viewTransition?.updateCallbackDone;
	} catch (e) {
		// This log doesn't make it worse than before, where we got error messages about uncaught exceptions, which can't be caught when the trigger was a click or history traversal.
		// Needs more investigation on root causes if errors still occur sporadically
		const err = e as Error;
		console.log('[pjax-navigate]', err.name, err.message, err.stack);
	}
}

// Keep all styles that are potentially created by client
// and required on the next page
async function prepareForClientOnlyStyles(
	newDocument: Document,
	toLocation: URL,
	signal: AbortSignal,
): Promise<void> {
	// Load the next page with an empty module loader cache
	const nextPage = document.createElement('iframe');
	// with srcdoc resolving imports does not work on webkit browsers
	nextPage.src = toLocation.href;
	nextPage.style.display = 'none';
	document.body.append(nextPage);

	// silence the iframe's console
	// @ts-expect-error
	nextPage.contentWindow.console = Object.keys(console).reduce<
		Record<string, () => void>
	>((acc, key) => {
		acc[key] = () => {};
		return acc;
	}, {});

	await hydrationDone(nextPage);

	const nextHead = nextPage.contentDocument?.head;
	if (nextHead) {
		// Collect the vite ids of all styles present in the next head
		// Copy required styles to the new document if they are from hydration.
		for (const style of nextHead.querySelectorAll(
			`style[${VITE_DEV_ID_ATTR}]`,
		)) {
			const id = style.getAttribute(VITE_DEV_ID_ATTR);
			if (
				id &&
				!newDocument.head.querySelector(`style[${VITE_DEV_ID_ATTR}="${id}"]`)
			) {
				newDocument.head.appendChild(style.cloneNode(true));
			}
		}

		// Collect all svelte style ids (prefixed with 'svelte-') present in the next head
		// Copy required styles to the new document id they are from hydration
		for (const style of nextHead.querySelectorAll('style[id^="svelte-"]')) {
			const id = style.getAttribute('id');
			if (id && !newDocument.head.querySelector(`style[id="${id}"]`)) {
				newDocument.head.appendChild(style.cloneNode(true));
			}
		}
	}

	// return a promise that resolves when all document is hydrated
	async function hydrationDone(loadingPage: HTMLIFrameElement): Promise<void> {
		if (!signal.aborted) {
			await new Promise((resolve) =>
				loadingPage.contentWindow?.addEventListener('load', resolve, {
					once: true,
				}),
			);
		}
	}
}

export async function navigate(
	href: string,
	options?: NavigateOptions,
): Promise<void> {
	if (!hasConfig()) {
		console.warn(
			'[pjax-navigate]',
			'The view transitions client API was called before initialization. Make sure the router has been initialized before calling this method.',
		);
		return;
	}

	const { isBrowser } = getConfig();

	if (!isBrowser) {
		if (!navigateOnServerWarned) {
			console.warn(
				'[pjax-navigate]',
				'The view transitions client API was called during a server side render. This may be unintentional as the navigate() function is expected to be called in response to user interactions. Please make sure that your usage is correct.',
			);
			navigateOnServerWarned = true;
		}
		return;
	}

	await transition(
		'forward',
		originalLocation,
		new URL(href, location.href),
		options ?? {},
	);
}

function onPopState(event: PopStateEvent): void {
	if (!transitionEnabledOnThisPage() && event.state) {
		// The current page doesn't have View Transitions enabled
		// but the page we navigate to does (because it set the state).
		// Do a full page refresh to reload the client-side router from the new page.
		location.reload();
		return;
	}

	// History entries without state are created by the browser (e.g. for hash links)
	// Our view transition entries always have state.
	// Just ignore stateless entries.
	// The browser will handle navigation fine without our help
	if (event.state === null) {
		return;
	}

	const state: HistoryState = history.state;
	const nextIndex = state.index;
	const direction: Direction =
		nextIndex > currentHistoryIndex ? 'forward' : 'back';
	currentHistoryIndex = nextIndex;

	transition(
		direction,
		originalLocation,
		new URL(location.href),
		{},
		state,
		event.hasUAVisualTransition,
	);
}

function onScrollEnd(): void {
	// NOTE: our "popstate" event handler may call `pushState()` or
	// `replaceState()` and then `scrollTo()`, which will fire "scroll" and
	// "scrollend" events. To avoid redundant work and expensive calls to
	// `replaceState()`, we simply check that the values are different before
	// updating.
	if (
		history.state &&
		(scrollX !== history.state.scrollX || scrollY !== history.state.scrollY)
	) {
		updateScrollPosition({ scrollX, scrollY });
	}
}

export function initializeNavigator(options: NavigatorOptions = {}): void {
	if (hasConfig()) {
		console.warn('[pjax-navigate]', 'Already initialized!');
		return;
	}

	setConfig(options);

	const { isBrowser, isDev, prefetchEnabled } = getConfig();

	if (!isBrowser) {
		return;
	}

	originalLocation = new URL(location.href);

	if (history.state) {
		// Here we reloaded a page with history state
		// (e.g. history navigation from non-transition page or browser reload)
		currentHistoryIndex = history.state.index;
		scrollTo({ left: history.state.scrollX, top: history.state.scrollY });
	} else if (transitionEnabledOnThisPage()) {
		// This page is loaded from the browser address bar or via a link from extern,
		// it needs a state in the history
		history.replaceState({ index: currentHistoryIndex, scrollX, scrollY }, '');
		history.scrollRestoration = 'manual';
	}

	if (
		supportsViewTransitions() ||
		getTransitionFallbackFromThisPage() !== 'none'
	) {
		if (isDev && window.matchMedia('(prefers-reduced-motion)').matches) {
			console.warn(
				'[pjax-navigate]: All view transition animations, including fallback animation, are disabled as this device has the prefer-reduced-motion setting enabled.',
			);
		}

		window.addEventListener('popstate', onPopState);
		window.addEventListener('load', () => {
			triggerEvent(PAGE_LOAD_EVENT);
		});

		// There's not a good way to record scroll position before a history back
		// navigation, so we will record it when the user has stopped scrolling.
		if ('onscrollend' in window) {
			window.addEventListener('scrollend', onScrollEnd);
		} else {
			// Keep track of state between intervals
			let intervalId: number | undefined;
			let lastY: number;
			let lastX: number;
			let lastIndex: HistoryState['index'];

			const scrollInterval = () => {
				// Check the index to see if a popstate event was fired
				if (lastIndex !== history.state?.index) {
					clearInterval(intervalId);
					intervalId = undefined;
					return;
				}

				// Check if the user stopped scrolling
				if (lastY === scrollY && lastX === scrollX) {
					// Cancel the interval and update scroll positions
					clearInterval(intervalId);
					intervalId = undefined;
					onScrollEnd();
					return;
				}

				// Update vars with current positions
				lastY = scrollY;
				lastX = scrollX;
			};

			// We can't know when or how often scroll events fire, so we'll just use them to start intervals
			(window as Window).addEventListener(
				'scroll',
				() => {
					if (intervalId !== undefined) {
						return;
					}
					lastIndex = history.state?.index;
					lastY = scrollY;
					lastX = scrollX;
					intervalId = window.setInterval(scrollInterval, 50);
				},
				{ passive: true },
			);
		}

		initTriggers();

		if (prefetchEnabled) {
			initPrefetch({ prefetchAll: true });
		}
	}

	for (const script of Array.from(document.getElementsByTagName('script'))) {
		if (isExecutableScript(script)) {
			detectScriptExecuted(script);
			script.setAttribute(EXECUTED_ATTR, '');
		}
	}
}

function initTriggers(): void {
	let lastClickedElementLeavingWindow: EventTarget | null = null;

	document.addEventListener('click', (event) => {
		let link = event.target;

		lastClickedElementLeavingWindow = leavesWindow(event) ? link : null;

		if (event.composed) {
			link = event.composedPath()[0];
		}
		if (link instanceof Element) {
			link = link.closest('a, area');
		}
		if (
			!(link instanceof HTMLAnchorElement) &&
			!(link instanceof SVGAElement) &&
			!(link instanceof HTMLAreaElement)
		) {
			return;
		}

		// This check verifies that the click is happening on an anchor
		// that is going to another page within the same origin. Basically it determines
		// same-origin navigation, but omits special key combos for new tabs, etc.
		const linkTarget =
			link instanceof HTMLElement ? link.target : link.target.baseVal;
		const href = link instanceof HTMLElement ? link.href : link.href.baseVal;
		const origin = new URL(href, location.href).origin;

		if (
			isReloadEl(link) ||
			link.hasAttribute('download') ||
			!link.href ||
			(linkTarget && linkTarget !== '_self') ||
			origin !== location.origin ||
			lastClickedElementLeavingWindow ||
			event.defaultPrevented
		) {
			// No page transitions in these cases,
			// Let the browser standard action handle this
			return;
		}

		event.preventDefault();

		navigate(href, {
			history:
				link.getAttribute(HISTORY_ATTR) === 'replace' ? 'replace' : 'auto',
			sourceElement: link,
		});
	});

	document.addEventListener('submit', (event) => {
		const el = event.target as HTMLElement;
		const submitter = event.submitter;

		const clickedWithKeys =
			submitter && submitter === lastClickedElementLeavingWindow;
		lastClickedElementLeavingWindow = null;

		if (
			el.tagName !== 'FORM' ||
			event.defaultPrevented ||
			isReloadEl(el) ||
			clickedWithKeys
		) {
			return;
		}

		const form = el as HTMLFormElement;
		const formData = new FormData(form, submitter);
		// form.action and form.method can point to an <input name="action"> or <input name="method">
		// in which case should fall back to the form attribute
		const formAction =
			typeof form.action === 'string'
				? form.action
				: form.getAttribute('action');
		const formMethod =
			typeof form.method === 'string'
				? form.method
				: form.getAttribute('method');
		// Use the form action, if defined; otherwise, fall back to current path.
		let action =
			submitter?.getAttribute('formaction') ?? formAction ?? location.pathname;
		// Use the form method, if defined; otherwise, fall back to "get"
		const method = submitter?.getAttribute('formmethod') ?? formMethod ?? 'get';

		// the "dialog" method is a special keyword used within <dialog> elements
		// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fs-method
		if (
			method === 'dialog' ||
			location.origin !== new URL(action, location.href).origin
		) {
			// No page transitions in these cases,
			// Let the browser standard action handle this
			return;
		}

		const options: NavigateOptions = { sourceElement: submitter ?? form };
		if (method === 'get') {
			const params = new URLSearchParams(formData as any);
			const url = new URL(action);
			url.search = params.toString();
			action = url.toString();
		} else {
			options.formData = formData;
		}

		event.preventDefault();

		navigate(action, options);
	});
}

function isReloadEl(el: HTMLElement | SVGAElement): boolean {
	return el.getAttribute(RELOAD_ATTR) !== null;
}

function leavesWindow(event: MouseEvent) {
	return (
		(event.button && event.button !== 0) || // left clicks only
		event.metaKey || // new tab (mac)
		event.ctrlKey || // new tab (windows)
		event.altKey || // download
		event.shiftKey
	); // new window
}
