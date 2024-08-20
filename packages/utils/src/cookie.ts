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
  get cookie() {
    return document.cookie;
  },

  /** Set cookie string equivalent to `document.cookie = value` */
  set cookie(value: string) {
    document.cookie = value;
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
   * Retrieves a cookie value by its key.
   *
   * @param key - The key of the cookie to retrieve.
   *
   * @returns The value of the cookie, or null if not found.
   */
  get(key: string) {
    const matches = this.cookie.match(new RegExp(`(?:^|; )${key.replace(/([.$?*|{}()[\]\\/+^])/g, '$1')}=([^;]*)`));
    return matches?.[1] ? decodeURIComponent(matches[1]) : null;
  },

  /**
   * Retrieves all the cookies
   *
   * @returns Record of string and string
   */
  getAll() {
    const cookies: Record<string, string> = {};
    const cookieArray = this.cookie.split('; ');
    for (let i = 0; i < cookieArray.length; i += 1) {
      const [name, value] = cookieArray[i].split('=');
      if (name) {
        cookies[name] = decodeURIComponent(value || '');
      }
    }
    return cookies;
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

    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value !== undefined ? value : '')}`;

    for (const optionKey in object) {
      const optionValue = object[optionKey as keyof typeof object];
      let flagKey = optionKey;
      let flagValue = optionValue;
      switch (optionKey) {
        case 'expires':
          flagValue = optionValue instanceof Date ? optionValue.toUTCString() : optionValue;
          break;
        case 'maxAge':
          flagKey = 'max-age';
          break;
        case 'sameSite':
          flagKey = 'samesite';
          flagValue = optionValue === 'none' ? true : optionValue;
          break;
      }
      cookieString += `; ${flagKey}`;
      const shouldAddValue = (typeof flagValue === 'boolean' ? flagValue !== true : true) && optionValue !== undefined;
      if (shouldAddValue) {
        cookieString += `=${flagValue}`;
      }
    }

    this.cookie = cookieString;
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
