import { isUndefined } from '@deox/utils/predicate';
import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { Methods } from './methods';
import { validators } from './utils';

/** Options for {@link Posts.list} */
export type PostsListOptions = {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  label?: string;
  summary?: boolean;
};

/** Options for {@link Posts.get} */
export type PostsGetOptions = { summary?: boolean };

/** Options for {@link Posts.query} */
export type PostsQueryOptions = Omit<PostsListOptions, 'label'>;

export class Posts extends Methods {
  /**
   * Retrieves all the posts of the blog
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async list(options: PostsListOptions = {}) {
    const { label } = options;

    // validate label if provided
    if (!isUndefined(label)) validators.nB(label, 'options.label');

    const { posts, pagination } = await this.c.req(
      `./posts/${options.summary === true ? 'summary' : 'default'}${label ? `/-/${encodeURI(label)}` : ''}`,
      {
        params: options,
        exclude: ['query'],
      },
    );

    // Use an empty array if entries were not found
    return this._p('posts', posts || [], pagination);
  }

  /**
   * Retrieves a post
   *
   * @param post_id The id of the post
   * @param options Options
   *
   * @returns On success, a Post
   */
  async get(post_id: string, options: PostsGetOptions = {}) {
    validators.nB(post_id, "Argument 'post_id'");

    const { posts } = await this.c.req(`./posts/${options.summary === true ? 'summary' : 'default'}/${encodeURIComponent(post_id)}`, {
      exclude: ['query'],
    });

    const post = posts?.find((p) => p.id === post_id);

    // Throw an error if the post was not found
    if (!post) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.post);

    return post;
  }

  /**
   * Retrieves all the posts with query
   *
   * @param query The query
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async query(query: string, options: PostsQueryOptions = {}) {
    validators.nB(query, "Argument 'query'");

    const { posts, pagination } = await this.c.req(`./posts/${options.summary === true ? 'summary' : 'default'}`, {
      params: {
        ...options,
        query,
      },
    });

    // Use an empty array if entries were not found
    return this._p('posts', posts || [], pagination);
  }
}
