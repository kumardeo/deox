import { Methods } from './methods';
import type { CustomField } from './types';
import { addProperties, assertNonBlankString } from './utils';

/** Bindings for {@link CustomField} */
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

/** A class having API methods related to Custom Fields */
export class CustomFieldsMethods extends Methods {
  protected _bindCustomField(custom_field: CustomField, product_id: string): CustomField & CustomFieldProps {
    const methods: CustomFieldProps = {
      update: async (options, requestOptions) => this.update(product_id, custom_field.name, options, requestOptions),

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
  async list(product_id: string, { signal }: { signal?: AbortSignal } = {}): Promise<(CustomField & CustomFieldProps)[]> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      return (
        await this.client.request<{ custom_fields: CustomField[] }>(`./products/${encodeURI(product_id)}/custom_fields`, {
          signal,
        })
      ).custom_fields.map((custom_field) => this._bindCustomField(custom_field, product_id));
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
  ): Promise<CustomField & CustomFieldProps> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");

      const { type, required, variant } = options;

      return this._bindCustomField(
        (
          await this.client.request<{ custom_field: CustomField }>(`./products/${encodeURI(product_id)}/custom_fields`, {
            method: 'POST',
            params: {
              name,
              type: type && ['text', 'checkbox', 'terms'].includes(type) ? type : undefined,
              required: typeof required === 'boolean' ? required : undefined,
              variant,
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
      type?: 'text' | 'checkbox' | 'terms';
      required?: boolean;
      variant?: string;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<CustomField & CustomFieldProps> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");
      assertNonBlankString(name, "Argument 'name'");

      const { name: newName, type, required, variant } = options;

      return this._bindCustomField(
        (
          await this.client.request<{ custom_field: CustomField }>(`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`, {
            method: 'PUT',
            params: {
              type: type && ['text', 'checkbox', 'terms'].includes(type) ? type : undefined,
              required: typeof required === 'boolean' ? required : undefined,
              name: newName,
              variant: variant,
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
  async delete(product_id: string, name: string, { signal }: { signal?: AbortSignal } = {}): Promise<true> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");
      assertNonBlankString(name, "Argument 'name'");

      await this.client.request(`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`, {
        method: 'DELETE',
        signal,
      });

      return true;
    } catch (e) {
      this.logger.function(e, 'CustomFields.delete', { product_id, name });

      throw e;
    }
  }
}
