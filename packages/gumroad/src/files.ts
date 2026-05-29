import { Methods } from './methods';
import { assertArray, assertNonBlankString, assertNumber, assertObject } from './utils';

/** A class having API methods related to Files */
export class FilesMethods extends Methods {
  /**
   * Start a multipart upload. Returns presigned URLs for each part.
   *
   * @param filename The filename (e.g. `course.pdf`)
   * @param file_size The file size in bytes; max 20 GB
   *
   * @returns On success, An Object
   *
   * @see https://app.gumroad.com/api#post-/files/presign
   *
   * **Only available with the `edit_products` scope.**
   */
  async presign(
    filename: string,
    file_size: number,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<{
    /** S3 multipart upload ID; pass to `/files/complete` */
    upload_id: string;

    /** S3 object key for the uploaded file; pass to `/files/complete` */
    key: string;

    /**
     * Canonical S3 URL (`{S3_BASE_URL}attachments/{seller_external_id}/{guid}/original/{filename}`);
     * the S3 object isn't accessible until `/files/complete` finalizes the multipart upload
     */
    file_url: string;

    /** One entry per 100 MB part; PUT the bytes for each part to its `presigned_url` */
    parts: {
      /** Sequential part number, starting at 1 */
      part_number: number;

      /** S3 presigned URL; expires after 900 seconds (15 minutes) */
      presigned_url: string;
    }[];
  }> {
    try {
      assertNonBlankString(filename, "Argument 'filename'");
      assertNumber(file_size, "Argument 'file_size'");

      const { upload_id, key, file_url, parts } = await this.client.request<{
        upload_id: string;
        key: string;
        file_url: string;
        parts: {
          part_number: number;
          presigned_url: string;
        }[];
      }>('./files/presign', {
        method: 'POST',
        params: { filename, file_size },
        signal,
      });

      return { upload_id, key, file_url, parts };
    } catch (e) {
      this.logger.function(e, 'Files.presign', { filename, file_size });

      throw e;
    }
  }

  /**
   * Finalize the multipart upload started by `/v2/files/presign`.
   *
   * Returns the final `file_url`.
   *
   * @param upload_id returned by `/files/presign`
   * @param key returned by `/files/presign`
   * @param parts An Array of `{ part_number, etag }`
   *
   * @returns On success, An Object
   *
   * @see https://app.gumroad.com/api#post-/files/complete
   *
   * **Only available with the edit_products scope.**
   */
  async complete(
    upload_id: string,
    key: string,
    parts: { part_number: string; etag: string }[],
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<{
    /** Pass this as `files[][url]` when attaching to a product */
    file_url: string;
  }> {
    try {
      assertNonBlankString(upload_id, "Argument 'upload_id'");
      assertNonBlankString(key, "Argument 'key'");
      assertArray(parts, "Argument 'parts'");

      if (parts.length === 0) {
        throw new TypeError("Argument 'parts' must have at least 1 item");
      }

      const params: Record<string, string | number> = { upload_id, key };

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        assertObject(part, `'parts[${i}]'`);
        assertNumber(part.part_number, `'parts[${i}].part_number'`);
        assertNonBlankString(part.etag, `'parts[${i}].etag'`);

        params['parts[][part_number]'] = part.part_number;
        params['parts[][etag]'] = part.etag;
      }

      const { file_url } = await this.client.request<{ file_url: string }>('./files/complete', {
        method: 'POST',
        params,
        signal,
      });

      return { file_url };
    } catch (e) {
      this.logger.function(e, 'Files.complete', { upload_id, key, parts });

      throw e;
    }
  }

  /**
   * Cancel a multipart upload started by `/v2/files/presign`.
   *
   * @param upload_id returned by `/files/presign`
   * @param key returned by `/files/presign`
   *
   * @returns On success, An Object
   *
   * @see https://app.gumroad.com/api#post-/files/abort
   *
   * **Only available with the edit_products scope.**
   */
  async abort(
    upload_id: string,
    key: string,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<{
    /**
     * `accepted` if S3 took the cancellation on this call (parts still in flight may finish seconds later);
     * `already_gone` if S3 has no multipart session for this `upload_id`
     */
    status: 'accepted' | 'already_gone';
  }> {
    try {
      assertNonBlankString(upload_id, "Argument 'upload_id'");
      assertNonBlankString(key, "Argument 'key'");

      const { status } = await this.client.request<{ status: 'accepted' | 'already_gone' }>('./files/abort', {
        method: 'POST',
        params: { upload_id, key },
        signal,
      });

      return { status };
    } catch (e) {
      this.logger.function(e, 'Files.abort', { upload_id, key });

      throw e;
    }
  }
}
