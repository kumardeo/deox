import { WORKER_NAMESPACE } from "./constants";
import { generateId, getBlobContent } from "./utils";
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

export const GlobalWorker = (
	typeof globalThis !== "undefined" ? globalThis : window
).Worker;

export const eventIsResponse = (event: MessageEvent<unknown>) => {
	const response = event.data;
	if (
		typeof response === "object" &&
		response &&
		Object.hasOwnProperty.call(response, WORKER_NAMESPACE)
	) {
		return true;
	}
	return false;
};

/**
 * A subclass of Worker with more features
 * It can be used to create Worker instance for script from different origin
 */
export class Worker<
	R extends RegisterOutput<
		(ctx: any) => MayBePromise<NonNullable<object>>
	> = RegisterOutput<(ctx: undefined) => never>
> extends GlobalWorker {
	static get isProxySupported() {
		return typeof Proxy !== "undefined";
	}

	private _setup: Promise<void>;

	private _queue: {
		[key: string]: [(value: any) => void, (error: any) => void] | undefined;
	};

	private _proxy: InferProxyType<R> | undefined;

	private _generate: (message: MessageWorkerInput) => string;

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
				: new URL(scriptURL, window.location.host);
		const workerOptions = options || {};

		if (workerUrl.host === window.location.host) {
			super(scriptURL, workerOptions);
		} else {
			const blob = new Blob([getBlobContent(workerUrl.href)], {
				type: "text/javascript"
			});
			super(URL.createObjectURL(blob), workerOptions);
		}

		this._queue = {};

		this._generate =
			typeof workerOptions.generate === "function"
				? workerOptions.generate
				: (message) => `worker_${message.type}_${generateId()}`;

		// Add message event listener
		this.addEventListener("message", (event: MessageEvent<MessageMain>) => {
			if (eventIsResponse(event)) {
				const response = event.data;

				const { type: responseType, id: responseId } = response;

				const pendingData = this._queue[responseId];

				if (
					["response", "context"].includes(responseType) &&
					typeof pendingData !== "undefined"
				) {
					pendingData[0](response);

					// Remove the pending request
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
	 * Call function from worker thread
	 *
	 * @param handler The name of handler function
	 * @param args The arguments to be passed to handler
	 *
	 * @returns Promise which resolves with the return value of the handler
	 */
	async call<N extends keyof InferMethodsMap<R>>(
		name: N,
		...args: InferMethodsMap<R>[N][0]
	): Promise<Await<InferMethodsMap<R>[N][1]>> {
		// Wait for context to setup
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
