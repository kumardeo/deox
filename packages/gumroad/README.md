# @deox/gumroad

API client for Gumroad. All the methods in API v2 are available.

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/gumroad
```

## Usage

> **Warning:** The library uses Fetch standard (Fetch API including fetch, Response, etc) which means that the environment must support it to make the library work!

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```ts
// index.ts
import { Gumroad } from "@deox/gumroad";

const gumroad = new Gumroad(process.env.GUMROAD_ACCESS_TOKEN);
```

Common JS:

```cjs
// index.cjs
const { Gumroad } = require("@deox/gumroad");

const gumroad = new Gumroad(process.env.GUMROAD_ACCESS_TOKEN);
```

## API

Currently, all the methods in Gumroad API v2 are available.

Some examples are:

```ts
// index.ts
import { Gumroad } from "@deox/gumroad";

const gumroad = new Gumroad(process.env.GUMROAD_ACCESS_TOKEN);

const products = await gumroad.listProducts(); // type: Product[]

const sales = await gumroad.listSales(); // type: Sale[]

// ...
```

There are more methods. You can explore it by installing the package!

## Webhook (Resource Subscriptions)

You can handle webhook requests with ease by using this library. An example is shown below which is written for Cloudflare Workers:

```ts
// src/index.ts
import { Gumroad } from "@deox/gumroad";

export type Env = Readonly<{
 GUMROAD_ACCESS_TOKEN: string;
}>;

const handleWebhook = async (request: Request, env: Env) => {
 const gumroad = new Gumroad(env.GUMROAD_ACCESS_TOKEN);

 gumroad.on(
  "ping",
  async (ctx, next) => {
   console.log(
    `Good news! A new sale was made using an email address ${ctx.data.email}`
   );

   const sale = await gumroad.getSale(ctx.data.sale_id);

   console.log(sale);

   // ...

   if (ctx.data.test) {
    await next();
   }
  },
  () => {
   // This will be called only on test pings
   console.log("A test ping!");
  }
 );

 // Second parameter is type of resource subscription
 // which is going to be posted on this endpoint
 // Make sure you specify the correct type
 return gumroad.handle(request, "ping");
};

const workers: ExportedHandler<Env> = {
 fetch: (request, env) => {
  const url = new URL(request.url);

  // Check for pathname and request method
  if (request.method === "POST" && url.pathname === "/ping") {
   return handleWebhook(request, env);
  }

  return new Response(null, { status: 404 });
 }
};

export default workers;
```
