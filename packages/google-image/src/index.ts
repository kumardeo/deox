/**
 * Based on https://gist.github.com/Sauerstoffdioxid/2a0206da9f44dde1fdfce290f38d2703
 */

import { getParamInfo, HOSTS_REGEX, PARAMS_REGEX } from './utils';

export interface GoogleImageOptions {
  /**
   * Whether to keep existing image parameters.
   *
   * @default true
   */
  existing?: boolean;

  /**
   * When `true`, skips transformations on unsupported URLs.
   *
   * Instead of throwing an error for unsupported URLs, `.url()` will return the
   * original URL unchanged.
   *
   * @default false
   */
  pass?: boolean;
}

export class GoogleImage {
  private readonly _url: string;
  private readonly _match: [string, number] | null;
  private readonly _params: Record<string, string | number | boolean>;
  private readonly _pass: boolean;

  /**
   * Creates an instance of {@link GoogleImage}
   *
   * @param url The image url
   * @param options Options
   */
  constructor(url: string | URL, { existing = true, pass = false }: GoogleImageOptions = {}) {
    let imageUrl: string;
    if (url instanceof URL) {
      imageUrl = url.toString();
    } else if (typeof url === 'string') {
      imageUrl = url;
    } else {
      throw new TypeError("Argument 'url' must be of type string | URL");
    }

    this._url = imageUrl;
    this._pass = !!pass;
    this._match = null;
    this._params = {};

    if (!HOSTS_REGEX.test(imageUrl)) {
      return;
    }

    const matches = imageUrl.match(PARAMS_REGEX);

    if (!matches?.[0] || !matches.index) {
      return;
    }

    this._match = [matches[0], matches.index];

    if (!existing) {
      return;
    }

    for (const param of matches[0].split('-')) {
      if (!param) {
        continue;
      }
      const info = getParamInfo(param);
      if (!info) {
        continue;
      }
      this._params[`${info[0]}${info[1]}`] = info[2];
    }
  }

  private _check(): boolean {
    if (this._match) {
      return true;
    }
    if (!this._pass) {
      throw new Error('Image url is not supported for transformations');
    }
    return false;
  }

  private _boolean(param: string, value?: boolean, removeBeforeAdding?: string[]): boolean | this {
    const ok = this._check();

    const key = `${0}${param}`;

    // get
    if (value === undefined) {
      if (ok) {
        return (this._params[key] ?? false) as boolean;
      }
      return false;
    }

    // delete
    if (value === false) {
      if (ok && key in this._params) {
        delete this._params[key];
      }
    }
    // set
    else if (value === true) {
      if (ok) {
        if (removeBeforeAdding) {
          for (const remove of removeBeforeAdding) {
            const other = `${0}${remove}`;
            if (other in this._params) {
              delete this._params[other];
            }
          }
        }
        this._params[key] = true;
      }
    } else {
      throw new Error("Argument 'value' must be of type boolean");
    }

    return this;
  }

  private _number(param: string, value?: number | null): number | null | this {
    const ok = this._check();

    const key = `${1}${param}`;

    // get
    if (value === undefined) {
      if (ok) {
        return (this._params[key] ?? null) as number | null;
      }
      return null;
    }

    // delete
    if (value === null) {
      if (ok && key in this._params) {
        delete this._params[key];
      }
    }
    // set
    else if (typeof value === 'number') {
      if (ok) {
        this._params[key] = value;
      }
    } else {
      throw new TypeError("Argument 'value' must be of type number | null");
    }

    return this;
  }

  private _hex(param: string, value?: string | null): string | null | this {
    const ok = this._check();

    const regex = /^0x[0-9A-Fa-f]{6,8}$/;

    const key = `${2}${param}`;

    // get
    if (value === undefined) {
      if (ok) {
        return (this._params[key] ?? null) as string | null;
      }
      return null;
    }

    // delete
    if (value === null) {
      if (ok && key in this._params) {
        delete this._params[key];
      }
    }
    // set
    else if (typeof value === 'string') {
      if (!regex.test(value)) {
        throw new Error("Argument 'value' must be of format '0xrrggbb' or '0xaarrggbb'");
      }
      if (ok) {
        this._params[key] = value;
      }
    } else {
      throw new TypeError("Argument 'value' must be of type number | null");
    }

    return this;
  }

  private _format(param: string, value?: boolean): boolean | this {
    return this._boolean(param, value, ['rj', 'rp', 'rw', 'rwa', 'rg', 'rh', 'nw']);
  }

  /**
   * To check whether image url is supported for transformations
   *
   * @returns `true` if image url is supported otherwise `false`
   */
  isSupported() {
    return !!this._match;
  }

  width(): number | null;
  width(value: undefined): number | null;
  width(value: number | null): this;
  width(value?: number | null): number | null | this {
    return this._number('w', value);
  }

  height(): number | null;
  height(value: undefined): number | null;
  height(value: number | null): this;
  height(value?: number | null): number | null | this {
    return this._number('h', value);
  }

  size(): number | null;
  size(value: undefined): number | null;
  size(value: number | null): this;
  size(value?: number | null): number | null | this {
    return this._number('s', value);
  }

  noUpscaling(): boolean;
  noUpscaling(value: undefined): boolean;
  noUpscaling(value: boolean): this;
  noUpscaling(value?: boolean): boolean | this {
    return this._boolean('nu', value);
  }

  forceScaling(): boolean;
  forceScaling(value: undefined): boolean;
  forceScaling(value: boolean): this;
  forceScaling(value?: boolean): boolean | this {
    return this._boolean('s', value);
  }

  crop(): boolean;
  crop(value: undefined): boolean;
  crop(value: boolean): this;
  crop(value?: boolean): boolean | this {
    return this._boolean('c', value, ['cc', 'ci', 'p']);
  }

  circularCrop(): boolean;
  circularCrop(value: undefined): boolean;
  circularCrop(value: boolean): this;
  circularCrop(value?: boolean): boolean | this {
    return this._boolean('cc', value, ['c', 'ci', 'p']);
  }

  squareCrop(): boolean;
  squareCrop(value: undefined): boolean;
  squareCrop(value: boolean): this;
  squareCrop(value?: boolean): boolean | this {
    return this._boolean('ci', value, ['c', 'cc', 'p']);
  }

  alternateCrop(): boolean;
  alternateCrop(value: undefined): boolean;
  alternateCrop(value: boolean): this;
  alternateCrop(value?: boolean): boolean | this {
    return this._boolean('p', value, ['c', 'cc', 'ci']);
  }

  flipHorizontally(): boolean;
  flipHorizontally(value: undefined): boolean;
  flipHorizontally(value: boolean): this;
  flipHorizontally(value?: boolean): boolean | this {
    return this._boolean('fh', value);
  }

  flipVertically(): boolean;
  flipVertically(value: undefined): boolean;
  flipVertically(value: boolean): this;
  flipVertically(value?: boolean): boolean | this {
    return this._boolean('fv', value);
  }

  rotate(): number | null;
  rotate(value: undefined): number | null;
  rotate(value: 90 | 180 | 270 | null): this;
  rotate(value?: 90 | 180 | 270 | null): number | null | this {
    return this._number('r', value);
  }

  symbol(): number | null;
  symbol(value: undefined): number | null;
  symbol(value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null): this;
  symbol(value?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null): number | null | this {
    return this._number('ba', value);
  }

  borderRadius(): number | null;
  borderRadius(value: undefined): number | null;
  borderRadius(value: number | null): this;
  borderRadius(value?: number | null): number | null | this {
    return this._number('br', value);
  }

  border(): number | null;
  border(value: undefined): number | null;
  border(value: number | null): this;
  border(value?: number | null): number | null | this {
    return this._number('b', value);
  }

  color(): string | null;
  color(value: undefined): string | null;
  color(value: string | null): this;
  color(value?: string | null): string | null | this {
    return this._hex('c', value);
  }

  backgroundColor(): string | null;
  backgroundColor(value: undefined): string | null;
  backgroundColor(value: string | null): this;
  backgroundColor(value?: string | null): string | null | this {
    return this._hex('bc', value);
  }

  pad(): boolean;
  pad(value: undefined): boolean;
  pad(value: boolean): this;
  pad(value?: boolean): boolean | this {
    return this._boolean('pd', value, ['c', 'cc', 'ci', 'p']);
  }

  padColor(): string | null;
  padColor(value: undefined): string | null;
  padColor(value: string | null): this;
  padColor(value?: string | null): string | null | this {
    return this._hex('pc', value);
  }

  jpeg(): boolean;
  jpeg(value: undefined): boolean;
  jpeg(value: boolean): this;
  jpeg(value?: boolean): boolean | this {
    return this._format('rj', value);
  }

  png(): boolean;
  png(value: undefined): boolean;
  png(value: boolean): this;
  png(value?: boolean): boolean | this {
    return this._format('rp', value);
  }

  webp(): boolean;
  webp(value: undefined): boolean;
  webp(value: boolean): this;
  webp(value?: boolean): boolean | this {
    return this._format('rw', value);
  }

  animatedWebp(): boolean;
  animatedWebp(value: undefined): boolean;
  animatedWebp(value: boolean): this;
  animatedWebp(value?: boolean): boolean | this {
    return this._format('rwa', value);
  }

  gif(): boolean;
  gif(value: undefined): boolean;
  gif(value: boolean): this;
  gif(value?: boolean): boolean | this {
    return this._format('rg', value);
  }

  mp4(): boolean;
  mp4(value: undefined): boolean;
  mp4(value: boolean): this;
  mp4(value?: boolean): boolean | this {
    return this._format('rh', value);
  }

  html(): boolean;
  html(value: undefined): boolean;
  html(value: boolean): this;
  html(value?: boolean): boolean | this {
    return this._format('h', value);
  }

  download(): boolean;
  download(value: undefined): boolean;
  download(value: boolean): this;
  download(value?: boolean): boolean | this {
    return this._boolean('d', value);
  }

  noButton(): boolean;
  noButton(value: undefined): boolean;
  noButton(value: boolean): this;
  noButton(value?: boolean): boolean | this {
    return this._boolean('no', value, ['o']);
  }

  button(): boolean;
  button(value: undefined): boolean;
  button(value: boolean): this;
  button(value?: boolean): boolean | this {
    return this._boolean('o', value, ['no']);
  }

  cacheDays(): number | null;
  cacheDays(value: undefined): number | null;
  cacheDays(value: number | null): this;
  cacheDays(value?: number | null): number | null | this {
    return this._number('e', value);
  }

  disableAnimation(): boolean;
  disableAnimation(value: undefined): boolean;
  disableAnimation(value: boolean): this;
  disableAnimation(value?: boolean): boolean | this {
    return this._boolean('k', value);
  }

  frame(): number | null;
  frame(value: undefined): number | null;
  frame(value: number | null): this;
  frame(value?: number | null): number | null | this {
    return this._number('a', value);
  }

  /**
   * Get the new image url
   */
  url() {
    this._check();

    const originalUrl = this._url;
    const matches = this._match;

    if (!matches) {
      return originalUrl;
    }

    const newParams: string[] = [];

    for (const key in this._params) {
      const prefix = key.slice(1);
      const value = this._params[key];

      if (typeof value === 'string' || typeof value === 'number') {
        newParams.push(prefix + value);
      } else if (typeof value === 'boolean') {
        newParams.push(prefix);
      }
    }

    return `${originalUrl.slice(0, matches[1])}${newParams.join('-') || 's0'}${originalUrl.slice(matches[1] + matches[0].length)}`;
  }
}
