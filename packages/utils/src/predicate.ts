const getGlobalObject = () => (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : self);

/**
 * Gets the string tag
 *
 * @param input The input
 */
export const getStringTag = (input: any): string => Object.prototype.toString.call(input).replace(/(?:^\[object\s(.*?)\]$)/, '$1');

/**
 * Checks whether the input is a `string`.
 *
 * @param input The value to check.
 */
export const isString = (input: any): input is string => typeof input === 'string';

/**
 * Checks whether the input is a `function`.
 *
 * @param input The value to check.
 */
export const isFunction = (input: any): input is (..._args: any[]) => any => typeof input === 'function';

/**
 * Checks whether the input is a `bigint`.
 *
 * @param input The value to check.
 */
export const isBigInt = (input: any): input is bigint => typeof input === 'bigint';

/**
 * Checks whether the input is a `symbol`.
 *
 * @param input The value to check.
 */
export const isSymbol = (input: any): input is symbol => typeof input === 'symbol';

/**
 * Checks whether the input is a `boolean`.
 *
 * @param input The value to check.
 */
export const isBoolean = (input: any): input is boolean => typeof input === 'boolean';

/**
 * Checks whether the input is `undefined`.
 *
 * @param input The value to check.
 */
export const isUndefined = (input: any): input is undefined => typeof input === 'undefined';

/**
 * Checks whether the input is `null`.
 *
 * @param input The value to check.
 */
export const isNull = (input: any): input is null => input === null;

/**
 * Checks whether the input is `null` or `undefined`.
 *
 * @param input The value to check.
 */
export const isNil = (input: any): input is null | undefined => isNull(input) || isUndefined(input);

/**
 * Checks whether the input is Javascript primitive.
 *
 * @param input The value to check.
 */
export const isPrimitive = (input: unknown): input is null | undefined | string | number | boolean | symbol | bigint =>
  isNil(input) || (typeof input !== 'object' && !isFunction(input));

/**
 * Checks whether the input is a `number` (including `NaN` and `±Infinity`).
 *
 * @param input The value to check.
 */
export const isNumber = (input: any): input is number => typeof input === 'number';

/**
 * Checks whether the input is `NaN` (value of type number which is also not a number).
 *
 * @param input The value to check.
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: we need to shadow
export const isNaN = (input: any) => (Number.isNaN ? Number.isNaN(input) : isNumber(input) && getGlobalObject().isNaN(input));

/**
 * Checks whether the input is a `number` and is finite.
 *
 * @param input The value to check.
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: we need to shadow
export const isFinite = (input: any): input is number =>
  Number.isFinite ? Number.isFinite(input) : isNumber(input) && getGlobalObject().isFinite(input);

/**
 * Checks whether input is a `number` (excluding `NaN` and `±Infinity`).
 *
 * @param input The value to check.
 */
export const isValidNumber = (input: any): input is number => isNumber(input) && !isNaN(input) && isFinite(input);

/**
 * Checks whether the input is a `number`,
 * is more than or equal to JavaScript's minimum safe integer (`Number.MIN_SAFE_INTEGER`) and
 * is less than or equal to JavaScript's maximum safe integer (`Number.MAX_SAFE_INTEGER`).
 *
 * @param input The value to check.
 */
export const isSafeNumber = (input: any): input is number => isNumber(input) && input >= Number.MIN_SAFE_INTEGER && input <= Number.MAX_SAFE_INTEGER;

/**
 * Checks whether the input is a valid length.
 *
 * A valid length is of type `number`, is a non-negative integer, and is less than or equal to
 * JavaScript's maximum safe integer (`Number.MAX_SAFE_INTEGER`).
 *
 * @param input The value to check.
 */
export const isLength = (input: any): input is number => isNumber(input) && input >= 0 && Number.isSafeInteger(input);

/**
 * Checks whether input is an `Array`.
 *
 * @param input The value to check.
 */
export const isArray = (input: any): input is any[] => (Array.isArray ? Array.isArray(input) : getStringTag(input) === 'Array');

/**
 * Checks whether the input is array-like.
 *
 * @param input The value to check.
 */
export const isArrayLike = (input: any): input is ArrayLike<any> =>
  input != null && !isFunction(input) && isLength((input as ArrayLike<unknown>).length);

/**
 * Checks whether the input is a `TypedArray`.
 *
 * `TypedArray` includes `Uint8Array`, `Uint8ClampedArray`, `Uint16Array`,
 * `Uint32Array`, `BigUint64Array`, `Int8Array`, `Int16Array`, `Int32Array`,
 * `BigInt64Array`, `Float32Array` and `Float64Array`
 *
 * @param input The value to check.
 */
export const isTypedArray = (
  input: unknown,
): input is
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array =>
  input instanceof Uint8Array ||
  input instanceof Uint8ClampedArray ||
  input instanceof Uint16Array ||
  input instanceof Uint32Array ||
  input instanceof BigUint64Array ||
  input instanceof Int8Array ||
  input instanceof Int16Array ||
  input instanceof Int32Array ||
  input instanceof BigInt64Array ||
  input instanceof Float32Array ||
  input instanceof Float64Array;

/**
 * Checks if the given value is object-like.
 *
 * @param input The value to check.
 */
export const isObjectLike = (input: any): input is object => typeof input === 'object' && input !== null;

/**
 * Check whether the input is an `object`.
 *
 * @param input The value to check.
 */
export const isObject = (input: any): input is NonNullable<object> => isObjectLike(input) && !isArray(input);

/**
 * Checks whether the input is an arguments object.
 *
 * @param value The value to check.
 */
export const isArguments = (input: any): input is IArguments => isObjectLike(input) && getStringTag(input) === 'Arguments';

/**
 * Checks whether input is a plain object
 *
 * @param input The value to check
 */
export const isPlainObject = (input: any): input is object & Record<string, unknown> => {
  if (!isObjectLike(input)) {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  if (getStringTag(input) !== 'Object') {
    return false;
  }

  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(input) === proto;
};

/**
 * Check whether the input is an instance of {@link RegExp}
 *
 * @param input The value to check
 */
export const isRegExp = (input: any): input is RegExp => input instanceof RegExp;

/**
 * Check whether the input is an instance of {@link Date}
 *
 * @param input The value to check
 */
export const isDate = (input: any): input is Date => input instanceof Date;

/**
 * Check whether the input is an instance of {@link URL}
 *
 * @param input The value to check
 */
export const isURL = (input: any): input is URL => typeof URL !== 'undefined' && input instanceof URL;

/**
 * Checks whether the input is an instance of {@link Error}
 *
 * @param input The value to check
 */
export const isError = (input: any): input is Error => typeof Error !== 'undefined' && input instanceof Error;
