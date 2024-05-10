import type { Sale } from "./types";
import { addProperties, validators } from "./utils";
import { Methods } from "./methods";

/**
 * Bindings for Array of {@link Sale}
 */
export interface SalesProps {
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
	next(): Promise<(Sale[] & SalesProps) | null>;
}

/**
 * Bindings for {@link Sale}
 */
export interface SaleProps {
	/**
	 * Marks the sale as shipped
	 *
	 * @param tracking_url (Optional) The tracking url
	 *
	 * @returns On success, a {@link Sale}
	 */
	markAsShipped(tracking_url?: string | undefined): Promise<Sale & SaleProps>;

	/**
	 * Refunds the sale
	 *
	 * @param amount_cents The amount in cents
	 *
	 * @returns On success, a {@link Sale}
	 */
	refund(amount_cents?: number | undefined): Promise<Sale & SaleProps>;
}

/**
 * A class having API methods related to Sales
 */
export class Sales extends Methods {
	protected _bind_sales(object: {
		next_page_url?: string;
		next_page_key?: string;
		sales: Sale[];
	}) {
		const properties: SalesProps = {
			next_page_key: object.next_page_key,
			next_page_url: object.next_page_url,
			next: async () => {
				if (object.next_page_url) {
					return this._bind_sales(
						await this.client.request<typeof object>(object.next_page_url)
					);
				}

				return null;
			}
		};

		return addProperties(
			object.sales.map((sale) => this._bind_sale(sale)),
			properties
		);
	}

	protected _bind_sale(sale: Sale) {
		const properties: SaleProps = {
			markAsShipped: async (tracking_url) =>
				this.markAsShipped(sale.id, tracking_url),

			refund: async (amount_cents) => this.refund(sale.id, amount_cents)
		};

		return addProperties(sale, properties);
	}

	/**
	 * **Only available with the `view_sales` scope**
	 *
	 * Retrieves all of the successful sales by the authenticated user.
	 *
	 * @param options (Optional) Options
	 *
	 * @returns On success, an Array of {@link Sales}
	 *
	 * @see https://app.gumroad.com/api#get-/sales
	 */
	async list(options?: {
		/**
		 * Date in form `YYYY-MM-DD` - Only return sales after this date
		 */
		after?: string;
		/**
		 * Date in form `YYYY-MM-DD` - Only return sales before this date
		 */
		before?: string;
		/**
		 * Filter sales by this product
		 */
		product_id?: string;
		/**
		 * Filter sales by this email
		 */
		email?: string;
		/**
		 * Filter sales by this Order ID
		 */
		order_id?: string;
		/**
		 * A key representing a page of results. It is given in the response as `next_page_key`.
		 */
		page_key?: string;
	}) {
		try {
			return this._bind_sales(
				await this.client.request<{
					next_page_url?: string;
					next_page_key?: string;
					sales: Sale[];
				}>("./sales", {
					params: options
				})
			);
		} catch (e) {
			this.logger.function(e, "Sales.list", { options });

			throw e;
		}
	}

	/**
	 * **Only available with the `view_sales` scope**
	 *
	 * Retrieves the details of a sale by this user
	 *
	 * @param sale_id The id of the sale
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#get-/sales/:id
	 */
	async get(sale_id: string) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this._bind_sale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}`
					)
				).sale
			);
		} catch (e) {
			this.logger.function(e, "Sales.get", { sale_id });

			throw e;
		}
	}

	/**
	 * **Only available with the `mark_sales_as_shipped` scope**
	 *
	 * Marks a sale as shipped.
	 *
	 * @param sale_id The id of the sale
	 * @param tracking_url (Optional) The tracking url
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/mark_as_shipped
	 */
	async markAsShipped(sale_id: string, tracking_url?: string) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this._bind_sale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/mark_as_shipped`,
						{ params: { tracking_url } }
					)
				).sale
			);
		} catch (e) {
			this.logger.function(e, "Sales.markAsShipped", { sale_id, tracking_url });

			throw e;
		}
	}

	/**
	 * **Only available with the `refund_sales` scope**
	 *
	 * Refunds a sale.
	 *
	 * @param sale_id The id of the sale
	 * @param amount_cents Amount in cents (in currency of the sale) to be refunded.
	 * If set, issue partial refund by this amount.
	 * If not set, issue full refund.
	 * You can issue multiple partial refunds per sale until it is fully refunded.
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/refund
	 */
	async refund(sale_id: string, amount_cents?: number) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this._bind_sale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/refund`,
						{ params: { amount_cents } }
					)
				).sale
			);
		} catch (e) {
			this.logger.function(e, "Sales.refund", { sale_id, amount_cents });

			throw e;
		}
	}
}
