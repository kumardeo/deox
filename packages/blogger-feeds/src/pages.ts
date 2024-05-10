import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";
import { validators } from "./utils";

export type PagesListOptions = {
	maxResults?: number;
	startIndex?: number;
	orderBy?: "lastmodified" | "starttime" | "published" | "updated";
	publishedMin?: Date | string;
	publishedMax?: Date | string;
	updatedMin?: Date | string;
	updatedMax?: Date | string;
	summary?: boolean;
};

export class Pages extends Methods {
	async list(options: PagesListOptions = {}) {
		const result = await this.client.request(
			`./pages/${options.summary === true ? "summary" : "default"}`,
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

	async get(page_id: string, options: { summary?: boolean } = {}) {
		validators.notBlank(page_id, "Argument 'post_id'");

		const result = await this.client.request(
			`./pages/${options.summary === true ? "summary" : "default"}/${encodeURI(page_id)}`,
			{
				exclude: ["query"]
			}
		);

		if (!result.posts) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.posts);
		}

		const post = result.posts.find((p) => p.id === page_id);

		if (!post) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.post);
		}

		return post;
	}
}
