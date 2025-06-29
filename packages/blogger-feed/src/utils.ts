import { isString } from '@deox/utils/predicate';
import { SDKTypeError } from './errors';

/** Checks whether the deep nested property in an object exists and gets its value */
export const nestedData = (obj: unknown, ...levels: string[]) => {
  let current = obj;

  for (let i = 0; i < levels.length; i += 1) {
    if (!current || !Object.hasOwn(current, levels[i])) {
      return { exists: false, value: undefined };
    }
    current = current[levels[i] as never];
  }

  return { exists: true, value: current };
};

/** Gets the deep nested property value in an object */
export const getNested = (obj: unknown, ...args: string[]): unknown => nestedData(obj, ...args).value;

/** Converts object to property descriptor map */
const getConfigurations = <M extends Record<string | number, unknown>>(properties: M) =>
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
  /** asserts: input must be string */
  s(data: unknown, name: string) {
    if (!isString(data)) throw new SDKTypeError(`${name} must be of type string, current type is ${typeof data}`);
  },

  /** asserts: string must not be empty */
  nE(data: unknown, name: string) {
    this.s(data, name);

    if ((data as string).length === 0) throw new SDKTypeError(`${name} cannot be an empty string`);
  },

  /** asserts: string must not be blank */
  nB(data: unknown, name: string) {
    this.s(data, name);

    if ((data as string).trim().length === 0) throw new SDKTypeError(`${name} cannot be a blank string`);
  },
};
