import { Client } from './client';
import { DEFAULT_API_BASE_URL } from './constants';
import { CustomFields } from './custom-fields';
import {
  SDKBadRequestError,
  SDKError,
  SDKInputNotFoundError,
  SDKInternalServerError,
  SDKNotFoundError,
  SDKRequestError,
  SDKRequestFailedError,
  SDKTypeError,
  SDKUnauthorizedError,
} from './errors';
import { Licenses } from './licenses';
import { Logger } from './logger';
import { OfferCodes } from './offer-codes';
import { Products } from './products';
import { request } from './request';
import { ResourceSubscriptions } from './resource-subscriptions';
import { Sales } from './sales';
import { Subscribers } from './subscribers';
import type { Purchase } from './types';
import { User } from './user';
import { formatCustomField, validators } from './utils';
import { VariantCategories } from './variant-categories';
import { Variants } from './variants';

/**
 * An interface representing options for {@link API}
 */
export interface APIOptions {
  /**
   * Indicates whether to enable debug mode or not
   *
   * @default false
   */
  debug?: boolean;
}

/**
 * A class for making API requests to Gumroad API endpoints
 */
export class API {
  static readonly SDKBadRequestError = SDKBadRequestError;
  static readonly SDKError = SDKError;
  static readonly SDKInputNotFoundError = SDKInputNotFoundError;
  static readonly SDKInternalServerError = SDKInternalServerError;
  static readonly SDKNotFoundError = SDKNotFoundError;
  static readonly SDKRequestError = SDKRequestError;
  static readonly SDKRequestFailedError = SDKRequestFailedError;
  static readonly SDKTypeError = SDKTypeError;
  static readonly SDKUnauthorizedError = SDKUnauthorizedError;

  /**
   * Verify a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   * @param increment_uses_count Increments license uses on successful verification, defaults to: `true`
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#post-/licenses/verify
   */
  static async verifyLicense(product_id: string, license_key: string, increment_uses_count?: boolean, options: { debug?: boolean } = {}) {
    validators.notBlank(product_id, "Argument 'product_id'");
    validators.notBlank(license_key, "Argument 'license_key'");

    return formatCustomField(
      (
        await request<{ purchase: Purchase }>('./licenses/verify', null, {
          method: 'POST',
          baseUrl: DEFAULT_API_BASE_URL,
          params: {
            product_id,
            license_key,
            increment_uses_count,
          },
          debug: options.debug,
        })
      ).data.purchase,
    );
  }

  readonly client: Client;
  readonly logger: Logger;
  readonly products: Products;
  readonly variant_categories: VariantCategories;
  readonly variants: Variants;
  readonly offer_codes: OfferCodes;
  readonly custom_fields: CustomFields;
  readonly user: User;
  readonly sales: Sales;
  readonly resource_subscriptions: ResourceSubscriptions;
  readonly subscribers: Subscribers;
  readonly licenses: Licenses;

  /**
   * Creates an instance of {@link API}
   *
   * @param accessToken Gumroad API access token, read [guide](https://help.gumroad.com/article/280-create-application-api).
   * @param options The {@link APIOptions}
   */
  constructor(accessToken: string, options: APIOptions = {}) {
    validators.notBlank(accessToken, "Argument 'accessToken'");

    this.client = new Client(accessToken, {
      debug: options.debug,
    });
    this.logger = new Logger(options.debug);
    this.products = new Products(this.client, this.logger);
    this.variant_categories = new VariantCategories(this.client, this.logger);
    this.variants = new Variants(this.client, this.logger);
    this.offer_codes = new OfferCodes(this.client, this.logger);
    this.custom_fields = new CustomFields(this.client, this.logger);
    this.user = new User(this.client, this.logger);
    this.resource_subscriptions = new ResourceSubscriptions(this.client, this.logger);
    this.sales = new Sales(this.client, this.logger);
    this.subscribers = new Subscribers(this.client, this.logger);
    this.licenses = new Licenses(this.client, this.logger);
  }
}
