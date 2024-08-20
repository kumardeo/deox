import { Blog } from './blog';
import { Client } from './client';
import { Comments } from './comments';
import { SDKError, SDKInputNotFoundError, SDKRequestError, SDKTypeError } from './errors';
import { parseFeed } from './feed-parser';
import { Pages } from './pages';
import { Posts } from './posts';

/**
 * An interface representing options for {@link BloggerFeed}
 */
export interface BloggerFeedOptions {
  /**
   * When set to `true`, enables jsonp callbacks, useful when running in browser environments to prevent cors issues.
   *
   * **Warning**: Set it to `true` if and only if you are running it in browser
   * because it loads javascript by appending script element to document.
   *
   * @default false
   */
  jsonp?: boolean;
}

export class BloggerFeed {
  static readonly SDKError = SDKError;
  static readonly SDKInputNotFoundError = SDKInputNotFoundError;
  static readonly SDKRequestError = SDKRequestError;
  static readonly SDKTypeError = SDKTypeError;
  static readonly parseFeed = parseFeed;

  readonly posts: Posts;
  readonly pages: Pages;
  readonly comments: Comments;
  readonly blog: Blog;

  /**
   * Creates an instance of {@link BloggerFeed}
   *
   * @param urlOrId The url or id of the blog
   * @param options Options
   */
  constructor(urlOrId: string | URL, options: BloggerFeedOptions = {}) {
    const client = new Client(urlOrId, options);
    this.posts = new Posts(client);
    this.pages = new Pages(client);
    this.comments = new Comments(client);
    this.blog = new Blog(client);
  }
}
