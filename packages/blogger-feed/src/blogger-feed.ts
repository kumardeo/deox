import { Blog } from "./blog";
import { Client } from "./client";
import { Comments } from "./comments";
import { Pages } from "./pages";
import { Posts } from "./posts";

/**
 * An interface representing options for {@link BloggerFeed}
 */
export interface BloggerFeedOptions {
	jsonp?: boolean;
}

export class BloggerFeed {
	protected options: {
		urlOrId: string | URL;
		jsonp: boolean;
	};

	constructor(urlOrId: string | URL, options: BloggerFeedOptions = {}) {
		this.options = {
			urlOrId,
			jsonp: options.jsonp === true
		};
	}

	private _client?: Client;

	protected get client() {
		this._client ??= new Client(this.options.urlOrId, {
			jsonp: this.options.jsonp
		});
		return this._client;
	}

	private _posts?: Posts;

	get posts() {
		this._posts ??= new Posts(this.client);
		return this._posts;
	}

	private _pages?: Pages;

	get pages() {
		this._pages ??= new Pages(this.client);
		return this._pages;
	}

	private _comments?: Comments;

	get comments() {
		this._comments ??= new Comments(this.client);
		return this._comments;
	}

	private _blog?: Blog;

	get blog() {
		this._blog ??= new Blog(this.client);
		return this._blog;
	}
}
