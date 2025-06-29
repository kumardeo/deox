import { isArray, isBoolean, isRegExp, isString, isUndefined, isValidNumber } from './predicate';

/* utilities */
const isPositiveNumber = (input: unknown): input is number => isValidNumber(input) && input > 0;
const escapeRegex = (input: string) => input.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const floor = Math.floor;

/* constants */
export const SUPPORTED_HOSTS = ['googleusercontent.com', 'blogspot.com'];
const SUPPORTED_HOSTS_REGEX = new RegExp(`^(https?:)?(//)[^/]*.(${SUPPORTED_HOSTS.map((host) => escapeRegex(host)).join('|')})`);

const FORMAT_MAP = {
  jpeg: 'rj',
  jpg: 'rj',
  png: 'rp',
  webp: 'rw',
  animatedWebp: 'rwa',
  gif: 'rg',
  mp4: 'rh',
  noWebp: 'nw',
  html: 'h',
  xml: 'g',
} as const;
const SUPPORTED_FORMATS = Object.keys(FORMAT_MAP);
const FORMAT_PARAMS: string[] = SUPPORTED_FORMATS.map((format) => FORMAT_MAP[format as keyof typeof FORMAT_MAP]);

const NUMBER_PARAMS = 'w,h,s,b,e,r,l,v,m,a,ba,pd,br,cp,iv,pc,sc,vb'.split(',').map((a) => new RegExp(`^${a}\\d+$`));
const HEX_PARAMS = 'c,bc,pc'.split(',').map((a) => new RegExp(`^${a}0x([0-9A-Fa-f]{6,8})$`));
const STATIC_PARAMS =
  'rj,rp,rw,rwa,rg,rh,nw,h,g,k,x,y,z,a,d,b,r,n,s,c,o,p,cc,dv,vm,no,ip,sm,fg,pg,ft,ng,lo,fv,ci,al,df,fh,pf,pp,gd,il,lf,md,mo,mv,nc,nd,ns,nu,nt0,pa,rwu,sg,sm'
    .split(',')
    .map((a) => new RegExp(`^${a}$`));
const UNKNOWN_PARAMS = [/^mm,.*/, /^t.*/, /^q.*/, /^fcrop64=1,([0-9A-Fa-f]{6,16})$/, /^fSoften=\d+,\d+,\d+$/];
const DYNAMIC_PARAMS = NUMBER_PARAMS.concat(HEX_PARAMS, UNKNOWN_PARAMS);
const ALL_PARAMS = DYNAMIC_PARAMS.concat(STATIC_PARAMS);

const PARAM_REGEX = /(?<=\/)[^/]+(?=\/[^/]+\.[^/?]+(\?|$))|(?<==)[^=&?]+(?=\?|$)/g;

/** Options for image transformation */
export interface TransformOptions {
  /** New width for the transformed image */
  width?: number;

  /** New height for the transformed image */
  height?: number;

  /** New size for the transformed image */
  size?: number;

  /** Adjust width / height if only one of width, height or size parameter is provided */
  ratio?: number;

  /** Parameters to add */
  addParams?: string[];

  /** Parameters to remove */
  removeParams?: (string | RegExp)[];

  /** Clears existing parameters */
  cleanParams?: boolean;

  /** Sort parameters */
  sortParams?: boolean;

  /** Flips image horizontally */
  flipHorizontally?: boolean;

  /** Flips image vertically */
  flipVertically?: boolean;

  /** Rotates image */
  rotate?: 90 | 180 | 270;

  /** Adds a symbol to the image */
  symbol?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

  /** Generate image download link */
  download?: boolean;

  /** Sets image format */
  format?: keyof typeof FORMAT_MAP;

  /** Cache TTL in days, accepted range is: >= 0 and <= 90 */
  cache?: number;

  noUpScaling?: boolean;
  forceScaling?: boolean;
  freeCrop?: string;
}

/**
 * Modifies google hosted image url by applying transforms
 *
 * @param url The url of the image
 * @param transforms Transforms to apply
 *
 * @returns Modified image url
 */
export const transformImage = (url: string, transforms: TransformOptions = {}) => {
  if (!isString(url)) {
    throw new TypeError('Argument url is not type of string.');
  }
  const urlParts = url.split(/\?(.*)/, 2);
  const imageUrl = urlParts[0];
  const queryString = urlParts[1]?.trim().length ? `?${urlParts[1]}` : '';
  const matches = imageUrl.match(PARAM_REGEX);

  if (!matches || !matches.length || !SUPPORTED_HOSTS_REGEX.test(imageUrl)) {
    return imageUrl + queryString;
  }

  const UNDEFINED = undefined;
  const TRUE = true;
  const FALSE = false;
  let {
    width,
    height,
    size,
    ratio,
    addParams,
    removeParams,
    cleanParams,
    sortParams,
    forceScaling,
    flipHorizontally,
    flipVertically,
    rotate,
    format,
    cache,
    noUpScaling,
    freeCrop,
    download,
    symbol,
  } = transforms;

  width = isPositiveNumber(width) ? floor(width) : UNDEFINED;
  height = isPositiveNumber(height) ? floor(height) : UNDEFINED;
  size = isPositiveNumber(size) ? floor(size) : UNDEFINED;
  ratio = isPositiveNumber(ratio) ? ratio : UNDEFINED;
  rotate = isPositiveNumber(rotate) && rotate <= 270 && rotate % 90 === 0 ? rotate : UNDEFINED;
  symbol = isPositiveNumber(symbol) && symbol >= 0 && symbol <= 11 && symbol % 1 === 0 ? symbol : UNDEFINED;
  cache = isPositiveNumber(cache) && cache >= 0 && cache <= 90 && cache % 1 === 0 ? cache : UNDEFINED;
  download = isBoolean(download) ? download : UNDEFINED;
  cleanParams = isBoolean(cleanParams) ? cleanParams : UNDEFINED;
  addParams = isArray(addParams) ? addParams.filter((param) => isString(param)) : [];
  removeParams = isArray(removeParams) ? removeParams.filter((param) => isString(param) || isRegExp(param)) : [];
  forceScaling = isBoolean(forceScaling) ? forceScaling : UNDEFINED;
  flipHorizontally = isBoolean(flipHorizontally) ? flipHorizontally : UNDEFINED;
  flipVertically = isBoolean(flipVertically) ? flipVertically : UNDEFINED;
  noUpScaling = isBoolean(noUpScaling) ? noUpScaling : UNDEFINED;
  format = isString(format) && SUPPORTED_FORMATS.includes(format) ? format : UNDEFINED;
  freeCrop = isString(freeCrop) ? freeCrop.trim().toLowerCase() : UNDEFINED;
  sortParams = isBoolean(sortParams) ? sortParams : TRUE;

  const getNewParams = (oldParams: string[]) => {
    const newParams: string[] = [];

    const addNewParams = (params: unknown | unknown[]) => {
      if (!params) return;

      const paramArray: unknown[] = isArray(params) ? params : [params];
      for (const param of paramArray) {
        const isParamString = isString(param);
        const trimmedParam = isParamString ? param.trim() : '';
        if (isParamString && trimmedParam) {
          for (const regex of ALL_PARAMS) {
            // check if param is valid
            if (regex.test(trimmedParam)) {
              // remove similar params in new params
              for (let k = newParams.length - 1; k >= 0; k -= 1) {
                const newParam = newParams[k].trim();
                if (regex.test(newParam)) {
                  newParams.splice(k, 1);
                }
              }
              // add new param
              newParams.push(param);
              break;
            }
          }
        }
      }
    };

    const removeNewParams = (params: unknown | unknown[]) => {
      if (!params) return;

      const paramArray: unknown[] = isArray(params) ? params : [params];
      for (const param of paramArray) {
        const isParamString = isString(param);
        const isParamRegex = isRegExp(param);
        if (isParamString || isParamRegex) {
          const trimmedParam = isParamString ? param.trim() : '';
          for (let j = newParams.length - 1; j >= 0; j -= 1) {
            const newParam = newParams[j].trim();
            if ((isParamString && trimmedParam === newParam) || (isParamRegex && param.test(newParam))) {
              newParams.splice(j, 1);
            }
          }
        }
      }
    };

    // Add old params if it is not clean so we can overwrite it
    if (!cleanParams) {
      addNewParams(oldParams.map((param) => param.trim()).filter((param) => !!param));
      removeNewParams(removeParams);
    }

    addNewParams(addParams);

    removeNewParams([
      forceScaling === FALSE && 's',
      flipHorizontally === FALSE && 'fh',
      flipVertically === FALSE && 'fv',
      download === FALSE && 'd',
      noUpScaling === FALSE && 'nu',
    ]);

    // remove format params
    if (format && FORMAT_MAP[format]) {
      removeNewParams(FORMAT_PARAMS);
    }

    addNewParams([
      width && `w${width}`,
      height && `h${height}`,
      !isUndefined(size) && `s${size}`,
      forceScaling === TRUE && 's',
      flipHorizontally === TRUE && 'fh',
      flipVertically === TRUE && 'fv',
      download === TRUE && 'd',
      noUpScaling === TRUE && 'nu',
      rotate && `r${rotate}`,
      !isUndefined(symbol) && `ba${symbol}`,
      format && FORMAT_MAP[format],
      cache && `e${cache}`,
      freeCrop && `fcrop64=1,${freeCrop}`,
    ]);

    if (ratio) {
      if (width || height || size) {
        addNewParams(['p', 'k', 'no', 'nu']);
      }
      if (width) {
        addNewParams(`h${floor(width / ratio)}`);
      } else if (height) {
        addNewParams(`w${floor(height * ratio)}`);
      } else if (size) {
        addNewParams([`w${size}`, `h${floor(size / ratio)}`]);
      }
    }

    // sort params
    if (sortParams) {
      newParams.sort();
    }

    return newParams;
  };

  let index = 0;
  return (
    imageUrl.replace(PARAM_REGEX, (match) => {
      // Replace only the last match
      if (index === matches.length - 1) {
        return getNewParams(match.split('-')).join('-').trim() || 's0';
      }
      index += 1;
      return match;
    }) + queryString
  );
};

/**
 * Checks if image url can be transformed
 *
 * @param url The url of the image
 */
export const isTransformableImage = (url: string) => {
  if (isString(url) && SUPPORTED_HOSTS_REGEX.test(url)) {
    const matches = url.match(PARAM_REGEX);
    if (matches && matches.length > 0) return true;
  }
  return false;
};
