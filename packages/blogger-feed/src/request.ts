import { JSONP_NAMESPACE } from './constants';
import { SDKError, SDKRequestError } from './errors';
import { parseFeed } from './feed-parser';
import type { Feed } from './types';
import { generateId } from './utils';

/**
 * Fetches JSON using Fetch API
 *
 * @param url The url to fetch
 *
 * @returns The json data
 */
async function fetchJSON<T = unknown>(url: string | URL, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  const response = await fetch(url, {
    signal,
  }).catch((error) => {
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
    throw new SDKRequestError(`Request was success but Content-Type '${contentType}' is not supported`, response.url);
  }

  return (await response.json()) as T;
}

/** A callback function for constructing jsonp url with given callback param */
type JSONPGetUrl = (data: { callback: string; id: string }) => string | URL;

/** Pending jsonp requests */
const jsonpQueue: Record<string, (data: unknown) => void> = {};

/**
 * Fetches JSONP data through callback using script element
 *
 * @param getUrl A callback function for constructing jsonp url with given callback param
 * @param scriptOptions Assign object to script element
 *
 * @returns The data which was sent to the callback
 */
async function fetchJSONP<T = unknown>(getUrl: JSONPGetUrl, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  return new Promise<T>((res, rej) => {
    let settled = false;
    const resolve = (value: T) => {
      if (!settled) {
        settled = true;
        res(value);
      }
    };
    const reject = (error: unknown) => {
      if (!settled) {
        settled = true;
        rej(error);
      }
    };

    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }

    const id = `callback_${generateId()}`;
    const callback = `window.${JSONP_NAMESPACE}.${id}`;
    const url = getUrl({ callback, id });

    const script = document.createElement('script');
    script.async = true;
    script.src = String(url);

    const cleanup = () => {
      delete jsonpQueue[id];
      signal?.removeEventListener('abort', onAbort);
      script.onerror = null;
      script.onload = null;
      script.remove();
    };

    const onAbort = () => {
      // use noop function for late JSONP calls
      jsonpQueue[id] = () => {};
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    jsonpQueue[id] = (data) => {
      resolve(data as T);
    };
    script.onload = () => {
      cleanup();

      if (!settled) {
        reject(new SDKError(`JSONP callback \`${callback}\` was not invoked for '${script.src}'`));
      }
    };
    script.onerror = (event) => {
      cleanup();
      reject(new SDKError(typeof event === 'string' ? event : `Failed to load script from '${script.src}'`));
    };

    (window as unknown as Record<string, unknown>)[JSONP_NAMESPACE] ??= jsonpQueue;
    document.head.appendChild(script);
  });
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
  sort?: string;
  query?: string;
}

/** List of supported query params options and map to valid params */
const validParamsMap: Record<keyof Params, string> = {
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

/**
 * An interface representing options for {@link fetchFeed}
 */
export interface FetchFeedOptions {
  params?: Params;
  include?: (keyof Params)[];
  exclude?: (keyof Params)[];
  base?: string | URL;
  jsonp?: boolean;
  signal?: AbortSignal;
}

/**
 * Fetches and parses the blogger feed
 *
 * @param path The feed url
 * @param param1 Options
 *
 * @returns The parsed feed data
 */
export async function fetchFeed(path: string | URL, { params, include, exclude, base, jsonp, signal }: FetchFeedOptions = {}): Promise<Feed> {
  const queries: Record<string, string> = {};

  if (params) {
    for (const key in params) {
      if (!(key in validParamsMap)) {
        continue;
      }
      const value = params[key as keyof typeof params];

      const allowed = (!include || (include as string[]).includes(key)) && (!exclude || !(exclude as string[]).includes(key));

      if (allowed) {
        const mapped = validParamsMap[key as keyof Params];
        queries[mapped] = value instanceof Date ? value.toISOString() : String(value);
      }
    }
  }

  // Set alt to json in order to load the json data instead of xml
  queries.alt = 'json';

  // Set redirect to false
  queries.redirect = 'false';

  const endpoint = new URL(path, base);

  for (const name in queries) {
    endpoint.searchParams.append(name, queries[name]);
  }

  if (jsonp) {
    const data = await fetchJSONP(
      ({ callback }) => {
        const url = new URL(endpoint);
        url.searchParams.append('callback', callback);
        return url;
      },
      { signal },
    );
    return parseFeed(data);
  }

  const data = await fetchJSON(endpoint, { signal });
  return parseFeed(data);
}
