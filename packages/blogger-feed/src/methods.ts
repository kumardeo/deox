import type { Client } from './client';
import type { Comment, Pagination, Post } from './types';
import { addProperties } from './utils';

type PaginationMap = {
  posts: Post[];
  comments: Comment[];
};

/** Pagination props */
export interface PaginationProps<T extends keyof PaginationMap> {
  readonly self_url: string;
  readonly previous_url: string | null;
  readonly next_url: string | null;
  next(): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
  previous(): Promise<(PaginationMap[T] & PaginationProps<T>) | null>;
}

export class Methods {
  constructor(client: Client) {
    this._client = client;
  }

  private _client: Client;

  protected get client() {
    return this._client;
  }

  protected _bind_pagination<T extends keyof PaginationMap>(type: T, array: PaginationMap[T], pagination: Pagination) {
    const properties: PaginationProps<T> = {
      self_url: pagination.self,
      previous_url: pagination.previous,
      next_url: pagination.next,
      previous: async () => {
        if (pagination.previous) {
          const result = await this.client.request(pagination.previous);
          const to = (type === 'comments' ? result.comments : result.posts) as PaginationMap[T] | null;
          if (to) {
            return this._bind_pagination(type, to, result.pagination);
          }
        }
        return null;
      },
      next: async () => {
        if (pagination.next) {
          const result = await this.client.request(pagination.next);
          const to = (type === 'comments' ? result.comments : result.posts) as PaginationMap[T] | null;
          if (to) {
            return this._bind_pagination(type, to, result.pagination);
          }
        }
        return null;
      },
    };

    return addProperties(array, properties);
  }
}
