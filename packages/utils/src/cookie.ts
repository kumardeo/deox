/** Represents options for setting a cookie. */
export interface SetCookieOptions {
  /** The path where the cookie is valid. Defaults to '/'. */
  path?: string;

  /** The domain where the cookie is valid. */
  domain?: string;

  /** Indicates if the cookie should only be sent over secure channels (HTTPS). Defaults to false. */
  secure?: boolean;

  /** Specifies the SameSite attribute of the cookie. Can be `none`, `strict`, or `lax`. */
  sameSite?: 'none' | 'strict' | 'lax';

  /** The maximum age of the cookie in seconds. */
  maxAge?: number;

  /** The expiration date of the cookie. It can be a string or a Date object. */
  expires?: string | Date;
}

export const cookie = {
  /** Cookie string equivalent to `document.cookie` */
  get value() {
    return document.cookie;
  },

  /** Set cookie string equivalent to `document.cookie = value` */
  set value(value: string) {
    // biome-ignore lint/suspicious/noDocumentCookie: we need to set cookie
    document.cookie = value;
  },

  /**
   * Retrieves a cookie value by its key.
   *
   * @param key - The key of the cookie to retrieve.
   *
   * @returns The value of the cookie, or null if not found.
   */
  get(key: string) {
    const regex = new RegExp(`(?:^|; )${encodeURIComponent(key).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}=([^;]*)`);
    const matches = this.value.match(regex);
    return typeof matches?.[1] === 'string' ? decodeURIComponent(matches[1]) : null;
  },

  /**
   * Retrieves all the cookies
   *
   * @returns Record of string and string
   */
  getAll() {
    const cookies: Record<string, string> = {};
    const cookieArray = this.value.split('; ');
    for (let i = 0; i < cookieArray.length; i += 1) {
      const [name, value] = cookieArray[i].split('=');
      if (typeof name === 'string') {
        cookies[decodeURIComponent(name)] = value ? decodeURIComponent(value) : '';
      }
    }
    return cookies;
  },

  /**
   * Check whether a cookie with specific key exists.
   *
   * @param key The cookie key to check.
   */
  has(key: string) {
    return this.get(key) !== null;
  },

  /**
   * Sets a cookie with the provided key, value, and options.
   *
   * @param key - The key of the cookie to set.
   * @param value - The value to assign to the cookie.
   * @param options - Additional options for the cookie.
   *
   * @returns The cookie string that was set.
   */
  set(key: string, value: string, options?: SetCookieOptions) {
    const object = { path: '/', ...options };

    let cookieString = `${encodeURIComponent(key)}=${typeof value !== 'undefined' ? encodeURIComponent(value) : ''}`;

    for (let flagKey in object) {
      let flagValue = object[flagKey as keyof typeof object];
      switch (flagKey) {
        case 'expires':
          if (flagValue instanceof Date) {
            flagValue = flagValue.toUTCString();
          }
          break;
        case 'maxAge':
          flagKey = 'max-age';
          break;
        case 'sameSite':
        case 'samesite':
          flagKey = 'samesite';
          if (flagValue === 'none') {
            flagValue = true;
          }
          break;
      }
      cookieString += `; ${flagKey}`;
      const shouldAddValue = typeof flagValue === 'boolean' ? flagValue !== true : typeof flagValue !== 'undefined';
      if (shouldAddValue) {
        cookieString += `=${flagValue}`;
      }
    }

    this.value = cookieString;
    return cookieString;
  },

  /**
   * Removes a cookie with specific key.
   *
   * @param key - The key of the cookie to remove.
   */
  remove(key: string) {
    this.set(key, '', {
      maxAge: -1,
    });
  },

  /**
   * Removes all the cookies.
   */
  clear() {
    for (const key in this.getAll()) {
      this.remove(key);
    }
  },

  /**
   * All cookie keys
   */
  get keys() {
    return Object.keys(this.getAll());
  },

  /**
   * Number of cookies set
   */
  get size() {
    return this.keys.length;
  },
};
