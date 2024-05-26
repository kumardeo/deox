import { RESOURCE_SUBSCRIPTION_NAMES } from './constants';
import { SDKTypeError } from './errors';
import { Methods } from './methods';
import type { ResourceSubscription, ResourceSubscriptionName } from './types';
import { addProperties, validators } from './utils';

/**
 * Bindings for {@link ResourceSubscription}
 */
export interface ResourceSubscriptionProps {
  /**
   * Deletes the resource subscription
   *
   * @returns On success, `true`
   */
  delete(): Promise<true>;
}

/**
 * A class having API methods related to Resource Subscriptions
 */
export class ResourceSubscriptions extends Methods {
  protected _bind_resource_subscription(resource_subscription: ResourceSubscription) {
    const properties: ResourceSubscriptionProps = {
      delete: async () => this.delete(resource_subscription.id),
    };

    return addProperties(resource_subscription, properties);
  }

  /**
   * Show all active subscriptions of user for the input resource.
   *
   * @param resource_name The name of resource
   *
   * @returns On success, an Array of {@link ResourceSubscription}
   *
   * @see https://app.gumroad.com/api#get-/resource_subscriptions
   */
  async list(resource_name: ResourceSubscriptionName) {
    try {
      validators.notBlank(resource_name, "Argument 'resource_name'");

      return (
        await this.client.request<{
          resource_subscriptions: ResourceSubscription[];
        }>('./resource_subscriptions', {
          params: { resource_name },
        })
      ).resource_subscriptions.map((resource_subscription) => this._bind_resource_subscription(resource_subscription));
    } catch (e) {
      this.logger.function(e, 'ResourceSubscriptions.list', { resource_name });

      throw e;
    }
  }

  /**
   * Subscribe to a resource.
   *
   * Currently there are 8 supported resource names:
   * "sale", "refund", "dispute", "dispute_won",
   * "cancellation", "subscription_updated", "subscription_ended", and "subscription_restarted".
   *
   * @param post_url The url where resource updates should be send
   * @param resource_name The {@link ResourceSubscriptionName}
   *
   * @returns On success, a {@link ResourceSubscription}
   *
   * @see https://app.gumroad.com/api#put-/resource_subscriptions
   */
  async create(post_url: string, resource_name: ResourceSubscriptionName) {
    try {
      validators.notBlank(post_url, "Argument 'post_url'");
      validators.notBlank(resource_name, "Argument 'resource_name'");

      if (!RESOURCE_SUBSCRIPTION_NAMES.includes(resource_name)) {
        throw new SDKTypeError(`'${resource_name}' is not a valid 'resource_name'`);
      }

      return this._bind_resource_subscription(
        (
          await this.client.request<{
            resource_subscription: {
              id: string;
              post_url: string;
              resource_name: ResourceSubscriptionName;
            };
          }>('./resource_subscriptions', {
            method: 'PUT',
          })
        ).resource_subscription,
      );
    } catch (e) {
      this.logger.function(e, 'ResourceSubscriptions.create', {
        post_url,
        resource_name,
      });

      throw e;
    }
  }

  /**
   * Unsubscribe from a resource.
   *
   * @param resource_subscription_id The id of resource
   *
   * @returns On success, `true`
   *
   * @see https://app.gumroad.com/api#delete-/resource_subscriptions/:resource_subscription_id
   */
  async delete(resource_subscription_id: string) {
    try {
      validators.notBlank(resource_subscription_id, "Argument 'resource_subscription_id'");
      await this.client.request(`./resource_subscriptions/${encodeURI(resource_subscription_id)}`, {
        method: 'DELETE',
      });

      return true as const;
    } catch (e) {
      this.logger.function(e, 'ResourceSubscriptions.delete', {
        resource_subscription_id,
      });

      throw e;
    }
  }
}
