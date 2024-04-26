/* eslint-disable max-classes-per-file */

export class GumroadError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);

		this.name = "GumroadError";
	}
}

export class GumroadTypeError extends GumroadError {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);

		this.name = "GumroadTypeError";
	}
}

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
