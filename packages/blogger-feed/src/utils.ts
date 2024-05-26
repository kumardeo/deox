import { SDKTypeError } from './errors';

/** Checks whether arg is an array */
// biome-ignore lint/suspicious/noExplicitAny: we need to use `any` here
export const isArray = (arg: unknown): arg is any[] => Array.isArray(arg);

/** Checks whether arg is a non-nullish object */
export const isObject = (arg: unknown): arg is NonNullable<object> => typeof arg === 'object' && arg !== null;

/** Checks whether arg is a string */
export const isString = (arg: unknown): arg is string => typeof arg === 'string';

/** Checks whether the deep nested property in an object exists and gets its value */
export const nestedData = (obj: unknown, ...levels: string[]) => {
  let current = obj;

  for (let i = 0; i < levels.length; i += 1) {
    if (!current || !Object.prototype.hasOwnProperty.call(current, levels[i])) {
      return { exists: false, value: undefined };
    }
    current = current[levels[i] as never];
  }

  return { exists: true, value: current };
};

/** Gets the deep nested property value in an object */
// biome-ignore lint/suspicious/noExplicitAny: we need to use `any` here
export const getNested = (obj: any, ...args: string[]): unknown => nestedData(obj, ...args).value;

/** Converts object to property descriptor map */
// biome-ignore lint/suspicious/noExplicitAny: we need to use `any` here
const getConfigurations = <M extends Record<string | number, any>>(properties: M) =>
  Object.keys(properties).reduce((acc, key) => {
    const value = properties[key as keyof M];

    acc[key] = {
      value,
    };

    return acc;
  }, {} as PropertyDescriptorMap);

/** Adds properties to existing object */
export const addProperties = <O extends NonNullable<unknown>, I extends NonNullable<unknown>, M extends NonNullable<unknown>>(
  object: O,
  immutable: I,
  mutable?: M,
) => {
  if (mutable) {
    Object.assign(object, mutable);
  }
  Object.defineProperties(object, getConfigurations(immutable));

  return object as O & M & I;
};

/** Input validators */
export const validators = {
  string(data: unknown, name: string) {
    if (typeof data !== 'string') {
      throw new SDKTypeError(`${name} must be of type string, current type is ${typeof data}`);
    }
  },

  notEmpty(data: unknown, name: string) {
    this.string(data, name);

    if ((data as string).length === 0) {
      throw new SDKTypeError(`${name} cannot be an empty string`);
    }
  },

  notBlank(data: unknown, name: string) {
    this.string(data, name);

    if ((data as string).trim().length === 0) {
      throw new SDKTypeError(`${name} cannot be a blank string`);
    }
  },
};

/**
 * Helper function to generate unique id
 *
 * @param format Format for generating random string
 *
 * @returns Generated random string
 */
export const generateId = (format = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx') => {
  // Timestamp
  let d1 = new Date().getTime();
  // Time in microseconds since page-load or 0 if unsupported
  let d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
  return format.replace(/[xy]/g, (c) => {
    // random number between 0 and 16
    let r = Math.random() * 16;
    if (d1 > 0) {
      // Use timestamp until depleted
      r = ((d1 + r) % 16) | 0;
      d1 = Math.floor(d1 / 16);
    } else {
      // Use microseconds since page-load if supported
      r = ((d2 + r) % 16) | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/**
 * The the origin of an url
 *
 * @param input The input string
 *
 * @returns The origin of the input
 */
export const getOrigin = (input: string) => {
  if (typeof input === 'string') {
    const matches = input.match(/^(https?:\/\/)?([a-zA-Z0-9-]{0,}[a-zA-Z0-9]\.[a-zA-Z0-9-]{3,}(?:\.[a-zA-Z0-9-]{2,12}){1,2})(?:[/?#](?:.*))?$/i);

    if (matches?.[2]) {
      return `${matches?.[1] ?? 'https://'}${matches[2]}`;
    }
  }

  return null;
};
