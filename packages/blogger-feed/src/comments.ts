import { isUndefined } from '@deox/utils/predicate';
import { NOT_FOUND_ERRORS } from './constants';
import { SDKInputNotFoundError } from './errors';
import { Methods } from './methods';
import { validators } from './utils';

/** Options for {@link Comments.list} */
export type CommentsListOptions = {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  summary?: boolean;
  post_id?: string;
};

/** Options for {@link Comments.get} */
export type CommentsGetOptions = {
  summary?: boolean;
};

/**
 * A class having methods related to Comments
 */
export class Comments extends Methods {
  /**
   * Retrieves all the comments of the blog or a post
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Comment
   */
  async list(options: CommentsListOptions = {}) {
    const { post_id } = options;

    // validate post_id if provided
    if (!isUndefined(post_id)) validators.nB(post_id, 'options.post_id');

    const result = await this.c.req(`./${post_id ? `${encodeURI(post_id)}/` : ''}comments/${options.summary === true ? 'summary' : 'default'}`, {
      params: options,
      exclude: ['query'],
    });

    return this._p('comments', {
      ...result,
      // If post_id was provided, make sure to filter once again
      // Use an empty array if entries were not found
      comments: (post_id ? result.comments?.filter((c) => c.post.id === post_id) : result.comments) || [],
    });
  }

  /**
   * Retrieves a comment
   *
   * @param post_id The id of the post
   * @param comment_id The id of the comment
   * @param options Options
   *
   * @returns On success, a Comment
   */
  async get(post_id: string, comment_id: string, options: CommentsGetOptions = {}) {
    validators.nB(post_id, "Argument 'post_id'");
    validators.nB(comment_id, "Argument 'comment_id'");

    const { comments } = await this.c.req(
      `./${encodeURI(post_id)}/comments/${options.summary === true ? 'summary' : 'default'}/${encodeURI(comment_id)}`,
      {
        // We need to use blogger service base url since comments by id through domain is not available
        baseUrl: await this.c.serviceBase,
        exclude: ['query'],
      },
    );

    const comment = comments?.find((c) => c.id === comment_id);

    if (!comment) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comment);

    return comment;
  }
}
