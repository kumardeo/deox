import { generateId } from '@deox/utils/generate-id';
import { WORKER_RPC_KEY } from './constants';
import type {
	InferContext,
	InferMethods,
	InferProxyType,
	InferWorkerOptions,
	MessageMain,
	MessageWorker,
	MessageWorkerInput,
	MethodsMap,
	RegisterOutput,
	RequestOptions,
} from './types';
import {
	createWorkerFromSource,
	eventIsResponse,
	getCrossOriginWorkerSource,
} from './utils';

/**
 * Provides an RPC interface for communicating with a Web Worker.
 *
 * It can also be used to create and communicate with a worker script from a
 * different origin using a Blob URL.
 *
 * **Example for webpack**:
 *
 * Create a `worker.ts` file with the following content:
 *
 * ```ts
 * // worker.ts
 * import { register } from "@deox/worker-rpc/register";
 *
 * // Context type
 * export type Context = { from: string };
 *
 * // Register methods
 * const registered = register((ctx: Context) => ({
 *   hello: () => `Hello from ${ctx.from}`
 * }));
 *
 * // Registered type
 * export type Registered = typeof registered;
 * ```
 *
 * You can then create an `RPCWorker` instance and use the registered methods:
 *
 * ```ts
 * import { Worker } from "@deox/worker-rpc";
 * import { type Context, type Registered } from "./worker";
 *
 * // Context data to be sent to the worker
 * const context: Context = { from: "Worker Thread" };
 *
 * // Create an RPCWorker instance
 * const worker = new Worker<Registered>(
 *   new URL("./worker", import.meta.url),
 *   { context }
 * );
 *
 * // Call a registered method using the call method
 * worker.call("hello").then(
 *   console.log // "Hello from Worker Thread"
 * );
 *
 * // Or call a registered method using the proxy
 * worker.proxy.hello().then(
 *   console.log // "Hello from Worker Thread"
 * );
 * ```
 *
 * **Note:** It doesn't matter whether registered methods are synchronous or
 * asynchronous. Methods called through the `RPCWorker` instance always return
 * a Promise that resolves or rejects based on the method's result.
 */
export class RPCWorker<
	R extends RegisterOutput<NonNullable<object>, any> = RegisterOutput<
		Record<string | number, (...args: unknown[]) => unknown>,
		unknown
	>,
> {
	/** The underlying Web Worker instance used to execute RPC calls. */
	private _worker: Worker;

	/** A promise which resolves when context is sent to worker */
	private _setup: Promise<void>;

	/** A map of pending requests containing functions to resolve or reject */
	private _queue: Map<
		string,
		{ resolve: (value: any) => void; reject: (error: any) => void }
	>;

	/** A proxy which can to used as an alternative for `call` method */
	private _proxy: InferProxyType<R> | undefined;

	/** Indicates whether worker has been terminated */
	private _terminated: boolean;

	/** A function which generates unique request id */
	private _generate: (message: MessageWorkerInput) => string;

	/**
	 * Creates a new instance of RPCWorker
	 *
	 * @param scriptURL The url of the worker script
	 * @param options Options
	 */
	constructor(scriptURL: string | URL, options: InferWorkerOptions<R>);
	constructor(
		worker: Worker,
		options: Pick<InferWorkerOptions<R>, 'context' | 'generate'>,
	);
	constructor(
		urlOrWorker: string | URL | Worker,
		options: InferWorkerOptions<R>,
	) {
		if (typeof Worker === 'undefined') {
			throw new Error(
				"Cannot create an 'RPCWorker' instance. The current runtime does not support Web Workers or does not provide a global 'Worker' constructor.",
			);
		}

		if (urlOrWorker instanceof Worker) {
			this._worker = urlOrWorker;
		} else {
			const scriptURL =
				urlOrWorker instanceof URL
					? urlOrWorker
					: new URL(urlOrWorker, window.location.href);

			// Construct normally if script URL is same-origin otherwise use Blob URL
			if (scriptURL.origin === window.location.origin) {
				this._worker = new Worker(scriptURL, options);
			} else {
				const source = getCrossOriginWorkerSource(
					scriptURL.href,
					options?.type,
				);
				this._worker = createWorkerFromSource(source, options);
			}
		}

		this._queue = new Map();
		this._terminated = false;

		this._generate = (message) => {
			let id: string;
			do {
				id =
					typeof options?.generate === 'function'
						? options.generate(message)
						: `worker_${message.type}_${generateId()}`;
			} while (this._queue.has(id));
			return id;
		};

		// add message event listener to handle responses
		this.addEventListener('message', (event: MessageEvent<MessageMain>) => {
			// ensure message is received through register function of worker thread
			if (!eventIsResponse(event)) {
				return;
			}

			// stop propagation to make sure next listeners do not get invoked since message was not sent by user
			event.stopImmediatePropagation();

			const response = event.data;

			const { type: responseType, id: responseId } = response;

			// pending request corresponding with the response id
			const pendingRequest = this._queue.get(responseId);

			if (
				['response', 'context'].includes(responseType) &&
				typeof pendingRequest !== 'undefined'
			) {
				// remove the pending request form queue
				this._queue.delete(responseId);

				// resolve the request with response data from worker
				pendingRequest.resolve(response);
			}
		});

		this._setup = this._request({
			type: 'context',
			context: options?.context as InferContext<R>,
		}).then((data) => {
			if (data.type !== 'context') {
				throw new Error(
					`Requested 'context' type but got '${String(data.type)}'`,
				);
			}

			if (data.status !== 'success') {
				throw data.error;
			}
		});
	}

	/**
	 * A method to request to worker
	 *
	 * @param message The message object to be sent
	 *
	 * @returns The response message object
	 */
	private _request(
		message: MessageWorkerInput,
		options: RequestOptions = {},
	): Promise<MessageMain> {
		return new Promise<MessageMain>((resolve, reject) => {
			const { transfer, signal } = Array.isArray(options)
				? { transfer: options }
				: options;

			if (signal?.aborted) {
				return reject(
					signal.reason ?? new DOMException('Aborted', 'AbortError'),
				);
			}

			signal?.addEventListener(
				'abort',
				() => {
					this._queue.delete(requestId);
					reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
				},
				{ once: true },
			);

			const requestId = this._generate(message);
			const messageData: MessageWorker = {
				...message,
				id: requestId,
			};
			Object.assign(messageData, { [WORKER_RPC_KEY]: true });

			this._queue.set(requestId, { resolve, reject });
			if (transfer) {
				this.postMessage(messageData, { transfer });
			} else {
				this.postMessage(messageData);
			}
		});
	}

	/**
	 * Call registered method from worker thread
	 *
	 * @param name The name of handler function
	 * @param args The arguments to be passed to handler
	 *
	 * @returns A Promise which resolves with the return value of the handler
	 */
	async call<N extends keyof MethodsMap<InferMethods<R>>>(
		name: N,
		...args: Parameters<MethodsMap<InferMethods<R>>[N]>
	): Promise<Awaited<ReturnType<MethodsMap<InferMethods<R>>[N]>>>;
	/**
	 * Call registered method from worker thread and also transfer `Transferable`
	 *
	 * @param options Options
	 * @param name The name of handler function
	 * @param args The arguments to be passed to handler
	 *
	 * @returns A Promise which resolves with the return value of the handler
	 */
	async call<N extends keyof MethodsMap<InferMethods<R>>>(
		options: RequestOptions,
		name: N,
		...args: Parameters<MethodsMap<InferMethods<R>>[N]>
	): Promise<Awaited<ReturnType<MethodsMap<InferMethods<R>>[N]>>>;

	async call<N extends keyof MethodsMap<InferMethods<R>>>(
		...rest:
			| [N, ...Parameters<MethodsMap<InferMethods<R>>[N]>]
			| [RequestOptions, N, ...Parameters<MethodsMap<InferMethods<R>>[N]>]
	): Promise<Awaited<ReturnType<MethodsMap<InferMethods<R>>[N]>>> {
		if (this._terminated) {
			throw new Error('Worker is terminated');
		}

		if (
			!['string', 'number', 'object'].includes(typeof rest[0]) ||
			rest[0] === null
		) {
			throw new TypeError(
				'Argument 1 must be of type string, number, object or array',
			);
		}

		let name: N;
		let args: Parameters<MethodsMap<InferMethods<R>>[N]>;
		let options: RequestOptions | undefined;
		const hasOptions = typeof rest[0] === 'object';
		if (hasOptions) {
			[options, name, ...args] = rest as [
				RequestOptions,
				N,
				...Parameters<MethodsMap<InferMethods<R>>[N]>,
			];
		} else {
			[name, ...args] = rest as [
				N,
				...Parameters<MethodsMap<InferMethods<R>>[N]>,
			];
		}

		// throw an error if name is neither string nor number
		if (!['string', 'number'].includes(typeof name)) {
			throw new TypeError(
				`${hasOptions ? 'Argument 2' : 'Argument 1'} must be of type string or number`,
			);
		}

		// make sure context is setup
		await this._setup;

		const response = await this._request(
			{
				type: 'request',
				arguments: args,
				handler: name,
			},
			options,
		);

		if (response.type !== 'response') {
			throw new Error(
				`Requested 'response' type but got '${String(response.type)}'`,
			);
		}

		switch (response.status) {
			case 'success':
				return response.body as Awaited<
					ReturnType<MethodsMap<InferMethods<R>>[N]>
				>;
			case 'error':
				throw response.error;
			case 'not-found':
				throw new Error(
					`Requested handler '${String(response.handler)}' not found`,
				);
			default:
				throw new Error(`Invalid response '${JSON.stringify(response)}'`);
		}
	}

	/** A proxy which can to used as an alternative for `call` method */
	get proxy(): InferProxyType<R> {
		if (typeof Proxy === 'undefined') {
			throw new Error("'Proxy' is not supported.");
		}
		this._proxy ??= {
			__proto__: new Proxy(
				{},
				{
					get: (_: unknown, prop) => {
						return <P extends keyof MethodsMap<InferMethods<R>>>(
							...args: Parameters<MethodsMap<InferMethods<R>>[P]>
						) => {
							return this.call(prop as P, ...args);
						};
					},
				},
			),
		} as InferProxyType<R>;

		return this._proxy;
	}

	/** The underlying Web Worker instance */
	get worker(): Worker {
		return this._worker;
	}

	get onerror(): ((this: AbstractWorker, ev: ErrorEvent) => any) | null {
		return this.worker.onerror;
	}
	set onerror(onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null) {
		this._worker.onerror = onerror;
	}

	get onmessage(): ((this: Worker, ev: MessageEvent) => any) | null {
		return this._worker.onmessage;
	}
	set onmessage(onmessage: ((this: Worker, ev: MessageEvent) => any) | null) {
		this._worker.onmessage = onmessage;
	}

	get onmessageerror(): ((this: Worker, ev: MessageEvent) => any) | null {
		return this._worker.onmessageerror;
	}
	set onmessageerror(onmessageerror:
		| ((this: Worker, ev: MessageEvent) => any)
		| null) {
		this._worker.onmessageerror = onmessageerror;
	}

	postMessage(message: unknown, transfer: Transferable[]): void;
	postMessage(message: unknown, options?: StructuredSerializeOptions): void;
	postMessage(
		message: unknown,
		transferOrOptions?: Transferable[] | StructuredSerializeOptions,
	): void {
		if (transferOrOptions === undefined) {
			this._worker.postMessage(message);
		} else {
			this._worker.postMessage(
				message,
				// @ts-expect-error
				transferOrOptions,
			);
		}
	}

	terminate(): void {
		this._worker.terminate();
		this._terminated = true;
		const error = new Error('Worker terminated');
		for (const { reject } of this._queue.values()) {
			reject(error);
		}
		this._queue.clear();
	}

	addEventListener<K extends keyof WorkerEventMap>(
		type: K,
		listener: (this: Worker, ev: WorkerEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions,
	): void {
		this._worker.addEventListener(type, listener, options);
	}

	removeEventListener<K extends keyof WorkerEventMap>(
		type: K,
		listener: (this: Worker, ev: WorkerEventMap[K]) => any,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void;
	removeEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | EventListenerOptions,
	): void {
		this._worker.removeEventListener(type, listener, options);
	}

	dispatchEvent(event: Event): boolean {
		return this._worker.dispatchEvent(event);
	}
}

export type {
	CallerType,
	InferContext,
	InferMethods,
	InferProxyType,
	InferWorkerOptions,
	IWorkerOptions as WorkerOptions,
	MessageMain,
	MessageWorker,
	RegisterInput,
	RegisterOutput,
	RequestOptions,
} from './types';
export { RPCWorker as Worker };
