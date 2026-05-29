import { Methods } from './methods';
import type { Subscriber } from './types';
import { assertNonBlankString } from './utils';

/** A class having API methods related to Subscribers */
export class SubscribersMethods extends Methods {
  /**
   * Retrieves all of the active subscribers for one of the authenticated user's products.
   *
   * A subscription is terminated if any of `failed_at`, `ended_at`, or `cancelled_at` timestamps are populated and are in the past.
   *
   * A subscription's status can be one of: `alive`, `pending_cancellation`, `pending_failure`, `failed_payment`,
   * `fixed_subscription_period_ended`, `cancelled`.
   *
   * @param product_id The id of the product
   *
   * @returns On success, an Array of {@link Subscriber}
   *
   * @see https://app.gumroad.com/api#get-/products/:product_id/subscribers
   *
   * **Only available with the `view_sales` scope**
   */
  async list(
    product_id: string,
    options: {
      /** Filter subscribers by this email */
      email?: string;

      /**
       * Set to `true` to limit the number of subscribers returned to 100
       *
       * @default false
       */
      paginated?: boolean;

      /**
       * A key representing a page of results.
       * It is given in the paginated response of the previous page as `next_page_key`.
       */
      page_key?: string;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<Subscriber[]> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      const { email, paginated, page_key } = options;

      return (
        await this.client.request<{ subscribers: Subscriber[] }>(`./products/${encodeURI(product_id)}/subscribers`, {
          params: { email, paginated, page_key },
          signal,
        })
      ).subscribers;
    } catch (e) {
      this.logger.function(e, 'Subscribers.list', { product_id, options });

      throw e;
    }
  }

  /**
   * Retrieves the details of a subscriber to this user's product.
   *
   * @param subscriber_id The subscriber id
   *
   * @returns On success, a {@link Subscriber}
   *
   * @see https://app.gumroad.com/api#get-/subscribers/:id
   *
   * **Only available with the `view_sales` scope**
   */
  async get(subscriber_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Subscriber> {
    try {
      assertNonBlankString(subscriber_id, "Argument 'subscriber_id'");

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
