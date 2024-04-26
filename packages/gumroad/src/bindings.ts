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

export type ProductMethods = {
	/**
	 * Deletes the product
	 *
	 * @returns `true` on success
	 */
	delete(): Promise<boolean>;

	/**
	 * Enables the product
	 *
	 * @returns `Product` on success, null if not found
	 */
	enable(): Promise<(Product & ProductMethods) | null>;

	/**
	 * Disables the product
	 *
	 * @returns `Product` on success, null if not found
	 */
	disable(): Promise<(Product & ProductMethods) | null>;
};

export type VariantCategoryMethods = {
	update(
		title: string
	): Promise<(VariantCategory & VariantCategoryMethods) | null>;
	delete(): Promise<boolean>;
};

export type VariantMethods = {
	update(options: {
		name?: string | undefined;
		price_difference_cents?: number | undefined;
		max_purchase_count?: number | undefined;
	}): Promise<(Variant & VariantMethods) | null>;
	delete(): Promise<boolean>;
};

export type SalesMethods = {
	next_page_key: string | undefined;
	next: (() => Promise<Sale[] & SalesMethods>) | undefined;
};

export type SaleMethods = {
	markAsShipped(
		tracking_url?: string | undefined
	): Promise<(Sale & SaleMethods) | null>;
	refund(
		amount_cents?: number | undefined
	): Promise<(Sale & SaleMethods) | null>;
};

export type CustomFieldMethods = {
	update(options: {
		name?: string | undefined;
		required?: boolean | undefined;
		type?: "text" | "checkbox" | "terms" | undefined;
		variant?: string | undefined;
	}): Promise<null | (CustomField & CustomFieldMethods)>;
	delete(this: CustomField): Promise<boolean>;
};

export type OfferCodeMethods = {
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
			  }
	): Promise<(OfferCode & OfferCodeMethods) | null>;
	delete(): Promise<boolean>;
};

export type ResourceSubscriptionMethods = {
	delete(): Promise<boolean>;
};

export type PurchaseProps = {
	license_uses: number;
};

export type PurchaseMethods = {
	verify(
		increment_uses_count?: boolean
	): Promise<(Purchase & PurchaseProps & PurchaseMethods) | null>;
	enable(): Promise<(Purchase & PurchaseProps & PurchaseMethods) | null>;
	disable(): Promise<(Purchase & PurchaseProps & PurchaseMethods) | null>;
	decrementUsesCount(): Promise<
		(Purchase & PurchaseProps & PurchaseMethods) | null
	>;
};

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
			next: object.next_page_url
				? async function next(this: typeof object) {
						// @ts-expect-error we cannot do it without accessing bindings property
						return gumroad.bindings.sales(
							// @ts-expect-error we cannot do it without accessing request method
							await gumroad.request<typeof object>(
								(this.next_page_url as string).replace(/^\/v2/, "")
							)
						);
					}
				: undefined
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
				return gumroad.enableLicense(this.product_id, this.license_key);
			},

			async disable(this: Purchase) {
				return gumroad.disableLicense(this.purchaser_id, this.license_key);
			},

			async decrementUsesCount(this: Purchase) {
				return gumroad.decrementUsesCount(this.product_id, this.license_key);
			}
		};

		const properties: PurchaseProps = { license_uses: object.uses };

		return addProperties(object.purchase, methods, properties);
	}
});

export type Bindings = ReturnType<typeof createBindings>;
