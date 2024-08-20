import { DEFAULT_API_BASE_URL } from './constants';
import { type RequestOptions, request } from './request';

/**
 * An interface representing options for {@link Client} constructor
 */
export interface ClientOptions {
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
  protected accessToken: string;
  protected debug: boolean;
  protected baseUrl: string;

  constructor(accessToken: string, options: ClientOptions = {}) {
    this.accessToken = accessToken;
    this.debug = options.debug === true;
    this.baseUrl = options.baseUrl instanceof URL || typeof options.baseUrl === 'string' ? String(options.baseUrl) : DEFAULT_API_BASE_URL;
  }

  /**
   * Method for making HTTP requests to Gumroad API
   *
   * @param path The path of the endpoint
   * @param options Options
   *
   * @returns On success, the response data
   */
  async request<T extends NonNullable<unknown> = NonNullable<unknown>>(path: string, options: RequestOptions = {}) {
    return (
      await request<T>(path, this.accessToken, {
        ...options,
        baseUrl: this.baseUrl,
        debug: this.debug,
      })
    ).data;
  }
}
