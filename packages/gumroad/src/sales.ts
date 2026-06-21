import { Methods } from './methods';
import type { Sale } from './types';
import { addProperties, assertNonBlankString } from './utils';

/** Bindings for Array of {@link Sale} */
export interface SalesProps {
	/** The key for next page of sales if available */
	readonly next_page_key: string | undefined;

	/** The API endpoint for next page of sales if available */
	readonly next_page_url: string | undefined;

	/**
	 * Retrieves the next successful sales
	 *
	 * @returns On success, an Array of {@link Sale} | `null` if next page does not exists
	 */
	next(requestOptions?: {
		signal?: AbortSignal;
	}): Promise<((Sale & SaleProps)[] & SalesProps) | null>;
}

/** Bindings for {@link Sale} */
export interface SaleProps {
	/**
	 * Marks the sale as shipped
	 *
	 * @returns On success, a {@link Sale}
	 */
	markAsShipped(
		options: { tracking_url?: string | undefined },
		requestOptions?: { signal?: AbortSignal },
	): Promise<Sale & SaleProps>;

	/**
	 * Refunds the sale
	 *
	 * @returns On success, a {@link Sale}
	 */
	refund(
		options: { amount_cents?: number | undefined },
		requestOptions?: { signal?: AbortSignal },
	): Promise<Sale & SaleProps>;
}

/** A class having API methods related to Sales */
export class SalesMethods extends Methods {
	protected _bindSales(object: {
		next_page_url?: string;
		next_page_key?: string;
		sales: Sale[];
	}): (Sale & SaleProps)[] & SalesProps {
		const properties: SalesProps = {
			next_page_key: object.next_page_key,
			next_page_url: object.next_page_url,
			next: async ({ signal } = {}) => {
				if (object.next_page_url) {
					return this._bindSales(
						await this.client.request<typeof object>(object.next_page_url, {
							signal,
						}),
					);
				}

				return null;
			},
		};

		return addProperties(
			object.sales.map((sale) => this._bindSale(sale)),
			properties,
		);
	}

	protected _bindSale(sale: Sale): Sale & SaleProps {
		const properties: SaleProps = {
			markAsShipped: async (options, requestOptions) =>
				this.markAsShipped(sale.id, options, requestOptions),

			refund: async (options, requestOptions) =>
				this.refund(sale.id, options, requestOptions),
		};

		return addProperties(sale, properties);
	}

	/**
	 * Retrieves all of the successful sales by the authenticated user.
	 *
	 * @param options (Optional) Options
	 *
	 * @returns On success, an Array of {@link Sales}
	 *
	 * @see https://app.gumroad.com/api#get-/sales
	 *
	 * **Only available with the `view_sales` scope**
	 */
	async list(
		options: {
			/** Date in form `YYYY-MM-DD` - Only return sales after this date */
			after?: string;

			/** Date in form `YYYY-MM-DD` - Only return sales before this date */
			before?: string;

			/** Filter sales by this product */
			product_id?: string;

			/** Filter sales by this email */
			email?: string;

			/** Filter sales by this Order ID */
			order_id?: string;

			/** Filter sales by customer name */
			name?: string;

			/** Filter sales by license key */
			license_key?: string;

			/** A key representing a page of results. It is given in the response as `next_page_key`. */
			page_key?: string;
		} = {},
		{ signal }: { signal?: AbortSignal } = {},
	): Promise<(Sale & SaleProps)[] & SalesProps> {
		try {
			const {
				after,
				before,
				product_id,
				email,
				order_id,
				name,
				license_key,
				page_key,
			} = options;

			return this._bindSales(
				await this.client.request<{
					next_page_url?: string;
					next_page_key?: string;
					sales: Sale[];
				}>('./sales', {
					params: {
						after,
						before,
						product_id,
						email,
						order_id,
						name,
						license_key,
						page_key,
					},
					signal,
				}),
			);
		} catch (e) {
			this.logger.function(e, 'Sales.list', {
				options,
			});

			throw e;
		}
	}

	/**
	 * Retrieves the details of a sale by this user
	 *
	 * @param sale_id The id of the sale
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#get-/sales/:id
	 *
	 * **Only available with the `view_sales` scope**
	 */
	async get(
		sale_id: string,
		{ signal }: { signal?: AbortSignal } = {},
	): Promise<Sale & SaleProps> {
		try {
			assertNonBlankString(sale_id, "Argument 'sale_id'");

			return this._bindSale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}`,
						{
							signal,
						},
					)
				).sale,
			);
		} catch (e) {
			this.logger.function(e, 'Sales.get', { sale_id });

			throw e;
		}
	}

	/**
	 * Marks a sale as shipped.
	 *
	 * @param sale_id The id of the sale
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/mark_as_shipped
	 *
	 * **Only available with the `mark_sales_as_shipped` scope**
	 */
	async markAsShipped(
		sale_id: string,
		options: {
			/** The tracking url */
			tracking_url?: string;
		} = {},
		{ signal }: { signal?: AbortSignal } = {},
	): Promise<Sale & SaleProps> {
		try {
			assertNonBlankString(sale_id, "Argument 'sale_id'");

			const { tracking_url } = options;

			return this._bindSale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/mark_as_shipped`,
						{
							params: { tracking_url },
							signal,
						},
					)
				).sale,
			);
		} catch (e) {
			this.logger.function(e, 'Sales.markAsShipped', { sale_id, options });

			throw e;
		}
	}

	/**
	 * Refunds a sale.
	 *
	 * @param sale_id The id of the sale
	 *
	 * @returns On success, a {@link Sale}
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/refund
	 *
	 * **Only available with the `refund_sales` scope**
	 */
	async refund(
		sale_id: string,
		options: {
			/**
			 * Amount in cents (in currency of the sale) to be refunded.
			 * If set, issue partial refund by this amount.
			 * If not set, issue full refund.
			 * You can issue multiple partial refunds per sale until it is fully refunded.
			 */
			amount_cents?: number;
		} = {},
		{ signal }: { signal?: AbortSignal } = {},
	): Promise<Sale & SaleProps> {
		try {
			assertNonBlankString(sale_id, "Argument 'sale_id'");

			const { amount_cents } = options;

			return this._bindSale(
				(
					await this.client.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/refund`,
						{
							params: { amount_cents },
							signal,
						},
					)
				).sale,
			);
		} catch (e) {
			this.logger.function(e, 'Sales.refund', { sale_id, options });

			throw e;
		}
	}
}
