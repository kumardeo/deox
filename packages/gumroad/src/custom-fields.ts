import { Methods } from './methods';
import type { CustomField } from './types';
import { addProperties, validators } from './utils';

/**
 * Bindings for {@link CustomField}
 */
export interface CustomFieldProps {
  /**
   * Updates the custom field
   *
   * @param options Options
   *
   * @returns On success, a {@link CustomField}
   */
  update(
    options: {
      name?: string | undefined;
      required?: boolean | undefined;
      type?: 'text' | 'checkbox' | 'terms' | undefined;
      variant?: string | undefined;
    },
    requestOptions: { signal?: AbortSignal },
  ): Promise<CustomField & CustomFieldProps>;

  /**
   * Deletes the custom field
   *
   * @returns On success `true`
   */
  delete(requestOptions?: { signal?: AbortSignal }): Promise<true>;
}

/**
 * A class having API methods related to Custom Fields
 */
export class CustomFields extends Methods {
  protected _bind_custom_field(custom_field: CustomField, product_id: string) {
    const methods: CustomFieldProps = {
      update: async (update_options, requestOptions) => this.update(product_id, custom_field.name, update_options, requestOptions),

      delete: async (requestOptions) => this.delete(product_id, custom_field.name, requestOptions),
    };

    return addProperties(custom_field, methods);
  }

  /**
   * Retrieve all of the existing custom fields for a product.
   *
   * @param product_id The id of the product
   *
   * @returns On success, an Array of {@link CustomField}
   *
   * @see https://app.gumroad.com/api#get-/products/:product_id/custom_fields
   */
  async list(product_id: string, { signal }: { signal?: AbortSignal } = {}) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");

      return (
        await this.client.request<{ custom_fields: CustomField[] }>(`./products/${encodeURI(product_id)}/custom_fields`, {
          signal,
        })
      ).custom_fields.map((custom_field) => this._bind_custom_field(custom_field, product_id));
    } catch (e) {
      this.logger.function(e, 'CustomFields.list', { product_id });

      throw e;
    }
  }

  /**
   * Create a new custom field for a product.
   *
   * @param product_id The id of the product
   * @param name The name of the custom field to be created
   * @param options (Optional) Options
   *
   * @returns On success, a {@link CustomField}
   *
   * @see https://app.gumroad.com/api#post-/products/:product_id/custom_fields
   */
  async create(
    product_id: string,
    name: string,
    options: {
      required?: boolean;
      type?: 'text' | 'checkbox' | 'terms';
      variant?: string;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");

      return this._bind_custom_field(
        (
          await this.client.request<{ custom_field: CustomField }>(`./products/${encodeURI(product_id)}/custom_fields`, {
            method: 'POST',
            params: {
              name,
              type: options.type && ['text', 'checkbox', 'terms'].includes(options.type) ? options.type : 'text',
              required: typeof options.required === 'boolean' ? options.required : true,
              variant: options.variant,
            },
            signal,
          })
        ).custom_field,
        product_id,
      );
    } catch (e) {
      this.logger.function(e, 'CustomFields.create', {
        product_id,
        name,
        options,
      });

      throw e;
    }
  }

  /**
   * Edit an existing product's custom field.
   *
   * @param product_id The id of the product
   * @param name The name of the custom filed
   * @param options (Optional) Options
   *
   * @returns On success, a {@link CustomField}
   *
   * @see https://app.gumroad.com/api#put-/products/:product_id/custom_fields/:name
   */
  async update(
    product_id: string,
    name: string,
    options: {
      name?: string;
      required?: boolean;
      type?: 'text' | 'checkbox' | 'terms';
      variant?: string;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(name, "Argument 'name'");

      return this._bind_custom_field(
        (
          await this.client.request<{ custom_field: CustomField }>(`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`, {
            method: 'PUT',
            params: {
              type: options.type && ['text', 'checkbox', 'terms'].includes(options.type) ? options.type : 'text',
              required: typeof options.required === 'boolean' ? options.required : undefined,
              name: options.name,
              variant: options.variant,
            },
            signal,
          })
        ).custom_field,
        product_id,
      );
    } catch (e) {
      this.logger.function(e, 'CustomFields.update', {
        product_id,
        name,
        options,
      });

      throw e;
    }
  }

  /**
   * Permanently delete a product's custom field.
   *
   * @param product_id The id of the product
   * @param name The name of the custom field
   *
   * @returns On success, `true`
   *
   * @see https://app.gumroad.com/api#delete-/products/:product_id/custom_fields/:name
   */
  async delete(product_id: string, name: string, { signal }: { signal?: AbortSignal } = {}) {
    try {
      validators.notBlank(product_id, "Argument 'product_id'");
      validators.notBlank(name, "Argument 'name'");

      await this.client.request(`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`, {
        method: 'DELETE',
        signal,
      });

      return true as const;
    } catch (e) {
      this.logger.function(e, 'CustomFields.delete', { product_id, name });

      throw e;
    }
  }
}
