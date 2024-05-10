import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";
import { validators } from "./utils";

export type PostsListOptions = {
	maxResults?: number;
	startIndex?: number;
	orderBy?: "lastmodified" | "starttime" | "published" | "updated";
	publishedMin?: Date | string;
	publishedMax?: Date | string;
	updatedMin?: Date | string;
	updatedMax?: Date | string;
	summary?: boolean;
};

export type PostsQueryOptions = PostsListOptions;

export class Posts extends Methods {
	async list(options: PostsListOptions = {}) {
		const result = await this.client.request(
			`./posts/${options.summary === true ? "summary" : "default"}`,
			{
				params: options,
				exclude: ["query"]
			}
		);

		if (!result.posts) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.posts);
		}

		return this._bind_pagination(result.posts, "posts", result.pagination);
	}

	async get(post_id: string, options: { summary?: boolean } = {}) {
		validators.notBlank(post_id, "Argument 'post_id'");

		const result = await this.client.request(
			`./posts/${options.summary === true ? "summary" : "default"}/${encodeURIComponent(post_id)}`,
			{
				exclude: ["query"]
			}
		);

		if (!result.posts) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.posts);
		}

		const post = result.posts.find((p) => p.id === post_id);

		if (!post) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.post);
		}

		return post;
	}

	async query(query: string, options: PostsQueryOptions = {}) {
		validators.notBlank(query, "Argument 'query'");

		const result = await this.client.request(
			`./posts/${options.summary === true ? "summary" : "default"}`,
			{
				params: {
					...options,
					query
				}
			}
		);

		if (!result.posts) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.posts);
		}

		return this._bind_pagination(result.posts, "posts", result.pagination);
	}
}
