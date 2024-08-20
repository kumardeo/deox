import type { Client } from './client';
import type { Comment, Pagination, Post } from './types';
import { addProperties } from './utils';

type PaginationMap = {
  posts: Post[];
  comments: Comment[];
};

/** Pagination props */
export interface PaginationProps<T extends keyof PaginationMap> {
  readonly selfUrl: string;
  readonly prevUrl: string | null;
  readonly nextUrl: string | null;
  next(): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
  previous(): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
}

export class Methods {
  protected c: Client;

  constructor(client: Client) {
    this.c = client;
  }

  protected _p<T extends keyof PaginationMap>(type: T, array: PaginationMap[T], pagination: Pagination) {
    const properties: PaginationProps<T> = {
      selfUrl: pagination.self,
      prevUrl: pagination.previous,
      nextUrl: pagination.next,
      previous: async () => {
        if (pagination.previous) {
          const result = await this.c.req(pagination.previous);
          const to = (type === 'comments' ? result.comments : result.posts) as PaginationMap[T] | null;
          if (to) {
            return this._p(type, to, result.pagination);
          }
        }
        return null;
      },
      next: async () => {
        if (pagination.next) {
          const result = await this.c.req(pagination.next);
          const to = (type === 'comments' ? result.comments : result.posts) as PaginationMap[T] | null;
          if (to) {
            return this._p(type, to, result.pagination);
          }
        }
        return null;
      },
    };

    return addProperties(array, properties);
  }
}
