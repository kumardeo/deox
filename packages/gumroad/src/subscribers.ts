import { Methods } from './methods';
import type { Subscriber } from './types';
import { validators } from './utils';

/**
 * A class having API methods related to Subscribers
 */
export class Subscribers extends Methods {
  /**
   * **Only available with the `view_sales` scope**
   *
   * Retrieves all of the active subscribers for one of the authenticated user's products.
   *
   * A subscription is terminated if any of `failed_at`, `ended_at`, or `cancelled_at` timestamps are populated and are in the past.
   *
   * A subscription's status can be one of: `alive`, `pending_cancellation`, `pending_failure`, `failed_payment`,
   * `fixed_subscription_period_ended`, `cancelled`.
   *
   * @param product_id The id of the product
   * @param email (Optional) Filter subscribers by this email
   *
   * @returns On success, an Array of {@link Subscriber}
   *
   * @see https://app.gumroad.com/api#get-/products/:product_id/subscribers
   */
  async list(product_id: string, email?: string, { signal }: { signal?: AbortSignal } = {}) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");

      return (
        await this.client.request<{ subscribers: Subscriber[] }>(`./products/${encodeURI(product_id)}/subscribers`, {
          params: { email },
          signal,
        })
      ).subscribers;
    } catch (e) {
      this.logger.function(e, 'Subscribers.list', { product_id, email });

      throw e;
    }
  }

  /**
   * **Only available with the `view_sales` scope**
   *
   * Retrieves the details of a subscriber to this user's product.
   *
   * @param subscriber_id The subscriber id
   *
   * @returns On success, a {@link Subscriber}
   *
   * @see https://app.gumroad.com/api#get-/subscribers/:id
   */
  async get(subscriber_id: string, { signal }: { signal?: AbortSignal } = {}) {
    try {
      validators.notBlank(subscriber_id, "Argument 'subscriber_id'");

      return (
        await this.client.request<{ subscriber: Subscriber }>(`./subscribers/${encodeURI(subscriber_id)}`, {
          signal,
        })
      ).subscriber;
    } catch (e) {
      this.logger.function(e, 'Subscribers.get', { subscriber_id });

      throw e;
    }
  }
}
