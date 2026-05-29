/**
 * !DISCLAIMER:
 *
 * I wrote these types based on my understanding of the documentation, but they have not been fully tested yet.
 *
 * If you find any mistakes, feel free to open an issue.
 */

import type { StringWithSuggestions } from './utils';

/**
 * * API method types
 */

/** Type of recurrence */
export type Recurrence = 'monthly' | 'quarterly' | 'biannually' | 'yearly';

/** Represents recurrence prices */
export type RecurrencePrices = {
  [K in Recurrence]?: {
    /** The price in USD cents for this recurrence */
    price_cents: number;

    /**
     * Suggested price in cents
     *
     * May return a number if `is_pay_what_you_want` is `true`
     */
    suggested_price_cents: number | null;

    /**
     * PPP-adjusted prices for this recurrence
     *
     * Present when the seller has purchasing power parity enabled and the product has not opted out
     */
    purchasing_power_parity_prices?: PurchasingPowerParityPrices;
  };
};

export type PurchasingPowerParityPrices = {
  US: number;
  IN: number;
  EC: number;
};

/** The visual information of the card used */
export type Card = {
  visual: string | null;
  type: StringWithSuggestions<'visa' | 'paypal'> | null;
  bin: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
};

/** Represents option for product variant category */
export type ProductVariantOption = {
  /** The name of the option */
  name: string;

  /** Price difference in cents from the base price (0 for membership tiers, whose prices are set via `recurrence_prices`) */
  price_difference: number | null;

  /**
   * PPP-adjusted prices for this option, computed from the base price plus `price_difference`; `null` for options whose `price_difference` is `null`
   *
   * Present when the seller has purchasing power parity enabled and the product has not opted out
   */
  purchasing_power_parity_prices: PurchasingPowerParityPrices | null;

  /** Indicates whether this option is pay-what-you-want */
  is_pay_what_you_want: boolean;

  /** @deprecated Always `null` */
  url: string | null;

  /**
   * Prices per recurrence interval
   *
   * Present for membership products; otherwise `null`
   */
  recurrence_prices: RecurrencePrices | null;

  /**
   * Per-variant rich content pages
   *
   * Omitted from `GET /v2/products` list responses
   */
  rich_content?: RichContentItem[];
};

/** Represents a product variant category */
export type ProductVariant = {
  /** The title of the variant category */
  title: string;

  /** The options available for the variant category */
  options: ProductVariantOption[];
};

/** Represents information of the file */
export type FileInfo = {
  /** Size of file in readable format */
  Size: string;
};

/** Represents a custom field */
export type CustomField = {
  /** The id of the custom field */
  id: string;

  /** The type of the custom field */
  type: 'text' | 'checkbox' | 'terms';

  /** The name of the custom field */
  name: string;

  /** Indicates whether the custom field is required */
  required: boolean;
};

/** The type of the cover */
export type CoverType = 'image' | 'video' | 'oembed' | 'unsplash';

/** Represents a cover */
export type Cover = {
  /** Unique identifier for the cover */
  id: string;

  /** Display URL (retina variant for non-GIF images; original URL for GIFs, videos, and oEmbed covers) */
  url: string;

  /** URL of the original uploaded asset */
  original_url: string;

  /** Thumbnail URL for oEmbed covers; null otherwise */
  thumbnail: string | null;

  /** The type of the cover */
  type: CoverType;

  /** File extension; null when no file is attached */
  filetype: string | null;

  /** Display width in pixels */
  width: number;

  /** Display height in pixels */
  height: number;

  /** Intrinsic width of the source asset in pixels */
  native_width: number;

  /** Intrinsic height of the source asset in pixels */
  native_height: number;
};

export type BundleProduct = {
  /** External ID of the included product */
  product_id: string;

  /** External ID of the selected variant, if any */
  variant_id: string | null;

  /** Quantity of this item in the bundle */
  quantity: number;

  /** Order of this item within the bundle */
  position: number;
};

export type RichContentText = {
  type: 'text';
  text: string;
};

export type RichContentElement = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichContentNode[];
  [K: string]: unknown;
};

export type RichContentNode = RichContentText | RichContentElement;

export type RichContentDoc = {
  type: 'doc';
  content: RichContentNode[];
};

export type RichContentItem = {
  id: string;
  page_id: string;
  title: string;
  variant_id: string | null;
  description: RichContentDoc;
};

/** Represents a file */
export type File = {
  /** External ID of the file */
  id: string;

  /** Display name of the file */
  name: string | null;

  /** File size in bytes */
  size: number | null;

  /** Signed download URL for uploaded files; raw URL for external-link files (filetype: `link`) */
  url: string;

  /** File extension (e.g. `pdf`) or `link` for external URLs */
  filetype: StringWithSuggestions<'link'>;

  /** Group classification */
  filegroup: StringWithSuggestions<'audio' | 'video' | 'document'>;
};

/** Represents a product */
export type Product = {
  /** The custom URL slug for the product, `null` if not available */
  custom_permalink: string | null;

  /** The custom receipt text, `null` if not available */
  custom_receipt: string | null;

  /** The custom summary shown to buyers, `null` if not set */
  custom_summary: string | null;

  /**
   * Combined list of the seller's global checkout custom fields and the product's own custom fields
   *
   * An Array of {@link CustomField}
   */
  custom_fields: CustomField[];

  /** Indicates whether pay-what-you-want pricing is enabled */
  customizable_price: boolean | null;

  /** The product description */
  description: string;

  /** Indicates whether the product has been deleted */
  deleted: boolean;

  /** The number of maximum purchase allowed for the product, `null` if not set */
  max_purchase_count: number | null;

  /** The name of the product */
  name: string;

  /** The preview url of the product */
  preview_url: string | null;

  /** Indicates whether shipping info is required */
  require_shipping: boolean;

  /** The subscription billing interval, `null` if not available */
  subscription_duration: Recurrence | null;

  /** Indicates whether the product is published */
  published: boolean;

  /**
   * The url of the product, `null` if not available
   *
   * @deprecated Always `null`
   */
  url: string | null;

  /** The unique identifier for the product */
  id: string;

  /** The price of the product in USD cents */
  price: number;

  /**
   * Country-code-keyed prices adjusted for purchasing power parity
   *
   * Present when the seller has purchasing power parity enabled and the product has not opted out
   */
  purchasing_power_parity_prices?: PurchasingPowerParityPrices;

  /** ISO currency code (e.g. `usd`) */
  currency: StringWithSuggestions<'usd'>;

  /**
   * The short Gumroad URL for the product
   *
   * Example: `https://sahil.gumroad.com/l/pencil`
   */
  short_url: string;

  /** The URL of the product thumbnail image, `null` if not available */
  thumbnail_url: string | null;

  /** Covers for the product, in display order */
  covers: Cover[];

  /** ID of the first cover in display order; null when the product has no covers */
  main_cover_id: string | null;

  /** Tags associated with the product */
  tags: string[];

  /** The human readable price of the product with currency */
  formatted_price: string;

  /**
   * Legacy single-file metadata; returns `{}` for products with 0 or 2+ files.
   *
   * For complete file state, fetch the product via `GET /v2/products/:id` and read the `files` array (not returned by `GET /v2/products`)
   */
  file_info: FileInfo | NonNullable<unknown>;

  /** Items contained in a bundle product; empty for non-bundle products */
  bundle_products: BundleProduct[];

  /**
   * Number of sales of the product, note that the number is in string
   *
   * **Only available with the `view_sales` or `account` scope**
   */
  sales_count?: number;

  /**
   * The amount in USD cents which was made with the sales of the product
   *
   * **Only available with the `view_sales` or `account` scope**
   */
  sales_usd_cents?: number;

  /**
   * The delivery url of the product, `null` if not set
   *
   * @deprecated Always `null`
   *
   * **Only available with the `view_sales` or `account` scope**
   */
  custom_delivery_url: string | null;

  /**
   * Product-level rich content pages
   *
   * Omitted from `GET /v2/products` list responses
   */
  rich_content?: RichContentItem[];

  /**
   * Whether all variants share the product-level rich content
   *
   * Omitted from `GET /v2/products` list responses
   */
  has_same_rich_content_for_all_variants?: boolean;

  /**
   * Files attached to the product. Files whose backing S3 object is missing are omitted from the response.
   *
   * Omitted from `GET /v2/products` list responses
   */
  files?: File[];

  /**
   * Variant categories and their options
   *
   * An Array of {@link ProductVariant}
   */
  variants: ProductVariant[];
} & (
  | {
      /** Indicates whether the product is a membership product */
      is_tiered_membership: false;

      /** `null` since `is_tiered_membership` is `false` */
      recurrences: null;
    }
  | {
      /** Indicates whether the product is a membership product */
      is_tiered_membership: true;

      /** List of available Recurrence since `is_tiered_membership` is `true` */
      recurrences: Recurrence[];
    }
) &
  (
    | {
        /** Whether the product is a preorder */
        is_preorder: false;

        is_in_preorder_state?: undefined;
        release_at?: undefined;
      }
    | {
        /** Whether the product is a preorder */
        is_preorder: true;

        /** Whether the preorder has not yet been released (present only for preorder products) */
        is_in_preorder_state: boolean;

        /** Preorder release timestamp (present only for preorder products) */
        release_at: string;
      }
  );

/** Represents a offer code */
export type OfferCode = {
  /** The id of the offer code */
  id: string;

  /** The name of the offer code */
  name: string;

  /** The number of maximum purchases which can be made using this offer code, `null` if not set */
  max_purchase_count: number | null;

  /**
   * Indicates whether the offer code is `universal`.
   *
   * A universal offer code is one that applies to all products.
   */
  universal: boolean;

  /** The number of times the offer code was used */
  times_used: number;
} & (
  | {
      /** The amount in USD cents which will be reduced when the offer code is used */
      amount_cents: number;

      percent_off?: undefined;
    }
  | {
      amount_cents?: undefined;

      /** The percentage of price which will be reduced when the offer code is used */
      percent_off: number;
    }
);

/** Represents a Gumroad user */
export type User = {
  /** The name of the user */
  name: string;

  /** The currency type set by the user, `null` if not set */
  currency_type: string | null;

  /** The biography of the user, `null` if not set */
  bio: string | null;

  /** The twitter handle of the user, `null` if not set */
  twitter_handle: string | null;

  /** The id of the user */
  id: string;

  /** The user-id of the user */
  user_id: string;

  /** **Only available if username is set** */
  url?: string;

  /**
   * The links which are available to user.
   *
   * Always relative to `url` field.
   */
  links?: string[];

  /** The gumroad profile url of the user */
  profile_url: string;

  /** **Only available with the `view_sales` scope** */
  email?: string;

  /** The display name of the user */
  display_name: string;
};

/** Represents subscriber status */
export type SubscriberStatus =
  | 'alive'
  | 'pending_cancellation'
  | 'pending_failure'
  | 'failed_payment'
  | 'fixed_subscription_period_ended'
  | 'cancelled';

/** Represents a subscriber */
export type Subscriber = {
  /** The id of the subscriber */
  id: string;

  /** The id of the product for which user has subscribed */
  product_id: string;

  /** The name of the product for which user has subscribed */
  product_name: string;

  /** The user-id of the subscriber */
  user_id: string;

  /** The email of the subscriber */
  user_email: string;

  /** An array of charge ids belonging to this subscriber */
  purchase_ids: string[];

  /** Timestamp when subscription was created */
  created_at: string;

  /** If present, timestamp when the user requested cancellation */
  user_requested_cancellation_at: string | null;

  /** Number of charges made for this subscription */
  charge_occurrence_count: number | null;

  /** Subscription duration - `monthly`, `quarterly`, `biannually` or `yearly` */
  recurrence: Recurrence;

  /** If present, timestamp at which subscription will be cancelled */
  cancelled_at: string | null;

  /** If present, timestamp at which the subscription ended */
  ended_at: string | null;

  /** If present, timestamp at which the subscription failed */
  failed_at: string | null;

  /** Timestamp when free trial ends, if free trial is enabled for the membership */
  free_trial_ends_at: string | null;

  /** License key from the original purchase */
  license_key: string;

  /**
   * The current status of the subscription.
   *
   * One of - `alive`, `pending_cancellation`, `pending_failure`, `failed_payment`,
   * `fixed_subscription_period_ended` or `cancelled`
   */
  status: SubscriberStatus;
};

/** Represents a Purchase */
export type Purchase = {
  /** The id of the purchase */
  id: string;

  /** The timestamp when purchase was made */
  created_at: string;

  /** */
  variants: string;

  /** The id of the seller */
  seller_id: string;

  /** The id of the product */
  product_id: string;

  /** The name of the product */
  product_name: string;

  /** The relative permalink of the product */
  permalink: string;

  /** The permalink of the product */
  product_permalink: string;

  /** Unique identifier for the product */
  short_product_id: string;

  /** The email of the buyer */
  email: string;

  /** The price paid, in USD cents */
  price: number;

  /** Gumroad's fee, in USD cents */
  gumroad_fee: number;

  /** The currency of the product */
  currency: StringWithSuggestions<'usd'>;

  /** The quantity */
  quantity: number;

  /** `true` if this sale was subject to Gumroad Discover fees, `false` otherwise */
  discover_fee_charged: boolean;

  can_contact: boolean;
  referrer: StringWithSuggestions<'direct'>;

  /** Payment instrument details */
  card: Card;

  /** Numeric version of sale_id */
  order_number: number;

  /** The id of the sale */
  sale_id: string;

  /** The timestamp of the sale */
  sale_timestamp: string;

  /** If present, the name of the buyer */
  full_name: string;

  /** The id of the purchaser's Gumroad account, if the purchaser has one */
  purchaser_id?: string;

  /** If present, the country of the buyer's IP address */
  ip_country: string;

  /** `true` if this sale has been refunded, false otherwise */
  refunded: boolean;

  /** Indicates whether the sale is disputed */
  disputed: boolean;

  /** Indicates whether the dispute won by the user */
  dispute_won: boolean;

  /** If present, the custom fields */
  custom_fields: Record<string, string | boolean>;
} & (
  | {
      license_key?: null;
      is_multiseat_license?: null;
      license_uses?: null;
    }
  | {
      /** If licenses are enabled for the product */
      license_key: string;

      license_uses: number;
      is_multiseat_license: boolean;
    }
) &
  (
    | {
        /** purchase was refunded, non-subscription product only */
        chargebacked: boolean;

        subscription_id?: null;
        recurrence?: null;
        subscription_ended_at?: null;
        subscription_cancelled_at?: null;
        subscription_failed_at?: null;
      }
    | {
        /** The id of the subscription, if the purchase is part of a subscription */
        subscription_id: string;

        /** If present, the recurrence of the payment option chosen by the buyer such as `monthly`, `yearly`, etc */
        recurrence: Recurrence;

        /** subscription was ended, subscription product only */
        subscription_ended_at: string | null;

        /** subscription was cancelled, subscription product only */
        subscription_cancelled_at: string | null;

        /** we were unable to charge the subscriber's card */
        subscription_failed_at: string | null;
      }
  ) &
  (
    | {
        /** `true` if a gift, `false` otherwise */
        is_gift_receiver_purchase: false;

        gifter_email?: null;
        gift_price?: null;
      }
    | {
        /** `true` if a gift, `false` otherwise */
        is_gift_receiver_purchase: true;

        /** Email address of gifter */
        gifter_email: string;

        /** The price paid by the gifter, in USD cents */
        gift_price: string;
      }
  );

/** Name of Resource subscription */
export type ResourceSubscriptionName =
  | 'sale'
  | 'refund'
  | 'dispute'
  | 'dispute_won'
  | 'cancellation'
  | 'subscription_updated'
  | 'subscription_ended'
  | 'subscription_restarted';

/** Represents a resource subscription */
export type ResourceSubscription = {
  /** The id of resource subscription */
  id: string;

  /** The resource name of resource subscription */
  resource_name: ResourceSubscriptionName;

  /** The post url of resource subscription */
  post_url: string;
};

/** Represents a variant category */
export type VariantCategory = {
  /** The id of variant category */
  id: string;

  /** The title of the variant category */
  title: string;
};

/** Represents a variant */
export type Variant = {
  /** The id of the variant */
  id: string;

  /** The name of the variant */
  name: string;

  /** The price difference in USD cents */
  price_difference_cents: number;

  /** The number of maximum purchases if set */
  max_purchase_count: number | null;
};

/** Represents a sale */
export type Sale = {
  /** The id of the sale */
  id: string;

  /** The email of the buyer */
  email: string;

  /** The id of the seller */
  seller_id: string;

  /** Interval from now and when the sale was made */
  timestamp: string;

  /** Daystamp when the sale was made */
  daystamp: string;

  /** Timestamp when the sale was created */
  created_at: string;

  /** The name of the product */
  product_name: string;

  /** Indicates whether the product has variants */
  product_has_variants: boolean;

  /** The price paid, in USD cents */
  price: number;

  /** Gumroad's fee, in USD cents */
  gumroad_fee: number;

  is_bundle_purchase: boolean;
  is_bundle_product_purchase: boolean;

  /** Formatted display price */
  formatted_display_price: string;

  /** Formatted total price */
  formatted_total_price: string;

  /** Symbol of the currency */
  currency_symbol: string;

  /** Amount refundable in currency */
  amount_refundable_in_currency: `${number}`;

  /** The id of the product */
  product_id: string;

  /** The permalink of the product */
  product_permalink: string;

  /** `true` if this sale has been refunded, false otherwise */
  refunded: boolean;

  /** `true` if this sale has been partially refunded, false otherwise */
  partially_refunded: boolean;

  /** purchase was refunded, non-subscription product only */
  chargedback: boolean;

  /** The email of the buyer */
  purchase_email: string;

  /** If present, the street address */
  street_address?: string;

  /** If present, the city */
  city?: string;

  /** If present, the state */
  state?: string;

  country: string;
  country_iso2: string;
  zip_code?: `${number}`;
  paid: boolean;
  has_variants: boolean;
  variants?: Record<string, string>;
  variants_and_quantity: string;

  /** Indicates whether custom fields are there */
  has_custom_fields: boolean;

  /** Custom fields of the original purchse */
  custom_fields: Record<string, string | boolean>;

  /** The order id of the sale */
  order_id: number;

  /** Indicates whether the product is physical */
  is_product_physical: boolean;

  /** The id of the purchaser's Gumroad account, if the purchaser has one */
  purchaser_id?: string;

  is_recurring_billing: boolean;
  can_contact: boolean;
  is_following: boolean;

  /** Indicates whether the sale is disputed */
  disputed: boolean;

  /** Indicates whether the dispute won by the user */
  dispute_won: boolean;

  is_additional_contribution: boolean;
  discover_fee_charged: boolean;
  is_upgrade_purchase: boolean;
  is_more_like_this_recommended: boolean;
  referrer: StringWithSuggestions<'direct'>;
  paypal_refund_expired?: boolean;

  /** Payment instrument details */
  card: Card;

  /** Rating of the product */
  product_rating: number | null;

  /** Number of reviews */
  reviews_count: number;

  /** Average rating of the product */
  average_rating: number;

  /** The quantity */
  quantity: number;

  /** If present, the affiliate's information */
  affiliate?: {
    /** The affiliate's email address */
    email: string;

    /** The amount paid to the affiliate in USD cents */
    amount: string;
  };

  offer_code?: {
    name: string;
    displayed_amount_off: string;
  };
} & (
  | { is_gift_sender_purchase: false; is_gift_receiver_purchase: false }
  | { is_gift_sender_purchase: true; is_gift_receiver_purchase: false }
  | { is_gift_sender_purchase: false; is_gift_receiver_purchase: true }
) &
  (
    | {
        subscription_id?: null;
        cancelled?: null;
        ended?: null;
        recurring_charge?: null;
      }
    | {
        subscription_id: string;
        cancelled: boolean;
        ended: boolean;
        recurring_charge: boolean;
      }
  ) &
  (
    | {
        license_key?: null;
        license_id?: null;
        license_disabled?: null;
      }
    | {
        license_key: string;
        license_id: string;
        license_disabled: boolean;
      }
  ) &
  (
    | {
        shipped?: null;
        sku_id?: null;
        sku_external_id?: null;
      }
    | {
        shipped: boolean;
        sku_id: string;
        sku_external_id: string;
      }
  );

export type PayoutStatus = 'payable' | 'completed' | 'pending' | 'failed';

export type PaymentProcessor = 'stripe' | 'paypal' | 'STRIPE' | 'PAYPAL';

export type PayoutMinimal = {
  /** Unique identifier for the payout (null for upcoming payouts) */
  id: string | null;

  /** Payout amount as a decimal string */
  amount: string;

  /** ISO currency code (e.g. "USD") */
  currency: string;

  /** Payout status */
  status: PayoutStatus;

  /** ISO 8601 timestamp of when the payout was created */
  created_at: string;

  /** ISO 8601 timestamp of when the payout was processed */
  processed_at: string | null;

  /** Payment processor used */
  payment_processor: PaymentProcessor;

  /** Masked bank account number (present for Stripe payouts) */
  bank_account_visual: string | null;

  /** PayPal email address (present for PayPal payouts) */
  paypal_email: string | null;
};

/** Transaction type */
export type TransactionType =
  | 'Sale'
  | 'Chargeback'
  | 'Full Refund'
  | 'Partial Refund'
  | 'PayPal Refund'
  | 'Stripe Connect Refund'
  | 'Affiliate Credit'
  | 'PayPal Connect Affiliate Fees'
  | 'Stripe Connect Affiliate Fees'
  | 'PayPal Payouts'
  | 'Stripe Connect Payouts'
  | 'Credit'
  | 'Payout Fee'
  | 'Technical Adjustment';

/** Represents a payout transaction */
export type Transaction = {
  /** Transaction type */
  type: TransactionType;

  /** Transaction date (YYYY-MM-DD) */
  date: string;

  /** Associated purchase ID */
  purchase_id: string;

  /** Name of the purchased item */
  item_name: string;

  /** Name of the buyer */
  buyer_name: string;

  /** Email of the buyer */
  buyer_email: string;

  /** Tax amount */
  taxes: number | string;

  /** Shipping amount */
  shipping: number | string;

  /** Sale price (negative for refunds/chargebacks) */
  sale_price: number;

  /** Gumroad fees */
  gumroad_fees: number | string;

  /** Net total after fees (negative for refunds/chargebacks) */
  net_total: number;
};

/** Represents a Payout */
export type Payout = PayoutMinimal & {
  /** Array of sale IDs included in this payout (omitted if include_sales is "false") */
  sales?: string[];

  /** Array of refunded sale IDs in this payout (omitted if include_sales is "false") */
  refunded_sales?: string[];

  /** Array of disputed sale IDs in this payout (omitted if include_sales is "false") */
  disputed_sales?: string[];

  /** Detailed transaction list matching payout CSV export (present when include_transactions is "true") */
  transactions?: Transaction[];
};

/** Tax form type */
export type TaxFormType = 'us_1099_k' | 'us_1099_misc';

/** Represents a tax form */
export type TaxForm = {
  /** The tax year the form covers */
  tax_year: number;

  /** The form type. */
  tax_form_type: TaxFormType;

  /**
   * ISO-8601 timestamp when Stripe filed the form with the IRS.
   * `null` if the form has not yet been filed.
   */
  filed_at: string | null;
};

/** Represents an Annual earnings breakdown */
export type AnnualEarnings = {
  /** The tax year the earnings cover */
  year: number;

  /** Always `usd` */
  currency: StringWithSuggestions<'usd'>;

  /** Gross earnings in cents, summed across all successful non-refunded sales */
  gross_cents: number;

  /** Gumroad fees in cents */
  fees_cents: number;

  /** Gumroad-collected and seller-collected taxes in cents */
  taxes_cents: number;

  /** Affiliate credit in cents */
  affiliate_credit_cents: number;

  /** Equals `gross_cents - fees_cents - taxes_cents - affiliate_credit_cents` */
  net_cents: number;
};

/**
 * * Update (Resource subscriptions post data) types
 */

/** Represents an update for `sale`, `refund`, `dispute` or `dispute_won` */
export type UpdatePing = {
  /** The id of the seller */
  seller_id: string;

  /** The id of the product */
  product_id: string;

  /** The name of the product */
  product_name: string;

  /** The relative permalink of the product */
  permalink: string;

  /** The permalink of the product */
  product_permalink: string;

  /** Unique identifier for the product */
  short_product_id: string;

  /** The email of the buyer */
  email: string;

  /** The price paid, in USD cents */
  price: string;

  /** Gumroad's fee, in USD cents */
  gumroad_fee: number;

  /** The currency of the product */
  currency: StringWithSuggestions<'usd'>;

  /** The quantity */
  quantity?: number;

  /** `true` if this sale was subject to Gumroad Discover fees, `false` otherwise */
  discover_fee_charged: boolean;

  can_contact: boolean;
  referrer?: StringWithSuggestions<'direct'>;

  /** Payment instrument details */
  card: Card;

  /** Numeric version of sale_id */
  order_number: number;

  /** The id of the sale */
  sale_id: string;

  /** The timestamp of the sale */
  sale_timestamp: string;

  /** If present, the name of the buyer */
  full_name?: string;

  /** If present, a dictionary with custom fields */
  custom_fields?: Record<string, string | boolean>;

  /** If licenses are enabled for the product */
  license_key?: string;

  /** If present, the country of the buyer's IP address */
  ip_country?: string;

  /** `true` if this sale has been refunded, false otherwise */
  refunded: boolean;

  /** Indicates whether the sale is disputed */
  disputed: boolean;

  /** Indicates whether the dispute won by the user */
  dispute_won: boolean;

  /**
   * You can pass unique URL parameters by adding them to any Gumroad product URL.
   *
   * If passed, they will show up in the url_params
   */
  url_params: Record<string, string>;

  /** The id of the purchaser's Gumroad account, if the purchaser has one */
  purchaser_id?: string;

  /** If present, a dictionary of product variants */
  variants?: Record<string, string>;

  /** If present, a offer code */
  offer_code?: string;

  /** If present, a dictionary */
  shipping_information?: Record<string, string>;

  /** If relevant, a boolean */
  is_preorder_authorization?: boolean;

  /** The shipping paid, in USD cents, if the product is a physical product */
  shipping_rate?: string;

  /** If present, the affiliate's email address */
  affiliate?: string;

  /** If present, the amount paid to the affiliate in USD cents */
  affiliate_credit_amount_cents?: string;

  /** If you are buying your own product, for testing purposes */
  test: boolean;
} & (
  | {
      /** `true` if a gift, `false` otherwise */
      is_gift_receiver_purchase: false;

      gifter_email?: null;
      gift_price?: null;
    }
  | {
      /** `true` if a gift, `false` otherwise */
      is_gift_receiver_purchase: true;

      /** Email address of gifter */
      gifter_email: string;

      /** The price paid by the gifter, in USD cents */
      gift_price: string;
    }
) &
  (
    | {
        subscription_id?: null;
        recurrence?: null;
        is_recurring_charge?: null;
      }
    | {
        /** The id of the subscription, if the purchase is part of a subscription */
        subscription_id: string;

        /** If present, the recurrence of the payment option chosen by the buyer such as `monthly`, `yearly`, etc. */
        recurrence: Recurrence;

        /** If relevant, a boolean */
        is_recurring_charge: boolean;
      }
  );

/** Common fields for subscriptions' updates */
export type UpdateSubscription = {
  /** The id of the subscription */
  subscription_id: string;

  /** The id of the product */
  product_id: string;

  /** The name of the product */
  product_name: string;

  /** The user-id of the subscriber */
  user_id: string;

  /** The email of the subscriber */
  user_email: string;

  /** An array of charge ids belonging to this subscription */
  purchase_ids: string[];

  /** Timestamp when subscription was created */
  created_at: string;

  /** Number of charges made for this subscription */
  charge_occurrence_count: number;

  /** Subscription duration - `monthly`, `quarterly`, `biannually` or `yearly` */
  recurrence: Recurrence;

  /** Timestamp when free trial ends, if free trial is enabled for the membership */
  free_trial_ends_at?: string;

  /** Custom fields from the original purchase as an array of {@link CustomField} */
  custom_fields: string[];

  /** License key from the original purchase */
  license_key: string;
};

/** Represents a tier */
export type Tier = {
  /** The id of the tier */
  id: string;

  /** The name of the tier */
  name: string;
};

/** Represents a plan */
export type Plan = {
  /** The tier of the plan */
  tier: Tier;

  /** The duration of the plan */
  recurrence: Recurrence;

  /** The price of the plan in USD cents */
  price_cents: string;

  /** The quantity of the plan */
  quantity: number;
};

/** Represents a `subscription_updated` update */
export type UpdateSubscriptionUpdated = UpdateSubscription & {
  /** The type of update - `upgrade` or `downgrade` */
  type: 'upgrade' | 'downgrade';

  /** Timestamp at which the change went or will go into effect */
  effective_as_of: string;

  /** Plan before change as {@link Plan} */
  old_plan: Plan;

  /** Plan after change as {@link Plan} */
  new_plan: Plan;
};

/** Represents a `subscription_ended` update */
export type UpdateSubscriptionEnded = UpdateSubscription & {
  /** Timestamp at which the subscription ended */
  ended_at: string;

  /** The reason for the subscription ending */
  ended_reason: 'cancelled' | 'failed_payment' | 'fixed_subscription_period_ended';
};

/** Represents a `subscription_restarted` update */
export type UpdateSubscriptionRestarted = UpdateSubscription & {
  /** Timestamp at which the subscription was restarted */
  restarted_at: string;
};

/** Represents an `cancellation` update */
export type UpdateCancellation = UpdateSubscription & {
  /** `true` if subscription has been cancelled, otherwise false */
  cancelled: boolean;

  /** timestamp at which subscription will be cancelled */
  cancelled_at: string;

  /** `true` if subscription was been cancelled by admin, otherwise not present */
  cancelled_by_admin?: true;

  /** `true` if subscription was been cancelled by buyer, otherwise not present */
  cancelled_by_buyer?: true;

  /** `true` if subscription was been cancelled by seller, otherwise not present */
  cancelled_by_seller?: true;

  /** `true` if subscription was been cancelled automatically because of payment failure, otherwise not present */
  cancelled_due_to_payment_failures?: true;
};

export type UpdateMap = {
  /** Represents an update for `sale`, `refund`, `dispute` or `dispute_won` */
  ping: UpdatePing;

  /**
   * Represents a `sale` update
   *
   * When subscribed to this resource, you will be notified of the
   * user's sales.
   */
  sale: UpdatePing;

  /**
   * Represents a `refund` update
   *
   * When subscribed to this resource, you will be notified of refunds
   * to the user's sales.
   */
  refund: UpdatePing;

  /**
   * Represents a `dispute_won` update
   *
   * When subscribed to this resource, you will be notified of
   * the disputes raised against user's sales.
   */
  dispute: UpdatePing;

  /**
   * Represents a `dispute_won` update
   *
   * When subscribed to this resource, you will be notified of the sale
   * disputes won by the user.
   */
  dispute_won: UpdatePing;

  /**
   * Represents a `cancellation` update
   *
   * When subscribed to this resource, you will be notified of cancellations
   * of the user's subscribers.
   */
  cancellation: UpdateCancellation;

  /**
   * Represents a `subscription_updated` update
   *
   * When subscribed to this resource, you will be notified when
   * subscriptions to the user's products have been upgraded or
   * downgraded. A subscription is "upgraded" when the subscriber
   * switches to an equally or more expensive tier and/or subscription
   * duration. It is "downgraded" when the subscriber switches to a
   * less expensive tier and/or subscription duration. In the case of
   * a downgrade, this change will take effect at the end of the current
   * billing period. (Note: This currently applies only to tiered
   * membership products, not to all subscription products.)
   */
  subscription_updated: UpdateSubscriptionUpdated;

  /**
   * Represents a `subscription_ended` update
   *
   * When subscribed to this resource, you will be notified when subscriptions
   * to the user's products have ended. These events include termination
   * of a subscription due to: failed payment(s); cancellation;
   * or a subscription of fixed duration ending. Notifications are sent
   * at the time the subscription has officially ended, not, for example,
   * at the time cancellation is requested.
   */
  subscription_ended: UpdateSubscriptionEnded;

  /**
   * Represents a `subscription_restarted` update
   *
   * When subscribed to this resource,you will be notified when subscriptions
   * to the user's products have been restarted. A subscription is "restarted"
   * when the subscriber restarts their subscription after previously terminating it.
   */
  subscription_restarted: UpdateSubscriptionRestarted;
};

export type Update<T extends keyof UpdateMap> = UpdateMap[T];
