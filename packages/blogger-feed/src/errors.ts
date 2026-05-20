/**
 * Represents a SDK error
 */
export class SDKError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SDKError';
  }
}

/**
 * Represents a error thrown while making an API request
 */
export class SDKRequestError extends SDKError {
  readonly url: string;

  constructor(message: string, url: string | URL, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SDKRequestError';
    this.url = String(url);
  }
}
