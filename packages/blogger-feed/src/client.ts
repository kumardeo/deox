import { SDKError } from './errors';
import { type FetchFeedOptions, fetchFeed } from './request';
import type { Blog, Feed } from './types';
import { isString } from './utils';

/**
 * An interface representing options for {@link Client} constructor
 */
export interface ClientOptions {
  /** When set to `true`, enables jsonp callbacks */
  jsonp?: boolean;
}

/**
 * A class for fetching Blogger feed
 */
export class Client {
  private _jsonp: boolean;
  private _base: string;

  private _blogUrl: string | undefined;
  private _blogId: string | undefined;

  private _blog?: Blog;

  /**
   * Creates an instance of {@link Client}
   *
   * @param urlOrId The url or id of the blog
   * @param options Options
   */
  constructor(urlOrId: string | URL, options: ClientOptions = {}) {
    if (isString(urlOrId) && /^\d{12,24}$/.test(urlOrId)) {
      this._blogId = urlOrId;
      this._base = getServiceBase(urlOrId);
    } else {
      let url: URL | null = null;
      if (urlOrId instanceof URL) {
        url = urlOrId;
      } else if (typeof urlOrId === 'string') {
        try {
          url = new URL(!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(urlOrId) ? `https://${urlOrId}` : urlOrId);
        } catch (_) {}
      }
      if (!url) {
        throw new Error("Argument 'urlOrId' is not a valid blogger blog url or blog id");
      }
      if (!/^https?:$/i.test(url.protocol)) {
        throw new Error(`Argument 'urlOrId' has unsupported protocol '${url.protocol}'`);
      }

      this._blogUrl = trailingSlash(url.origin);
      this._base = getDomainBase(url.origin);
    }
    this._jsonp = options.jsonp === true;

    // Throw an error if jsonp is enabled but current environment is not browser
    if (this._jsonp && (typeof window !== 'object' || typeof document !== 'object')) {
      throw new Error("options.jsonp is set to true but current environment does't support it, please set it to false to use json");
    }
  }

  async getBlog(): Promise<{ id: string; url: string }> {
    if (!this._blog) {
      const { blog } = await this.req('./posts/summary', {
        params: {
          // do not load entries since we only need blog info
          maxResults: 0,
        },
      });

      if (!blog) {
        throw new SDKError('The blog was not found.');
      }

      this._blog = blog;
    }

    return this._blog;
  }

  async getBlogId(): Promise<string> {
    this._blogId ??= (await this.getBlog()).id;
    return this._blogId;
  }

  async getBlogUrl(): Promise<string> {
    this._blogUrl ??= trailingSlash((await this.getBlog()).url);
    return this._blogUrl;
  }

  async getDomainBase(): Promise<string> {
    return getDomainBase(await this.getBlogUrl());
  }

  async getServiceBase(): Promise<string> {
    return getServiceBase(await this.getBlogId());
  }

  async req(path: string, options?: FetchFeedOptions): Promise<Feed> {
    return fetchFeed(path, { base: this._base, jsonp: this._jsonp, ...options });
  }
}

function trailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`;
}

function getServiceBase(id: string): string {
  return `https://www.blogger.com/feeds/${id}/`;
}

function getDomainBase(origin: string): string {
  return `${trailingSlash(origin)}feeds/`;
}
