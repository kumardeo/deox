import { isString } from '@deox/utils/predicate';
import type { NOT_FOUND_ERRORS } from './constants';

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
 * Represents a SDK type error
 */
export class SDKTypeError extends SDKError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SDKTypeError';
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

/**
 * Represents a error thrown when client is requesting for some resources which does not exists.
 * For example requesting for a post with specific `post_id` but that doesn't exists.
 */
export class SDKInputNotFoundError<
  T extends {
    error: string;
    code: (typeof NOT_FOUND_ERRORS)[keyof typeof NOT_FOUND_ERRORS]['code'];
  },
> extends SDKError {
  readonly error: T['error'];

  readonly code: T['code'];

  constructor(result: T, options?: ErrorOptions) {
    super(result.error, options);
    this.name = 'SDKInputNotFoundError';

    this.error = result.error;
    this.code = result.code;
  }
}
