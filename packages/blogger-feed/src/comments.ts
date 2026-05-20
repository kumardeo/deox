import { Methods, type WithPagination } from './methods';
import type { Comment } from './types';
import { assertNonBlankString, isUndefined } from './utils';

/** Options for {@link Comments.list} */
export interface CommentsListOptions {
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'published' | 'updated';
  publishedMin?: Date | string;
  publishedMax?: Date | string;
  updatedMin?: Date | string;
  updatedMax?: Date | string;
  summary?: boolean;
  postId?: string;
}

/** Options for {@link Comments.get} */
export interface CommentsGetOptions {
  summary?: boolean;
}

/**
 * A class having methods related to Comments
 */
export class CommentsMethods extends Methods {
  /**
   * Retrieves all the comments of the blog or a post
   *
   * @param options Options for filters
   *
   * @returns On success, an Array of Comment
   */
  async list(options: CommentsListOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<WithPagination<'comments'>> {
    const { postId } = options;

    // validate post_id if provided
    if (!isUndefined(postId)) {
      assertNonBlankString(postId, 'options.postId');
    }

    const result = await this.c.req(`./${postId ? `${encodeURI(postId)}/` : ''}comments/${options.summary === true ? 'summary' : 'default'}`, {
      params: options,
      exclude: ['query'],
      signal,
    });

    // Make sure to filter once again if post_id is provided,
    if (postId && result.comments) {
      result.comments = result.comments.filter((c) => c.post.id === postId);
    }

    return this._paginate('comments', result);
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
  async get(postId: string, commentId: string, options: CommentsGetOptions = {}, { signal }: { signal?: AbortSignal } = {}): Promise<Comment | null> {
    assertNonBlankString(postId, "Argument 'postId'");
    assertNonBlankString(commentId, "Argument 'commentId'");

    const { comments } = await this.c.req(
      `./${encodeURI(postId)}/comments/${options.summary === true ? 'summary' : 'default'}/${encodeURI(commentId)}`,
      {
        // We need to use blogger service base url since comments by id through domain is not available
        base: await this.c.getServiceBase(),
        exclude: ['query'],
        signal,
      },
    );

    return comments?.find((c) => c.id === commentId) ?? null;
  }
}
