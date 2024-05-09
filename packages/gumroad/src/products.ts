import type { Product } from "./types";
import { addProperties, validators } from "./utils";
import { Methods } from "./methods";

/**
 * Bindings for {@link Product}
 */
export interface ProductProps {
	/**
	 * Deletes the product
	 *
	 * @returns On success, `true`
	 */
	readonly delete: () => Promise<true>;

	/**
	 * Enables the product
	 *
	 * @returns On success, a {@link Product}
	 */
	readonly enable: () => Promise<Product & ProductProps>;

	/**
	 * Disables the product
	 *
	 * @returns On success, a {@link Product}
	 */
	readonly disable: () => Promise<Product & ProductProps>;
}

/**
 * A class having API methods related to Products
 */
export class Products extends Methods {
	protected _bind_product(product: Product) {
		const properties: ProductProps = {
			delete: async () => this.delete(product.id),

			enable: async () => this.enable(product.id),

			disable: async () => this.disable(product.id)
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
	async list() {
		try {
			return (
				await this.client.request<{ products: Product[] }>("./products")
			).products.map((product) => this._bind_product(product));
		} catch (e) {
			this.logger.function(e, "Products.list");

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
	async get(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this._bind_product(
				(
					await this.client.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}`
					)
				).product
			);
		} catch (e) {
			this.logger.function(e, "Products.get", { product_id });

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
	async delete(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			await this.client.request(`./products/${encodeURI(product_id)}`, {
				method: "DELETE"
			});

			return true as const;
		} catch (e) {
			this.logger.function(e, "Products.delete", { product_id });

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
	async enable(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this._bind_product(
				(
					await this.client.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}/enable`,
						{
							method: "PUT"
						}
					)
				).product
			);
		} catch (e) {
			this.logger.function(e, "Products.enable", { product_id });

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
	async disable(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this._bind_product(
				(
					await this.client.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}/disable`,
						{
							method: "PUT"
						}
					)
				).product
			);
		} catch (e) {
			this.logger.function(e, "Products.disable", { product_id });

			throw e;
		}
	}
}
