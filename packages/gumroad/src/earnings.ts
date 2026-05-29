import { Methods } from './methods';
import type { AnnualEarnings } from './types';
import { assertNumber } from './utils';

export class EarningsMethods extends Methods {
  /**
   * Retrieves an annual earnings breakdown for the authenticated user, matching the totals reported in the Tax Center.
   *
   * Only available to US-based sellers with the tax center enabled. Fully refunded sales are excluded from every aggregate.
   *
   * @param year A 4-digit tax year.
   * Returns 404 if the year is outside the seller's available range (account-creation year through the previous calendar year).
   *
   * @returns On success, an {@link AnnualEarnings} object
   *
   * @see https://app.gumroad.com/api#get-/earnings
   *
   * **Only available with the `view_tax_data` scope.**
   */
  async get(year: number, { signal }: { signal?: AbortSignal } = {}): Promise<AnnualEarnings> {
    try {
      assertNumber(year, "Argument 'year'");

      const { success, ...data } = await this.client.request<AnnualEarnings>('./earnings', {
        params: { year },
        signal,
      });

      return data;
    } catch (e) {
      this.logger.function(e, 'Earnings.get', { year });

      throw e;
    }
  }
}
