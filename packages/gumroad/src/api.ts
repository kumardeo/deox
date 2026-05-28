import { Client } from './client';
import { DEFAULT_API_BASE_URL } from './constants';
import { CustomFieldsMethods } from './custom-fields';
import {
  SDKBadRequestError,
  SDKError,
  SDKInputNotFoundError,
  SDKInternalServerError,
  SDKNotFoundError,
  SDKRequestError,
  SDKRequestFailedError,
  SDKUnauthorizedError,
} from './errors';
import { LicensesMethods } from './licenses';
import { Logger } from './logger';
import { OfferCodesMethods } from './offer-codes';
import { PayoutsMethods } from './payouts';
import { ProductsMethods } from './products';
import { request } from './request';
import { ResourceSubscriptionsMethods } from './resource-subscriptions';
import { SalesMethods } from './sales';
import { SubscribersMethods } from './subscribers';
import type { Purchase } from './types';
import { UserMethods } from './user';
import { assertNonBlankString, formatCustomField } from './utils';
import { VariantCategoriesMethods } from './variant-categories';
import { VariantsMethods } from './variants';

/** An interface representing options for {@link API} */
export interface APIOptions {
  /**
   * Indicates whether to enable debug mode or not
   *
   * @default false
   */
  debug?: boolean;
}

/** A class for making API requests to Gumroad API endpoints */
export class API {
  static readonly SDKBadRequestError = SDKBadRequestError;
  static readonly SDKError = SDKError;
  static readonly SDKInputNotFoundError = SDKInputNotFoundError;
  static readonly SDKInternalServerError = SDKInternalServerError;
  static readonly SDKNotFoundError = SDKNotFoundError;
  static readonly SDKRequestError = SDKRequestError;
  static readonly SDKRequestFailedError = SDKRequestFailedError;
  static readonly SDKUnauthorizedError = SDKUnauthorizedError;

  /**
   * Verify a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#post-/licenses/verify
   */
  static async verifyLicense(
    product_id: string,
    license_key: string,
    {
      increment_uses_count,
    }: {
      /** Increments license uses on successful verification, defaults to: `true` */
      increment_uses_count?: boolean;
    } = {},
    { debug, signal }: { debug?: boolean; signal?: AbortSignal } = {},
  ): Promise<Purchase> {
    assertNonBlankString(product_id, "Argument 'product_id'");
    assertNonBlankString(license_key, "Argument 'license_key'");

    return formatCustomField(
      (
        await request<{ purchase: Purchase }>('./licenses/verify', {
          method: 'POST',
          base: DEFAULT_API_BASE_URL,
          params: {
            product_id,
            license_key,
            increment_uses_count,
          },
          debug,
          signal,
        })
      ).purchase,
    );
  }

  readonly client: Client;
  readonly logger: Logger;
  readonly products: ProductsMethods;
  readonly variant_categories: VariantCategoriesMethods;
  readonly variants: VariantsMethods;
  readonly offer_codes: OfferCodesMethods;
  readonly custom_fields: CustomFieldsMethods;
  readonly user: UserMethods;
  readonly sales: SalesMethods;
  readonly resource_subscriptions: ResourceSubscriptionsMethods;
  readonly subscribers: SubscribersMethods;
  readonly licenses: LicensesMethods;
  readonly payouts: PayoutsMethods;

  /**
   * Creates an instance of {@link API}
   *
   * @param accessToken Gumroad API access token, read [guide](https://help.gumroad.com/article/280-create-application-api).
   * @param options The {@link APIOptions}
   */
  constructor(accessToken: string, options: APIOptions = {}) {
    assertNonBlankString(accessToken, "Argument 'accessToken'");

    this.client = new Client(accessToken, {
      debug: options.debug,
    });
    this.logger = new Logger(options.debug);
    this.products = new ProductsMethods(this.client, this.logger);
    this.variant_categories = new VariantCategoriesMethods(this.client, this.logger);
    this.variants = new VariantsMethods(this.client, this.logger);
    this.offer_codes = new OfferCodesMethods(this.client, this.logger);
    this.custom_fields = new CustomFieldsMethods(this.client, this.logger);
    this.user = new UserMethods(this.client, this.logger);
    this.resource_subscriptions = new ResourceSubscriptionsMethods(this.client, this.logger);
    this.sales = new SalesMethods(this.client, this.logger);
    this.subscribers = new SubscribersMethods(this.client, this.logger);
    this.licenses = new LicensesMethods(this.client, this.logger);
    this.payouts = new PayoutsMethods(this.client, this.logger);
  }
}
