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
