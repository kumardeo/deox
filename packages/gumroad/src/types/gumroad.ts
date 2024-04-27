/**
 * TODO: These types are not yet finalized since there is no reference for conditional data in gumroad api docs
 * * So I read the docs and wrote the expected types but not yet tested
 * * Sorry for my bad English!
 */

import type { StringWithSuggestions } from "./utils";

/**
 * * API method types
 */

/**
 * Type of recurrence
 */
export type Recurrence = "monthly" | "quarterly" | "biannually" | "yearly";

/**
 * Name of Resource subscription
 */
export type ResourceSubscriptionName =
	| "sale"
	| "refund"
	| "dispute"
	| "dispute_won"
	| "cancellation"
	| "subscription_updated"
	| "subscription_ended"
	| "subscription_restarted";

export type PurchasingPowerParityPrices = {
	US: number;
	IN: number;
	EC: number;
};

/**
 * The visual information of the card used
 */
export type Card = {
	visual: string | null;
	type: StringWithSuggestions<"visa" | "paypal"> | null;
	bin: string | null;
	expiry_month: number | null;
	expiry_year: number | null;
};

export type RecurrencePrices = {
	[K in Recurrence]?: {
		price_cents: number;
		/**
		 * May return number if `is_pay_what_you_want` is `true`
		 */
		suggested_price_cents: number | null;
		purchasing_power_parity_prices?: PurchasingPowerParityPrices;
	};
};

export type ProductVariantOption = {
	name: string;

	/**
	 * set for non-membership product options
	 */
	price_difference?: number;

	/**
	 * set for non-membership product options
	 */
	purchasing_power_parity_prices?: PurchasingPowerParityPrices;

	is_pay_what_you_want: boolean;

	/**
	 * present for membership products; otherwise null
	 */
	recurrence_prices: RecurrencePrices | null;
};

export type ProductVariant = {
	title: string;
	options: ProductVariantOption[];
};

/**
 * Represents information of the file
 */
export type FileInfo = {
	/**
	 * Size of file in readable format
	 */
	Size: string;
};

/**
 * A custom field
 */
export type CustomField = {
	/**
	 * The id of the custom field
	 */
	id: string;

	/**
	 * The type of the custom field
	 */
	type: "text" | "checkbox" | "terms";

	/**
	 * The name of the custom field
	 */
	name: string;

	/**
	 * Indicates whether the custom field is required
	 */
	required: boolean;
};

export type Product = {
	name: string;
	preview_url: string | null;
	description: string;
	customizable_price: boolean | null;
	require_shipping: boolean;
	custom_receipt: string | null;
	custom_permalink: string | null;
	subscription_duration: null;
	id: string;
	url: string | null;
	price: number;
	currency: StringWithSuggestions<"usd">;
	short_url: string;
	thumbnail_url: string | null;
	tags: string[];
	formatted_price: string;
	published: boolean;
	file_info: FileInfo | NonNullable<unknown>;
	max_purchase_count: number | null;
	deleted: boolean;
	custom_fields: CustomField[];
	custom_summary: string | null;
	variants: ProductVariant[];
	custom_delivery_url: string | null;
	/**
	 * **Only available with the `view_sales` scope**
	 */
	sales_count?: `${number}`;
	/**
	 * **Only available with the `view_sales` scope**
	 */
	sales_usd_cents?: `${number}`;
	purchasing_power_parity_prices?: PurchasingPowerParityPrices;
} & (
	| {
			is_tiered_membership: false;
			/**
			 * `null` since `is_tiered_membership` is `false`
			 */
			recurrences: null;
	  }
	| {
			is_tiered_membership: true;
			/**
			 * List of available Recurrence since `is_tiered_membership` is `true`
			 */
			recurrences: Recurrence[];
	  }
);

export type OfferCode = {
	id: string;
	name: string;
	max_purchase_count: number | null;
	universal: boolean;
	times_used: number;
} & (
	| {
			amount_cents: number;
	  }
	| {
			percent_off: number;
	  }
);

export type User = {
	name: string;
	currency_type: string | null;
	bio: string | null;
	twitter_handle: string | null;
	id: string;
	user_id: string;
	/**
	 * **Only available if username is set**
	 */
	url?: string;
	links?: string[];
	profile_url: string;
	/**
	 * **Only available with the `view_sales` scope**
	 */
	email?: string;
	display_name: string;
};

export type SubscriberStatus =
	| "alive"
	| "pending_cancellation"
	| "pending_failure"
	| "failed_payment"
	| "fixed_subscription_period_ended"
	| "cancelled";

export type Subscriber = {
	id: string;
	product_id: string;
	product_name: string;
	user_id: string;
	user_email: string;
	purchase_ids: string[];
	created_at: string;
	user_requested_cancellation_at: string | null;
	charge_occurrence_count: number | null;
	recurrence: Recurrence;
	cancelled_at: string | null;
	ended_at: string | null;
	failed_at: string | null;
	free_trial_ends_at: string | null;
	license_key: string;
	status: SubscriberStatus;
};

export type Purchase = {
	seller_id: string;
	product_id: string;
	product_name: string;
	permalink: string;
	product_permalink: string;
	short_product_id: string;
	email: string;
	price: number;
	gumroad_fee: number;
	currency: StringWithSuggestions<"usd">;
	quantity: number;
	discover_fee_charged: boolean;
	can_contact: boolean;
	referrer: StringWithSuggestions<"direct">;
	card: Card;
	order_number: number;
	sale_id: string;
	sale_timestamp: string;
	full_name: string;
	purchaser_id: string;
	license_key: string;
	is_multiseat_license?: boolean;
	subscription_id?: string;
	recurrence?: Recurrence;
	ip_country: string;
	is_gift_receiver_purchase: boolean;
	refunded: boolean;
	disputed: boolean;
	dispute_won: boolean;
	id: string;
	created_at: string;
	variants: string;
	custom_fields: CustomField[];
	/**
	 * purchase was refunded, non-subscription product only
	 */
	chargebacked: boolean;
	/**
	 * subscription was ended, subscription product only
	 */
	subscription_ended_at?: string | null;
	/**
	 * subscription was cancelled, subscription product only
	 */
	subscription_cancelled_at?: string | null;
	/**
	 * we were unable to charge the subscriber's card
	 */
	subscription_failed_at?: string | null;
};

export type ResourceSubscription = {
	id: string;
	resource_name: ResourceSubscriptionName;
	post_url: string;
};

export type VariantCategory = { id: string; title: string };

export type Variant = {
	id: string;
	name: string;
	price_difference_cents: number;
	max_purchase_count: number | null;
};

export type Sale = {
	id: string;
	email: string;
	seller_id: string;
	timestamp: string;
	daystamp: string;
	created_at: string;
	product_name: string;
	product_has_variants: boolean;
	price: number;
	gumroad_fee: number;
	is_bundle_purchase: boolean;
	is_bundle_product_purchase: boolean;
	formatted_display_price: string;
	formatted_total_price: string;
	currency_symbol: string;
	amount_refundable_in_currency: `${number}`;
	product_id: string;
	product_permalink: string;
	refunded: boolean;
	partially_refunded: boolean;
	chargedback: boolean;
	purchase_email: string;
	street_address?: string;
	city?: string;
	state?: string;
	country: string;
	country_iso2: string;
	zip_code?: `${number}`;
	paid: boolean;
	has_variants: boolean;
	variants_and_quantity: string;
	has_custom_fields: boolean;
	custom_fields: NonNullable<unknown>;
	order_id: number;
	is_product_physical: boolean;
	purchaser_id?: string;
	is_recurring_billing: boolean;
	can_contact: boolean;
	is_following: boolean;
	disputed: boolean;
	dispute_won: boolean;
	is_additional_contribution: boolean;
	discover_fee_charged: boolean;
	is_upgrade_purchase: boolean;
	is_more_like_this_recommended: boolean;
	is_gift_sender_purchase: boolean;
	is_gift_receiver_purchase: boolean;
	referrer: StringWithSuggestions<"direct">;
	card: Card;
	product_rating: number | null;
	reviews_count: number;
	average_rating: number;
	quantity: number;
	affiliate?: {
		email: string;
		amount: string;
	};
};

/**
 * * Update (Resource subscriptions post data) types
 */

/**
 * Represents a tier
 */
export type Tier = {
	id: string;
	name: string;
};

export type Plan = {
	tier: Tier;
	recurrence: Recurrence;
	price_cents: string;
	quantity: number;
};

export type UpdatePingCommon = {
	sale_id: string;
	sale_timestamp: string;
	order_number: number;
	seller_id: string;
	product_id: string;
	product_permalink: string;
	short_product_id: string;
	product_name: string;
	email: string;
	url_params:
		| string
		| {
				source_url: string;
				campaignid: string;
				userid: string;
				version: string;
		  };
	full_name?: string;
	purchaser_id?: string;
	ip_country?: string;
	price: string;
	variants?: string | Record<string, string>;
	offer_code?: string;
	test: boolean;
	custom_fields?: Record<string, string>;
	shipping_information?: string | Record<string, string>;
	is_preorder_authorization?: boolean;
	license_key?: string;
	quantity?: number;
	shipping_rate?: string;
	affiliate?: string;
	affiliate_credit_amount_cents?: string;
	refunded: boolean;
	discover_fee_charged: boolean;
	can_contact: boolean;
	referrer?: StringWithSuggestions<"direct">;
	gumroad_fee: number;
	card: Card;
} & (
	| {
			is_gift_receiver_purchase: false;
	  }
	| {
			is_gift_receiver_purchase: true;
			gifter_email: string;
			gift_price: string;
	  }
);

export type UpdatePingSubscription = {
	subscription_id: string;
	recurrence: Recurrence;
	is_recurring_charge: boolean;
};

export type UpdatePing =
	| UpdatePingCommon
	| (UpdatePingCommon & UpdatePingSubscription);

export type UpdateSubscription = {
	subscription_id: string;
	product_id: string;
	product_name: string;
	user_id: string;
	user_email: string;
	purchase_ids: string[];
	created_at: string;
	charge_occurrence_count: number;
	recurrence: Recurrence;
	free_trial_ends_at?: string;
	custom_fields: CustomField[];
	license_key: string;
};

export type UpdateSubscriptionUpdated = UpdateSubscription & {
	type: "upgrade" | "downgrade";
	/**
	 *  Timestamp at which the change went or will go into effect
	 */
	effective_as_of: string;
	/**
	 * Plan before change
	 */
	old_plan: Plan;
	/**
	 * Plan after change
	 */
	new_plan: Plan;
};

export type UpdateSubscriptionEnded = UpdateSubscription & {
	/**
	 * Timestamp at which the subscription ended
	 */
	ended_at: string;
	/**
	 * The reason for the subscription ending
	 */
	ended_reason:
		| "cancelled"
		| "failed_payment"
		| "fixed_subscription_period_ended";
};

export type UpdateSubscriptionRestarted = UpdateSubscription & {
	/**
	 * Timestamp at which the subscription was restarted
	 */
	restarted_at: string;
};

export type UpdateCancellation = {
	/**
	 * true if subscription has been cancelled, otherwise false
	 */
	cancelled: boolean;
	/**
	 * timestamp at which subscription will be cancelled
	 */
	cancelled_at: string;
	/**
	 * true if subscription was been cancelled by admin, otherwise not present
	 */
	cancelled_by_admin?: true;
	/**
	 * true if subscription was been cancelled by buyer, otherwise not present
	 */
	cancelled_by_buyer?: true;
	/**
	 * true if subscription was been cancelled by seller, otherwise not present
	 */
	cancelled_by_seller?: true;
	/**
	 * true if subscription was been cancelled automatically because of payment failure, otherwise not present
	 */
	cancelled_due_to_payment_failures?: true;
};

export type UpdateMap = {
	ping: UpdatePing;
	sale: UpdatePing;
	refund: UpdatePing;
	dispute: UpdatePing;
	dispute_won: UpdatePing;
	cancellation: UpdateCancellation;
	subscription_updated: UpdateSubscriptionUpdated;
	subscription_ended: UpdateSubscriptionEnded;
	subscription_restarted: UpdateSubscriptionRestarted;
};

export type Update<T extends keyof UpdateMap> = UpdateMap[T];
