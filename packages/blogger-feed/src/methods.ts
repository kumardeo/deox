import { Client } from "./client";
import { Comment, Pagination, Post } from "./types";
import { addProperties } from "./utils";

export interface PaginationProps<T extends (Post | Comment)[]> {
	readonly self_url: string;
	readonly previous_url: string | null;
	readonly next_url: string | null;
	readonly next: () => Promise<(T & PaginationProps<T>) | null>;
	readonly previous: () => Promise<(T & PaginationProps<T>) | null>;
}

export class Methods {
	constructor(client: Client) {
		this._client = client;
	}

	private _client: Client;

	protected get client() {
		return this._client;
	}

	protected _bind_pagination<T extends (Post | Comment)[]>(
		array: T,
		type: T extends Post[] ? "posts" : "comments",
		pagination: Pagination
	) {
		const properties: PaginationProps<T> = {
			self_url: pagination.self,
			previous_url: pagination.previous,
			next_url: pagination.next,
			previous: async () => {
				if (pagination.previous) {
					const result = await this.client.request(pagination.previous);
					const to = (type === "comments" ? result.comments : result.posts) as
						| T
						| undefined;
					if (to) {
						return this._bind_pagination(to, type, result.pagination);
					}
				}
				return null;
			},
			next: async () => {
				if (pagination.next) {
					const result = await this.client.request(pagination.next);
					const to = (type === "comments" ? result.comments : result.posts) as
						| T
						| undefined;
					if (to) {
						return this._bind_pagination(to, type, result.pagination);
					}
				}
				return null;
			}
		};

		return addProperties(array, properties);
	}
}
