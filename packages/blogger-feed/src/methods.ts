import type { Client } from './client';
import type { Comment, Feed, Post } from './types';
import { addProperties } from './utils';

type PaginationMap = {
  posts: Post[];
  comments: Comment[];
};

/** Pagination props */
export interface PaginationProps<T extends keyof PaginationMap> {
  readonly itemsPerPage: number | null;
  readonly startIndex: number | null;
  readonly totalResults: number | null;
  readonly selfUrl: string | null;
  readonly previousUrl: string | null;
  readonly nextUrl: string | null;
  next(requestOptions?: { signal?: AbortSignal }): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
  previous(requestOptions?: { signal?: AbortSignal }): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
}

export class Methods {
  protected c: Client;

  constructor(client: Client) {
    this.c = client;
  }

  /** Adds pagination properties and methods to feed entries array */
  protected _p<T extends keyof PaginationMap>(type: T, feed: Feed) {
    const properties: PaginationProps<T> = {
      itemsPerPage: feed.itemsPerPage,
      startIndex: feed.startIndex,
      totalResults: feed.totalResults,
      selfUrl: feed.selfUrl,
      previousUrl: feed.previousUrl,
      nextUrl: feed.nextUrl,
      previous: async ({ signal } = {}) => {
        if (properties.previousUrl) {
          const result = await this.c.req(properties.previousUrl, {
            signal,
          });
          return this._p(type, result);
        }
        return null;
      },
      next: async ({ signal } = {}) => {
        if (properties.nextUrl) {
          const result = await this.c.req(properties.nextUrl, {
            signal,
          });
          return this._p(type, result);
        }
        return null;
      },
    };

    return addProperties(((type === 'comments' ? feed.comments : feed.posts) ?? []) as PaginationMap[T], properties);
  }
}
