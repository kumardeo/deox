export type Fallback = 'none' | 'animate' | 'swap';
export type Direction = 'forward' | 'back';
export type NavigationTypeString = 'push' | 'replace' | 'traverse';

export interface NavigateOptions {
	history?: 'auto' | 'push' | 'replace';
	info?: any;
	state?: any;
	formData?: FormData;
	sourceElement?: Element; // more than HTMLElement, e.g. SVGAElement
}

export interface Navigation {
	controller: AbortController;
}

export interface Transition {
	// The view transitions object (API and simulation)
	viewTransition?: ViewTransition;
	// Simulation: Whether transition was skipped
	transitionSkipped: boolean;
	// Simulation: The resolve function of the finished promise
	viewTransitionFinished?: () => void;
}

export interface SavedFocus {
	activeElement: HTMLElement | null;
	start?: number | null;
	end?: number | null;
}

export interface HistoryState {
	index: number;
	scrollX: number;
	scrollY: number;
}

export interface PrefetchOptions {
	/**
	 * Should prefetch even on data saver mode or slow connection. (default `false`)
	 */
	ignoreSlowConnection?: boolean;
	/**
	 * A string providing a hint to the browser as to how eagerly it should prefetch/prerender link
	 * targets in order to balance performance advantages against resource overheads. (default `immediate`)
	 * Only works if `clientPrerender` is enabled and browser supports Speculation Rules API.
	 * The browser takes this hint into consideration along with its own heuristics, so it may select a link
	 * that the author has hinted as less eager than another, if the less eager candidate is considered a better choice.
	 *
	 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/speculationrules#eagerness
	 */
	eagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
}

export interface FetchOptions extends RequestInit {
	trigger: 'prefetch' | null;
}

export interface NavigatorOptions {
	ssr?: boolean;
	dev?: boolean;
	prefetch?: boolean;
	styles?: boolean;
	fetch?: (url: URL, options: FetchOptions) => Promise<Response>;
}

export interface NavigatorConfig {
	isBrowser: boolean;
	isDev: boolean;
	collectClientStyles: boolean;
	prefetchEnabled: boolean;
	fetchCallback: (
		url: string | URL,
		options?: Partial<FetchOptions>,
	) => Promise<Response>;
}
