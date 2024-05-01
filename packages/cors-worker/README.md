# @deox/cors-worker

A cors web worker (supports creating a `Worker` instance for scripts from different hosts). Can be used with webpack or other bundlers.

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/cors-worker
```

## Usage

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```ts
// index.ts
import { Worker } from "@deox/cors-worker";

// ...
```

Common JS:

```cjs
// index.cjs
const { Worker } = require("@deox/cors-worker");

// ...
```

## Example

Following is an example of using this library with webpack:

Create a `worker.ts` as shown below:

```ts
// worker.ts
import { register } from "@deox/cors-worker/register";

export type Context = {
  info: string;
};

const registered = register((ctx: Context) => ({
  hello: () => `Hello from worker with info: ${ctx.info}`,
  sum: (...numbers: number[]) => numbers.reduce((p, c) => p + c)
}));

export type Registered = typeof registered;
```

Create a `Worker` instance in your entrypoint and utilize it:

```ts
// index.ts
import { Worker } from "@deox/cors-worker";
import { type Context, type Registered } from "./worker";

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
