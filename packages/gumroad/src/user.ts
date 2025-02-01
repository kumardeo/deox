import { Methods } from './methods';
import type { User as UserType } from './types';

/**
 * A class having API methods related to User
 */
export class User extends Methods {
  /**
   * Retrieve the user's data.
   *
   * @returns On success, a {@link User}
   *
   * @see https://app.gumroad.com/api#get-/user
   */
  async get({ signal }: { signal?: AbortSignal } = {}) {
    try {
      return (
        await this.client.request<{ user: UserType }>('./user', {
          signal,
        })
      ).user;
    } catch (e) {
      this.logger.function(e, 'User.get');

      throw e;
    }
  }
}
