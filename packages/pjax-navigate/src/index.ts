import type {
	AFTER_PREPARATION_EVENT,
	AFTER_SWAP_EVENT,
	BEFORE_PREPARATION_EVENT,
	BEFORE_SWAP_EVENT,
	PAGE_LOAD_EVENT,
} from './constants';
import type {
	TransitionBeforePreparationEvent,
	TransitionBeforeSwapEvent,
} from './events';

export {
	TransitionBeforePreparationEvent,
	TransitionBeforeSwapEvent,
} from './events';

export { initializeNavigator, navigate } from './navigator';

export { swapFunctions } from './swap';

export type {
	Direction,
	Fallback,
	HistoryState,
	NavigateOptions,
	Navigation,
	NavigationTypeString,
	NavigatorOptions,
	Transition,
} from './types';

type ToEventMap<E extends [string, Event][]> = {
	[K in E[number] as K[0]]: K[1];
};

type PJAXEventMap = ToEventMap<
	[
		[typeof BEFORE_PREPARATION_EVENT, TransitionBeforePreparationEvent],
		[typeof AFTER_PREPARATION_EVENT, Event],
		[typeof BEFORE_SWAP_EVENT, TransitionBeforeSwapEvent],
		[typeof AFTER_SWAP_EVENT, Event],
		[typeof PAGE_LOAD_EVENT, Event],
	]
>;

declare global {
	interface DocumentEventMap extends PJAXEventMap {}
}
