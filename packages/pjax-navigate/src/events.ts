import {
	AFTER_PREPARATION_EVENT,
	type AFTER_SWAP_EVENT,
	BEFORE_PREPARATION_EVENT,
	BEFORE_SWAP_EVENT,
	type PAGE_LOAD_EVENT,
} from './constants';
import { swap } from './swap';
import type { Direction, NavigationTypeString } from './types';

type Events =
	| typeof AFTER_PREPARATION_EVENT
	| typeof AFTER_SWAP_EVENT
	| typeof PAGE_LOAD_EVENT;

class BeforeEvent extends Event {
	readonly from: URL;
	to: URL;
	direction: Direction | string;
	readonly navigationType: NavigationTypeString;
	readonly sourceElement: Element | undefined;
	readonly info: unknown;
	newDocument: Document;
	readonly signal: AbortSignal;

	constructor(
		type: string,
		eventInitDict: EventInit | undefined,
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: unknown,
		newDocument: Document,
		signal: AbortSignal,
	) {
		super(type, eventInitDict);
		this.from = from;
		this.to = to;
		this.direction = direction;
		this.navigationType = navigationType;
		this.sourceElement = sourceElement;
		this.info = info;
		this.newDocument = newDocument;
		this.signal = signal;

		Object.defineProperties(this, {
			from: { enumerable: true },
			to: { enumerable: true, writable: true },
			direction: { enumerable: true, writable: true },
			navigationType: { enumerable: true },
			sourceElement: { enumerable: true },
			info: { enumerable: true },
			newDocument: { enumerable: true, writable: true },
			signal: { enumerable: true },
		});
	}
}

export class TransitionBeforePreparationEvent extends BeforeEvent {
	formData: FormData | undefined;
	loader: () => Promise<void>;
	constructor(
		from: URL,
		to: URL,
		direction: Direction | string,
		navigationType: NavigationTypeString,
		sourceElement: Element | undefined,
		info: unknown,
		newDocument: Document,
		signal: AbortSignal,
		formData: FormData | undefined,
		loader: (event: TransitionBeforePreparationEvent) => Promise<void>,
	) {
		super(
			BEFORE_PREPARATION_EVENT,
			{ cancelable: true },
			from,
			to,
			direction,
			navigationType,
			sourceElement,
			info,
			newDocument,
			signal,
		);
		this.formData = formData;
		this.loader = loader.bind(this, this);
		Object.defineProperties(this, {
			formData: { enumerable: true },
			loader: { enumerable: true, writable: true },
		});
	}
}

export class TransitionBeforeSwapEvent extends BeforeEvent {
	readonly direction: Direction | string;
	readonly viewTransition: ViewTransition;
	swap: () => void;

	constructor(afterPreparation: BeforeEvent, viewTransition: ViewTransition) {
		super(
			BEFORE_SWAP_EVENT,
			undefined,
			afterPreparation.from,
			afterPreparation.to,
			afterPreparation.direction,
			afterPreparation.navigationType,
			afterPreparation.sourceElement,
			afterPreparation.info,
			afterPreparation.newDocument,
			afterPreparation.signal,
		);
		this.direction = afterPreparation.direction;
		this.viewTransition = viewTransition;
		this.swap = () => swap(this.newDocument);

		Object.defineProperties(this, {
			direction: { enumerable: true },
			viewTransition: { enumerable: true },
			swap: { enumerable: true, writable: true },
		});
	}
}

export async function doPreparation(
	from: URL,
	to: URL,
	direction: Direction | string,
	navigationType: NavigationTypeString,
	sourceElement: Element | undefined,
	info: unknown,
	signal: AbortSignal,
	formData: FormData | undefined,
	defaultLoader: (event: TransitionBeforePreparationEvent) => Promise<void>,
) {
	const event = new TransitionBeforePreparationEvent(
		from,
		to,
		direction,
		navigationType,
		sourceElement,
		info,
		window.document,
		signal,
		formData,
		defaultLoader,
	);
	if (document.dispatchEvent(event)) {
		await event.loader();
		if (!event.defaultPrevented) {
			triggerEvent(AFTER_PREPARATION_EVENT);
			if (event.navigationType !== 'traverse') {
				// save the current scroll position before we change the DOM and transition to the new page
				updateScrollPosition({ scrollX, scrollY });
			}
		}
	}
	return event;
}

// only update history entries that are managed by us
// leave other entries alone and do not accidentally add state.
export function updateScrollPosition(positions: {
	scrollX: number;
	scrollY: number;
}): void {
	if (history.state) {
		history.scrollRestoration = 'manual';
		history.replaceState({ ...history.state, ...positions }, '');
	}
}

export async function doSwap(
	afterPreparation: BeforeEvent,
	viewTransition: ViewTransition,
	afterDispatch?: () => Promise<void>,
): Promise<TransitionBeforeSwapEvent> {
	const event = new TransitionBeforeSwapEvent(afterPreparation, viewTransition);
	document.dispatchEvent(event);
	if (afterDispatch) {
		await afterDispatch();
	}
	event.swap();
	return event;
}

export function triggerEvent(name: Events): void {
	document.dispatchEvent(new Event(name));
}
