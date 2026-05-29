import clc from '@deox/clc';
import { type Serializable, serialize } from '@deox/utils/params';
import { DEFAULT_API_BASE_URL } from './constants';
import {
  SDKBadRequestError,
  SDKForbiddenError,
  SDKInputNotFoundError,
  SDKInternalServerError,
  SDKNotFoundError,
  SDKRequestError,
  SDKRequestFailedError,
  SDKUnauthorizedError,
} from './errors';
import { error } from './utils';

/** An interface representing options for {@link request} function */
export interface RequestOptions {
  /** The access token */
  accessToken?: string;

  /** The search queries */
  params?: Record<string, Serializable>;

  /** The method for request */
  method?: string;

  /** The request headers */
  headers?: HeadersInit;

  /** The body which should be send */
  body?: unknown;

  /** Indicates whether to enable debug mode */
  debug?: boolean;

  /** The base url for Gumroad API */
  base?: string | URL;

  /** An AbortSignal to set request's signal. */
  signal?: AbortSignal;

  download?: boolean;
}

/**
 * Requests to Gumroad API
 *
 * @param path The relative path for endpoint
 * @param param2 Options
 *
 * @returns Parsed response data from the Gumroad API.
 */
export async function request<T extends NonNullable<object> = NonNullable<object>>(
  path: string | URL,
  {
    accessToken,
    method = 'GET',
    params = {},
    headers: optHeaders = {},
    body,
    debug = false,
    base = DEFAULT_API_BASE_URL,
    signal,
    download = false,
  }: RequestOptions = {},
): Promise<T & { success: true }> {
  try {
    const url = new URL(path, base);

    serialize(params, url.searchParams);

    if (accessToken) {
      url.searchParams.set('access_token', accessToken);
    }

    const headers = new Headers(optHeaders);
    const init: RequestInit = {
      method,
      signal,
      headers,
    };

    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (method.toUpperCase() === 'POST' && typeof body !== 'undefined') {
      if (body instanceof URLSearchParams || body instanceof FormData) {
        init.body = body;
      } else {
        init.body = JSON.stringify(body);
        headers.set('Content-Type', 'application/json');
      }
    }

    const started = debug ? Date.now() : null;

    const response = await fetch(url, init).catch((e) => {
      throw new SDKRequestError('Fetch to Gumroad API failed', url.pathname, {
        cause: e,
      });
    });

    if (started !== null) {
      let coloredStatus = `${clc.bold(response.status)} ${response.statusText}`;
      if (response.status >= 200 && response.status <= 299) {
        coloredStatus = clc.green(coloredStatus);
      } else if (response.status >= 300 && response.status <= 399) {
        coloredStatus = clc.yellow(coloredStatus);
      } else if (response.status >= 400) {
        coloredStatus = clc.red(coloredStatus);
      }
      console.log(
        `${clc.green('[@deox/gumroad:info]')} ${clc.bold(method)} ${url.pathname} ${coloredStatus} ${clc.dim(`(${Date.now() - started}ms)`)}`,
      );
    }

    const contentType = response.headers.get('Content-Type');

    if (download && response.status === 200) {
      const bytes = new Uint8Array(await response.arrayBuffer());
      return { success: true, bytes, type: contentType } as unknown as T & { success: true };
    }

    if (contentType?.includes('application/json')) {
      const data: unknown = await response.json();
      if (typeof data === 'object' && data !== null) {
        if ('success' in data) {
          if (data.success === true && response.status === 200) {
            return data as T & { success: true };
          }

          if (data.success === false && 'message' in data && typeof data.message === 'string') {
            throw getResponseError(response, data.message);
          }
        }

        if ('error' in data && typeof data.error === 'string') {
          throw getResponseError(response, data.error);
        }
      }

      throw getResponseError(response, `Invalid Server Response body: ${JSON.stringify(data)}`);
    }

    throw getResponseError(
      response,
      undefined,
      contentType !== null ? `Response Content-Type ('${contentType}') is not supported` : 'Response has no Content-Type header',
    );
  } catch (e) {
    const notFoundError = error.isAnyNotFound(e);

    if (notFoundError) {
      throw new SDKInputNotFoundError(notFoundError, {
        cause: e,
      });
    }

    throw e;
  }
}

function getResponseError(response: Response, message?: string, defaultMessage?: string): Error {
  const pathname = new URL(response.url).pathname;
  switch (response.status) {
    case 400:
      return new SDKBadRequestError(message || `Server responded with '${response.statusText}' status text`, pathname);
    case 401:
      return new SDKUnauthorizedError(
        message || `Server responded with '${response.statusText}' status text, please make sure you have passed a valid Access Token!`,
        pathname,
      );
    case 402:
      return new SDKRequestFailedError(
        message || `Server responded with '${response.statusText}' status text, looks like the parameters were valid but request failed.`,
        pathname,
      );
    case 403:
      return new SDKForbiddenError(message || `Server responded with '${response.statusText}' status text`, pathname);
    case 404:
      return new SDKNotFoundError(message || `Server responded with '${response.statusText}' status text`, pathname);
    case 500:
    case 502:
    case 503:
    case 504:
      return new SDKInternalServerError(
        message || `Server responded with '${response.statusText}' status text, looks like something else went wrong on endpoint.`,
        pathname,
      );
    default:
      return new SDKRequestError(defaultMessage || message || 'Response error', pathname);
  }
}
