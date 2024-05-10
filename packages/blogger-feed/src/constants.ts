export const JSONP_NAMESPACE = "__blogger_feed_jsonp_callbacks__";

export const NOT_FOUND_ERRORS = {
	post: {
		error: "Post was not found.",
		code: "post_not_found"
	},
	posts: {
		error: "Posts were not found.",
		code: "posts_not_found"
	},
	page: {
		error: "Page was not found.",
		code: "page_not_found"
	},
	pages: {
		error: "Pages were not found.",
		code: "pages_not_found"
	},
	comment: {
		error: "Comment was not found.",
		code: "comment_not_found"
	},
	comments: {
		error: "Comments were not found.",
		code: "comments_not_found"
	},
	blog: {
		error: "Blog was not found.",
		code: "blog_not_found"
	}
} as const;
