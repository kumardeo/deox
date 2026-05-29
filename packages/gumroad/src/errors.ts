import type { error } from './utils';

/** Represents a SDK error */
export class SDKError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SDKError';
  }
}

/** Represents a error thrown while making an API request */
export class SDKRequestError extends SDKError {
  readonly path: string;

  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SDKRequestError';

    this.path = path;
  }
}

/** Represents a error thrown when server responds with `Bad Request` */
export class SDKBadRequestError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKBadRequestError';
  }
}

/** Represents a error thrown when server responds with `Forbidden` */
export class SDKForbiddenError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKForbiddenError';
  }
}

/** Represents a error thrown when server responds with `Unauthorized` */
export class SDKUnauthorizedError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKUnauthorizedError';
  }
}

/** Represents a error thrown when server responds with `Request Failed` */
export class SDKRequestFailedError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKRequestFailedError';
  }
}

/** Represents a error thrown when server responds with `Not Found` */
export class SDKNotFoundError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKNotFoundError';
  }
}

/** Represents a error thrown when server responds with `Internal Server Error` */
export class SDKInternalServerError extends SDKRequestError {
  constructor(message: string, path: string, options?: ErrorOptions) {
    super(message, path, options);
    this.name = 'SDKInternalServerError';
  }
}

/**
 * Represents a error thrown when client is requesting for some resources which does not exists.
 * For example requesting for a product with specific `product_id` but that doesn't exists.
 */
export class SDKInputNotFoundError<T extends Exclude<ReturnType<typeof error.isAnyNotFound>, false>> extends SDKError {
  readonly error: T['error'];

  readonly code: T['code'];

  constructor(result: T, options?: ErrorOptions) {
    super(result.error, options);
    this.name = 'SDKInputNotFoundError';

    this.error = result.error;
    this.code = result.code;
  }
}
