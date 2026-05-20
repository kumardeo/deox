import { Methods } from './methods';
import type { Blog } from './types';

/**
 * A class having methods related to Blog
 */
export class BlogMethods extends Methods {
  /**
   * Retrieve blog information
   *
   * @returns The blog info
   */
  async get({ signal }: { signal?: AbortSignal } = {}): Promise<Blog | null> {
    const { blog } = await this.c.req('./posts/summary', {
      params: {
        // do not load entries since we only need blog info
        maxResults: 0,
      },
      signal,
    });

    return blog;
  }
}
