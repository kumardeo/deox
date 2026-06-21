import { Methods } from './methods';
import type { User } from './types';

/** A class having API methods related to User */
export class UserMethods extends Methods {
	/**
	 * Retrieve the user's data.
	 *
	 * @returns On success, a {@link User}
	 *
	 * @see https://app.gumroad.com/api#get-/user
	 */
	async get({ signal }: { signal?: AbortSignal } = {}): Promise<User> {
		try {
			return (
				await this.client.request<{ user: User }>('./user', {
					signal,
				})
			).user;
		} catch (e) {
			this.logger.function(e, 'User.get');

			throw e;
		}
	}
}
