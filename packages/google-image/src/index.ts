/**
 * Based on https://gist.github.com/Sauerstoffdioxid/2a0206da9f44dde1fdfce290f38d2703
 */

import { isBoolean, isNull, isNumber, isString, isUndefined, isURL } from '@deox/utils/predicate';

const HOSTS_REGEX = /^(https?:)?(\/\/)[^/]*.(googleusercontent\.com|blogspot\.com)/;
const PARAMS_REGEX = /[^/]+(?=\/[^/]+\.[^/?]+(?:\?|$))|(?<==)[^=&?/]+(?=\?|$)/;
const PARAM_REGEX =
  /^(rj|rp|rw|rwa|rg|rh|nw|h|g|k|x|y|z|a|d|b|r|n|s|c|o|p|cc|dv|vm|no|ip|sm|fg|pg|ft|ng|lo|fv|ci|al|df|fh|pf|pp|gd|il|lf|md|mo|mv|nc|nd|ns|nu|nt0|pa|rwu|sg|sm)$|^(w|h|s|b|e|r|l|v|m|a|ba|pd|br|cp|iv|pc|sc|vb)(\d+)$|^(c|bc|pc)(0x[0-9A-Fa-f]{6,8})$|^(fcrop64)(=1,[0-9A-Fa-f]{6,16})$|^(fSoften)(=\d+,\d+,\d+)$|^(mm)(,[0-9A-Za-z]+)$|^(t|q)([0-9A-Za-z]+)$/;

function getParamInfo(param: string) {
  const matches = param.match(PARAM_REGEX);

  if (matches) {
    // boolean param
    if (matches[1]) {
      return [0, matches[1], true] as const;
    }
    // number param
    if (matches[2] && matches[3]) {
      return [1, matches[2], Number(matches[3])] as const;
    }
    // hex param
    if (matches[4] && matches[5]) {
      return [2, matches[4], matches[5]] as const;
    }
    // free crop param
    if (matches[6] && matches[7]) {
      return [3, matches[6], matches[7]] as const;
    }
    // free soften param
    if (matches[8] && matches[9]) {
      return [4, matches[8], matches[9]] as const;
    }
    // unknown param
    if (matches[10] && matches[11]) {
      return [5, matches[10], matches[11]] as const;
    }
    if (matches[12] && matches[13]) {
      return [6, matches[12], matches[13]] as const;
    }
  }
}

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
  private _u: string;
  private _m?: [string, number];
  private _p: {
    [k: string]: string | number | boolean;
  };
  private _e: boolean;

  constructor(url: string | URL, { existing = true, pass = false }: GoogleImageOptions = {}) {
    let imageUrl: string;
    if (isURL(url)) {
      imageUrl = url.toString();
    } else if (isString(url)) {
      imageUrl = url;
    } else {
      throw new TypeError("Argument 'url' must be of type string | URL");
    }

    this._u = imageUrl;
    this._e = !pass;
    this._p = {};

    if (HOSTS_REGEX.test(imageUrl)) {
      const matches = imageUrl.match(PARAMS_REGEX);
      if (matches?.[0] && matches.index) {
        this._m = [matches[0], matches.index];

        if (existing) {
          for (const param of matches[0].split('-')) {
            if (!param) {
              continue;
            }
            const info = getParamInfo(param);
            if (!info) {
              continue;
            }
            this._p[info[0] + info[1]] = info[2];
          }
        }
      }
    }
  }

  private _a(error = this._e) {
    if (this._m) {
      return false;
    }
    if (error) {
      throw new Error('Image url is not supported for transformations');
    }
    return true;
  }

  private _b(param: string, value?: boolean, removeWhenAdding?: string[]): boolean | this {
    const skip = this._a();

    const key = 0 + param;

    if (isUndefined(value)) {
      if (skip) {
        return false;
      }
      return (this._p[key] ?? false) as boolean;
    }

    if (value === false) {
      if (!skip && key in this._p) {
        delete this._p[key];
      }
    } else if (value === true) {
      if (!skip) {
        if (removeWhenAdding) {
          for (const remove of removeWhenAdding) {
            const other = 0 + remove;
            if (other in this._p) {
              delete this._p[other];
            }
          }
        }
        this._p[key] = true;
      }
    } else {
      throw new Error("Argument 'value' must be of type boolean");
    }

    return this;
  }

  private _n(param: string, value?: number | null): number | null | this {
    const skip = this._a();

    const key = 1 + param;

    if (isUndefined(value)) {
      if (skip) {
        return null;
      }
      return (this._p[key] ?? null) as number | null;
    }

    if (isNull(value)) {
      if (!skip && key in this._p) {
        delete this._p[key];
      }
    } else if (isNumber(value)) {
      if (!skip) {
        this._p[key] = value;
      }
    } else {
      throw new TypeError("Argument 'value' must be of type number | null");
    }

    return this;
  }

  private _h(param: string, value?: string | null): string | null | this {
    const skip = this._a();

    const regex = /^0x[0-9A-Fa-f]{6,8}$/;

    const key = 2 + param;

    if (isUndefined(value)) {
      if (skip) {
        return null;
      }
      return (this._p[key] ?? null) as string | null;
    }

    if (isNull(value)) {
      if (!skip && key in this._p) {
        delete this._p[key];
      }
    } else if (isString(value)) {
      if (!regex.test(value)) {
        throw new Error("Argument 'value' must be of format '0xrrggbb' or '0xaarrggbb'");
      }
      if (!skip) {
        this._p[key] = value;
      }
    } else {
      throw new TypeError("Argument 'value' must be of type number | null");
    }

    return this;
  }

  private _f(param: string, value?: boolean): boolean | this {
    return this._b(param, value, ['rj', 'rp', 'rw', 'rwa', 'rg', 'rh', 'nw']);
  }

  isSupported() {
    return !!this._m;
  }

  width(): number | null;
  width(value: undefined): number | null;
  width(value: number | null): this;
  width(value?: number | null): number | null | this {
    return this._n('w', value);
  }

  height(): number | null;
  height(value: undefined): number | null;
  height(value: number | null): this;
  height(value?: number | null): number | null | this {
    return this._n('h', value);
  }

  size(): number | null;
  size(value: undefined): number | null;
  size(value: number | null): this;
  size(value?: number | null): number | null | this {
    return this._n('s', value);
  }

  noUpscaling(): boolean;
  noUpscaling(value: undefined): boolean;
  noUpscaling(value: boolean): this;
  noUpscaling(value?: boolean): boolean | this {
    return this._b('nu', value);
  }

  forceScaling(): boolean;
  forceScaling(value: undefined): boolean;
  forceScaling(value: boolean): this;
  forceScaling(value?: boolean): boolean | this {
    return this._b('s', value);
  }

  crop(): boolean;
  crop(value: undefined): boolean;
  crop(value: boolean): this;
  crop(value?: boolean): boolean | this {
    return this._b('c', value, ['cc', 'ci', 'p']);
  }

  circularCrop(): boolean;
  circularCrop(value: undefined): boolean;
  circularCrop(value: boolean): this;
  circularCrop(value?: boolean): boolean | this {
    return this._b('cc', value, ['c', 'ci', 'p']);
  }

  squareCrop(): boolean;
  squareCrop(value: undefined): boolean;
  squareCrop(value: boolean): this;
  squareCrop(value?: boolean): boolean | this {
    return this._b('ci', value, ['c', 'cc', 'p']);
  }

  alternateCrop(): boolean;
  alternateCrop(value: undefined): boolean;
  alternateCrop(value: boolean): this;
  alternateCrop(value?: boolean): boolean | this {
    return this._b('p', value, ['c', 'cc', 'ci']);
  }

  flipHorizontally(): boolean;
  flipHorizontally(value: undefined): boolean;
  flipHorizontally(value: boolean): this;
  flipHorizontally(value?: boolean): boolean | this {
    return this._b('fh', value);
  }

  flipVertically(): boolean;
  flipVertically(value: undefined): boolean;
  flipVertically(value: boolean): this;
  flipVertically(value?: boolean): boolean | this {
    return this._b('fv', value);
  }

  rotate(): number | null;
  rotate(value: undefined): number | null;
  rotate(value: 90 | 180 | 270 | null): this;
  rotate(value?: 90 | 180 | 270 | null): number | null | this {
    return this._n('r', value);
  }

  symbol(): number | null;
  symbol(value: undefined): number | null;
  symbol(value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null): this;
  symbol(value?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | null): number | null | this {
    return this._n('ba', value);
  }

  borderRadius(): number | null;
  borderRadius(value: undefined): number | null;
  borderRadius(value: number | null): this;
  borderRadius(value?: number | null): number | null | this {
    return this._n('br', value);
  }

  border(): number | null;
  border(value: undefined): number | null;
  border(value: number | null): this;
  border(value?: number | null): number | null | this {
    return this._n('b', value);
  }

  color(): string | null;
  color(value: undefined): string | null;
  color(value: string | null): this;
  color(value?: string | null): string | null | this {
    return this._h('c', value);
  }

  backgroundColor(): string | null;
  backgroundColor(value: undefined): string | null;
  backgroundColor(value: string | null): this;
  backgroundColor(value?: string | null): string | null | this {
    return this._h('bc', value);
  }

  pad(): boolean;
  pad(value: undefined): boolean;
  pad(value: boolean): this;
  pad(value?: boolean): boolean | this {
    return this._b('pd', value, ['c', 'cc', 'ci', 'p']);
  }

  padColor(): string | null;
  padColor(value: undefined): string | null;
  padColor(value: string | null): this;
  padColor(value?: string | null): string | null | this {
    return this._h('pc', value);
  }

  jpeg(): boolean;
  jpeg(value: undefined): boolean;
  jpeg(value: boolean): this;
  jpeg(value?: boolean): boolean | this {
    return this._f('rj', value);
  }

  png(): boolean;
  png(value: undefined): boolean;
  png(value: boolean): this;
  png(value?: boolean): boolean | this {
    return this._f('rp', value);
  }

  webp(): boolean;
  webp(value: undefined): boolean;
  webp(value: boolean): this;
  webp(value?: boolean): boolean | this {
    return this._f('rw', value);
  }

  animatedWebp(): boolean;
  animatedWebp(value: undefined): boolean;
  animatedWebp(value: boolean): this;
  animatedWebp(value?: boolean): boolean | this {
    return this._f('rwa', value);
  }

  gif(): boolean;
  gif(value: undefined): boolean;
  gif(value: boolean): this;
  gif(value?: boolean): boolean | this {
    return this._f('rg', value);
  }

  mp4(): boolean;
  mp4(value: undefined): boolean;
  mp4(value: boolean): this;
  mp4(value?: boolean): boolean | this {
    return this._f('rh', value);
  }

  html(): boolean;
  html(value: undefined): boolean;
  html(value: boolean): this;
  html(value?: boolean): boolean | this {
    return this._f('h', value);
  }

  download(): boolean;
  download(value: undefined): boolean;
  download(value: boolean): this;
  download(value?: boolean): boolean | this {
    return this._b('d', value);
  }

  noButton(): boolean;
  noButton(value: undefined): boolean;
  noButton(value: boolean): this;
  noButton(value?: boolean): boolean | this {
    return this._b('no', value, ['o']);
  }

  button(): boolean;
  button(value: undefined): boolean;
  button(value: boolean): this;
  button(value?: boolean): boolean | this {
    return this._b('o', value, ['no']);
  }

  cacheDays(): number | null;
  cacheDays(value: undefined): number | null;
  cacheDays(value: number | null): this;
  cacheDays(value?: number | null): number | null | this {
    return this._n('e', value);
  }

  disableAnimation(): boolean;
  disableAnimation(value: undefined): boolean;
  disableAnimation(value: boolean): this;
  disableAnimation(value?: boolean): boolean | this {
    return this._b('k', value);
  }

  frame(): number | null;
  frame(value: undefined): number | null;
  frame(value: number | null): this;
  frame(value?: number | null): number | null | this {
    return this._n('a', value);
  }

  url() {
    const skip = this._a();

    if (skip) {
      return this._u;
    }

    const originalUrl = this._u;
    // biome-ignore lint/style/noNonNullAssertion: this should not be undefined here
    const matches = this._m!;
    const newParams: string[] = [];

    for (const key in this._p) {
      const prefix = key.slice(1);
      const value = this._p[key];

      if (isString(value) || isNumber(value)) {
        newParams.push(prefix + value);
      } else if (isBoolean(value)) {
        newParams.push(prefix);
      }
    }

    return originalUrl.slice(0, matches[1]) + (newParams.join('-') || 's0') + originalUrl.slice(matches[1] + matches[0].length);
  }
}
