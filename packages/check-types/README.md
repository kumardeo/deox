# @deox/check-types

Utilities for checking types.

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/check-types
```

## Usage

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```ts
// index.ts
import { isPlainObject } from "@deox/check-types";

// ...
```

Common JS:

```cjs
// index.cjs
const { isPlainObject } = require("@deox/check-types");

// ...
```

## API

Following functions are available:  

* `getClass(input)`: Returns the name of constructor class of `input` as string.
* `isNull(arg)`: Checks whether `arg` is `null` or not
* `isArray(arg)`: Check whether `arg` is an `Array`
* `isString(arg)`: Check whether `arg` is a `String`
* `isFunction(arg)`: Check whether `arg` is a `Function`
* `isBigInt(arg)`: Check whether `arg` is a `BigInt`
* `isSymbol(arg)`: Check whether `arg` is a `Symbol`
* `isBoolean(arg)`: Check whether `arg` is a `Boolean`
* `isUndefined(arg)`: Check whether `arg` is `undefined`
* `isNumberAny(arg)`: Check whether `arg` is a `Number` including `NaN` and `Infinity`
* `isNaN(arg)`: Check whether `arg` is `NaN`
* `isFinite(arg)`: Check whether `arg` is `Number` and isFinite
* `isNumber(arg)`: Check whether `arg` is a `Number` excluding `NaN` and `Infinity`
* `isObjectAny(arg)`: Check whether `arg` is an `Object` including `null`
* `isObject(arg)`: Check whether `arg`is an `Object` excluding `null` and `Array`
* `isPlainObject(arg)`: Check whether `arg` is a plain object
* `isRegExp(arg)`: Check whether `arg` is a `RegExp`
* `isDate(arg)`: Check whether `arg` is a `Date`
* `isURL(arg)`: Check whether `arg` is an `URL`
* `isError(arg)`: Check whether `arg` is an `Error`
