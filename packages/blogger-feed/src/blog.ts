import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { Methods } from './methods';

/**
 * A class having methods related to Blog
 */
export class Blog extends Methods {
  /**
   * Retrieve blog information
   *
   * @returns The blog info
   */
  async get() {
    const { blog } = await this.c.req('./posts/summary', {
      params: {
        // Do not load entries since we only need blog info
        maxResults: 0,
      },
    });

    // Throw an error if feed doesn't contain blog info
    if (!blog) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.blog);

    return blog;
  }
}
