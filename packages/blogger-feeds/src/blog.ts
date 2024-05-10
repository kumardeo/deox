import { NOT_FOUND_ERRORS } from "./constants";
import { SDKInputNotFoundError } from "./errors";
import { Methods } from "./methods";

/**
 * A class having methods related for Blog
 */
export class Blog extends Methods {
	/**
	 * Retrieve blog information
	 *
	 * @returns The blog info
	 */
	async get() {
		const { blog } = await this.client.request("./posts/summary", {
			params: {
				maxResults: 0
			}
		});

		if (!blog) {
			throw new SDKInputNotFoundError(NOT_FOUND_ERRORS.blog);
		}

		return blog;
	}
}
