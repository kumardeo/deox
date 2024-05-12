import { WORKER_NAMESPACE } from "./constants";
import { eventIsResponse, generateId, getBlobContent } from "./utils";
import type {
	InferMethodsMap,
	InferWorkerOptions,
	MessageWorkerInput,
	MessageMain,
	MessageWorker,
	RegisterOutput,
	InferContext,
	InferProxyType,
	MayBePromise,
	Await
} from "./types";

/** The global `Worker` constructor */
export const GlobalWorker = (
	typeof globalThis !== "undefined" ? globalThis : window
).Worker;

/**
 * A subclass of Worker with more features.
 *
 * It can be used to create Worker instance for script from different origin using Blob URLs.
 *
 * **Example for webpack**:
 *
 * Create a `worker.ts` file with following content:
 *
 * ```ts
 * // worker.ts
 * import { register } from "@deox/cors-worker/register";
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
 * Now you can create a {@link Worker} instance and use the registered methods in your entrypoints:
 *
 * ```ts
 * import { Worker } from "@deox/cors-worker";
 * import { type Context, type Registered } from "./worker";
 *
 * // Context data to be sent to worker
 * const context: Context = { from: "Worker Thread" };
 *
 * // Create a Worker instance
 * const worker = new Worker<Registered>(
 *   new URL("./worker", import.meta.url),
 *   { context }
 * );
 *
 * // Call registered method from worker using call method of instance
 * worker.call("hello").then(
 *   console.log // "Hello from Worker Thread"
 * );
 *
 * // Or you can call registered method from worker using proxy
 * worker.proxy.hello().then(
 *   console.log // "Hello from Worker Thread"
 * );
 * ```
 *
 * **Note**: It doesn't matter your registered methods are synchronous or asynchronous,
 * the methods called using Worker instance will always return a Promise which resolves or rejects based on method logic.
 */
export class Worker<
	R extends RegisterOutput<
		(ctx: any) => MayBePromise<NonNullable<object>>
	> = RegisterOutput<(ctx: undefined) => never>
> extends GlobalWorker {
	/** Indicates whether Proxy is supported */
	static get isProxySupported() {
		return typeof Proxy !== "undefined";
	}

	/** A promise which resolves when context is sent to worker */
	private _setup: Promise<void>;

	/** A map of pending requests containing functions to resolve or reject */
	private _queue: Record<
		string,
		[(value: any) => void, (error: any) => void] | undefined
	>;

	/** A proxy which can to used as an alternative for `call` method */
	private _proxy: InferProxyType<R> | undefined;

	/** A function which generates unique request id */
	private _generate: (message: MessageWorkerInput) => string;

	/** The context provided through options (to be sent to worker) */
	readonly context: InferContext<R>;

	/**
	 * A method to request to worker
	 *
	 * @param message The message object to be sent
	 *
	 * @returns The response message object
	 */
	private _request(message: MessageWorkerInput) {
		const requestId = this._generate(message);
		const messageData: MessageWorker = {
			...message,
			id: requestId
		};
		Object.assign(messageData, { [WORKER_NAMESPACE]: true });
		return new Promise<MessageMain>((resolve, reject) => {
			this._queue[requestId] = [resolve, reject];
			this.postMessage(messageData);
		});
	}

	/**
	 * Creates a new instance of Worker
	 *
	 * @param scriptURL The url of the worker script
	 * @param options Options
	 */
	constructor(scriptURL: string | URL, options: InferWorkerOptions<R>) {
		const workerUrl =
			scriptURL instanceof URL
				? scriptURL
				: new URL(scriptURL, window.location.href);
		const workerOptions = options || {};

		// construct normally if script url is same-origin otherwise use blob url
		if (workerUrl.origin === window.location.origin) {
			super(scriptURL, workerOptions);
		} else {
			const blob = new Blob([getBlobContent(workerUrl.href, options?.type)], {
				type: "text/javascript"
			});
			super(URL.createObjectURL(blob), workerOptions);
		}

		this._queue = {};

		this._generate =
			typeof workerOptions.generate === "function"
				? workerOptions.generate
				: (message) => `worker_${message.type}_${generateId()}`;

		// add message event listener to handle responses
		this.addEventListener("message", (event: MessageEvent<MessageMain>) => {
			// check if message was sent through register function of worker thread
			if (eventIsResponse(event)) {
				// stop propagation to make sure next listeners do not get invoked since message was not sent by user
				event.stopImmediatePropagation();

				const response = event.data;

				const { type: responseType, id: responseId } = response;

				// pending request corresponding with the response id
				const pendingData = this._queue[responseId];

				if (
					["response", "context"].includes(responseType) &&
					typeof pendingData !== "undefined"
				) {
					// resolve the request with response data from worker
					pendingData[0](response);

					// remove the pending request form queue
					delete this._queue[responseId];
				}
			}
		});

		this.context = workerOptions.context;

		this._setup = new Promise((resolve, reject) => {
			this._request({
				type: "context",
				context: this.context
			})
				.then((data) => {
					if (data.type === "context") {
						if (data.status === "success") {
							resolve();
						} else {
							reject(data.error);
						}
					} else {
						reject(
							new Error(`Requested context type but got ${String(data.type)}`)
						);
					}
				})
				.catch(reject);
		});
	}

	/**
	 * Call registered method from worker thread
	 *
	 * @param handler The name of handler function
	 * @param args The arguments to be passed to handler
	 *
	 * @returns A Promise which resolves with the return value of the handler
	 */
	async call<N extends keyof InferMethodsMap<R>>(
		name: N,
		...args: InferMethodsMap<R>[N][0]
	): Promise<Await<InferMethodsMap<R>[N][1]>> {
		// make sure context is setup
		await this._setup;

		const response = await this._request({
			type: "request",
			arguments: args,
			handler: name
		});

		if (response.type !== "response") {
			throw new Error(
				`Requested response type but got ${String(response.type)}`
			);
		}

		switch (response.status) {
			case "success":
				return response.body as Await<InferMethodsMap<R>[N][1]>;
			case "error":
				throw response.error;
			case "not-found":
				throw new Error(
					`Requested handler '${String(response.handler)}' not found`
				);
			default:
				throw new Error(`Invalid response: ${JSON.stringify(response)}`);
		}
	}

	/**
	 * A proxy which can to used as an alternative for `call` method
	 */
	get proxy() {
		if (!Worker.isProxySupported) {
			throw new Error("Proxy is not supported");
		}
		if (!this._proxy) {
			this._proxy = {
				__proto__: new Proxy(
					{},
					{
						get:
							<P extends keyof InferMethodsMap<R>>(_: unknown, prop: P) =>
							(...args: InferMethodsMap<R>[P][0]) =>
								this.call(prop, ...args)
					}
				)
			} as InferProxyType<R>;
		}

		return this._proxy;
	}
}
