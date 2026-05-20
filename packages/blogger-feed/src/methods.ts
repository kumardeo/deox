import type { Client } from './client';
import type { Comment, Feed, Post } from './types';

interface PaginationItemsMap {
  posts: Post[];
  comments: Comment[];
}

export interface WithPagination<T extends keyof PaginationItemsMap> {
  readonly items: PaginationItemsMap[T];
  readonly itemsPerPage: number | null;
  readonly startIndex: number | null;
  readonly totalResults: number | null;
  readonly selfUrl: string | null;
  readonly previousUrl: string | null;
  readonly nextUrl: string | null;
  readonly next: (requestOptions?: { signal?: AbortSignal }) => Promise<WithPagination<T> | null>;
  readonly previous: (requestOptions?: { signal?: AbortSignal }) => Promise<WithPagination<T> | null>;
}

export class Methods {
  protected readonly c: Client;

  constructor(client: Client) {
    this.c = client;
  }

  /** Adds pagination properties and methods to feed entries array */
  protected _paginate<T extends keyof PaginationItemsMap>(type: T, feed: Feed): WithPagination<T> {
    return {
      items: ((type === 'comments' ? feed.comments : feed.posts) ?? []) as PaginationItemsMap[T],
      itemsPerPage: feed.itemsPerPage,
      startIndex: feed.startIndex,
      totalResults: feed.totalResults,
      selfUrl: feed.selfUrl,
      previousUrl: feed.previousUrl,
      nextUrl: feed.nextUrl,
      previous: async ({ signal } = {}) => {
        if (!feed.previousUrl) {
          return null;
        }
        const result = await this.c.req(feed.previousUrl, { signal });
        return this._paginate(type, result);
      },
      next: async ({ signal } = {}) => {
        if (!feed.nextUrl) {
          return null;
        }
        const result = await this.c.req(feed.nextUrl, {
          signal,
        });
        return this._paginate(type, result);
      },
    };
  }
}
