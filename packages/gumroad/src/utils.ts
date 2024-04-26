import { GumroadRequestError, GumroadTypeError } from "./errors";

const check = <T>(value: T, included?: T[] | null, excluded?: T[] | null) => {
	if (Array.isArray(included)) {
		return included.includes(value);
	}
	if (Array.isArray(excluded)) {
		return !excluded.includes(value);
	}
	return true;
};

const encode = (
	objectOrArray: unknown,
	included?: string[] | null,
	excluded?: string[] | null,
	param?: string,
	paramArrayLike?: string[],
	innerCall?: boolean
) => {
	const paramArray: string[] = Array.isArray(paramArrayLike)
		? paramArrayLike
		: [];

	// Check if objectOrArray is either Object or Array
	if (typeof objectOrArray === "object" && objectOrArray) {
		Object.keys(objectOrArray).forEach((key) => {
			const searchKey = param || key;
			const searchValue = objectOrArray[key as keyof typeof objectOrArray];
			if (check(searchKey, included, excluded)) {
				encode(searchValue, null, null, searchKey, paramArray, true);
			}
		});
	} else if (innerCall) {
		if (["string", "boolean", "number"].includes(typeof objectOrArray)) {
			const value = objectOrArray as string | boolean | number;
			paramArray.push(
				`${encodeURIComponent(param as string)}=${encodeURIComponent(value)}`
			);
		}
	}

	return paramArray.join("&");
};

export const encodeParams = (
	params: { [K: string | number]: any },
	included?: string[] | null,
	excluded?: string[] | null
) => encode(params, included, excluded);

export const encodeUrl = (
	url: string,
	params: { [K: string | number]: any },
	included?: string[] | null,
	excluded?: string[] | null
) => {
	const query = encodeParams(params, included, excluded);

	if (query) {
		return `${url}?${query}`;
	}

	return url;
};

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
