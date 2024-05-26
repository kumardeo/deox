import { Methods } from './methods';
import type { Purchase } from './types';
import { addProperties, formatCustomField, validators } from './utils';

/**
 * Bindings for {@link Purchase}
 */
export interface PurchaseProps {
  /**
   * The number of license uses
   */
  readonly license_uses: number;

  /**
   * Verifies the license of the purchase
   *
   * @param increment_uses_count If `true`, increment the uses count of a license. Default: `true`
   *
   * @returns On success, a {@link Purchase}
   */
  verify(increment_uses_count?: boolean): Promise<Purchase & PurchaseProps>;

  /**
   * Enables the license of the purchase
   *
   * @returns On success, a {@link Purchase}
   */
  enable(): Promise<Purchase & PurchaseProps>;

  /**
   * Disables the license of the purchase
   *
   * @returns On success, a {@link Purchase}
   */
  disable(): Promise<Purchase & PurchaseProps>;

  /**
   * Decrement the uses count of the license of the product
   *
   * @returns On success, a {@link Purchase}
   */
  decrementUsesCount(): Promise<Purchase & PurchaseProps>;
}

/**
 * A class having API methods related to Licenses
 */
export class Licenses extends Methods {
  protected _bind_purchase({
    purchase,
    uses,
    product_id,
    license_key,
  }: {
    purchase: Purchase;
    uses: number;
    product_id: string;
    license_key: string;
  }) {
    const properties: PurchaseProps = {
      license_uses: uses,

      verify: async (increment_uses_count) => this.verify(product_id, license_key, increment_uses_count),

      enable: async () => this.enable(product_id, license_key),

      disable: async () => this.disable(product_id, license_key),

      decrementUsesCount: async () => this.decrementUsesCount(product_id, license_key),
    };

    return addProperties(purchase, properties);
  }

  /**
   * Verify a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   * @param increment_uses_count If `true`, increment the uses count of a license. Default: `true`
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#post-/licenses/verify
   */
  async verify(product_id: string, license_key: string, increment_uses_count?: boolean) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(license_key, "Argument 'license_key'");

      const response = await this.client.request<{
        uses: number;
        purchase: Purchase;
      }>('./licenses/verify', {
        method: 'POST',
        params: { product_id, license_key, increment_uses_count },
      });

      formatCustomField(response.purchase);

      return this._bind_purchase({ ...response, product_id, license_key });
    } catch (e) {
      this.logger.function(e, 'Licenses.verify', {
        product_id,
        license_key,
        increment_uses_count,
      });

      throw e;
    }
  }

  /**
   * Enable a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#put-/licenses/enable
   */
  async enable(product_id: string, license_key: string) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(license_key, "Argument 'license_key'");

      const response = await this.client.request<{
        uses: number;
        purchase: Purchase;
      }>('./licenses/enable', {
        method: 'PUT',
        params: { product_id, license_key },
      });

      formatCustomField(response.purchase);

      return this._bind_purchase({ ...response, product_id, license_key });
    } catch (e) {
      this.logger.function(e, 'Licenses.enable', {
        product_id,
        license_key,
      });

      throw e;
    }
  }

  /**
   * Disable a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#put-/licenses/disable
   */
  async disable(product_id: string, license_key: string) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(license_key, "Argument 'license_key'");

      const response = await this.client.request<{
        uses: number;
        purchase: Purchase;
      }>('./licenses/disable', {
        method: 'PUT',
        params: { product_id, license_key },
      });

      formatCustomField(response.purchase);

      return this._bind_purchase({ ...response, product_id, license_key });
    } catch (e) {
      this.logger.function(e, 'Licenses.disable', {
        product_id,
        license_key,
      });

      throw e;
    }
  }

  /**
   * Decrement the uses count of a license
   *
   * @param product_id The unique ID of the product, available on product's edit page
   * @param license_key The license key provided by your customer
   *
   * @returns On success, a {@link Purchase}
   *
   * @see https://app.gumroad.com/api#put-/licenses/decrement_uses_count
   */
  async decrementUsesCount(product_id: string, license_key: string) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(license_key, "Argument 'license_key'");

      const response = await this.client.request<{
        uses: number;
        purchase: Purchase;
      }>('./licenses/decrement_uses_count', {
        method: 'PUT',
        params: { product_id, license_key },
      });

      formatCustomField(response.purchase);

      return this._bind_purchase({ ...response, product_id, license_key });
    } catch (e) {
      this.logger.function(e, 'Licenses.decrementUsesCount', {
        product_id,
        license_key,
      });

      throw e;
    }
  }
}
