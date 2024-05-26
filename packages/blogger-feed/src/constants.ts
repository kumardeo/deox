/** Name for global variable for jsonp callbacks */
export const JSONP_NAMESPACE = '__deox_blogger_feed_jsonp_callbacks__';

/** Feed ot entry not found error */
export const NOT_FOUND_ERRORS = {
  post: {
    error: 'The post was not found.',
    code: 'post_not_found',
  },
  page: {
    error: 'The page was not found.',
    code: 'page_not_found',
  },
  comment: {
    error: 'The comment was not found.',
    code: 'comment_not_found',
  },
  blog: {
    error: 'The blog was not found.',
    code: 'blog_not_found',
  },
} as const;
