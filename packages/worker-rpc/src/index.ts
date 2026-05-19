import { generateId } from '@deox/utils/generate-id';
import { WORKER_NAMESPACE } from './constants';
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
import { eventIsResponse, getBlobContent } from './utils';

/** Worker constructor from global object */
let MayBeWorker: (typeof globalThis)['Worker'] | undefined;
if (typeof globalThis !== 'undefined' && globalThis.Worker) {
  MayBeWorker = globalThis.Worker;
} else if (typeof window !== 'undefined' && window.Worker) {
  MayBeWorker = window.Worker;
} else if (typeof self !== 'undefined' && self.Worker) {
  MayBeWorker = self.Worker;
}

/** This is dummy constructor to extend if `Worker` constructor is not available */
class DummyWorker {
  constructor() {
    throw new Error(
      "Cannot create 'Worker' instance. Make sure you are using on a Web Worker supported runtime which has a global 'Worker' constructor.",
    );
  }
}

/** Use dummy constructor if global `Worker` constructor is not available to make sure we can extend on ssr */
const ExtendWorker = (MayBeWorker as (typeof globalThis)['Worker']) ?? DummyWorker;

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
 * Now you can create a {@link Worker} instance and use the registered methods in your entrypoints:
 *
 * ```ts
 * import { Worker } from "@deox/worker-rpc";
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
  R extends RegisterOutput<NonNullable<object>, any> = RegisterOutput<Record<string | number, (...args: unknown[]) => unknown>, unknown>,
> extends ExtendWorker {
  /** The context provided through options (to be sent to worker) */
  private _context: InferContext<R>;

  /** A promise which resolves when context is sent to worker */
  private _setup: Promise<void>;

  /** A map of pending requests containing functions to resolve or reject */
  private _queue: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>;

  /** A proxy which can to used as an alternative for `call` method */
  private _proxy: InferProxyType<R> | undefined;

  /** Indicates whether worker has been terminated */
  private _terminated: boolean;

  /** A function which generates unique request id */
  private _generate: (message: MessageWorkerInput) => string;

  /**
   * A method to request to worker
   *
   * @param message The message object to be sent
   *
   * @returns The response message object
   */
  private _request(message: MessageWorkerInput, options: RequestOptions = {}): Promise<MessageMain> {
    return new Promise<MessageMain>((resolve, reject) => {
      const { transfer, signal } = Array.isArray(options) ? { transfer: options } : options;

      if (signal?.aborted) {
        return reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
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
      Object.assign(messageData, { [WORKER_NAMESPACE]: true });

      this._queue.set(requestId, { resolve, reject });
      if (transfer) {
        this.postMessage(messageData, { transfer });
      } else {
        this.postMessage(messageData);
      }
    });
  }

  /**
   * Creates a new instance of Worker
   *
   * @param scriptURL The url of the worker script
   * @param options Options
   */
  constructor(scriptURL: string | URL, options: InferWorkerOptions<R>) {
    const workerUrl = scriptURL instanceof URL ? scriptURL : new URL(scriptURL, window.location.href);

    // construct normally if script url is same-origin otherwise use blob url
    if (workerUrl.origin === window.location.origin) {
      super(scriptURL, options);
    } else {
      const blob = new Blob([getBlobContent(workerUrl.href, options?.type)], {
        type: 'text/javascript',
      });
      super(URL.createObjectURL(blob), options);
    }

    this._queue = new Map();
    this._context = options?.context as InferContext<R>;
    this._terminated = false;

    this._generate = (message) => {
      let id: string;
      do {
        id = typeof options?.generate === 'function' ? options.generate(message) : `worker_${message.type}_${generateId()}`;
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

      if (['response', 'context'].includes(responseType) && typeof pendingRequest !== 'undefined') {
        // remove the pending request form queue
        this._queue.delete(responseId);

        // resolve the request with response data from worker
        pendingRequest.resolve(response);
      }
    });

    this._setup = this._request({
      type: 'context',
      context: this._context,
    }).then((data) => {
      if (data.type !== 'context') {
        throw new Error(`Requested 'context' type but got '${String(data.type)}'`);
      }

      if (data.status !== 'success') {
        throw data.error;
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
    ...rest: [N, ...Parameters<MethodsMap<InferMethods<R>>[N]>] | [RequestOptions, N, ...Parameters<MethodsMap<InferMethods<R>>[N]>]
  ): Promise<Awaited<ReturnType<MethodsMap<InferMethods<R>>[N]>>> {
    if (this._terminated) {
      throw new Error('Worker is terminated');
    }

    if (!['string', 'number', 'object'].includes(typeof rest[0]) || rest[0] === null) {
      throw new TypeError('Argument 1 must be of type string, number, object or array');
    }

    let name: N;
    let args: Parameters<MethodsMap<InferMethods<R>>[N]>;
    let options: RequestOptions | undefined;
    const hasOptions = typeof rest[0] === 'object';
    if (hasOptions) {
      [options, name, ...args] = rest as [RequestOptions, N, ...Parameters<MethodsMap<InferMethods<R>>[N]>];
    } else {
      [name, ...args] = rest as [N, ...Parameters<MethodsMap<InferMethods<R>>[N]>];
    }

    // throw an error if name is neither string nor number
    if (!['string', 'number'].includes(typeof name)) {
      throw new TypeError(`${hasOptions ? 'Argument 2' : 'Argument 1'} must be of type string or number`);
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
      throw new Error(`Requested 'response' type but got '${String(response.type)}'`);
    }

    switch (response.status) {
      case 'success':
        return response.body as Awaited<ReturnType<MethodsMap<InferMethods<R>>[N]>>;
      case 'error':
        throw response.error;
      case 'not-found':
        throw new Error(`Requested handler '${String(response.handler)}' not found`);
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
            return <P extends keyof MethodsMap<InferMethods<R>>>(...args: Parameters<MethodsMap<InferMethods<R>>[P]>) => {
              return this.call(prop as P, ...args);
            };
          },
        },
      ),
    } as InferProxyType<R>;

    return this._proxy;
  }

  override terminate(): void {
    super.terminate();
    this._terminated = true;
    const error = new Error('Worker terminated');
    for (const { reject } of this._queue.values()) {
      reject(error);
    }
    this._queue.clear();
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
