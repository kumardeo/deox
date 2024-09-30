import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { Methods } from './methods';
import { validators } from './utils';

/** Options for {@link Pages.list} */
export type PagesListOptions = {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  summary?: boolean;
};

/** Options for {@link Pages.get} */
export type PagesGetOptions = { summary?: boolean };

/**
 * A class having methods related to Pages
 */
export class Pages extends Methods {
  /**
   * Retrieves all the pages of the blog
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Post
   */
  async list(options: PagesListOptions = {}) {
    const result = await this.c.req(`./pages/${options.summary === true ? 'summary' : 'default'}`, {
      params: options,
      exclude: ['query'],
    });

    return this._p('posts', result);
  }

  /**
   * Retrieves a page
   *
   * @param pageId The id of the page
   * @param options Options for filters
   *
   * @returns On success, a Post
   */
  async get(pageId: string, options: PagesGetOptions = {}) {
    validators.nB(pageId, "Argument 'pageId'");

    const { posts } = await this.c.req(`./pages/${options.summary === true ? 'summary' : 'default'}/${encodeURI(pageId)}`, {
      exclude: ['query'],
    });

    const page = posts?.find((p) => p.id === pageId);

    // Throw an error if the page was not found
    if (!page) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.page);

    return page;
  }
}
