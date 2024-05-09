/* eslint-disable max-classes-per-file */
import { type error } from "./utils";

/**
 * Represents a SDK error
 */
export class SDKError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "SDKError";
	}
}

/**
 * Represents a SDK type error
 */
export class SDKTypeError extends SDKError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "SDKTypeError";
	}
}

/**
 * Represents a error thrown while making an API request
 */
export class SDKRequestError extends SDKError {
	readonly response?: Response;

	readonly url: string;

	constructor(
		message: string,
		url: Response | URL | string,
		options?: ErrorOptions
	) {
		super(message, options);
		this.name = "SDKRequestError";

		if (url instanceof URL || typeof url === "string") {
			this.url = String(url);
		} else {
			this.url = url.url;
			this.response = url;
		}
	}
}

/**
 * Represents a error thrown when server responds with `Bad Request`
 */
export class SDKBadRequestError extends SDKRequestError {
	readonly response: Response;

	constructor(message: string, response: Response, options?: ErrorOptions) {
		super(message, response, options);
		this.name = "SDKBadRequestError";
		this.response = response;
	}
}

/**
 * Represents a error thrown when server responds with `Unauthorized`
 */
export class SDKUnauthorizedError extends SDKRequestError {
	readonly response: Response;

	constructor(message: string, response: Response, options?: ErrorOptions) {
		super(message, response, options);
		this.name = "SDKUnauthorizedError";
		this.response = response;
	}
}

/**
 * Represents a error thrown when server responds with `Request Failed`
 */
export class SDKRequestFailedError extends SDKRequestError {
	readonly response: Response;

	constructor(message: string, response: Response, options?: ErrorOptions) {
		super(message, response, options);
		this.name = "SDKRequestFailedError";
		this.response = response;
	}
}

/**
 * Represents a error thrown when server responds with `Not Found`
 */
export class SDKNotFoundError extends SDKRequestError {
	readonly response: Response;

	constructor(message: string, response: Response, options?: ErrorOptions) {
		super(message, response, options);
		this.name = "SDKNotFoundError";
		this.response = response;
	}
}

/**
 * Represents a error thrown when server responds with `Internal Server Error`
 */
export class SDKInternalServerError extends SDKRequestError {
	readonly response: Response;

	constructor(message: string, response: Response, options?: ErrorOptions) {
		super(message, response, options);
		this.name = "SDKInternalServerError";
		this.response = response;
	}
}

/**
 * Represents a error thrown when client is requesting for some resources which does not exists.
 * For example requesting for a product with specific `product_id` but that does't exists.
 */
export class SDKInputNotFoundError<
	T extends Exclude<ReturnType<typeof error.isAnyNotFound>, false>
> extends SDKError {
	readonly error: T["error"];

	readonly code: T["code"];

	constructor(result: T, options?: ErrorOptions) {
		super(result.error, options);
		this.name = "SDKInputNotFoundError";

		this.error = result.error;
		this.code = result.code;
	}
}
