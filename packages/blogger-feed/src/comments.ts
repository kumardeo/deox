import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";
import { validators } from "./utils";

/** Options for {@link Comments.list} */
export type CommentsListOptions = {
	maxResults?: number;
	startIndex?: number;
	orderBy?: "published" | "updated";
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
		if (typeof post_id !== "undefined") {
			validators.notBlank(post_id, "options.post_id");
		}

		const { comments, pagination } = await this.client.request(
			`./${post_id ? `${encodeURI(post_id)}/` : ""}comments/${options.summary === true ? "summary" : "default"}`,
			{
				params: options,
				exclude: ["query"]
			}
		);

		// If post_id was provided, make sure to filter once again
		// Use an empty array if entries were not found
		const filtered =
			(post_id ? comments?.filter((c) => c.post.id === post_id) : comments) ||
			[];

		return this._bind_pagination("comments", filtered, pagination);
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
	async get(
		post_id: string,
		comment_id: string,
		options: CommentsGetOptions = {}
	) {
		validators.notBlank(post_id, "Argument 'post_id'");
		validators.notBlank(comment_id, "Argument 'comment_id'");

		const { comments } = await this.client.request(
			`./${encodeURI(post_id)}/comments/${options.summary === true ? "summary" : "default"}/${encodeURI(comment_id)}`,
			{
				// We need to use blogger base url since comments by id through domain is not available
				baseUrl: await this.client.bloggerBaseUrl,
				exclude: ["query"]
			}
		);

		const comment = comments?.find((c) => c.id === comment_id);

		if (!comment) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comment);
		}

		return comment;
	}
}
