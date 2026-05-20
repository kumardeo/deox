import { Methods, type WithPagination } from './methods';
import type { Post } from './types';
import { assertNonBlankString } from './utils';

/** Options for {@link Pages.list} */
export interface PagesListOptions {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  summary?: boolean;
}

/** Options for {@link Pages.get} */
export interface PagesGetOptions {
  summary?: boolean;
}

/**
 * A class having methods related to Pages
 */
export class PagesMethods extends Methods {
  /**
   * Retrieves all the pages of the blog
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async list(options: PagesListOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<WithPagination<'posts'>> {
    const result = await this.c.req(`./pages/${options.summary === true ? 'summary' : 'default'}`, {
      params: options,
      exclude: ['query'],
      signal,
    });

    return this._paginate('posts', result);
  }

  /**
   * Retrieves a page
   *
   * @param pageId The id of the page
   * @param options Options for filters
   *
   * @returns On success, a Post
   */
  async get(pageId: string, options: PagesGetOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<Post | null> {
    assertNonBlankString(pageId, "Argument 'pageId'");

    const { posts } = await this.c.req(`./pages/${options.summary === true ? 'summary' : 'default'}/${encodeURI(pageId)}`, {
      exclude: ['query'],
      signal,
    });

    return posts?.find((p) => p.id === pageId) ?? null;
  }
}
