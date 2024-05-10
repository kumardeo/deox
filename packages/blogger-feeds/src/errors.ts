/* eslint-disable max-classes-per-file */

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
 * Represents a error thrown when client is requesting for some resources which does not exists.
 * For example requesting for a post with specific `post_id` but that doesn't exists.
 */
export class SDKInputNotFoundError<
	T extends {
		error: string;
		code:
			| "post_not_found"
			| "posts_not_found"
			| "page_not_found"
			| "pages_not_found"
			| "comment_not_found"
			| "comments_not_found"
			| "blog_not_found";
	}
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
