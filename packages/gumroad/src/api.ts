import { Client } from './client';
import { DEFAULT_API_BASE_URL } from './constants';
import { CustomFields } from './custom-fields';
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

  protected options: {
    accessToken: string;
    debug: boolean;
  };

  /**
   * Creates an instance of {@link API}
   *
   * @param accessToken Gumroad API access token, read [guide](https://help.gumroad.com/article/280-create-application-api).
   * @param options The {@link APIOptions}
   */
  constructor(accessToken: string, options: APIOptions = {}) {
    validators.notBlank(accessToken, "Argument 'accessToken'");

    this.options = {
      accessToken,
      debug: options.debug === true,
    };
  }

  private _client?: Client;

  protected get client() {
    this._client ??= new Client({
      accessToken: this.options.accessToken,
      debug: this.options.debug,
    });
    return this._client;
  }

  private _logger?: Logger;

  protected get logger() {
    this._logger ??= new Logger(this.options.debug);
    return this._logger;
  }

  private _products?: Products;

  get products() {
    this._products ??= new Products(this.client, this.logger);
    return this._products;
  }

  private _variant_categories?: VariantCategories;

  get variant_categories() {
    this._variant_categories ??= new VariantCategories(this.client, this.logger);
    return this._variant_categories;
  }

  private _variants?: Variants;

  get variants() {
    this._variants ??= new Variants(this.client, this.logger);
    return this._variants;
  }

  private _offer_codes?: OfferCodes;

  get offer_codes() {
    this._offer_codes ??= new OfferCodes(this.client, this.logger);
    return this._offer_codes;
  }

  private _custom_fields?: CustomFields;

  get custom_fields() {
    this._custom_fields ??= new CustomFields(this.client, this.logger);
    return this._custom_fields;
  }

  private _user?: User;

  get user() {
    this._user ??= new User(this.client, this.logger);
    return this._user;
  }

  private _resource_subscriptions?: ResourceSubscriptions;

  get resource_subscriptions() {
    this._resource_subscriptions ??= new ResourceSubscriptions(this.client, this.logger);
    return this._resource_subscriptions;
  }

  private _sales?: Sales;

  get sales() {
    this._sales ??= new Sales(this.client, this.logger);
    return this._sales;
  }

  private _subscribers?: Subscribers;

  get subscribers() {
    this._subscribers ??= new Subscribers(this.client, this.logger);
    return this._subscribers;
  }

  private _licenses?: Licenses;

  get licenses() {
    this._licenses ??= new Licenses(this.client, this.logger);
    return this._licenses;
  }
}
