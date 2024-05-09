import type { VariantCategory } from "./types";
import { addProperties, validators } from "./utils";
import { Methods } from "./methods";

/**
 * Bindings for {@link VariantCategory}
 */
export interface VariantCategoryProps {
	/**
	 * Updates the variant category
	 *
	 * @param title The new title for the variant category
	 *
	 * @returns On success, a {@link VariantCategory}
	 */
	readonly update: (
		title: string
	) => Promise<VariantCategory & VariantCategoryProps>;

	/**
	 * Deletes the variant category
	 *
	 * @returns On success, `true`
	 */
	readonly delete: () => Promise<true>;
}

/**
 * A class having API methods related to Variant Categories
 */
export class VariantCategories extends Methods {
	protected _bind_variant_category(
		variant_category: VariantCategory,
		product_id: string
	) {
		const properties: VariantCategoryProps = {
			update: async (title) =>
				this.update(product_id, variant_category.id, title),

			delete: async () => this.delete(product_id, variant_category.id)
		};

		return addProperties(variant_category, properties);
	}

	/**
	 * Retrieve all of the existing variant categories of a product.
	 *
	 * @param product_id The id of the product
	 *
	 * @returns On success, An array of {@link VariantCategory}
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories
	 */
	async list(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return (
				await this.client.request<{
					variant_categories: VariantCategory[];
				}>(`./products/${encodeURI(product_id)}/variant_categories`)
			).variant_categories.map((variant_category) =>
				this._bind_variant_category(variant_category, product_id)
			);
		} catch (e) {
			this.logger.function(e, "VariantCategories.list", { product_id });

			throw e;
		}
	}

	/**
	 * Retrieve the details of a variant category of a product.
	 *
	 * @param product_id The id the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, a {@link VariantCategory}
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:id
	 */
	async get(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			return this._bind_variant_category(
				(
					await this.client.request<{ variant_category: VariantCategory }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}`
					)
				).variant_category,
				product_id
			);
		} catch (e) {
			this.logger.function(e, "VariantCategories.get", {
				product_id,
				variant_category_id
			});

			throw e;
		}
	}

	/**
	 * Create a new variant category on a product.
	 *
	 * @param product_id The id of the product
	 * @param title The title for the variant category
	 *
	 * @returns On success, a {@link VariantCategory}
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/variant_categories
	 */
	async create(product_id: string, title: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(title, "Argument 'title'");

			return this._bind_variant_category(
				(
					await this.client.request<{ variant_category: VariantCategory }>(
						`./products/${encodeURI(product_id)}/variant_categories`,
						{ method: "POST", params: { title } }
					)
				).variant_category,
				product_id
			);
		} catch (e) {
			this.logger.function(e, "createVariantCategory", { product_id, title });

			throw e;
		}
	}

	/**
	 * Edit a variant category of an existing product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 * @param title The new title for the variant category
	 *
	 * @returns On success, a {@link VariantCategory}
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/variant_categories/:id
	 */
	async update(product_id: string, variant_category_id: string, title: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(title, "Argument 'title'");

			return this._bind_variant_category(
				(
					await this.client.request<{ variant_category: VariantCategory }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}`,
						{
							method: "PUT",
							params: { title }
						}
					)
				).variant_category,
				product_id
			);
		} catch (e) {
			this.logger.function(e, "updateVariantCategory", {
				product_id,
				variant_category_id,
				title
			});

			throw e;
		}
	}

	/**
	 * Permanently delete a variant category of a product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, `true`
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/variant_categories/:id
	 */
	async delete(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			await this.client.request(
				`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}`,
				{
					method: "DELETE"
				}
			);

			return true as const;
		} catch (e) {
			this.logger.function(e, "deleteVariantCategory", {
				product_id,
				variant_category_id
			});

			throw e;
		}
	}
}
