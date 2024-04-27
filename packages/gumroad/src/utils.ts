import { GumroadRequestError, GumroadTypeError } from "./errors";

const getConfigurations = <M extends Record<string | number, any>>(
	properties: M
) =>
	Object.keys(properties).reduce((acc, key) => {
		const value = properties[key as keyof M];

		acc[key] = {
			value
		};

		return acc;
	}, {} as PropertyDescriptorMap);

export const addProperties = <
	O extends NonNullable<unknown>,
	I extends NonNullable<unknown>,
	M extends NonNullable<unknown>
>(
	object: O,
	immutable: I,
	mutable?: M
) => {
	if (mutable) {
		Object.assign(object, mutable);
	}
	Object.defineProperties(object, getConfigurations(immutable));

	return object as O & M & I;
};

export const validators = {
	string(data: unknown, name: string) {
		if (typeof data !== "string") {
			throw new GumroadTypeError(
				`${name} must be of type string, current type is ${typeof data}`
			);
		}
	},

	notEmpty(data: unknown, name: string) {
		this.string(data, name);

		if ((data as string).length === 0) {
			throw new GumroadTypeError(`${name} cannot be an empty string`);
		}
	},

	notBlank(data: unknown, name: string) {
		this.string(data, name);

		if ((data as string).trim().length === 0) {
			throw new GumroadTypeError(`${name} cannot be a blank string`);
		}
	}
};

export const error = {
	inGumroadRequest(e: unknown, message: string) {
		if (e instanceof GumroadRequestError) {
			if (e.message.toLowerCase().includes(message.toLowerCase())) {
				return true;
			}
		}

		return false;
	},

	isProductNotFound(e: unknown) {
		const message = "The product was not found.";
		return this.inGumroadRequest(e, message);
	},

	isOfferCodeNotFound(e: unknown) {
		const message = "The offer_code was not found.";
		return this.inGumroadRequest(e, message);
	},

	isVariantCategoryNotFound(e: unknown) {
		const message = "The variant_category was not found.";
		return this.inGumroadRequest(e, message);
	},

	isLicenseNotFound(e: unknown) {
		const message = "That license does not exist for the provided product.";
		return this.inGumroadRequest(e, message);
	},

	isSubscriberNotFound(e: unknown) {
		const message = "The subscriber was not found.";
		return this.inGumroadRequest(e, message);
	},

	isResourceSubscriptionNotFound(e: unknown) {
		const message = "The resource_subscription was not found.";
		return this.inGumroadRequest(e, message);
	},

	isSaleNotFound(e: unknown) {
		const message = "The sale was not found.";
		return this.inGumroadRequest(e, message);
	},

	isAnyNotFound(e: unknown) {
		if (
			this.isLicenseNotFound(e) ||
			this.isOfferCodeNotFound(e) ||
			this.isProductNotFound(e) ||
			this.isVariantCategoryNotFound(e) ||
			this.isSubscriberNotFound(e) ||
			this.isResourceSubscriptionNotFound(e)
		) {
			return true;
		}

		return false;
	}
};

export const getType = (input: unknown) =>
	Object.prototype.toString
		.call(input)
		.replace(/(?:^\[object\s(.*?)\]$)/, "$1");

export const isObject = (input: unknown): boolean =>
	getType(input) === "Object";

export const isPlainObject = (data: any): boolean => {
	if (!isObject(data)) return false;

	// If it has modified constructor
	const { constructor } = data as object;
	if (constructor === undefined) return true;

	// If it has modified prototype
	if (!isObject(constructor.prototype)) return false;

	// If constructor does not have an Object-specific method
	if (
		!Object.prototype.hasOwnProperty.call(
			constructor.prototype,
			"isPrototypeOf"
		)
	) {
		return false;
	}

	// Most likely a plain Object
	return true;
};

export const isNumberValid = (input: unknown) => {
	if (typeof input === "number") {
		const numIsFinite = Number.isFinite ? Number.isFinite : globalThis.isFinite;
		const numIsNan = Number.isNaN ? Number.isNaN : globalThis.isNaN;
		if (numIsFinite(input) && !numIsNan(input)) {
			return true;
		}
	}
	return false;
};

export const convertToNumber = (input: unknown) => {
	if (typeof input === "string") {
		const numbered = Number(input);
		return isNumberValid(numbered) ? numbered : undefined;
	}
	if (isNumberValid(input)) {
		return input as number;
	}
	return undefined;
};

export type ParseValueOptions = {
	parseBoolean?: boolean;
	parseNumber?: boolean;
	parseNull?: boolean;
};

export const parseValue = <T = unknown>(
	input: T,
	options: ParseValueOptions = {}
) => {
	if (typeof input === "string" && input.trim().length !== 0) {
		const lowered = input.toLowerCase();
		if (options.parseNull && lowered === "null") {
			return null;
		}
		if (options.parseBoolean) {
			if (lowered === "true" || lowered === "false") {
				return lowered === "true";
			}
		}
		if (options.parseNumber) {
			const converted = convertToNumber(input);
			if (typeof converted === "number") {
				return converted;
			}
		}
	}
	return input;
};

export type ParsedFormDataValue = string | File | (string | File)[];

export type ParsedFormData = Record<string, ParsedFormDataValue>;

export const parseFormData = <T extends ParsedFormData = ParsedFormData>(
	formData: FormData,
	options: { all?: boolean } = {}
): T => {
	const result: ParsedFormData = {};

	formData.forEach((value, key) => {
		const shouldParseAllValues = options.all || key.endsWith("[]");
		const currentValue = result[key];

		if (!shouldParseAllValues) {
			result[key] = value;
		} else if (currentValue && Array.isArray(currentValue)) {
			currentValue.push(value);
		} else if (currentValue) {
			result[key] = [currentValue, value];
		} else {
			result[key] = value;
		}
	});

	return result as T;
};

export type ParsedDeepFormDataValue =
	| ParsedFormDataValue
	| number
	| boolean
	| null;

export type ParsedDeepFormData = Record<
	string,
	ParsedDeepFormDataValue | Record<string, ParsedDeepFormDataValue>
>;

export type ParseDeepFormDataOptions = ParseValueOptions;

export const parseDeepFormData = <
	T extends ParsedDeepFormData = ParsedDeepFormData
>(
	formData: FormData,
	options?: ParseDeepFormDataOptions
) => {
	const parsedData = parseFormData(formData);

	return Object.keys(parsedData).reduce((result, e) => {
		if (e.match(/\[(.*?)\]/gi)) {
			const keys = e.split(/\[(.*?)\]/gi).filter((key) => key !== "");

			keys.reduce(
				(accumulator, key, i) => {
					if (isPlainObject(accumulator)) {
						const acc = accumulator as ParsedDeepFormData;
						let value;
						if (i !== keys.length - 1) {
							if (!Object.hasOwnProperty.call(acc, key)) {
								value = {};
							} else {
								value = parseValue(acc[key], options);
							}
						} else {
							value = parseValue(parsedData[e], options);
						}
						acc[key] = value;
						return value as ParsedDeepFormData;
					}
					return undefined;
				},
				result as ParsedDeepFormData | undefined
			);
		} else {
			result[e] = parseValue(parsedData[e], options);
		}

		return result;
	}, {} as ParsedDeepFormData) as T;
};
