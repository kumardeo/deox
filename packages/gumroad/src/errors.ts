/* eslint-disable max-classes-per-file */

/**
 * Represents error for Gumroad
 */
export class GumroadError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);

		this.name = "GumroadError";
	}
}

/**
 * Represents type error for Gumroad
 */
export class GumroadTypeError extends GumroadError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);

		this.name = "GumroadTypeError";
	}
}

/**
 * Represents error thrown while making an API request
 */
export class GumroadRequestError extends GumroadError {
	response: Response | undefined;

	constructor(
		message: string,
		options?: ErrorOptions & { response?: Response }
	) {
		super(message);

		this.name = "GumroadRequestError";
		if (options?.response instanceof Response) {
			this.response = options.response;
		}
	}
}
