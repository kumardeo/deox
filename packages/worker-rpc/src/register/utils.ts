/// <reference lib="WebWorker" />

import { WORKER_NAMESPACE } from '../constants';
import type {
	CallerType,
	MessageMain,
	MessageMainInput,
	WithOptions,
} from '../types';

declare let self: DedicatedWorkerGlobalScope;

export class InternalWithOptions<T> implements WithOptions<T> {
	readonly result: T;
	readonly options: StructuredSerializeOptions | Transferable[];

	constructor(result: T, options: StructuredSerializeOptions | Transferable[]) {
		this.result = result;
		this.options = options;
	}
}

export function withOptions<T>(
	result: T,
	options: StructuredSerializeOptions | Transferable[],
): WithOptions<T> {
	return new InternalWithOptions(result, options);
}

/**
 * A helper function to get Error object from any data type
 *
 * @param data The Error
 *
 * @returns An Error instance
 */
export function toError(data: unknown): Error {
	return data instanceof Error ? data : new Error(String(data));
}

/**
 * An object containing methods for sending message to main thread
 */
export const respond = {
	/**
	 * A helper method to send object as message data to main thread
	 *
	 * @param id The id of the request
	 *
	 * @param data The object to be sent
	 */
	post(
		id: string,
		data: MessageMainInput,
		options?: StructuredSerializeOptions | Transferable[],
	) {
		const response: MessageMain = Object.assign(
			{
				...data,
				id,
				timestamp: Date.now(),
			},
			{ [WORKER_NAMESPACE]: true },
		);

		if (options) {
			self.postMessage(
				response,
				Array.isArray(options) ? { transfer: options } : options,
			);
		} else {
			self.postMessage(response);
		}
	},

	/**
	 * A method to respond to context request
	 * to tell main thread that context is now set
	 *
	 * @param id The id of the context request
	 */
	contextSuccess(id: string) {
		this.post(id, {
			type: 'context',
			status: 'success',
		});
	},

	/**
	 * A method to respond to context request with error
	 *
	 * @param id The id of context request
	 */
	contextError(id: string, error?: unknown) {
		this.post(id, {
			type: 'context',
			status: 'error',
			error: toError(
				error ||
					'An unexpected error occurred while setting context in worker.',
			),
		});
	},

	/**
	 * A method to respond to handler request with body
	 *
	 * @param id The id of the request
	 * @param handler The name of the method
	 *
	 * @param body The body to be sent
	 * (it should be the value returned by calling handler)
	 */
	handlerSuccess(
		id: string,
		handler: string | number,
		body: unknown,
		options?: StructuredSerializeOptions | Transferable[],
	) {
		this.post(
			id,
			{
				type: 'response',
				status: 'success',
				handler,
				body,
			},
			options,
		);
	},

	/**
	 * A method to respond to handler request with error
	 *
	 * @param id the id of the request
	 * @param handler The name of the handler
	 * @param e The error
	 */
	handlerError(id: string, handler: string | number, error: unknown) {
		this.post(id, {
			type: 'response',
			status: 'error',
			error: toError(error || 'An unexpected error occurred in worker.'),
			handler,
		});
	},

	/**
	 * A method to respond to handler request
	 * in case the handler was not found
	 *
	 * @param id The id of the request
	 * @param handler The name of handler which was not found
	 */
	handlerNotFound(id: string, handler: string | number) {
		this.post(id, {
			type: 'response',
			status: 'not-found',
			handler,
		});
	},
};

/** checks if message event is request */
export function isRequestEvent(event: MessageEvent<unknown>): boolean {
	const request = event.data;

	return (
		!!request &&
		typeof request === 'object' &&
		Object.hasOwn(request, WORKER_NAMESPACE)
	);
}

export interface MethodsResolver<M> {
	readonly get: () => Promise<M>;
	readonly call: CallerType<M>;
}

export function createMethodsResolver<M extends NonNullable<object>, C>(
	input: (ctx: C) => M | Promise<M>,
	ctx: C,
): MethodsResolver<M> {
	let resolved: M | undefined;

	const get = async (): Promise<M> => {
		resolved ??= await input(ctx);
		return resolved;
	};

	const call = (async (name, ...args) => {
		// throw an error if name is neither string nor number
		if (!['string', 'number'].includes(typeof name)) {
			throw new TypeError('Argument 1 must be of type string or number');
		}

		const methods = await get();

		if (!Object.hasOwn(methods, name)) {
			throw new Error(`Method '${String(name)}' does not exists.`);
		}

		if (typeof methods[name] !== 'function') {
			throw new Error(`Property '${String(name)}' is not a function.`);
		}

		return methods[name](...args);
	}) as CallerType<M>;

	return { get, call };
}

export type MessageHandler<T = any> = (event: MessageEvent<T>) => void;

/** utility for attaching or detaching message handler */
export class MessageEventHandler<T = any> {
	current: MessageHandler<T> | undefined;

	constructor() {
		this.current = undefined;
	}

	remove(): void {
		if (this.current) {
			self.removeEventListener('message', this.current);
		}
		this.current = undefined;
	}

	attach(handler: MessageHandler<T>): void {
		this.remove();
		this.current = handler;
		self.addEventListener('message', this.current);
	}
}
