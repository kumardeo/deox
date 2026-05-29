import { Methods } from './methods';
import type { Cover } from './types';
import { assertNonBlankString } from './utils';

/** A class having API methods related to Covers */
export class CoversMethods extends Methods {
  /**
   * Add a cover to a product from a publicly accessible URL.
   * The server fetches the URL and stores a copy, so the URL must be reachable over HTTP(S)
   * and cannot be a private or pre-signed upload URL.
   *
   * Accepts image (JPEG, PNG, GIF) and video URLs, as well as YouTube and Vimeo URLs.
   *
   * @param product_id The id of the product
   * @param url A publicly accessible image/video URL, or a YouTube/Vimeo URL
   *
   * @returns On success, An object containing `covers` and `main_cover_id`
   *
   * @see https://app.gumroad.com/api#post-/products/:product_id/covers
   *
   * **Only available with the `edit_products` scope.**
   */
  async add(product_id: string, url: string, { signal }: { signal?: AbortSignal } = {}): Promise<{ covers: Cover[]; main_cover_id: string | null }> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");
      assertNonBlankString(url, "Argument 'url'");

      const { covers, main_cover_id } = await this.client.request<{
        covers: Cover[];
        main_cover_id: string | null;
      }>(`./products/${encodeURI(product_id)}/covers`, {
        method: 'POST',
        params: { url },
        signal,
      });

      return { covers, main_cover_id };
    } catch (e) {
      this.logger.function(e, 'Covers.add', { product_id, url });

      throw e;
    }
  }

  /**
   * Delete a cover from a product.
   *
   * @param product_id The id of the product
   * @param cover_id The id of the cover
   *
   * @returns On success, An object containing `covers` and `main_cover_id`
   *
   * @see https://app.gumroad.com/api#delete-/products/:product_id/covers/:id
   *
   * **Only available with the `edit_products` scope.**
   */
  async delete(
    product_id: string,
    cover_id: string,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<{ covers: Cover[]; main_cover_id: string | null }> {
    try {
      assertNonBlankString(product_id, "Argument 'product_id'");
      assertNonBlankString(cover_id, "Argument 'cover_id'");

      const { covers, main_cover_id } = await this.client.request<{ covers: Cover[]; main_cover_id: string | null }>(
        `./products/${encodeURI(product_id)}/covers/${encodeURI(cover_id)}`,
        {
          method: 'DELETE',
          signal,
        },
      );

      return { covers, main_cover_id };
    } catch (e) {
      this.logger.function(e, 'Covers.delete', {
        product_id,
        cover_id,
      });

      throw e;
    }
  }
}
