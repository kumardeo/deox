# @deox/worker-rpc

Lightweight RPC utility for calling functions in Web Workers and receiving results with simple, promise-based syntax.  
Can be used with Webpack, Vite or other bundlers.

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/worker-rpc
```

## Usage

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```ts
// index.ts
import { Worker } from "@deox/worker-rpc";

// ...
```

Common JS:

```cjs
// index.cjs
const { Worker } = require("@deox/worker-rpc");

// ...
```

## Example

Following is an example of using this library with webpack:

Create a `worker.ts` as shown below:

```ts
// worker.ts
import { register } from "@deox/worker-rpc/register";

export type Context = {
  info: string;
};

const registered = register((ctx: Context) => ({
  hello: () => `Hello from worker with info: ${ctx.info}`,
  sum: (...numbers: number[]) => numbers.reduce((p, c) => p + c, 0)
}));

export type Registered = typeof registered;
```

Create a `Worker` instance in your entrypoint and utilize it:

```ts
// index.ts
import { Worker } from "@deox/worker-rpc";
import type { Context, Registered } from "./worker";

const context: Context = {
  info: "This works!"
};

const worker = new Worker<Registered>(
  new URL("./worker", import.meta.url),
  { context, name: "my-worker" }
);

// Call the methods :)
worker.call("hello").then(result => {
  // Do something with result
  console.log(result);
});

// Or use ES6 Proxy
worker.proxy.sum(20, 50, 30).then(result => {
  // Do something with result
  console.log(result);
});
```

> **Note:** It doesn't matter your registered methods are synchronous or asynchronous, the methods called using `Worker` instance will always return a `Promise` which resolves or rejects based on method logic.

## Transfer data

You can transfer the ownership of transferable objects between threads.

### Main to Worker

To transfer transferable objects from the main thread to the worker thread, pass them as the first parameter in the `Worker.call()` method.

> [!WARNING]
> The transferable objects should be passed as method parameters; otherwise, they may be moved, but not actually accessible within the worker thread.

`worker.ts`:
```ts
// worker.ts
import { register } from "@deox/worker-rpc/register";

const registered = register(() => ({
  doSomething: (bytes: Uint8Array) => {
    // do something with bytes
  }
}));

export type Registered = typeof registered;
```

`index.ts`:
```ts
// index.ts
import { Worker } from "@deox/worker-rpc";
import type { Registered } from "./worker";

const worker = new Worker<Registered>(
  new URL("./worker", import.meta.url),
  { name: "my-worker" }
);

const bytes = new Uint8Array([1, 2, 3, 4]);

worker.call([bytes.buffer], "doSomething", bytes);
// or alternatively
/*
worker.call({
  transfer: [bytes.buffer]
}, "doSomething", bytes);
*/
```

## Worker to Main

To transfer transferable objects from the worker thread to the main thread, use the `withOptions()` helper to pass the transferable objects along with the result and return it from the worker method.

> [!WARNING]
> The transferable objects should be attached to the result; otherwise, they may be moved but not accessible in the main thread.

`worker.ts`:
```ts
// worker.ts
import { register, withOptions } from "@deox/worker-rpc/register";

const registered = register(() => ({
  doSomething: () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    return withOptions([bytes.buffer], bytes);
    // or alternatively
    /*
    return withOptions({
      transfer: [bytes.buffer]
    }, bytes);
    */
  }
}));

export type Registered = typeof registered;
```

`index.ts`:
```ts
// index.ts
import { Worker } from "@deox/worker-rpc";
import type { Registered } from "./worker";

const worker = new Worker<Registered>(
  new URL("./worker", import.meta.url),
  { name: "my-worker" }
);

worker.call("doSomething").then((bytes) => {
  // do something with bytes
});
```
