import { generateId } from '@deox/utils/generate-id';
import { isObject } from '@deox/utils/predicate';
import { JSONP_NAMESPACE } from './constants';
import { SDKError, SDKRequestError } from './errors';
import { parseFeed } from './feed-parser';

/** An interface representing options for {@link RequestURL} */
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

/** Constructs an `URL` object for endpoints */
export class RequestURL extends URL {
  constructor(url: string | URL, base?: string | URL | undefined, options: RequestURLOptions = {}) {
    super(url, base);
    const { searchParams } = this;
    if (options.clearParams) {
      searchParams.forEach((_value, key, params) => params.delete(key));
    }
    const append = (key: string, value: string | number | boolean | undefined) => {
      if (['string', 'boolean', 'number'].includes(typeof value)) {
        searchParams.append(key, String(value));
      }
    };
    if (isObject(options.params)) {
      const queries = options.params;
      for (const key in queries) {
        const value = queries[key];
        if (Array.isArray(value)) {
          for (const e of value) {
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
 * An interface of parameters which can be used for blogger feed api
 */
export interface Params {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'lastmodified' | 'starttime' | 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  query?: string;
}

/**
 * An interface representing options for {@link fetchFeed}
 */
export interface FetchFeedOptions {
  params?: Params;
  include?: (keyof Params)[];
  exclude?: (keyof Params)[];
  baseUrl?: string | URL;
  jsonp?: boolean;
}

/** A callback function for constructing jsonp url with given callback param */
type JSONPGetUrl = (data: { callback: string; id: string }) => string | URL;

/** Pending jsonp requests */
const queueJSONP: Record<string, (data: unknown) => void> = {};

/**
 * Fetches JSONP data through callback using script element
 *
 * @param getUrl A callback function for constructing jsonp url with given callback param
 * @param scriptOptions Assign object to script element
 *
 * @returns The data which was sent to the callback
 */
const fetchJSONP = async <T = unknown>(getUrl: JSONPGetUrl, scriptOptions?: Record<string, unknown>) => {
  (window as unknown as Record<string, unknown>)[JSONP_NAMESPACE] ??= queueJSONP;

  const id = `callback_${generateId('xxxxxxxx_xxxx_4xxx_yxxx_xxxxxxxxxxxx')}`;
  const callback = `window.${JSONP_NAMESPACE}.${id}`;
  const url = getUrl({ callback, id });

  const script = document.createElement('script');
  script.async = true;
  if (scriptOptions) Object.assign(script, scriptOptions);
  script.src = String(url);

  return new Promise<T>((resolve, reject) => {
    queueJSONP[id] = (data) => {
      delete queueJSONP[id];
      resolve(data as T);
    };
    script.onerror = (event) => {
      delete queueJSONP[id];
      reject(new SDKError(typeof event === 'string' ? event : `Failed to load script from ${script.src}`));
    };
    document.head.appendChild(script);
  });
};

/**
 * Fetches JSON using Fetch API
 *
 * @param url The url to fetch
 *
 * @returns The json data
 */
const fetchJSON = async <T = unknown>(url: string | URL) => {
  const response = await fetch(url).catch((error) => {
    throw new SDKRequestError('Fetch to JSON', String(url), {
      cause: error,
    });
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new SDKRequestError(`Failed to fetch ${response.url} (status: ${response.status})`, response.url);
  }

  const contentType = response.headers.get('Content-Type')?.includes('application/json');
  if (!contentType) {
    await response.body?.cancel();
    throw new SDKRequestError(`Response was success but Content-Type '${contentType}' is not supported`, response.url);
  }

  return (await response.json()) as T;
};

/**
 * Fetches and parses the blogger feed
 *
 * @param path The feed url
 * @param param1 Options
 *
 * @returns The parsed feed data
 */
export const fetchFeed = async (path: string | URL, { params, include, exclude, baseUrl, jsonp }: FetchFeedOptions = {}) => {
  const queries: RequestURLOptions['params'] = {};

  // List of supported search params options and map to valid params
  const paramsMap: Record<string, string> = {
    maxResults: 'max-results',
    startIndex: 'start-index',
    orderBy: 'orderby',
    publishedMin: 'published-min',
    publishedMax: 'published-max',
    updatedMin: 'updated-min',
    updatedMax: 'updated-max',
    sort: 'sort',
    query: 'q',
  };

  if (params) {
    for (const key in params) {
      const value = params[key as keyof typeof params];
      if (key in paramsMap) {
        let shouldAllow = true;
        if (include) {
          shouldAllow = (include as string[]).includes(key);
        }
        if (exclude) {
          shouldAllow = !(exclude as string[]).includes(key);
        }
        if (shouldAllow) {
          queries[paramsMap[key]] = value instanceof Date ? value.toISOString() : String(value);
        }
      }
    }
  }

  // Set alt to json in order to load the json data instead of xml
  queries.alt = 'json';

  // Set redirect to false
  queries.redirect = false;

  const endpoint = new RequestURL(path, baseUrl, { params: queries });

  const json = await (jsonp ? fetchJSONP(({ callback }) => new RequestURL(endpoint, undefined, { params: { callback } })) : fetchJSON(endpoint));

  // Parse the feed object to feed info
  return parseFeed(json);
};
