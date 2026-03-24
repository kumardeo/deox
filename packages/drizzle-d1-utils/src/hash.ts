import { createHash, createHmac } from 'node:crypto';

export function durableObjectNamespaceIdFromName(uniqueKey: string, name: string) {
  /**
   * In v3.2, miniflare uses durable object to implement D1 and hashes the local sqlite filename.
   *
   * See the following for more context:
   * https://github.com/cloudflare/workers-sdk/issues/4548 (understand the hash of the local D1 filename)
   * https://github.com/cloudflare/miniflare/releases/tag/v3.20230918.0
   *
   * This function is copied from these links
   */
  const key = createHash('sha256').update(uniqueKey).digest();
  const nameHmac = createHmac('sha256', key).update(name).digest().subarray(0, 16);
  const hmac = createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16);
  return Buffer.concat([nameHmac, hmac]).toString('hex');
}
