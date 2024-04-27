/* eslint-disable camelcase */

import { addProperties } from "./utils";
import { type Gumroad } from "./gumroad";
import type {
	Product,
	VariantCategory,
	Variant,
	Sale,
	CustomField,
	OfferCode,
	Purchase,
	ResourceSubscription
} from "./types";

/**
 * Bindings for {@link Product}
 */
export type ProductMethods = {
	/**
	 * Deletes the product
	 *
	 * @returns On success, `true` | `false` if the product was not deleted
	 */
	readonly delete: () => Promise<boolean>;

	/**
	 * Enables the product
	 *
	 * @returns On success, a {@link Product} | can also be `null`
	 */
	readonly enable: () => Promise<(Product & ProductMethods) | null>;

	/**
	 * Disables the product
	 *
	 * @returns On success, a {@link Product} | can also be `null`
	 */
	readonly disable: () => Promise<(Product & ProductMethods) | null>;
};

export type VariantCategoryMethods = {
	/**
	 * Updates the variant category
	 *
	 * @param title The new title for the variant category
	 *
	 * @returns On success, a {@link VariantCategory} | can also be `null`
	 */
	readonly update: (
		title: string
	) => Promise<(VariantCategory & VariantCategoryMethods) | null>;

	/**
	 * Deletes the variant category
	 *
	 * @returns On success, `true` | `false` if the variant category was not deleted
	 */
	readonly delete: () => Promise<boolean>;
};

/**
 * Bindings for {@link Variant}
 */
export type VariantMethods = {
	/**
	 * Updates the variant
	 *
	 * @param options Options, provide at-least one property (`name`, `price_difference_cents` or `max_purchase_count`)
	 *
	 * @returns On success, a {@link Variant} | can also be `null`
	 */
	readonly update: (options: {
		name?: string | undefined;
		price_difference_cents?: number | undefined;
		max_purchase_count?: number | undefined;
	}) => Promise<(Variant & VariantMethods) | null>;

	/**
	 *
	 * @returns On success, `true` | `false` if the variant was not deleted
	 */
	readonly delete: () => Promise<boolean>;
};

/**
 * Bindings for Array of {@link Sale}
 */
export type SalesMethods = {
	/**
	 * The key for next page of sales if available
	 */
	readonly next_page_key: string | undefined;

	/**
	 * The API endpoint for next page of sales if available
	 */
	readonly next_page_url: string | undefined;

	/**
	 * Retrieves the next successful sales
	 *
	 * @returns On success, an Array of {@link Sale} | `null` if next page does not exists
	 */
	readonly next: () => Promise<(Sale[] & SalesMethods) | null>;
};

/**
 * Bindings for {@link Sale}
 */
export type SaleMethods = {
	/**
	 * Marks the sale as shipped
	 *
	 * @param tracking_url (Optional) The tracking url
	 *
	 * @returns On success, a {@link Sale} | can also be `null`
	 */
	readonly markAsShipped: (
		tracking_url?: string | undefined
	) => Promise<(Sale & SaleMethods) | null>;

	/**
	 * Refunds the sale
	 *
	 * @param amount_cents The amount in cents
	 *
	 * @returns On success, a {@link Sale} | can also be `null`
	 */
	readonly refund: (
		amount_cents?: number | undefined
	) => Promise<(Sale & SaleMethods) | null>;
};

/**
 * Bindings for {@link CustomField}
 */
export type CustomFieldMethods = {
	/**
	 * Updates the custom field
	 *
	 * @param options Options
	 *
	 * @returns On success, a {@link CustomField} | can also be `null`
	 */
	readonly update: (options: {
		name?: string | undefined;
		required?: boolean | undefined;
		type?: "text" | "checkbox" | "terms" | undefined;
		variant?: string | undefined;
	}) => Promise<(CustomField & CustomFieldMethods) | null>;

	/**
	 * Deletes the custom field
	 *
	 * @returns On success `true` | `false` if the custom field was not deleted
	 */
	readonly delete: () => Promise<boolean>;
};

/**
 * Bindings for {@link OfferCode}
 */
export type OfferCodeMethods = {
	/**
	 * Updates the offer code
	 *
	 * @param options Options
	 *
	 * @returns On success, a {@link OfferCode} | can also be `null`
	 */
	readonly update: (
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
			  }
	) => Promise<(OfferCode & OfferCodeMethods) | null>;

	/**
	 * Deletes the offer code
	 *
	 * @returns On success, `true` | `false` if the offer code was not deleted
	 */
	readonly delete: () => Promise<boolean>;
};

/**
 * Bindings for {@link ResourceSubscription}
 */
export type ResourceSubscriptionMethods = {
	/**
	 * Deletes the resource subscription
	 *
	 * @returns On success, `true` | `false` if the resource subscription was not deleted
	 */
	readonly delete: () => Promise<boolean>;
};

/**
 * Props for {@link Purchase}
 */
export type PurchaseProps = {
	/**
	 * The number of license uses
	 */
	license_uses: number;
};

/**
 * Bindings for {@link Purchase}
 */
export type PurchaseMethods = {
	/**
	 * Verifies the license of the purchase
	 *
	 * @param increment_uses_count If `true`, increment the uses count of a license. Default: `true`
	 *
	 * @returns On success, a {@link Purchase} | can also be `null`
	 */
	readonly verify: (
		increment_uses_count?: boolean
	) => Promise<(Purchase & PurchaseProps & PurchaseMethods) | null>;

	/**
	 * Enables the license of the purchase
	 *
	 * @returns On success, a {@link Purchase} | can also be `null`
	 */
	readonly enable: () => Promise<
		(Purchase & PurchaseProps & PurchaseMethods) | null
	>;

	/**
	 * Disables the license of the purchase
	 *
	 * @returns On success, a {@link Purchase} | can also be `null`
	 */
	readonly disable: () => Promise<
		(Purchase & PurchaseProps & PurchaseMethods) | null
	>;

	/**
	 * Decrement the uses count of the license of the product
	 *
	 * @returns On success, a {@link Purchase} | can also be `null`
	 */
	readonly decrementUsesCount: () => Promise<
		(Purchase & PurchaseProps & PurchaseMethods) | null
	>;
};

/**
 * Creates an object which can be used adding bindings
 *
 * @param gumroad The {@link Gumroad} for which bindings should be created
 *
 * @returns An object containing methods for adding bindings
 */
export const createBindings = (gumroad: Gumroad) => ({
	// Bindings for `Product` object
	product(product: Product) {
		const methods: ProductMethods = {
			async delete(this: Product) {
				return gumroad.deleteProduct(this.id);
			},

			async enable(this: Product) {
				return gumroad.enableProduct(this.id);
			},

			async disable(this: Product) {
				return gumroad.disableProduct(this.id);
			}
		};

		return addProperties(product, methods);
	},

	// Bindings for `VariantCategory` object
	variant_category(variant_category: VariantCategory, product_id: string) {
		const methods: VariantCategoryMethods = {
			async update(this: VariantCategory, title: string) {
				return gumroad.updateVariantCategory(product_id, this.id, title);
			},

			async delete(this: VariantCategory) {
				return gumroad.deleteVariantCategory(product_id, this.id);
			}
		};

		return addProperties(variant_category, methods);
	},

	// Bindings for `Variant` object
	variant(variant: Variant, product_id: string, variant_category_id: string) {
		const methods: VariantMethods = {
			async update(
				this: Variant,
				update_options: {
					name?: string | undefined;
					price_difference_cents?: number | undefined;
					max_purchase_count?: number | undefined;
				}
			) {
				return gumroad.updateVariant(
					product_id,
					variant_category_id,
					this.id,
					update_options
				);
			},

			async delete(this: Variant) {
				return gumroad.deleteVariant(product_id, variant_category_id, this.id);
			}
		};

		return addProperties(variant, methods);
	},

	// Bindings for `Sale[]`
	sales(object: {
		next_page_url?: string;
		next_page_key?: string;
		sales: Sale[];
	}) {
		const methods: SalesMethods = {
			next_page_key: object.next_page_key,
			next_page_url: object.next_page_url,
			async next(this: typeof object) {
				if (this.next_page_url) {
					// @ts-expect-error we cannot do it without accessing bindings property
					return gumroad.bindings.sales(
						// @ts-expect-error we cannot do it without accessing request method
						await gumroad.request<typeof object>(this.next_page_url)
					);
				}
				return null;
			}
		};

		return addProperties(object.sales, methods);
	},

	// Bindings for `Sale` object
	sale(sale: Sale) {
		const methods: SaleMethods = {
			async markAsShipped(this: Sale, tracking_url?: string | undefined) {
				return gumroad.markSaleAsShipped(this.id, tracking_url);
			},

			async refund(this: Sale, amount_cents?: number | undefined) {
				return gumroad.refundSale(this.id, amount_cents);
			}
		};

		return addProperties(sale, methods);
	},

	// Bindings for `CustomField` object
	custom_field(custom_field: CustomField, product_id: string) {
		const methods: CustomFieldMethods = {
			async update(
				this: CustomField,
				update_options: {
					name?: string | undefined;
					required?: boolean | undefined;
					type?: "text" | "checkbox" | "terms" | undefined;
					variant?: string | undefined;
				}
			) {
				return gumroad.updateCustomField(product_id, this.name, update_options);
			},

			async delete(this: CustomField) {
				return gumroad.deleteCustomField(product_id, this.name);
			}
		};

		return addProperties(custom_field, methods);
	},

	// Bindings for `OfferCode` object
	offer_code(offer_code: OfferCode, product_id: string) {
		const methods: OfferCodeMethods = {
			async update(
				this: OfferCode,
				update_options:
					| {
							offer_code: string;
					  }
					| {
							max_purchase_count: number;
					  }
					| {
							offer_code: string;
							max_purchase_count: number;
					  }
			) {
				return gumroad.updateOfferCode(product_id, this.id, update_options);
			},

			async delete(this: OfferCode) {
				return gumroad.deleteOfferCode(product_id, this.id);
			}
		};

		return addProperties(offer_code, methods);
	},

	// Bindings for `ResourceSubscription` object
	resource_subscription(resource_subscription: ResourceSubscription) {
		const methods: ResourceSubscriptionMethods = {
			async delete(this: ResourceSubscription) {
				return gumroad.deleteResourceSubscription(this.id);
			}
		};

		return addProperties(resource_subscription, methods);
	},

	// Bindings for `Purchase` object
	purchase(object: { uses: number; purchase: Purchase }) {
		const methods: PurchaseMethods = {
			async verify(this: Purchase, increment_uses_count?: boolean) {
				return gumroad.verifyLicense(
					this.product_id,
					this.license_key,
					increment_uses_count
				);
			},

			async enable(this: Purchase) {
				if (this.license_key) {
					return gumroad.enableLicense(this.product_id, this.license_key);
				}
				return null;
			},

			async disable(this: Purchase) {
				if (this.license_key) {
					return gumroad.disableLicense(this.purchaser_id, this.license_key);
				}
				return null;
			},

			async decrementUsesCount(this: Purchase) {
				if (this.license_key) {
					return gumroad.decrementUsesCount(this.product_id, this.license_key);
				}
				return null;
			}
		};

		const properties: PurchaseProps = { license_uses: object.uses };

		return addProperties(object.purchase, methods, properties);
	}
});

export type Bindings = ReturnType<typeof createBindings>;
