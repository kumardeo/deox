/**
 * Gets the constructor class name as string
 *
 * @param input The input
 *
 * @returns The name of class as string
 *
 * Equivalent to:
 * ```
 * Object.prototype.toString.call(input).replace(/(?:^\[object\s(.*?)\]$)/, "$1")
 * ```
 */
export const getClass = (input: any): string =>
	Object.prototype.toString
		.call(input)
		.replace(/(?:^\[object\s(.*?)\]$)/, "$1");

/**
 * Check whether `arg` is `null`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is `null` otherwise `false`
 *
 * Equivalent to:
 * ```
 * arg === null
 * ```
 */
export const isNull = (arg: any): arg is null => arg === null;

/**
 * Check whether `arg` is an `Array`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is an `Array` otherwise `false`
 *
 * Equivalent to:
 * ```
 * Array.isArray ? Array.isArray(arg) : getClass(arg) === "Array"
 * ```
 */
export const isArray = (arg: any): arg is any[] =>
	Array.isArray ? Array.isArray(arg) : getClass(arg) === "Array";

/**
 * Check whether `arg` is a `String`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `String` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "string"
 * ```
 */
export const isString = (arg: any): arg is string => typeof arg === "string";

/**
 * Check whether `arg` is a `Function`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Function` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "function"
 * ```
 */
export const isFunction = (arg: any): arg is (..._: any[]) => any =>
	typeof arg === "function";

/**
 * Check whether `arg` is a `BigInt`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `BigInt` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "bigint"
 * ```
 */
export const isBigInt = (arg: any): arg is bigint => typeof arg === "bigint";

/**
 * Check whether `arg` is a `Symbol`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Symbol` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "symbol"
 * ```
 */
export const isSymbol = (arg: any): arg is symbol => typeof arg === "symbol";

/**
 * Check whether `arg` is a `Boolean`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Boolean` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "boolean"
 * ```
 */
export const isBoolean = (arg: any): arg is boolean => typeof arg === "boolean";

/**
 * Check whether `arg` is `undefined`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is `undefined` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "undefined"
 * ```
 */
export const isUndefined = (arg: any): arg is undefined =>
	typeof arg === "undefined";

/**
 * Check whether `arg` is a `Number` (including `NaN` and `Infinity`)
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Number` (including `NaN` and `Infinity`) otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "number"
 * ```
 */
export const isNumberAny = (arg: any): arg is number => typeof arg === "number";

/**
 * Check whether `arg` is `NaN`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is `NaN` otherwise `false`
 *
 * Equivalent to:
 * ```
 * Number.isNaN(arg)
 * ```
 */
export const isNaN = (arg: unknown) =>
	(Number.isNaN
		? Number.isNaN
		: (typeof window === "object" ? window : globalThis).isNaN)(arg);

/**
 * Check whether `arg` number is not `Infinity`
 *
 * @param arg The number
 *
 * @returns `true` if `arg` is a finite number otherwise `false`
 *
 * Equivalent to:
 * ```
 * Number.isFinite(arg)
 * ```
 */
export const isFinite = (arg: number) =>
	(Number.isFinite
		? Number.isFinite
		: (typeof window === "object" ? window : globalThis).isFinite)(arg);

/**
 * Check whether `arg` is a `Number` (excluding `NaN` and `Infinity`)
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Number` (excluding `NaN` and `Infinity`) otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "number" && !Number.isNaN(arg) && Number.isFinite(arg)
 * ```
 */
export const isNumber = (arg: any): arg is number =>
	isNumberAny(arg) && !isNaN(arg) && isFinite(arg);

/**
 * Check whether `arg` is a `object` (including `null`)
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `object` (including `null`) otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "object"
 * ```
 */
export const isObjectAny = (arg: any): arg is object | null =>
	typeof arg === "object";

/**
 * Check whether `arg` is a `object` (excluding `null`)
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `object` (excluding `null`) otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof arg === "object" && arg !== null
 * ```
 */
export const isObject = (arg: any): arg is NonNullable<object> =>
	isObjectAny(arg) && !isNull(arg);

/**
 * Check whether `arg`'s constructor is `Object`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg`'s constructor is `Object` otherwise `false`
 */
const isFromObject = (arg: any): arg is NonNullable<object> =>
	getClass(arg) === "Object";

/**
 * Check whether `arg` is a plain object
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a plain object otherwise `false`
 */
export const isPlainObject = (
	arg: any
): arg is object & Record<string, unknown> => {
	if (!isFromObject(arg)) return false;

	// If it has modified constructor
	const ctor = arg.constructor;
	if (isUndefined(ctor)) return true;

	const prot: unknown = ctor.prototype;

	// If it has modified prototype
	if (!isFromObject(prot)) return false;

	// If constructor does not have an Object-specific method
	if (!Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")) {
		return false;
	}

	// Most likely a plain Object
	return true;
};

/**
 * Check whether `arg` is a `RegExp`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `RegExp` otherwise `false`
 *
 * Equivalent to:
 * ```
 * arg instanceof RegExp
 * ```
 */
export const isRegExp = (arg: any): arg is RegExp => arg instanceof RegExp;

/**
 * Check whether `arg` is a `Date`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Date` otherwise `false`
 *
 * Equivalent to:
 * ```
 * arg instanceof Date
 * ```
 */
export const isDate = (arg: any): arg is Date => arg instanceof Date;

/**
 * Check whether `arg` is a `URL`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `URL` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof URL !== "undefined" && arg instanceof URL
 * ```
 */
export const isURL = (arg: any): arg is URL =>
	typeof URL !== "undefined" && arg instanceof URL;

/**
 * Check whether `arg` is a `Error`
 *
 * @param arg Any data
 *
 * @returns `true` if `arg` is a `Error` otherwise `false`
 *
 * Equivalent to:
 * ```
 * typeof Error !== "undefined" && arg instanceof Error
 * ```
 */
export const isError = (arg: any): arg is Error =>
	typeof Error !== "undefined" && arg instanceof Error;
