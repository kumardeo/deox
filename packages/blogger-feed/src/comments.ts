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
  postId?: string;
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
  async list(options: CommentsListOptions = {}, { signal }: { signal?: AbortSignal } = {}) {
    const { postId } = options;

    // validate post_id if provided
    if (!isUndefined(postId)) validators.nB(postId, 'options.postId');

    const result = await this.c.req(`./${postId ? `${encodeURI(postId)}/` : ''}comments/${options.summary === true ? 'summary' : 'default'}`, {
      params: options,
      exclude: ['query'],
      signal,
    });

    // Make sure to filter once again if post_id is provided,
    if (postId && result.comments) {
      result.comments = result.comments.filter((c) => c.post.id === postId);
    }

    return this._p('comments', result);
  }

  /**
   * Retrieves a comment
   *
   * @param postId The id of the post
   * @param commentId The id of the comment
   * @param options Options
   *
   * @returns On success, a Comment
   */
  async get(postId: string, commentId: string, options: CommentsGetOptions = {}, { signal }: { signal?: AbortSignal } = {}) {
    validators.nB(postId, "Argument 'postId'");
    validators.nB(commentId, "Argument 'commentId'");

    const { comments } = await this.c.req(
      `./${encodeURI(postId)}/comments/${options.summary === true ? 'summary' : 'default'}/${encodeURI(commentId)}`,
      {
        // We need to use blogger service base url since comments by id through domain is not available
        baseUrl: await this.c.serviceBase,
        exclude: ['query'],
        signal,
      },
    );

    const comment = comments?.find((c) => c.id === commentId);

    if (!comment) throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comment);

    return comment;
  }
}
