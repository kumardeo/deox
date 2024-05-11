# @deox/oson

Oson Structured Object Notation - JSON has a bunch of problems, OSON fixes them.  
Powered by [@KnorpelSenf/oson](https://github.com/KnorpelSenf/oson).

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/oson
```

## Usage

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```js
// index.js
import * as oson from "@deox/oson";

// ...
```

Common JS:

```cjs
// index.cjs
const oson = require("@deox/oson");

// ...
```

## Features

OSON can encode **circular references**:

```js
const obj = {};
obj.self = obj;
JSON.stringify(obj); // error
oson.stringify(obj); // works!
```

OSON can encode **repeated references**:

```js
const obj = {};
const arr = [obj, obj];
const [left, right] = JSON.parse(JSON.stringify(arr));
assertStrictEquals(left, right); // error
const [l, r] = oson.parse(oson.stringify(arr));
assertStrictEquals(l, r); // works!
```

OSON can encode **undefined**:

```js
const undef = oson.parse(oson.stringify(undefined));
assertStrictEquals(undef, undefined);
```

OSON can encode **sparse arrays**:

```js
const arr = [5, , , , 6, , , 7];
console.log(oson.parse(oson.stringify(arr)));
// [ 5, <3 empty items>, 6, <2 empty items>, 7 ]
```

OSON can encode **bigint**:

```js
const num = 10n ** 1000n;
JSON.stringify(num); // error
oson.stringify(num); // works!
```

OSON can encode **class instances** of the following built-in types:

- `Map`
- `Set`
- `Date`
- `RegExp`
- `Error`
- `Uint8Array`
- `URL`

OSON can encode **class instances** of your custom classes:

```ts
class CustomClass {
  constructor(
    public prop1: string,
    public prop2: { a: boolean; b: string[] }
  ) {
    this.prop1 = prop1;
    this.prop2 = prop2;
  }
}

GLOBAL_CONSTRUCTOR_MAP.set(CustomClass, {
  from: (a) => [a.prop1, a.prop2] as const,
  create: ([prop1, prop2]) => new CustomClass(prop1, prop2)
});

const c = new CustomClass("str_1", "str_2");

assertInstanceOf(JSON.parse(JSON.stringify(c)), CustomClass); // error
assertInstanceOf(oson.parse(oson.stringify(c)), CustomClass); // works!
```

See also [this type definition](https://deno.land/x/oson/mod.ts?s=BucketContructor) for classes that are containers for object values (which may lead to circular references).

OSON provides `listify` and `delistify` which can be used to convert objects to a representation that `JSON` accepts.

```ts
const num = 10n;
JSON.stringify(num); // error
JSON.stringify(oson.listify(num)); // works!
```

This lets you avoid repeated serialization.

## Non-goals

The following things are explicitly not supported.

And they never will be, because they can never work well.

- symbols (would not preserve equality)
- functions (would not behave identically)
- modules (ditto)

## name

The _OSON_ in the name stands for _Oson Structured Object Notation_.

---

Written from scratch, based on ideas in [ARSON](https://github.com/benjamn/arson).
