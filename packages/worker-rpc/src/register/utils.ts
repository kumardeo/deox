import { WORKER_NAMESPACE } from '../constants';
import type { Await, AwaitReturn, MayBePromise, MessageMain, MessageMainInput, MethodsMap, WithOptionsInstance } from '../types';

/// <reference lib="WebWorker" />
declare let self: DedicatedWorkerGlobalScope;

export class WithOptions<T> implements WithOptionsInstance<T> {
  result: T;
  options: StructuredSerializeOptions | Transferable[];

  constructor(result: T, options: StructuredSerializeOptions | Transferable[]) {
    this.result = result;
    this.options = options;
  }
}

export const withOptions = <T>(result: T, options: StructuredSerializeOptions | Transferable[]) => new WithOptions(result, options);

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
   * @param data The object to be sent
   */
  post(id: string, data: MessageMainInput, options?: StructuredSerializeOptions | Transferable[]) {
    const response: MessageMain = Object.assign(
      {
        ...data,
        id,
        timestamp: new Date().getTime(),
      },
      { [WORKER_NAMESPACE]: true },
    );

    if (options) {
      self.postMessage(response, Array.isArray(options) ? { transfer: options } : options);
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
      error: toError(error || 'An unexpected error occurred while setting context in worker.'),
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
  handlerSuccess(id: string, handler: string | number, body: unknown, options?: StructuredSerializeOptions | Transferable[]) {
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

/** utility to convert data to promise */
export const toPromise = <T = any>(data: T): Promise<Await<T>> => {
  if (data instanceof Promise) {
    return data as Promise<Await<T>>;
  }
  return Promise.resolve(data);
};

/** checks if message event is request */
export const isRequestEvent = (event: MessageEvent<unknown>) => {
  const request = event.data;

  return !!request && typeof request === 'object' && Object.hasOwnProperty.call(request, WORKER_NAMESPACE);
};

export type HandlerType<F extends (ctx?: any) => MayBePromise<NonNullable<object>>> = {
  __resolved: AwaitReturn<F> | undefined;
  getObject: () => Promise<AwaitReturn<F>>;
  call: <N extends keyof MethodsMap<AwaitReturn<F>>>(
    name: N,
    ...args: MethodsMap<AwaitReturn<F>>[N][0]
  ) => Promise<Await<MethodsMap<AwaitReturn<F>>[N][1]>>;
};

export const handle = <F extends (ctx?: any) => MayBePromise<NonNullable<object>>>(input: F, context: Parameters<F>[0]): HandlerType<F> => {
  const result: HandlerType<F> = {
    __resolved: undefined,
    async getObject(): Promise<AwaitReturn<F>> {
      if (!this.__resolved) {
        this.__resolved = (await toPromise(input(context))) as AwaitReturn<F>;
      }
      return this.__resolved;
    },
    async call(name, ...args) {
      // throw an error if name is neither string nor number
      if (!['string', 'number'].includes(typeof name)) {
        throw new TypeError('Argument 1 must be of type string or number');
      }

      const methods = await this.getObject();

      if (!Object.hasOwnProperty.call(methods, name)) {
        throw new Error(`Method '${String(name)}' does not exists.`);
      }

      if (typeof methods[name] !== 'function') {
        throw new Error(`Property '${String(name)}' is not a function.`);
      }

      // @ts-expect-error: we did type checks, safe to call the method
      return methods[name](...args);
    },
  };

  return result;
};

export type MessageHandler<T = any> = (event: MessageEvent<T>) => void;

/** utility function for attaching or detaching message handler */
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
