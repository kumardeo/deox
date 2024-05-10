import type { Variant } from "./types";
import { addProperties, validators } from "./utils";
import { Methods } from "./methods";

/**
 * Bindings for {@link Variant}
 */
export interface VariantProps {
	/**
	 * Updates the variant
	 *
	 * @param options Options, provide at-least one property (`name`, `price_difference_cents` or `max_purchase_count`)
	 *
	 * @returns On success, a {@link Variant}
	 */
	update(options: {
		name?: string | undefined;
		price_difference_cents?: number | undefined;
		max_purchase_count?: number | undefined;
	}): Promise<Variant & VariantProps>;

	/**
	 *
	 * @returns On success, `true`
	 */
	delete(): Promise<true>;
}

/**
 * A class having API methods related to Variants
 */
export class Variants extends Methods {
	protected _bind_variant(
		variant: Variant,
		product_id: string,
		variant_category_id: string
	) {
		const properties: VariantProps = {
			update: async (update_options) =>
				this.update(
					product_id,
					variant_category_id,
					variant.id,
					update_options
				),

			delete: () => this.delete(product_id, variant_category_id, variant.id)
		};

		return addProperties(variant, properties);
	}

	/**
	 * Retrieve all of the existing variants in a variant category.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, an Array of {@link Variant}
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:variant_category_id/variants
	 */
	async list(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			return (
				await this.client.request<{ variants: Variant[] }>(
					`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants`
				)
			).variants.map((variant) =>
				this._bind_variant(variant, product_id, variant_category_id)
			);
		} catch (e) {
			this.logger.function(e, "Variants.list", {
				product_id,
				variant_category_id
			});

			throw e;
		}
	}

	/**
	 * Retrieve the details of a variant of a product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 * @param variant_id The id of the variant
	 *
	 * @returns On success, a {@link Variant}
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async get(
		product_id: string,
		variant_category_id: string,
		variant_id: string
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(variant_id, "Argument 'variant_id'");

			return this._bind_variant(
				(
					await this.client.request<{ variant: Variant }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants/${encodeURI(variant_id)}`
					)
				).variant,
				product_id,
				variant_category_id
			);
		} catch (e) {
			this.logger.function(e, "Variants.get", {
				product_id,
				variant_category_id,
				variant_id
			});

			throw e;
		}
	}

	/**
	 * Create a new variant of a product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of variant category
	 * @param name The name of the variant to create
	 * @param price_difference_cents The price difference in cents
	 * @param max_purchase_count (Optional) The maximum purchase count
	 *
	 * @returns On success, a {@link Variant}
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/variant_categories/:variant_category_id/variants
	 */
	async create(
		product_id: string,
		variant_category_id: string,
		name: string,
		price_difference_cents: number,
		max_purchase_count?: number
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(name, "Argument 'name'");

			return this._bind_variant(
				(
					await this.client.request<{ variant: Variant }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants`,
						{
							method: "POST",
							params: {
								name,
								price_difference_cents,
								max_purchase_count
							}
						}
					)
				).variant,
				product_id,
				variant_category_id
			);
		} catch (e) {
			this.logger.function(e, "Variants.create", {
				product_id,
				variant_category_id,
				name,
				price_difference_cents,
				max_purchase_count
			});

			throw e;
		}
	}

	/**
	 * Edit a variant of an existing product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 * @param variant_id The id of the category
	 * @param options Options, provide at-least one property (`name`, `price_difference_cents` or `max_purchase_count`)
	 *
	 * @returns On success, a {@link Variant}
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async update(
		product_id: string,
		variant_category_id: string,
		variant_id: string,
		options: {
			name?: string;
			price_difference_cents?: number;
			max_purchase_count?: number;
		}
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(variant_id, "Argument 'variant_id'");

			return this._bind_variant(
				(
					await this.client.request<{ variant: Variant }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants/${encodeURI(variant_id)}`,
						{
							method: "PUT",
							params: options
						}
					)
				).variant,
				product_id,
				variant_category_id
			);
		} catch (e) {
			this.logger.function(e, "Variants.update", {
				product_id,
				variant_category_id,
				variant_id,
				options
			});

			throw e;
		}
	}

	/**
	 * Permanently delete a variant of a product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 * @param variant_id The id of the variant
	 *
	 * @returns On success, `true`
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async delete(
		product_id: string,
		variant_category_id: string,
		variant_id: string
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(variant_id, "Argument 'variant_id'");

			await this.client.request(
				`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants/${encodeURI(variant_id)}`,
				{
					method: "DELETE"
				}
			);

			return true as const;
		} catch (e) {
			this.logger.function(e, "Variants.delete", {
				product_id,
				variant_category_id,
				variant_id
			});

			throw e;
		}
	}
}
