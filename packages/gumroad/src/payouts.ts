import { Methods } from './methods';
import type { Payout, PayoutMinimal } from './types';
import { addProperties, assertNonBlankString } from './utils';

/** Bindings for Array of {@link PayoutMinimal} */
export interface PayoutsProps {
  /** The key for next page of payouts if available */
  readonly next_page_key: string | undefined;

  /** The API endpoint for next page of payouts if available */
  readonly next_page_url: string | undefined;

  /**
   * Retrieves the next payouts
   *
   * @returns On success, an Array of {@link PayoutMinimal} | `null` if next page does not exists
   */
  next(requestOptions?: { signal?: AbortSignal }): Promise<(PayoutMinimal[] & PayoutsProps) | null>;
}

/** A class having API methods related to Payouts */
export class PayoutsMethods extends Methods {
  protected _bindPayouts(object: { next_page_url?: string; next_page_key?: string; payouts: PayoutMinimal[] }): PayoutMinimal[] & PayoutsProps {
    const properties: PayoutsProps = {
      next_page_key: object.next_page_key,
      next_page_url: object.next_page_url,
      next: async ({ signal } = {}) => {
        if (object.next_page_url) {
          return this._bindPayouts(
            await this.client.request<typeof object>(object.next_page_url, {
              signal,
            }),
          );
        }

        return null;
      },
    };

    return addProperties([...object.payouts], properties);
  }

  /**
   * Retrieves all of the payouts for the authenticated user.
   *
   * @param options (Optional) Options
   *
   * @returns On success, an Array of {@link PayoutMinimal}
   *
   * @see https://app.gumroad.com/api#get-/payouts
   *
   * **Only available with the `view_payouts` scope.**
   */
  async list(
    options: {
      /**
       * Date in form `YYYY-MM-DD`
       *
       * Only return payouts after this date
       */
      after?: string;

      /**
       * Date in form `YYYY-MM-DD`
       *
       * Only return payouts before this date
       */
      before?: string;

      /** A key representing a page of results. It is given in the response as `next_page_key`. */
      page_key?: string;

      /**
       * Set to `false` to exclude the upcoming payout from the response.
       *
       * @default true
       */
      include_upcoming?: boolean;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<PayoutMinimal[] & PayoutsProps> {
    try {
      const { after, before, page_key, include_upcoming } = options;

      return this._bindPayouts(
        await this.client.request<{
          next_page_url?: string;
          next_page_key?: string;
          payouts: PayoutMinimal[];
        }>('./payouts', {
          params: { after, before, page_key, include_upcoming },
          signal,
        }),
      );
    } catch (e) {
      this.logger.function(e, 'Payouts.list', {
        options,
      });

      throw e;
    }
  }

  /**
   * Retrieves the details of a specific payout by this user.
   *
   * @param payout_id The id of the payout
   * @param options (Optional) Options
   *
   * @returns On success, a {@link Payout}
   *
   * @see https://app.gumroad.com/api#get-/payouts/:id
   *
   * **Only available with the `view_payouts` scope.**
   */
  async get(
    payout_id: string,
    options: {
      /**
       * Set to `false` to exclude the `sales`, `refunded_sales`, and `disputed_sales` details from the response.
       *
       * @default true
       */
      include_sales?: boolean;

      /**
       * Set to `true` to include the same transaction details in the response as exported payout CSV.
       * All balance-affecting transactions included in the payout will be listed in a `transactions` array.
       */
      include_transactions?: boolean;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<Payout> {
    try {
      assertNonBlankString(payout_id, "Argument 'payout_id'");

      const { include_sales, include_transactions } = options;

      return (
        await this.client.request<{ payout: Payout }>(`./payouts/${encodeURI(payout_id)}`, {
          params: { include_sales, include_transactions },
          signal,
        })
      ).payout;
    } catch (e) {
      this.logger.function(e, 'Payouts.get', {
        payout_id,
        options,
      });

      throw e;
    }
  }

  /**
   * Retrieves the details of upcoming payouts for this user.
   * There can be up to 2 upcoming payouts at any given time.
   *
   * @param options (Optional) Options
   *
   * @returns On success, an Array of {@link Payout}
   *
   * @see https://app.gumroad.com/api#get-/payouts/upcoming
   *
   * **Only available with the `view_payouts` scope.**
   */
  async upcoming(
    options: {
      /**
       * Set to `false` to exclude the `sales`, `refunded_sales`, and `disputed_sales` details from the response.
       *
       * @default true
       */
      include_sales?: boolean;

      /**
       * Set to `true` to include the same transaction details in the response as exported payout CSV.
       * All balance-affecting transactions included in the payout will be listed in a `transactions` array.
       *
       * @default false
       */
      include_transactions?: boolean;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<Payout[]> {
    try {
      const { include_sales, include_transactions } = options;

      return (
        await this.client.request<{
          payouts: Payout[];
        }>('./payouts/upcoming', {
          params: { include_sales, include_transactions },
          signal,
        })
      ).payouts;
    } catch (e) {
      this.logger.function(e, 'Payouts.upcoming', {
        options,
      });

      throw e;
    }
  }
}
