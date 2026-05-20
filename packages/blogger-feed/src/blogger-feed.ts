import { BlogMethods } from './blog';
import { Client } from './client';
import { CommentsMethods } from './comments';
import { SDKError, SDKRequestError } from './errors';
import { parseFeed } from './feed-parser';
import { PagesMethods } from './pages';
import { PostsMethods } from './posts';

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
  static readonly SDKRequestError = SDKRequestError;
  static readonly parseFeed = parseFeed;

  readonly posts: PostsMethods;
  readonly pages: PagesMethods;
  readonly comments: CommentsMethods;
  readonly blog: BlogMethods;

  /**
   * Creates an instance of {@link BloggerFeed}
   *
   * @param urlOrId The url or id of the blog
   * @param options Options
   */
  constructor(urlOrId: string | URL, options: BloggerFeedOptions = {}) {
    const client = new Client(urlOrId, options);
    this.posts = new PostsMethods(client);
    this.pages = new PagesMethods(client);
    this.comments = new CommentsMethods(client);
    this.blog = new BlogMethods(client);
  }
}
