/* eslint-disable camelcase */

import clc from "console-log-colors";
import { type Bindings, createBindings } from "./bindings";
import { GumroadError, GumroadTypeError } from "./errors";
import { validators, error, parseDeepFormData } from "./utils";
import { request, type RequestOptions } from "./request";
import type {
	CustomField,
	MayBePromise,
	OfferCode,
	Product,
	Purchase,
	ResourceSubscription,
	ResourceSubscriptionName,
	Sale,
	Subscriber,
	UpdateMap,
	User,
	Variant,
	VariantCategory
} from "./types";

/**
 * A list of resource names currently supported by gumroad
 */
const resourceSubscriptionNames = [
	"sale",
	"refund",
	"dispute",
	"dispute_won",
	"cancellation",
	"subscription_updated",
	"subscription_ended",
	"subscription_restarted"
];

const updateNames = [...resourceSubscriptionNames, "ping"];

/**
 * An interface representing options for {@link Gumroad} constructor
 */
export interface GumroadOptions {
	/**
	 * Indicates whether to enable debug mode or not
	 *
	 * @default false
	 */
	debug?: boolean;
}

export type Context<T extends keyof UpdateMap = keyof UpdateMap> = {
	data: UpdateMap[T];
	// eslint-disable-next-line no-use-before-define
	api: Gumroad;
	type: T;
	vars: Record<string, any>;
};

export type Handler<T extends keyof UpdateMap = keyof UpdateMap> = (
	ctx: Context<T>,
	next: () => Promise<void>
) => MayBePromise<unknown>;

export type ErrorHandler = (err: Error, ctx: Context) => MayBePromise<unknown>;

export class Gumroad {
	/**
	 * Verify a license
	 *
	 * @param product_id The unique ID of the product, available on product's edit page
	 * @param license_key The license key provided by your customer
	 * @param increment_uses_count Increments license uses on successful verification, defaults to: `true`
	 *
	 * @returns On success, a {@link Purchase} | `null` if either product or license key was not found
	 *
	 * @see https://app.gumroad.com/api#post-/licenses/verify
	 */
	public static async verifyLicense(
		product_id: string,
		license_key: string,
		increment_uses_count?: boolean,
		options: { debug?: boolean } = {}
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(license_key, "Argument 'license_key'");

			return (
				await request<{ purchase: Purchase }>("./licenses/verify", null, {
					method: "POST",
					baseUrl: Gumroad.baseUrl,
					params: {
						product_id,
						license_key,
						increment_uses_count
					},
					debug: options.debug
				})
			).data.purchase;
		} catch (e) {
			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Base URL for the Gumroad API
	 */
	public static readonly baseUrl = "https://api.gumroad.com/v2/";

	/**
	 * Gumroad API access token
	 *
	 * @see https://help.gumroad.com/article/280-create-application-api
	 */
	private readonly accessToken: string;

	private readonly shouldDebug: boolean;

	private readonly bindings: Bindings;

	/**
	 * Creates an instance of {@link Gumroad}
	 *
	 * @param accessToken Gumroad API access token, read [guide](https://help.gumroad.com/article/280-create-application-api).
	 * @param options The {@link GumroadOptions}
	 */
	constructor(accessToken: string, options: GumroadOptions = {}) {
		if (typeof accessToken !== "string") {
			throw new GumroadTypeError("Argument 1 must be of type string");
		}

		if (accessToken.trim().length === 0) {
			throw new GumroadTypeError("Argument 1 cannot be a blank string");
		}

		this.accessToken = accessToken;

		this.shouldDebug =
			typeof options.debug === "boolean" ? options.debug : false;

		this.bindings = createBindings(this);
	}

	/**
	 * Method for making HTTP requests to Gumroad API
	 *
	 * @param path The path of the endpoint
	 * @param options Options
	 *
	 * @returns On success, the response data
	 */
	private async request<T extends NonNullable<unknown> = NonNullable<unknown>>(
		path: string,
		options: RequestOptions = {}
	) {
		return (
			await request<T>(path, this.accessToken, {
				...options,
				baseUrl: Gumroad.baseUrl,
				debug: this.shouldDebug
			})
		).data;
	}

	/**
	 * Logs error to console
	 *
	 * @param e The error object
	 * @param method The name of method which causes the error
	 * @param params The arguments passed as an object
	 */
	private logError(
		e: unknown,
		method: string,
		params?: Record<string, unknown>
	) {
		if (this.shouldDebug) {
			const stringified = params
				? Object.keys(params)
						.map((param) => {
							const value = params[param];
							let coloredValue: string;
							if (typeof value === "string" || value instanceof RegExp) {
								coloredValue = clc.green(JSON.stringify(value));
							} else if (value === null || value === undefined) {
								coloredValue = clc.yellow(String(value));
							} else {
								coloredValue = JSON.stringify(value);
							}
							return `${clc.red(param)}: ${coloredValue}`;
						})
						.join(", ")
				: "";

			// eslint-disable-next-line no-console
			console.log(
				`${clc.red("[gumroad:error]")} ${clc.yellow("Gumroad")}.${clc.blue(`${method}(`)}${stringified}${clc.blue(")")} ${clc.magenta("=>")}`,
				e
			);
		}
	}

	/**
	 * Record of events for handling pings
	 */
	private events: {
		[K in keyof UpdateMap]?: Handler<K>[];
	} = {};

	/**
	 * The error handler for the pings handlers
	 */
	private errorHandler: ErrorHandler | undefined;

	/**
	 * Registers an error handler for pings errors
	 * Note that if an error handler was previously set using this method, it will overwrite that.
	 * Only one handler can be registered
	 *
	 * @param handler An error handling function
	 */
	public onError(handler: ErrorHandler) {
		if (typeof handler !== "function") {
			throw new GumroadError(
				`Argument 'handler' must be of type function, provided type is ${typeof handler}`
			);
		}
		this.errorHandler = handler;

		return this;
	}

	/**
	 * Calls error handler
	 *
	 * @param err The `Error` object
	 * @param context The {@link Context}
	 */
	private async handleError(err: unknown, context: Context) {
		if (err instanceof Error && this.errorHandler) {
			await this.errorHandler(err, context);
		} else {
			throw err;
		}
	}

	/**
	 * Registers an handler for ping
	 *
	 * @param update_name The name of update
	 * @param handlers A function for handling the ping
	 */
	public on<T extends keyof UpdateMap>(
		update_name: T,
		...handlers: Handler<T>[]
	) {
		validators.notBlank(update_name, "Argument 'update_name'");
		if (!updateNames.includes(update_name)) {
			throw new GumroadTypeError(
				`Argument 'update_name' should be one of ${updateNames.map((name) => `"${name}"`).join(", ")} but provided: ${update_name}`
			);
		}

		if (!this.events[update_name]) {
			this.events[update_name] = [];
		}

		this.events[update_name]?.push(
			...handlers.filter((handler, i) => {
				if (typeof handler === "function") {
					return handler;
				}
				throw new GumroadTypeError(
					`Argument at position ${i + 2} must of type function, provided type is ${typeof handler}`
				);
			})
		);

		return this;
	}

	/**
	 * Compose
	 *
	 * @param handlers The handlers
	 * @param errorHandler The error handler
	 *
	 * @returns A function which can be used to dispatch events
	 */
	// eslint-disable-next-line class-methods-use-this
	private compose<T extends keyof UpdateMap>(
		handlers: Handler<T>[],
		errorHandler?: ErrorHandler
	) {
		return (context: Context<T>, next?: () => Promise<void>) => {
			let index = -1;

			async function dispatch(i: number) {
				if (i <= index) {
					throw new GumroadError("next() called multiple times");
				}

				index = i;
				let handler;

				if (handlers[i]) {
					handler = handlers[i];
				} else {
					handler = (i === handlers.length && next) || undefined;
				}

				if (handler) {
					try {
						await handler(context, () => dispatch(i + 1));
					} catch (err) {
						if (err instanceof Error && errorHandler) {
							await errorHandler(err, context);
						} else {
							throw err;
						}
					}
				}
			}

			return dispatch(0);
		};
	}

	/**
	 * Dispatches an event
	 *
	 * @param update_name The name of update (event)
	 * @param payload The payload for context
	 */
	private async dispatch<T extends keyof UpdateMap>(
		update_name: T,
		payload: UpdateMap[T]
	) {
		const handlers = this.events[update_name];

		if (handlers && handlers.length !== 0) {
			const context: Context<T> = {
				type: update_name,
				api: this,
				data: payload,
				vars: {}
			};

			// If there is only one handler
			if (handlers.length === 1) {
				try {
					await handlers[0](context, async () => {
						// No next handlers
					});
				} catch (err) {
					await this.handleError(err, context);
				}
			} else {
				await this.compose(handlers, this.errorHandler)(context);
			}
		}
	}

	/**
	 * Formats the payload data from gumroad ping
	 *
	 * @param payload The payload data
	 *
	 * @returns The same reference to the payload data but formatted
	 */
	// eslint-disable-next-line class-methods-use-this
	private formatPayload<T extends keyof UpdateMap>(payload: UpdateMap[T]) {
		// Validate card field
		if ("card" in payload) {
			const card = payload.card || {};
			card.visual =
				typeof card.visual === "string" && card.visual.trim().length !== 0
					? card.visual
					: null;
			card.type =
				typeof card.type === "string" && card.type.trim().length !== 0
					? card.type
					: null;
			card.bin =
				typeof card.bin === "string" && card.bin.trim().length !== 0
					? card.bin
					: null;
			card.expiry_month =
				typeof card.expiry_month === "string" &&
				(card.expiry_month as string).trim().length !== 0
					? Number(card.expiry_month)
					: null;
			card.expiry_year =
				typeof card.expiry_year === "string" &&
				(card.expiry_year as string).trim().length !== 0
					? Number(card.expiry_year)
					: null;

			payload.card = card;
		}

		return payload;
	}

	/**
	 * Handles a post request from gumroad ping
	 *
	 * @param req The `Request` object
	 * @param update_name The name of update
	 *
	 * @returns On success, a `Response` object with 200 status code
	 */
	public async handle<T extends keyof UpdateMap>(req: Request, update_name: T) {
		if (!(req instanceof Request)) {
			throw new GumroadTypeError(
				"Argument 'req' must be an instance of Request"
			);
		}

		if (req.bodyUsed) {
			throw new GumroadError(
				"Request body is already used, make sure you pass a Request with unused body. Tip: You can use .clone() method of Request to clone it before using its body."
			);
		}

		if (req.method.toUpperCase() !== "POST") {
			throw new GumroadError(
				`Request cannot be handled since only request with 'POST' method can be handled but the provided request's method is '${req.method.toUpperCase()}'`
			);
		}

		validators.notBlank(update_name, "Argument 'update_name'");
		if (!updateNames.includes(update_name)) {
			throw new GumroadTypeError(
				`Argument 'update_name' should be one of ${updateNames.map((name) => `"${name}"`).join(", ")} but provided: ${update_name}`
			);
		}

		const contentType = req.headers.get("Content-Type");
		if (!contentType) {
			throw new GumroadError("Request has no 'Content-Type' header");
		}
		let payload;
		if (
			contentType.startsWith("multipart/form-data") ||
			contentType.startsWith("application/x-www-form-urlencoded")
		) {
			payload = parseDeepFormData(await req.formData(), {
				parseBoolean: true,
				parseNull: true,
				parseNumber: true
			}) as UpdateMap[T];
		} else if (contentType.startsWith("application/json")) {
			payload = (await req.json()) as UpdateMap[T];
		} else {
			throw new GumroadError(`Content-Type '${contentType}' is not supported`);
		}

		await this.dispatch(update_name, this.formatPayload(payload));

		return new Response(null, { status: 200 });
	}

	/**
	 * Retrieve all of the existing products for the authenticated user.
	 *
	 * @returns On success, an Array of {@link Product}
	 *
	 * @see https://app.gumroad.com/api#get-/products
	 */
	public async listProducts() {
		try {
			return (
				await this.request<{ products: Product[] }>("./products")
			).products.map((product) => this.bindings.product(product));
		} catch (e) {
			this.logError(e, "listProducts");

			throw e;
		}
	}

	/**
	 * Retrieve the details of a product.
	 *
	 * @param product_id Id of the product
	 *
	 * @returns On success, a {@link Product} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:id
	 */
	public async getProduct(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this.bindings.product(
				(
					await this.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}`
					)
				).product
			);
		} catch (e) {
			this.logError(e, "getProduct", { product_id });

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Permanently delete a product.
	 *
	 * @param product_id The id of the product to delete
	 *
	 * @returns On success, `true` | `false` if product was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:id
	 */
	async deleteProduct(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			await this.request(`./products/${encodeURI(product_id)}`, {
				method: "DELETE"
			});

			return true;
		} catch (e) {
			this.logError(e, "deleteProduct", { product_id });

			if (error.isProductNotFound(e)) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Enable an existing product.
	 *
	 * @param product_id The id of the product to enable
	 *
	 * @returns On success, a {@link Product} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:id/enable
	 */
	async enableProduct(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this.bindings.product(
				(
					await this.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}/enable`,
						{
							method: "PUT"
						}
					)
				).product
			);
		} catch (e) {
			this.logError(e, "enableProduct", { product_id });

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Disable an existing product.
	 *
	 * @param product_id The id of the product to disable
	 *
	 * @returns On success, a {@link Product} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:id/disable
	 */
	async disableProduct(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this.bindings.product(
				(
					await this.request<{ product: Product }>(
						`./products/${encodeURI(product_id)}/disable`,
						{
							method: "PUT"
						}
					)
				).product
			);
		} catch (e) {
			this.logError(e, "disableProduct", { product_id });

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Retrieve all of the existing variant categories of a product.
	 *
	 * @param product_id The id of the product
	 *
	 * @returns On success, An array of {@link VariantCategory} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories
	 */
	async listVariantCategories(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return (
				await this.request<{
					variant_categories: VariantCategory[];
				}>(`./products/${encodeURI(product_id)}/variant_categories`)
			).variant_categories.map((v) =>
				this.bindings.variant_category(v, product_id)
			);
		} catch (e) {
			this.logError(e, "listVariantCategories", { product_id });

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Retrieve the details of a variant category of a product.
	 *
	 * @param product_id The id the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, a {@link VariantCategory} | `null` if either product or variant category was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:id
	 */
	async getVariantCategory(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			return this.bindings.variant_category(
				(
					await this.request<{ variant_category: VariantCategory }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}`
					)
				).variant_category,
				product_id
			);
		} catch (e) {
			this.logError(e, "getVariantCategory", {
				product_id,
				variant_category_id
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Create a new variant category on a product.
	 *
	 * @param product_id The id of the product
	 * @param title The title for the variant category
	 *
	 * @returns On success, a {@link VariantCategory} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/variant_categories
	 */
	async createVariantCategory(product_id: string, title: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(title, "Argument 'title'");

			return this.bindings.variant_category(
				(
					await this.request<{ variant_category: VariantCategory }>(
						`./products/${encodeURI(product_id)}/variant_categories`,
						{ method: "POST", params: { title } }
					)
				).variant_category,
				product_id
			);
		} catch (e) {
			this.logError(e, "createVariantCategory", { product_id, title });

			if (error.isAnyNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link VariantCategory} | `null` if either product or variant category was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/variant_categories/:id
	 */
	async updateVariantCategory(
		product_id: string,
		variant_category_id: string,
		title: string
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);
			validators.notBlank(title, "Argument 'title'");

			return this.bindings.variant_category(
				(
					await this.request<{ variant_category: VariantCategory }>(
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
			this.logError(e, "updateVariantCategory", {
				product_id,
				variant_category_id,
				title
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Permanently delete a variant category of a product.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, `true` | `false` if either product or variant category was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/variant_categories/:id
	 */
	async deleteVariantCategory(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			await this.request(
				`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}`,
				{
					method: "DELETE"
				}
			);
			return true;
		} catch (e) {
			this.logError(e, "deleteVariantCategory", {
				product_id,
				variant_category_id
			});

			if (error.isAnyNotFound(e)) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Retrieve all of the existing variants in a variant category.
	 *
	 * @param product_id The id of the product
	 * @param variant_category_id The id of the variant category
	 *
	 * @returns On success, an Array of {@link Variant} | `null` if either product or variant category was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:variant_category_id/variants
	 */
	async listVariants(product_id: string, variant_category_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(
				variant_category_id,
				"Argument 'variant_category_id'"
			);

			return (
				await this.request<{ variants: Variant[] }>(
					`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants`
				)
			).variants.map((v) =>
				this.bindings.variant(v, product_id, variant_category_id)
			);
		} catch (e) {
			this.logError(e, "listVariants", { product_id, variant_category_id });

			if (error.isAnyNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link Variant} | `null` if either product, variant category or variant was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async getVariant(
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

			return this.bindings.variant(
				(
					await this.request<{ variant: Variant }>(
						`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants/${encodeURI(variant_id)}`
					)
				).variant,
				product_id,
				variant_category_id
			);
		} catch (e) {
			this.logError(e, "getVariant", {
				product_id,
				variant_category_id,
				variant_id
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link Variant} | `null` if either product or variant category was not found
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/variant_categories/:variant_category_id/variants
	 */
	async createVariant(
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

			return this.bindings.variant(
				(
					await this.request<{ variant: Variant }>(
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
			this.logError(e, "createVariant", {
				product_id,
				variant_category_id,
				name,
				price_difference_cents,
				max_purchase_count
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link Variant} | `null` if either product, variant category or variant was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async updateVariant(
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

			return this.bindings.variant(
				(
					await this.request<{ variant: Variant }>(
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
			this.logError(e, "updateVariant", {
				product_id,
				variant_category_id,
				variant_id,
				options
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

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
	 * @returns On success, `true` | `false` if either product, variant category or variant was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/variant_categories/:variant_category_id/variants/:id
	 */
	async deleteVariant(
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

			await this.request(
				`./products/${encodeURI(product_id)}/variant_categories/${encodeURI(variant_category_id)}/variants/${encodeURI(variant_id)}`,
				{
					method: "DELETE"
				}
			);
			return true;
		} catch (e) {
			this.logError(e, "deleteVariant", {
				product_id,
				variant_category_id,
				variant_id
			});

			if (error.isAnyNotFound(e)) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Retrieve all of the existing offer codes for a product.
	 *
	 * Either `amount_cents` or `percent_off` will be returned depending if the offer code is a fixed amount off or a percentage off.
	 *
	 * A universal offer code is one that applies to all products.
	 *
	 * @param product_id The id of the product
	 *
	 * @returns On success, a {@link OfferCode} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/offer_codes
	 */
	async listOfferCodes(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return (
				await this.request<{ offer_codes: OfferCode[] }>(
					`./products/${encodeURI(product_id)}/offer_codes`
				)
			).offer_codes.map((o) => this.bindings.offer_code(o, product_id));
		} catch (e) {
			this.logError(e, "listOfferCodes", { product_id });

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Retrieve the details of a specific offer code of a product
	 *
	 * @param product_id The id of the product
	 * @param offer_code_id The id of the offer code
	 *
	 * @returns On success, a {@link OfferCode} | `null` if either product or offer code was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/offer_codes/:id
	 */
	async getOfferCode(
		product_id: string,
		offer_code_id: string
	): Promise<OfferCode | null> {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

			return this.bindings.offer_code(
				(
					await this.request<{ offer_code: OfferCode }>(
						`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`
					)
				).offer_code,
				product_id
			);
		} catch (e) {
			this.logError(e, "getOfferCode", { product_id, offer_code_id });

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Create a new offer code for a product.
	 * Default offer code is in cents.
	 * A universal offer code is one that applies to all products.
	 *
	 * @param product_id The id of the product
	 * @param name The name of the offer code
	 * @param amount_off The amount depending on offer type
	 * @param options (Optional) Options
	 *
	 * @returns On success, a {@link OfferCode} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/offer_codes
	 */
	async createOfferCode(
		product_id: string,
		name: string,
		amount_off: number,
		options?: {
			/**
			 * Default: "cents"
			 */
			offer_type?: "cents" | "percent";
			max_purchase_count?: number;
			universal?: boolean;
		}
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this.bindings.offer_code(
				(
					await this.request<{ offer_code: OfferCode }>(
						`./products/${encodeURI(product_id)}/offer_codes`,
						{
							method: "POST",
							params: { ...options, name, amount_off }
						}
					)
				).offer_code,
				product_id
			);
		} catch (e) {
			this.logError(e, "createOfferCode", {
				product_id,
				name,
				amount_off,
				options
			});

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Edit an existing product's offer code.
	 *
	 * @param product_id The id of the product
	 * @param offer_code_id The id of the offer code
	 * @param options Options
	 *
	 * @returns On success, a {@link OfferCode} | `null` if either product or offer code was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/offer_codes/:id
	 */
	async updateOfferCode(
		product_id: string,
		offer_code_id: string,
		options:
			| { offer_code: string }
			| {
					max_purchase_count: number;
			  }
			| { offer_code: string; max_purchase_count: number }
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

			return this.bindings.offer_code(
				(
					await this.request<{ offer_code: OfferCode }>(
						`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`,
						{
							method: "PUT",
							params: options
						}
					)
				).offer_code,
				product_id
			);
		} catch (e) {
			this.logError(e, "updateOfferCode", {
				product_id,
				offer_code_id,
				options
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Permanently delete a product's offer code.
	 *
	 * @param product_id The id of the product
	 * @param offer_code_id The id of the offer code
	 *
	 * @returns On success, `true` | `false` if either product or offer code was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/offer_codes/:id
	 */
	async deleteOfferCode(product_id: string, offer_code_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(offer_code_id, "Argument 'offer_code_id'");

			await this.request(
				`./products/${encodeURI(product_id)}/offer_codes/${encodeURI(offer_code_id)}`,
				{ method: "DELETE" }
			);

			return true;
		} catch (e) {
			this.logError(e, "deleteOfferCode", { product_id, offer_code_id });

			if (error.isAnyNotFound(e)) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Retrieve all of the existing custom fields for a product.
	 *
	 * @param product_id The id of the product
	 *
	 * @returns On success, an Array of {@link CustomField} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/custom_fields
	 */
	async listCustomFields(product_id: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return (
				await this.request<{ custom_fields: CustomField[] }>(
					`./products/${encodeURI(product_id)}/custom_fields`
				)
			).custom_fields.map((c) => this.bindings.custom_field(c, product_id));
		} catch (e) {
			this.logError(e, "listCustomFields", { product_id });

			if (error.isProductNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link CustomField} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#post-/products/:product_id/custom_fields
	 */
	async createCustomField(
		product_id: string,
		name: string,
		options: {
			required?: boolean;
			type?: "text" | "checkbox" | "terms";
			variant?: string;
		} = {}
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return this.bindings.custom_field(
				(
					await this.request<{ custom_field: CustomField }>(
						`./products/${encodeURI(product_id)}/custom_fields`,
						{
							method: "POST",
							params: {
								name,
								type:
									options.type &&
									["text", "checkbox", "terms"].includes(options.type)
										? options.type
										: "text",
								required:
									typeof options.required === "boolean"
										? options.required
										: true,
								variant: options.variant
							}
						}
					)
				).custom_field,
				product_id
			);
		} catch (e) {
			this.logError(e, "createCustomField", { product_id, name, options });

			if (error.isProductNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link CustomField} | `null` if either product or custom field was not found
	 *
	 * @see https://app.gumroad.com/api#put-/products/:product_id/custom_fields/:name
	 */
	async updateCustomField(
		product_id: string,
		name: string,
		options: {
			name?: string;
			required?: boolean;
			type?: "text" | "checkbox" | "terms";
			variant?: string;
		} = {}
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(name, "Argument 'name'");

			return this.bindings.custom_field(
				(
					await this.request<{ custom_field: CustomField }>(
						`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`,
						{
							method: "PUT",
							params: {
								type:
									options.type &&
									["text", "checkbox", "terms"].includes(options.type)
										? options.type
										: "text",
								required:
									typeof options.required === "boolean"
										? options.required
										: undefined,
								name: options.name,
								variant: options.variant
							}
						}
					)
				).custom_field,
				product_id
			);
		} catch (e) {
			this.logError(e, "updateCustomField", { product_id, name, options });

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Permanently delete a product's custom field.
	 *
	 * @param product_id The id of the product
	 * @param name The name of the custom field
	 *
	 * @returns On success, `true` | `false` if either product or custom field was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/products/:product_id/custom_fields/:name
	 */
	async deleteCustomField(product_id: string, name: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(name, "Argument 'name'");

			await this.request(
				`./products/${encodeURI(product_id)}/custom_fields/${encodeURI(name)}`,
				{
					method: "DELETE"
				}
			);

			return true;
		} catch (e) {
			this.logError(e, "deleteCustomField", { product_id, name });

			if (error.isAnyNotFound(e)) {
				return false;
			}

			throw e;
		}
	}

	/**
	 * Retrieve the user's data.
	 *
	 * @returns On success, a {@link User}
	 *
	 * @see https://app.gumroad.com/api#get-/user
	 */
	async getUser() {
		try {
			return (await this.request<{ user: User }>("./user")).user;
		} catch (e) {
			this.logError(e, "getUser");

			throw e;
		}
	}

	/**
	 * Show all active subscriptions of user for the input resource.
	 *
	 * @param resource_name The name of resource
	 *
	 * @returns On success, an Array of {@link ResourceSubscription}
	 *
	 * @see https://app.gumroad.com/api#get-/resource_subscriptions
	 */
	async listResourceSubscriptions(resource_name: ResourceSubscriptionName) {
		try {
			validators.notBlank(resource_name, "Argument 'resource_name'");

			return (
				await this.request<{ resource_subscriptions: ResourceSubscription[] }>(
					"./resource_subscriptions",
					{
						params: { resource_name }
					}
				)
			).resource_subscriptions.map((r) =>
				this.bindings.resource_subscription(r)
			);
		} catch (e) {
			this.logError(e, "listResourceSubscriptions", { resource_name });

			throw e;
		}
	}

	/**
	 * Subscribe to a resource.
	 *
	 * Currently there are 8 supported resource names:
	 * "sale", "refund", "dispute", "dispute_won",
	 * "cancellation", "subscription_updated", "subscription_ended", and "subscription_restarted".
	 *
	 * @param post_url The url where resource updates should be send
	 * @param resource_name The {@link ResourceSubscriptionName}
	 *
	 * @returns On success, a {@link ResourceSubscription}
	 *
	 * @see https://app.gumroad.com/api#put-/resource_subscriptions
	 */
	async createResourceSubscription(
		post_url: string,
		resource_name: ResourceSubscriptionName
	) {
		try {
			validators.notBlank(post_url, "Argument 'post_url'");
			validators.notBlank(resource_name, "Argument 'resource_name'");

			if (!resourceSubscriptionNames.includes(resource_name)) {
				throw new GumroadTypeError(
					`'${resource_name}' is not a valid 'resource_name'`
				);
			}

			return this.bindings.resource_subscription(
				(
					await this.request<{
						resource_subscription: {
							id: string;
							post_url: string;
							resource_name: ResourceSubscriptionName;
						};
					}>("./resource_subscriptions", {
						method: "PUT"
					})
				).resource_subscription
			);
		} catch (e) {
			this.logError(e, "createResourceSubscription", {
				post_url,
				resource_name
			});

			throw e;
		}
	}

	/**
	 * Unsubscribe from a resource.
	 *
	 * @param resource_subscription_id The id of resource
	 *
	 * @returns On success, `true` | `false` if resource was not found
	 *
	 * @see https://app.gumroad.com/api#delete-/resource_subscriptions/:resource_subscription_id
	 */
	async deleteResourceSubscription(resource_subscription_id: string) {
		try {
			validators.notBlank(
				resource_subscription_id,
				"Argument 'resource_subscription_id'"
			);
			await this.request(
				`./resource_subscriptions/${encodeURI(resource_subscription_id)}`,
				{
					method: "DELETE"
				}
			);
			return true;
		} catch (e) {
			this.logError(e, "deleteResourceSubscription", {
				resource_subscription_id
			});

			if (error.isResourceSubscriptionNotFound(e)) {
				return false;
			}

			throw e;
		}
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
	async listSales(options?: {
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
			return this.bindings.sales(
				await this.request<{
					next_page_url?: string;
					next_page_key?: string;
					sales: Sale[];
				}>("./sales", {
					params: options
				})
			);
		} catch (e) {
			this.logError(e, "listSales", { options });

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
	 * @returns On success, a {@link Sale} | `null` if sale was not found
	 *
	 * @see https://app.gumroad.com/api#get-/sales/:id
	 */
	async getSale(sale_id: string) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this.bindings.sale(
				(await this.request<{ sale: Sale }>(`./sales/${encodeURI(sale_id)}`))
					.sale
			);
		} catch (e) {
			this.logError(e, "getSale", { sale_id });

			if (error.isSaleNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link Sale} | `null` if sale was not found
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/mark_as_shipped
	 */
	async markSaleAsShipped(sale_id: string, tracking_url?: string) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this.bindings.sale(
				(
					await this.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/mark_as_shipped`,
						{ params: { tracking_url } }
					)
				).sale
			);
		} catch (e) {
			this.logError(e, "markSaleAsShipped", { sale_id, tracking_url });

			if (error.isSaleNotFound(e)) {
				return null;
			}

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
	 * @returns On success, a {@link Sale} | `null` if sale was not found
	 *
	 * @see https://app.gumroad.com/api#put-/sales/:id/refund
	 */
	async refundSale(sale_id: string, amount_cents?: number) {
		try {
			validators.notBlank(sale_id, "Argument 'sale_id'");

			return this.bindings.sale(
				(
					await this.request<{ sale: Sale }>(
						`./sales/${encodeURI(sale_id)}/refund`,
						{ params: { amount_cents } }
					)
				).sale
			);
		} catch (e) {
			this.logError(e, "refundSale", { sale_id, amount_cents });

			if (error.isSaleNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * **Only available with the `view_sales` scope**
	 *
	 * Retrieves all of the active subscribers for one of the authenticated user's products.
	 *
	 * A subscription is terminated if any of `failed_at`, `ended_at`, or `cancelled_at` timestamps are populated and are in the past.
	 *
	 * A subscription's status can be one of: `alive`, `pending_cancellation`, `pending_failure`, `failed_payment`,
	 * `fixed_subscription_period_ended`, `cancelled`.
	 *
	 * @param product_id The id of the product
	 * @param email (Optional) Filter subscribers by this email
	 *
	 * @returns On success, an Array of {@link Subscriber} | `null` if product was not found
	 *
	 * @see https://app.gumroad.com/api#get-/products/:product_id/subscribers
	 */
	async listSubscribers(product_id: string, email?: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");

			return (
				await this.request<{ subscribers: Subscriber[] }>(
					`./products/${encodeURI(product_id)}/subscribers`,
					{ params: { email } }
				)
			).subscribers;
		} catch (e) {
			this.logError(e, "listSubscribers", { product_id, email });

			if (error.isProductNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * **Only available with the `view_sales` scope**
	 *
	 * Retrieves the details of a subscriber to this user's product.
	 *
	 * @param subscriber_id The subscriber id
	 *
	 * @returns On success, a {@link Subscriber} | `null` if subscriber was not found
	 *
	 * @see https://app.gumroad.com/api#get-/subscribers/:id
	 */
	async getSubscriber(subscriber_id: string) {
		try {
			validators.notBlank(subscriber_id, "Argument 'subscriber_id'");

			return (
				await this.request<{ subscriber: Subscriber }>(
					`./subscribers/${encodeURI(subscriber_id)}`
				)
			).subscriber;
		} catch (e) {
			this.logError(e, "getSubscriber", { subscriber_id });

			if (error.isSubscriberNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Verify a license
	 *
	 * @param product_id The unique ID of the product, available on product's edit page
	 * @param license_key The license key provided by your customer
	 * @param increment_uses_count If `true`, increment the uses count of a license. Default: `true`
	 *
	 * @returns On success, a {@link Purchase} | `null` if either product or license key was not found
	 *
	 * @see https://app.gumroad.com/api#post-/licenses/verify
	 */
	async verifyLicense(
		product_id: string,
		license_key: string,
		increment_uses_count?: boolean
	) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(license_key, "Argument 'license_key'");

			return this.bindings.purchase(
				await this.request<{ uses: number; purchase: Purchase }>(
					"./licenses/verify",
					{
						method: "POST",
						params: { product_id, license_key, increment_uses_count }
					}
				)
			);
		} catch (e) {
			this.logError(e, "verifyLicense", {
				product_id,
				license_key,
				increment_uses_count
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Enable a license
	 *
	 * @param product_id The unique ID of the product, available on product's edit page
	 * @param license_key The license key provided by your customer
	 *
	 * @returns On success, a {@link Purchase} | `null` if either product or license key was not found
	 *
	 * @see https://app.gumroad.com/api#put-/licenses/enable
	 */
	async enableLicense(product_id: string, license_key: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(license_key, "Argument 'license_key'");

			return this.bindings.purchase(
				await this.request<{ uses: number; purchase: Purchase }>(
					"./licenses/enable",
					{
						method: "PUT",
						params: { product_id, license_key }
					}
				)
			);
		} catch (e) {
			this.logError(e, "enableLicense", {
				product_id,
				license_key
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Disable a license
	 *
	 * @param product_id The unique ID of the product, available on product's edit page
	 * @param license_key The license key provided by your customer
	 *
	 * @returns On success, a {@link Purchase} | `null` if either product or license key was not found
	 *
	 * @see https://app.gumroad.com/api#put-/licenses/disable
	 */
	async disableLicense(product_id: string, license_key: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(license_key, "Argument 'license_key'");

			return this.bindings.purchase(
				await this.request<{ uses: number; purchase: Purchase }>(
					"./licenses/disable",
					{
						method: "PUT",
						params: { product_id, license_key }
					}
				)
			);
		} catch (e) {
			this.logError(e, "disableLicense", {
				product_id,
				license_key
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}

	/**
	 * Decrement the uses count of a license
	 *
	 * @param product_id The unique ID of the product, available on product's edit page
	 * @param license_key The license key provided by your customer
	 *
	 * @returns On success, a {@link Purchase} | `null` if either product or license key was not found
	 *
	 * @see https://app.gumroad.com/api#put-/licenses/decrement_uses_count
	 */
	async decrementUsesCount(product_id: string, license_key: string) {
		try {
			validators.notBlank(product_id, "Argument 'product_id'");
			validators.notBlank(license_key, "Argument 'license_key'");

			return this.bindings.purchase(
				await this.request<{ uses: number; purchase: Purchase }>(
					"./licenses/decrement_uses_count",
					{
						method: "PUT",
						params: { product_id, license_key }
					}
				)
			);
		} catch (e) {
			this.logError(e, "decrementUsesCount", {
				product_id,
				license_key
			});

			if (error.isAnyNotFound(e)) {
				return null;
			}

			throw e;
		}
	}
}
