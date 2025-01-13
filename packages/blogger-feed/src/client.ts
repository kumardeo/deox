import { isString } from '@deox/utils/predicate';
import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { type FetchFeedOptions, fetchFeed } from './request';
import { getOrigin } from './utils';

const addSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

const getServiceBase = (id: string) => `https://www.blogger.com/feeds/${id}/`;

const getDomainBase = (origin: string) => `${addSlash(origin)}feeds/`;

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
  private jsonp: boolean;
  private base: string;

  private _bU: string | undefined;
  private _bI: string | undefined;

  /**
   * Creates an instance of {@link Client}
   *
   * @param urlOrId The url or id of the blog
   * @param options Options
   */
  constructor(urlOrId: string | URL, options: ClientOptions = {}) {
    if (isString(urlOrId) && /^\d{12,24}$/.test(urlOrId)) {
      this._bI = urlOrId;
      this.base = getServiceBase(urlOrId);
    } else {
      const origin = urlOrId instanceof URL ? urlOrId.origin : getOrigin(urlOrId);
      if (origin && /^https?:\/\//.test(origin)) {
        this._bU = addSlash(origin);
        this.base = getDomainBase(origin);
      } else {
        throw new Error("Argument 'urlOrId' is not a valid blogger blog url or blog id");
      }
    }
    this.jsonp = options.jsonp === true;

    // Throw an error if jsonp is enabled but current environment is not browser
    if (this.jsonp && (typeof window !== 'object' || typeof document !== 'object')) {
      throw new Error("options.jsonp is set to true but current environment does't support it, please set it to false to use json");
    }
  }

  private _?: {
    id: string;
    url: string;
    serviceBase: string;
    domainBase: string;
  };

  get blog() {
    return (async () => {
      const { blog } = await this.req('./posts/summary', { params: { maxResults: 0 } });

      if (!blog) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.blog);

      this._ ??= {
        id: blog.id,
        url: blog.url,
        serviceBase: getServiceBase(blog.id),
        domainBase: getDomainBase(blog.url),
      };

      return this._;
    })();
  }

  get id() {
    return (async () => {
      this._bI ??= (await this.blog).id;
      return this._bI;
    })();
  }

  get url() {
    return (async () => {
      this._bU ??= (await this.blog).url;
      return this._bU;
    })();
  }

  get domainBase() {
    return (async () => getDomainBase(await this.url))();
  }

  get serviceBase() {
    return (async () => getServiceBase(await this.id))();
  }

  async req(path: string, options?: FetchFeedOptions) {
    return fetchFeed(path, { baseUrl: this.base, jsonp: this.jsonp, ...options });
  }
}
