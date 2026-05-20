import { Methods, type WithPagination } from './methods';
import type { Post } from './types';
import { assertNonBlankString, isUndefined } from './utils';

/** Options for {@link Posts.list} */
export interface PostsListOptions {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  label?: string;
  summary?: boolean;
}

/** Options for {@link Posts.get} */
export interface PostsGetOptions {
  summary?: boolean;
}

/** Options for {@link Posts.query} */
export interface PostsQueryOptions extends Omit<PostsListOptions, 'label'> {}

export class PostsMethods extends Methods {
  /**
   * Retrieves all the posts of the blog
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async list(options: PostsListOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<WithPagination<'posts'>> {
    const { label } = options;

    // validate label if provided
    if (!isUndefined(label)) {
      assertNonBlankString(label, 'options.label');
    }

    const result = await this.c.req(`./posts/${options.summary === true ? 'summary' : 'default'}${label ? `/-/${encodeURI(label)}` : ''}`, {
      params: options,
      exclude: ['query'],
      signal,
    });

    return this._paginate('posts', result);
  }

  /**
   * Retrieves a post
   *
   * @param postId The id of the post
   * @param options Options
   *
   * @returns On success, a Post
   */
  async get(postId: string, options: PostsGetOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<Post | null> {
    assertNonBlankString(postId, "Argument 'postId'");

    const { posts } = await this.c.req(`./posts/${options.summary === true ? 'summary' : 'default'}/${encodeURIComponent(postId)}`, {
      exclude: ['query'],
      signal,
    });

    return posts?.find((p) => p.id === postId) ?? null;
  }

  /**
   * Retrieves all the posts with query
   *
   * @param query The query
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async query(query: string, options: PostsQueryOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<WithPagination<'posts'>> {
    assertNonBlankString(query, "Argument 'query'");

    const result = await this.c.req(`./posts/${options.summary === true ? 'summary' : 'default'}`, {
      params: {
        ...options,
        query,
      },
      signal,
    });

    return this._paginate('posts', result);
  }
}
