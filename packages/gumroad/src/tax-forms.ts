import { Methods } from './methods';
import type { TaxForm, TaxFormType } from './types';
import { assertNonBlankString, assertNumber } from './utils';

/** A class having API methods related to Tax Forms */
export class TaxFormsMethods extends Methods {
  /**
   * Retrieves tax forms (1099-K, 1099-MISC) generated for the authenticated user.
   * Only available to US-based sellers with the tax center enabled.
   *
   * @param options (Optional) Options
   *
   * @returns On success, an Array of {@link TaxForm}
   *
   * @see https://app.gumroad.com/api#get-/tax_forms
   *
   * **Only available with the `view_tax_data` scope.**
   */
  async list(
    options: {
      /**
       * A 4-digit tax year.
       *
       * When omitted, returns forms for every available year.
       *
       * Returns 404 if the year is outside the seller's available range (account-creation year through the previous calendar year).
       */
      year?: number;
    } = {},
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<TaxForm[]> {
    try {
      const { year } = options;

      if (typeof year !== 'undefined') {
        assertNumber(year, "'options.year'");
      }

      return (
        await this.client.request<{ tax_forms: TaxForm[] }>('./tax_forms', {
          params: { year },
          signal,
        })
      ).tax_forms;
    } catch (e) {
      this.logger.function(e, 'TaxForms.list', {
        options,
      });

      throw e;
    }
  }

  /**
   * Downloads the PDF for a specific tax form. Response is the raw PDF on success
   *
   * @param year A 4-digit tax year.
   * @param tax_form_type The form type.
   *
   * @returns On success, An Object
   *
   * @see https://app.gumroad.com/api#get-/tax_forms/:year/:tax_form_type/download
   *
   * **Only available with the `view_tax_data` scope.**
   */
  async download(
    year: number,
    tax_form_type: TaxFormType,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<{ bytes: Uint8Array<ArrayBuffer>; type: string | null }> {
    try {
      assertNumber(year, "Argument 'year'");
      assertNonBlankString(tax_form_type, "Argument 'tax_form_type'");

      const { bytes, type } = await this.client.request<{
        bytes: Uint8Array<ArrayBuffer>;
        type: string | null;
      }>(`./tax_forms/${year}/${encodeURI(tax_form_type)}/download`, {
        headers: {
          Accept: 'application/pdf',
        },
        download: true,
        signal,
      });

      return { bytes, type };
    } catch (e) {
      this.logger.function(e, 'TaxForms.download');

      throw e;
    }
  }
}
