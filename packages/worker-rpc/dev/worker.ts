import { register, withOptions } from '../src/register';

declare let self: DedicatedWorkerGlobalScope;

const registered = register((ctx: { info: string }) => {
  const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

  return {
    thisError: new Error('Custom error!'),
    hello: () => 'Hello from worker',
    sum: (...numbers: number[]) => numbers.reduce((p, c) => p + c),
    displayInfo: () => `ctx.info is ${ctx.info}`,
    fetchJson: (url: string) => fetch(url).then((response) => response.json()),
    throwError() {
      throw this.thisError;
    },
    transferToMain() {
      return withOptions(bytes, [bytes.buffer]);
    },
    transferToWorker(bytes: Uint8Array) {
      console.log(bytes);
    },
    getByteLength() {
      return bytes.byteLength;
    },
  };
});

// This should not log any event
self.addEventListener('message', (event) => {
  console.warn('(thread:worker) Log from message event: ', event);
});

export type Registered = typeof registered;
