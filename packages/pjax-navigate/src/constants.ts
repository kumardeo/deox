// DOM attribute names

export const DIRECTION_ATTR = 'data-pjax-transition';
export const FALLBACK_ATTR = 'data-pjax-fallback';
export const PERSIST_ATTR = 'data-pjax-persist';
export const RERUN_ATTR = 'data-pjax-rerun';
export const EXECUTED_ATTR = 'data-pjax-executed';
export const PREFETCH_ATTR = 'data-pjax-prefetch';
export const RELOAD_ATTR = 'data-pjax-reload';
export const HISTORY_ATTR = 'data-pjax-history';
export const VITE_DEV_ID_ATTR = 'data-vite-dev-id';

// Meta tag names

export const ENABLED_META = 'pjax:enabled';
export const FALLBACK_META = 'pjax:fallback';

// Event names

export const BEFORE_PREPARATION_EVENT = 'pjax:before-preparation';
export const AFTER_PREPARATION_EVENT = 'pjax:after-preparation';
export const BEFORE_SWAP_EVENT = 'pjax:before-swap';
export const AFTER_SWAP_EVENT = 'pjax:after-swap';
export const PAGE_LOAD_EVENT = 'pjax:page-load';

// Prefetch strategies

export const PREFETCH_STRATEGY_TAP = 'tap';
export const PREFETCH_STRATEGY_HOVER = 'hover';
export const PREFETCH_STRATEGY_VIEWPORT = 'viewport';
export const PREFETCH_STRATEGY_LOAD = 'load';

export type PrefetchStrategy =
	| typeof PREFETCH_STRATEGY_TAP
	| typeof PREFETCH_STRATEGY_HOVER
	| typeof PREFETCH_STRATEGY_VIEWPORT
	| typeof PREFETCH_STRATEGY_LOAD;
