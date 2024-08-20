import { isUndefined } from './predicate';

const functionsMap = new WeakMap();

export class DeferredPromise<T> extends Promise<T> {
  /**
   * Creates a new DeferredPromise.
   *
   * @param executor A callback used to initialize the promise. This callback is passed two arguments: a resolve callback used to resolve the promise with a value or the result of another promise, and a reject callback used to reject the promise with a provided reason or error.
   */
  constructor(
    executor?: (
      resolve: (value: T | PromiseLike<T>) => void,
      // biome-ignore lint/suspicious/noExplicitAny: we needed to use `any` here
      reject: (reason?: any) => void,
    ) => void,
  ) {
    let functions: unknown[] | undefined;
    super((resolve, reject) => {
      functions = [resolve, reject];
      if (!isUndefined(executor)) {
        executor(resolve, reject);
      }
    });
    functionsMap.set(this, functions ?? []);
  }

  resolve(value: T | PromiseLike<T>) {
    functionsMap.get(this)[0]?.(value);
    return this;
  }

  // biome-ignore lint/suspicious/noExplicitAny: we needed to use `any` here
  reject(reason?: any) {
    functionsMap.get(this)[1]?.(reason);
    return this;
  }
}
