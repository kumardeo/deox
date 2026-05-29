import { Methods } from './methods';
import type { Product, Recurrence } from './types';
import { addProperties, assertArray, assertNonBlankString, assertNumber } from './utils';

/** Bindings for {@link Product} */
export interface ProductProps {
  /**
   * Deletes the product
   *
   * @returns On success, `true`
   */
  delete(requestOptions?: { signal?: AbortSignal }): Promise<true>;

  /**
   * Enables the product
   *
   * @returns On success, a {@link Product}
   */
  enable(requestOptions?: { signal?: AbortSignal }): Promise<Product & ProductProps>;

  /**
   * Disables the product
   *
   * @returns On success, a {@link Product}
   */
  disable(requestOptions?: { signal?: AbortSignal }): Promise<Product & ProductProps>;
}

/** A class having API methods related to Products */
export class ProductsMethods extends Methods {
  protected _bindProduct(product: Product): Product & ProductProps {
    const properties: ProductProps = {
      delete: async (requestOptions) => this.delete(product.id, requestOptions),

      enable: async (requestOptions) => this.enable(product.id, requestOptions),

      disable: async (requestOptions) => this.disable(product.id, requestOptions),
    };

    return addProperties(product, properties);
  }

  /**
   * Retrieve all of the existing products for the authenticated user.
   *
   * @returns On success, an Array of {@link Product}
   *
   * @see https://app.gumroad.com/api#get-/products
   */
  async list({ signal }: { signal?: AbortSignal } = {}): Promise<(Product & ProductProps)[]> {
    try {
      return (
        await this.client.request<{ products: Product[] }>('./products', {
          signal,
        })
      ).products.map((product) => this._bindProduct(product));
    } catch (e) {
      this.logger.function(e, 'Products.list');

      throw e;
    }
  }

  /**
   * Retrieve the details of a product.
   *
   * @param product_id Id of the product
   *
   * @returns On success, a {@link Product}
   *
   * @see https://app.gumroad.com/api#get-/products/:id
   */
  async get(product_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Product & ProductProps> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      return this._bindProduct(
        (
          await this.client.request<{ product: Product }>(`./products/${encodeURI(product_id)}`, {
            signal,
          })
        ).product,
      );
    } catch (e) {
      this.logger.function(e, 'Products.get', { product_id });

      throw e;
    }
  }

  /**
   * Create a new product (as a draft).
   *
   * **Only available with the `edit_products` or `account` scope.**
   */
  async create(
    name: string,
    price: number,
    options: {
      /**
       * Native type of the product.
       * Cannot be changed later
       *
       * @default 'digital'
       */
      native_type?: 'digital' | 'course' | 'ebook' | 'membership' | 'bundle' | 'coffee' | 'call' | 'commission';

      /** The product description in HTML */
      description?: string;

      /** The custom URL slug for the product */
      custom_permalink?: string;

      /** ISO currency code; defaults to your account currency */
      price_currency_type?: string;

      /** For `membership` only */
      subscription_duration?: Recurrence;

      /** Set to `true` if want to enable pay-what-you-want */
      customizable_price?: boolean;

      /** Suggested price in cents */
      suggested_price_cents?: number;

      /** The number of maximum purchase allowed for the product */
      max_purchase_count?: number;

      taxonomy_id?: string;

      /** Array of tag strings */
      tags?: string[];

      /** The custom summary shown to buyers */
      custom_summary?: string;

      /** Array of files to attach */
      files?: { id?: string; url: string }[];
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<Product & ProductProps> {
    try {
      assertNonBlankString(name, "Argument 'name'");
      assertNumber(price, "Argument 'price'");

      const {
        native_type,
        description,
        custom_permalink,
        price_currency_type,
        subscription_duration,
        customizable_price,
        suggested_price_cents,
        max_purchase_count,
        taxonomy_id,
        tags,
        custom_summary,
        files,
      } = options;

      if (typeof tags !== 'undefined') {
        assertArray(tags, "'options.tags'");

        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];

          assertNonBlankString(tag, `'options.tags[${i}]'`);
        }
      }

      return this._bindProduct(
        (
          await this.client.request<{ product: Product }>('./products', {
            method: 'POST',
            params: {
              native_type,
              description,
              custom_permalink,
              price_currency_type,
              subscription_duration,
              customizable_price,
              suggested_price_cents,
              max_purchase_count,
              taxonomy_id,
              tags,
              custom_summary,
              files,
            },
            signal,
          })
        ).product,
      );
    } catch (e) {
      this.logger.function(e, 'Products.create', {
        name,
        price,
        options,
      });

      throw e;
    }
  }

  /**
   * Permanently delete a product.
   *
   * @param product_id The id of the product to delete
   *
   * @returns On success, `true`
   *
   * @see https://app.gumroad.com/api#delete-/products/:id
   */
  async delete(product_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<true> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      await this.client.request(`./products/${encodeURI(product_id)}`, {
        method: 'DELETE',
        signal,
      });

      return true;
    } catch (e) {
      this.logger.function(e, 'Products.delete', { product_id });

      throw e;
    }
  }

  /**
   * Enable an existing product.
   *
   * @param product_id The id of the product to enable
   *
   * @returns On success, a {@link Product}
   *
   * @see https://app.gumroad.com/api#put-/products/:id/enable
   */
  async enable(product_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Product & ProductProps> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      return this._bindProduct(
        (
          await this.client.request<{ product: Product }>(`./products/${encodeURI(product_id)}/enable`, {
            method: 'PUT',
            signal,
          })
        ).product,
      );
    } catch (e) {
      this.logger.function(e, 'Products.enable', { product_id });

      throw e;
    }
  }

  /**
   * Disable an existing product.
   *
   * @param product_id The id of the product to disable
   *
   * @returns On success, a {@link Product}
   *
   * @see https://app.gumroad.com/api#put-/products/:id/disable
   */
  async disable(product_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<Product & ProductProps> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      return this._bindProduct(
        (
          await this.client.request<{ product: Product }>(`./products/${encodeURI(product_id)}/disable`, {
            method: 'PUT',
            signal,
          })
        ).product,
      );
    } catch (e) {
      this.logger.function(e, 'Products.disable', { product_id });

      throw e;
    }
  }
}
