import clc from '@deox/clc';
import { isObject } from '@deox/utils/predicate';
import {
  SDKBadRequestError,
  SDKInputNotFoundError,
  SDKInternalServerError,
  SDKNotFoundError,
  SDKRequestError,
  SDKRequestFailedError,
  SDKUnauthorizedError,
} from './errors';
import { error } from './utils';

/**
 * An interface representing options for {@link RequestURL}
 */
export interface RequestURLOptions {
  /**
   * Indicates whether to clear existing search queries
   */
  clearParams?: boolean;

  /**
   * A record of key value which should to added to search queries
   */
  params?: Record<string, string | number | boolean | undefined | (string | number | boolean | undefined)[]>;
}

/**
 * Constructs an `URL` object for endpoints
 */
export class RequestURL extends URL {
  constructor(url: string | URL, base?: string | URL | undefined, options: RequestURLOptions = {}) {
    super(url, base);
    const { searchParams } = this;
    if (options.clearParams) {
      searchParams.forEach((_value, key, params) => {
        params.delete(key);
      });
    }
    const append = (key: string, value: string | number | boolean | undefined) => {
      if (['string', 'boolean', 'number'].includes(typeof value)) {
        searchParams.append(key, String(value));
      }
    };
    if (typeof options.params === 'object' && options.params) {
      const queries = options.params;
      for (const key in queries) {
        const value = queries[key];
        if (Array.isArray(value)) {
          for (const e in value) {
            append(key, e);
          }
        } else {
          append(key, value);
        }
      }
    }
  }
}

/**
 * An interface representing options for {@link request} function
 */
export interface RequestOptions {
  /**
   * The search queries
   */
  params?: RequestURLOptions['params'];

  /**
   * The method for request
   */
  method?: string;

  /**
   * The body which should be send
   */
  body?: unknown;

  /**
   * Indicates whether to enable debug mode
   */
  debug?: boolean;

  /**
   * The base url for Gumroad API
   */
  baseUrl?: string | RequestURL;

  /**
   * An AbortSignal to set request's signal.
   */
  signal?: AbortSignal;
}

const getResponseError = (response: Response, message?: string, defaultMessage?: string) => {
  switch (response.status) {
    case 400:
      return new SDKBadRequestError(message || `Server responded with '${response.statusText}' status text`, response);
    case 401:
      return new SDKUnauthorizedError(
        message || `Server responded with '${response.statusText}' status text, please make sure you have passed a valid Access Token!`,
        response,
      );
    case 402:
      return new SDKRequestFailedError(
        message || `Server responded with '${response.statusText}' status text, looks like the parameters were valid but request failed.`,
        response,
      );
    case 404:
      return new SDKNotFoundError(message || `Server responded with '${response.statusText}' status text`, response);
    case 500:
    case 502:
    case 503:
    case 504:
      return new SDKInternalServerError(
        message || `Server responded with '${response.statusText}' status text, looks like something else went wrong on endpoint.`,
        response,
      );
    default:
      return new SDKRequestError(defaultMessage || message || 'Response error', response);
  }
};

/**
 * Requests to Gumroad API
 *
 * @param path The relative path for endpoint
 * @param accessToken The access token | can be `null` in case it is not requested by endpoint
 * @param param2 Options
 *
 * @returns An object containing `data` and `response`
 */
export const request = async <T extends NonNullable<unknown> = NonNullable<unknown>>(
  path: string | RequestURL,
  accessToken?: string | null,
  { method = 'GET', params = {}, body, debug = false, baseUrl = 'https://api.gumroad.com/v2/', signal }: RequestOptions = {},
): Promise<{ data: T & { success: true }; response: Response }> => {
  try {
    const endpoint = new RequestURL(path, baseUrl, {
      params: {
        ...params,
        ...(accessToken ? { access_token: accessToken } : undefined),
      },
    });

    const shouldSendBody = method.toUpperCase() === 'POST' && typeof body !== 'undefined';
    const config: RequestInit = {
      method,
      body: shouldSendBody ? JSON.stringify(body) : undefined,
      headers: {
        Accept: 'application/json',
        ...(shouldSendBody ? { 'Content-Type': 'application/json' } : undefined),
      },
      signal,
    };

    const started = debug ? Date.now() : null;

    const response = await fetch(endpoint, config).catch((e) => {
      throw new SDKRequestError('Fetch to Gumroad API failed', String(endpoint), {
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
        `${clc.green('[@deox/gumroad:info]')} ${clc.bold(method)} ${endpoint.pathname} ${coloredStatus} ${clc.dim(`(${Date.now() - started}ms)`)}`,
      );
    }

    if (response.headers.get('Content-Type')?.includes('application/json')) {
      const data: unknown = await response.json();
      if (isObject(data)) {
        if ('success' in data) {
          if (data.success === true && response.status === 200) {
            return { data: data as T & { success: true }, response };
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

    throw getResponseError(response, undefined, `Response content type is not 'application/json'`);
  } catch (e) {
    const notFoundError = error.isAnyNotFound(e);

    if (notFoundError) {
      throw new SDKInputNotFoundError(notFoundError, {
        cause: e,
      });
    }

    throw e;
  }
};
