import { DEFAULT_API_BASE_URL } from "./constants";
import { type RequestOptions, request } from "./request";

/**
 * An interface representing options for {@link Client} constructor
 */
export interface ClientOptions {
	accessToken?: string;

	/**
	 * Indicates whether to enable debug mode or not
	 *
	 * @default false
	 */
	debug?: boolean;

	baseUrl?: string | URL;
}

/**
 * A class containing methods for making HTTPS requests to Gumroad API endpoints
 */
export class Client {
	accessToken?: string;

	options = {
		debug: false,
		baseUrl: DEFAULT_API_BASE_URL
	};

	constructor(options: ClientOptions = {}) {
		this.accessToken = options.accessToken;

		this.options.debug =
			typeof options.debug === "boolean" ? options.debug : false;

		if (options.baseUrl instanceof URL || typeof options.baseUrl === "string") {
			this.options.baseUrl = String(options.baseUrl);
		}
	}

	/**
	 * Method for making HTTP requests to Gumroad API
	 *
	 * @param path The path of the endpoint
	 * @param options Options
	 *
	 * @returns On success, the response data
	 */
	async request<T extends NonNullable<unknown> = NonNullable<unknown>>(
		path: string,
		options: RequestOptions = {}
	) {
		return (
			await request<T>(path, this.accessToken, {
				...options,
				baseUrl: this.options.baseUrl,
				debug: this.options.debug
			})
		).data;
	}
}
