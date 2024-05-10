import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";
import { PostsListOptions } from "./posts";
import { validators } from "./utils";

export type CommentsListOptions = PostsListOptions & {
	post_id?: string;
};

export type CommentsGetOptions = {
	summary?: boolean;
};

export class Comments extends Methods {
	async list(options: CommentsListOptions = {}) {
		const { post_id } = options;
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

		if (!comments) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comments);
		}

		return this._bind_pagination(
			post_id ? comments.filter((c) => c.post.id === post_id) : comments,
			"comments",
			pagination
		);
	}

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

		if (!comments) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comments);
		}

		const comment = comments.find((c) => c.id === comment_id);

		if (!comment) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.comment);
		}

		return comment;
	}
}
