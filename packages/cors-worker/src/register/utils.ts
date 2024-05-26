import { WORKER_NAMESPACE } from '../constants';
import type { Await, AwaitFunc, MayBePromise, MessageMain, MessageMainInput, MethodsMap } from '../types';

/// <reference lib="WebWorker" />
declare const self: DedicatedWorkerGlobalScope;

/**
 * A helper function to get Error object from any data type
 *
 * @param data The Error
 *
 * @returns An Error instance
 */
export const toError = (data: unknown) => (data instanceof Error ? data : new Error(String(data)));

/**
 * An object containing methods for sending message to main thread
 */
export const respond = {
  /**
   * A helper method to send object as message data to main thread
   *
   * @param id The id of the request
   *
   * @param keyValue The object to be sent
   */
  post(id: string, keyValue: MessageMainInput) {
    const response: MessageMain = {
      ...keyValue,
      id,
      timestamp: new Date().getTime(),
    };

    Object.assign(response, { [WORKER_NAMESPACE]: true });

    self.postMessage(response);
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
      error: toError(error || 'An unexpected error occurred while setting context in worker'),
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
  handlerSuccess(id: string, handler: string | number, body: unknown) {
    this.post(id, {
      type: 'response',
      status: 'success',
      handler,
      body,
    });
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
      error: toError(error || 'An unexpected error occurred in worker'),
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

export class DeferredPromise<T> extends Promise<T> {
  readonly resolve: (value: T | PromiseLike<T>) => void;

  readonly reject: (reason?: any) => void;

  /**
   * Creates a new Promise.
   *
   * @param executor A callback used to initialize the promise. This callback is passed two arguments: a resolve callback used to resolve the promise with a value or the result of another promise, and a reject callback used to reject the promise with a provided reason or error.
   */
  constructor(executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
    const nothingFunction = () => {};
    let resolveFunction: this['resolve'] | null = null;
    let rejectFunction: this['reject'] | null = null;

    super((resolve, reject) => {
      resolveFunction = resolve;
      rejectFunction = reject;
      if (typeof executor !== 'undefined') {
        executor(resolve, reject);
      }
    });

    this.resolve = resolveFunction || nothingFunction;
    this.reject = rejectFunction || nothingFunction;

    Object.defineProperties(this, {
      resolve: {
        value: this.resolve,
        writable: false,
        configurable: false,
        enumerable: false,
      },
      reject: {
        value: this.reject,
        writable: false,
        configurable: false,
        enumerable: false,
      },
    });
  }
}

export const makeAsync = <T = any>(data: T): Promise<Await<T>> => {
  if (data instanceof Promise) {
    return data as Promise<Await<T>>;
  }
  return Promise.resolve(data);
};

export const eventIsRequest = (event: MessageEvent<unknown>) => {
  const request = event.data;

  if (typeof request === 'object' && request && Object.hasOwnProperty.call(request, WORKER_NAMESPACE)) {
    return true;
  }
  return false;
};

export type HandlerType<F extends (ctx?: any) => MayBePromise<NonNullable<object>>> = {
  __resolved: AwaitFunc<F> | undefined;
  getObject: () => Promise<AwaitFunc<F>>;
  call: <N extends keyof MethodsMap<AwaitFunc<F>>>(
    name: N,
    ...args: MethodsMap<AwaitFunc<F>>[N][0]
  ) => Promise<Await<MethodsMap<AwaitFunc<F>>[N][1]>>;
};

export const handle = <F extends (ctx?: any) => MayBePromise<NonNullable<object>>>(input: F, context: Parameters<F>[0]): HandlerType<F> => {
  const result: HandlerType<F> = {
    __resolved: undefined,
    async getObject(): Promise<AwaitFunc<F>> {
      if (!this.__resolved) {
        this.__resolved = (await makeAsync(input(context))) as AwaitFunc<F>;
      }
      return this.__resolved;
    },
    async call(name, ...args) {
      const methods = await this.getObject();

      if (typeof args === 'undefined' || !Array.isArray(args)) {
        throw new TypeError('Argument 2 must be of type Array');
      }

      if (!Object.hasOwnProperty.call(methods, name)) {
        throw new Error(`Method '${String(name)}' does not exists`);
      }

      if (typeof methods[name] !== 'function') {
        throw new Error(`Property '${String(name)}' is not a function`);
      }

      // @ts-expect-error we did type checks safe to call the method
      return methods[name](...args);
    },
  };

  return result;
};

export type MessageHandler<T = any> = (event: MessageEvent<T>) => void;

export const messageHandler = <T = any>() => ({
  current: undefined as MessageHandler<T> | undefined,
  remove() {
    if (this.current) {
      self.removeEventListener('message', this.current);
    }
    this.current = undefined;
  },
  set(handler: MessageHandler<T>) {
    this.remove();
    this.current = handler;
    self.addEventListener('message', this.current);
  },
});
