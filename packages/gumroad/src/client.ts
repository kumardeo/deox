import { DEFAULT_API_BASE_URL } from './constants';
import { type RequestOptions, request } from './request';

/** An interface representing options for {@link Client} constructor */
export interface ClientOptions {
	/**
	 * Indicates whether to enable debug mode or not
	 *
	 * @default false
	 */
	debug?: boolean;

	base?: string | URL;
}

/** A class containing methods for making HTTPS requests to Gumroad API endpoints */
export class Client {
	protected accessToken: string;
	protected debug: boolean;
	protected base: string;

	constructor(accessToken: string, options: ClientOptions = {}) {
		this.accessToken = accessToken;
		this.debug = options.debug === true;
		this.base =
			options.base instanceof URL || typeof options.base === 'string'
				? String(options.base)
				: DEFAULT_API_BASE_URL;
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
		options: RequestOptions = {},
	) {
		return await request<T>(path, {
			...options,
			accessToken: this.accessToken,
			base: this.base,
			debug: this.debug,
		});
	}
}
