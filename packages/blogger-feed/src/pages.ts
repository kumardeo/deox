import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";
import { validators } from "./utils";

/** Options for {@link Pages.list} */
export type PagesListOptions = {
	maxResults?: number;
	startIndex?: number;
	orderBy?: "published" | "updated";
	publishedMin?: Date | string;
	publishedMax?: Date | string;
	updatedMin?: Date | string;
	updatedMax?: Date | string;
	summary?: boolean;
};

/** Options for {@link Pages.get} */
export type PagesGetOptions = { summary?: boolean };

/**
 * A class having methods related to Pages
 */
export class Pages extends Methods {
	/**
	 * Retrieves all the pages of the blog
	 *
	 * @param options Options for filters
	 *
	 * @returns On success, an Array of Post
	 */
	async list(options: PagesListOptions = {}) {
		const { posts, pagination } = await this.client.request(
			`./pages/${options.summary === true ? "summary" : "default"}`,
			{
				params: options,
				exclude: ["query"]
			}
		);

		// Use an empty array if entries were not found
		return this._bind_pagination("posts", posts || [], pagination);
	}

	/**
	 * Retrieves a page
	 *
	 * @param page_id The id of the page
	 * @param options Options for filters
	 *
	 * @returns On success, a Post
	 */
	async get(page_id: string, options: PagesGetOptions = {}) {
		validators.notBlank(page_id, "Argument 'post_id'");

		const { posts } = await this.client.request(
			`./pages/${options.summary === true ? "summary" : "default"}/${encodeURI(page_id)}`,
			{
				exclude: ["query"]
			}
		);

		const page = posts?.find((p) => p.id === page_id);

		// Throw an error if the page was not found
		if (!page) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.page);
		}

		return page;
	}
}
