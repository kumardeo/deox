import { Methods } from './methods';
import type { OfferCode } from './types';
import { addProperties, validators } from './utils';

/**
 * Bindings for {@link OfferCode}
 */
export interface OfferCodeProps {
  /**
   * Updates the offer code
   *
   * @param options Options
   *
   * @returns On success, a {@link OfferCode}
   */
  update(
    options:
      | {
          offer_code: string;
        }
      | {
          max_purchase_count: number;
        }
      | {
          offer_code: string;
          max_purchase_count: number;
        },
  ): Promise<OfferCode & OfferCodeProps>;

  /**
   * Deletes the offer code
   *
   * @returns On success, `true`
   */
  delete(): Promise<true>;
}

/**
 * A class having API methods related to Offer Codes
 */
export class OfferCodes extends Methods {
  protected _bind_offer_code(offer_code: OfferCode, product_id: string) {
    const properties: OfferCodeProps = {
      update: async (update_options) => this.update(product_id, offer_code.id, update_options),

      delete: async () => this.delete(product_id, offer_code.id),
    };

    return addProperties(offer_code, properties);
  }

  /**
   * Retrieve all of the existing offer codes for a product.
   *
   * Either `amount_cents` or `percent_off` will be returned depending if the offer code is a fixed amount off or a percentage off.
   *
   * A universal offer code is one that applies to all products.
   *
   * @param product_id The id of the product
   *
   * @returns On success, a {@link OfferCode}
   *
   * @see https://app.gumroad.com/api#get-/products/:product_id/offer_codes
   */
  async list(product_id: string) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");

      return (await this.client.request<{ offer_codes: OfferCode[] }>(`./products/${encodeURI(product_id)}/offer_codes`)).offer_codes.map(
        (offer_code) => this._bind_offer_code(offer_code, product_id),
      );
    } catch (e) {
      this.logger.function(e, 'OfferCodes.list', { product_id });

      throw e;
    }
  }

  /**
   * Retrieve the details of a specific offer code of a product
   *
   * @param product_id The id of the product
   * @param offer_code_id The id of the offer code
   *
   * @returns On success, a {@link OfferCode}
   *
   * @see https://app.gumroad.com/api#get-/products/:product_id/offer_codes/:id
   */
  async get(product_id: string, offer_code_id: string): Promise<OfferCode | null> {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

      return this._bind_offer_code(
        (await this.client.request<{ offer_code: OfferCode }>(`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`))
          .offer_code,
        product_id,
      );
    } catch (e) {
      this.logger.log(e, 'OfferCodes.get', { product_id, offer_code_id });

      throw e;
    }
  }

  /**
   * Create a new offer code for a product.
   * Default offer code is in cents.
   * A universal offer code is one that applies to all products.
   *
   * @param product_id The id of the product
   * @param name The name of the offer code
   * @param amount_off The amount depending on offer type
   * @param options (Optional) Options
   *
   * @returns On success, a {@link OfferCode}
   *
   * @see https://app.gumroad.com/api#post-/products/:product_id/offer_codes
   */
  async create(
    product_id: string,
    name: string,
    amount_off: number,
    options?: {
      /**
       * @default "cents"
       */
      offer_type?: 'cents' | 'percent';
      max_purchase_count?: number;
      universal?: boolean;
    },
  ) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");

      return this._bind_offer_code(
        (
          await this.client.request<{ offer_code: OfferCode }>(`./products/${encodeURI(product_id)}/offer_codes`, {
            method: 'POST',
            params: { ...options, name, amount_off },
          })
        ).offer_code,
        product_id,
      );
    } catch (e) {
      this.logger.function(e, 'OfferCodes.create', {
        product_id,
        name,
        amount_off,
        options,
      });

      throw e;
    }
  }

  /**
   * Edit an existing product's offer code.
   *
   * @param product_id The id of the product
   * @param offer_code_id The id of the offer code
   * @param options Options
   *
   * @returns On success, a {@link OfferCode}
   *
   * @see https://app.gumroad.com/api#put-/products/:product_id/offer_codes/:id
   */
  async update(
    product_id: string,
    offer_code_id: string,
    options:
      | { offer_code: string }
      | {
          max_purchase_count: number;
        }
      | { offer_code: string; max_purchase_count: number },
  ) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

      return this._bind_offer_code(
        (
          await this.client.request<{ offer_code: OfferCode }>(`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`, {
            method: 'PUT',
            params: options,
          })
        ).offer_code,
        product_id,
      );
    } catch (e) {
      this.logger.function(e, 'OfferCodes.update', {
        product_id,
        offer_code_id,
        options,
      });

      throw e;
    }
  }

  /**
   * Permanently delete a product's offer code.
   *
   * @param product_id The id of the product
   * @param offer_code_id The id of the offer code
   *
   * @returns On success, `true`
   *
   * @see https://app.gumroad.com/api#delete-/products/:product_id/offer_codes/:id
   */
  async delete(product_id: string, offer_code_id: string) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

      await this.client.request(`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`, { method: 'DELETE' });

      return true as const;
    } catch (e) {
      this.logger.function(e, 'OfferCodes.delete', {
        product_id,
        offer_code_id,
      });

      throw e;
    }
  }
}
