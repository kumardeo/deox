export const getClass = (input: any): string =>
	Object.prototype.toString
		.call(input)
		.replace(/(?:^\[object\s(.*?)\]$)/, "$1");

export const isNull = (arg: any): arg is null => arg === null;

export const isArray = (arg: any): arg is any[] =>
	Array.isArray ? Array.isArray(arg) : getClass(arg) === "Array";

export const isString = (arg: any): arg is string => typeof arg === "string";

export const isFunction = (arg: any): arg is (..._: any[]) => any =>
	typeof arg === "function";

export const isBigInt = (arg: any): arg is bigint => typeof arg === "bigint";

export const isSymbol = (arg: any): arg is symbol => typeof arg === "symbol";

export const isBoolean = (arg: any): arg is boolean => typeof arg === "boolean";

export const isUndefined = (arg: any): arg is undefined =>
	typeof arg === "undefined";

export const isNumberAny = (arg: any): arg is number => typeof arg === "number";

export const isNaN = (arg: unknown) =>
	(Number.isNaN
		? Number.isNaN
		: (typeof window === "object" ? window : globalThis).isNaN)(arg);

export const isFinite = (arg: number) =>
	(Number.isFinite
		? Number.isFinite
		: (typeof window === "object" ? window : globalThis).isFinite)(arg);

export const isNumber = (arg: any): arg is number =>
	isNumberAny(arg) && !isNaN(arg) && isFinite(arg);

export const isObjectAny = (arg: any): arg is object | null =>
	typeof arg === "object";

export const isObject = (arg: any): arg is NonNullable<object> =>
	getClass(arg) === "Object";

export const isPlainObject = (
	arg: any
): arg is object & Record<string, unknown> => {
	if (!isObject(arg)) return false;

	// If it has modified constructor
	const ctor = arg.constructor;
	if (isUndefined(ctor)) return true;

	const prot: unknown = ctor.prototype;

	// If it has modified prototype
	if (!isObject(prot)) return false;

	// If constructor does not have an Object-specific method
	if (!Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf")) {
		return false;
	}

	// Most likely a plain Object
	return true;
};

export const isRegExp = (arg: any): arg is RegExp => arg instanceof RegExp;

export const isDate = (arg: any): arg is Date => arg instanceof Date;

export const isURL = (arg: any): arg is URL =>
	typeof URL !== "undefined" && arg instanceof URL;

export const isError = (arg: any): arg is Error =>
	typeof Error !== "undefined" && arg instanceof Error;
