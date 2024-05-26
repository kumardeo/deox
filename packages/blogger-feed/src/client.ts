import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { type FetchFeedOptions, fetchFeed } from './request';
import { getOrigin } from './utils';

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
  protected options: {
    jsonp: boolean;
    input: { type: 'url' | 'id'; value: string };
  };

  /**
   * Creates an instance of {@link Client}
   *
   * @param urlOrId The url or id of the blog
   * @param options Options
   */
  constructor(urlOrId: string | URL, options: ClientOptions = {}) {
    let input: { type: 'url' | 'id'; value: string };

    if (typeof urlOrId === 'string' && /^\d+$/.test(urlOrId) && urlOrId.length >= 12 && urlOrId.length <= 24) {
      input = { type: 'id', value: urlOrId };
    } else {
      const origin = urlOrId instanceof URL ? urlOrId.origin : getOrigin(urlOrId);
      if (origin) {
        input = { type: 'url', value: `${origin}/` };
      } else {
        throw new Error("Argument 'urlOrId' is not a valid blogger blog url or blog id");
      }
    }

    this.options = {
      input,
      jsonp: options?.jsonp === true,
    };

    // Throw an error if jsonp is enabled but current environment is not browser
    if (this.options.jsonp && (typeof window !== 'object' || typeof document !== 'object' || typeof document.createElement !== 'function')) {
      throw new Error("options.jsonp is set to true but current environment does't support it, please set it to false to use json");
    }
  }

  get baseUrl() {
    const { input } = this.options;
    return input.type === 'id' ? `https://www.blogger.com/feeds/${input.value}/` : `${input.value}feeds/`;
  }

  private _info?: {
    blog_id: string;
    blog_url: string;
    blogger_base_url: string;
    domain_base_url: string;
  };

  get info() {
    return (async () => {
      const { blog } = await this.request('./posts/summary', {
        params: { maxResults: 0 },
      });
      if (!blog) {
        throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.blog);
      }
      const blog_url = blog.link.endsWith('/') ? blog.link : `${blog.link}/`;
      this._info ??= {
        blog_id: blog.id,
        blog_url,
        blogger_base_url: `https://www.blogger.com/feeds/${blog.id}/`,
        domain_base_url: `${blog_url}feeds/`,
      };
      this._blogId = this._info.blog_id;
      this._blogUrl = this._info.blog_url;
      return this._info;
    })();
  }

  private _blogId?: string;

  get blogId() {
    return (async () => {
      const { input } = this.options;
      this._blogId ??= input.type === 'id' ? input.value : (await this.info).blog_id;
      return this._blogId;
    })();
  }

  private _blogUrl?: string;

  get blogUrl() {
    return (async () => {
      const { input } = this.options;
      this._blogUrl ??= input.type === 'url' ? input.value : (await this.info).blog_url;
      return this._blogUrl;
    })();
  }

  get domainBaseUrl() {
    return (async () => `${await this.blogUrl}feeds/`)();
  }

  get bloggerBaseUrl() {
    return (async () => `https://www.blogger.com/feeds/${await this.blogId}/`)();
  }

  async request(path: string, options?: FetchFeedOptions) {
    return fetchFeed(path, {
      baseUrl: this.baseUrl,
      jsonp: this.options.jsonp,
      ...options,
    });
  }
}
