import { isArray, isNumber, isPlainObject } from '@deox/check-types';
import { SDKRequestError, SDKTypeError } from './errors';

const getConfigurations = <M extends Record<string | number, unknown>>(properties: M) =>
  Object.keys(properties).reduce((acc, key) => {
    const value = properties[key as keyof M];

    acc[key] = {
      value,
    };

    return acc;
  }, {} as PropertyDescriptorMap);

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

export const error = {
  inGumroadRequest(e: unknown, message: string) {
    if (e instanceof SDKRequestError) {
      if (e.message.toLowerCase().includes(message.toLowerCase())) {
        return true;
      }
    }

    return false;
  },

  isProductNotFound(e: unknown) {
    const result = {
      error: 'The product was not found.',
      code: 'product_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isOfferCodeNotFound(e: unknown) {
    const result = {
      error: 'The offer_code was not found.',
      code: 'offer_code_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isVariantCategoryNotFound(e: unknown) {
    const result = {
      error: 'The variant_category was not found.',
      code: 'variant_category_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isLicenseNotFound(e: unknown) {
    const result = {
      error: 'That license does not exist for the provided product.',
      code: 'license_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isSubscriberNotFound(e: unknown) {
    const result = {
      error: 'The subscriber was not found.',
      code: 'subscriber_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isResourceSubscriptionNotFound(e: unknown) {
    const result = {
      error: 'The resource_subscription was not found.',
      code: 'resource_subscription_not_found' as const,
    };
    return this.inGumroadRequest(e, result.code) ? result : false;
  },

  isSaleNotFound(e: unknown) {
    const result = {
      error: 'The sale was not found.',
      code: 'sale_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isAnyNotFound(e: unknown) {
    return (
      this.isProductNotFound(e) ||
      this.isOfferCodeNotFound(e) ||
      this.isVariantCategoryNotFound(e) ||
      this.isLicenseNotFound(e) ||
      this.isSubscriberNotFound(e) ||
      this.isResourceSubscriptionNotFound(e) ||
      this.isSaleNotFound(e)
    );
  },
};

/**
 * Convert input string or number to number if possible
 *
 * @param input The string number or number
 *
 * @returns The converted number otherwise undefined
 */
export const convertToNumber = (input: unknown) => {
  if (typeof input === 'string') {
    const numbered = Number(input);
    if (isNumber(numbered)) {
      return numbered;
    }
  } else if (isNumber(input)) {
    return input;
  }
  return undefined;
};

export type ParseValueOptions = {
  parseBoolean?: boolean;
  parseNumber?: boolean;
  parseNull?: boolean;
};

/**
 * Parse input string to valid data type otherwise return the same input
 *
 * @param input The input
 * @param options Options
 *
 * @returns The parsed value
 */
export const parseValue = <T = unknown>(input: T, options: ParseValueOptions = {}) => {
  if (typeof input === 'string' && input.trim().length !== 0) {
    const lowered = input.toLowerCase();
    if (options.parseNull && lowered === 'null') {
      return null;
    }
    if (options.parseBoolean) {
      if (lowered === 'true' || lowered === 'false') {
        return lowered === 'true';
      }
    }
    if (options.parseNumber) {
      const converted = convertToNumber(input);
      if (typeof converted === 'number') {
        return converted;
      }
    }
  }
  return input;
};

export type ParsedFormDataValue = string | File | (string | File)[];

export type ParsedFormData = Record<string, ParsedFormDataValue>;

export const parseFormData = <T extends ParsedFormData = ParsedFormData>(formData: FormData, options: { all?: boolean } = {}): T => {
  const result: ParsedFormData = {};

  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith('[]');
    const currentValue = result[key];

    if (!shouldParseAllValues) {
      result[key] = value;
    } else if (currentValue && isArray(currentValue)) {
      currentValue.push(value);
    } else if (currentValue) {
      result[key] = [currentValue, value];
    } else {
      result[key] = value;
    }
  });

  return result as T;
};

export type ParsedDeepFormDataValue = ParsedFormDataValue | number | boolean | null;

export type ParsedDeepFormData = Record<string, ParsedDeepFormDataValue | Record<string, ParsedDeepFormDataValue>>;

export type ParseDeepFormDataOptions = ParseValueOptions;

export const parseDeepFormData = <T extends ParsedDeepFormData = ParsedDeepFormData>(formData: FormData, options?: ParseDeepFormDataOptions) => {
  const parsedData = parseFormData(formData);

  return Object.keys(parsedData).reduce((result, e) => {
    if (e.match(/\[(.*?)\]/gi)) {
      const keys = e.split(/\[(.*?)\]/gi).filter((key) => key !== '');

      keys.reduce(
        (accumulator, key, i) => {
          if (isPlainObject(accumulator)) {
            const acc = accumulator;
            // biome-ignore lint/suspicious/noImplicitAnyLet: we need to use `any` here
            let value;
            if (i !== keys.length - 1) {
              if (!Object.hasOwnProperty.call(acc, key)) {
                value = {};
              } else {
                value = parseValue(acc[key], options);
              }
            } else {
              value = parseValue(parsedData[e], options);
            }
            acc[key] = value;
            return value as ParsedDeepFormData;
          }
          return undefined;
        },
        result as ParsedDeepFormData | undefined,
      );
    } else {
      result[e] = parseValue(parsedData[e], options);
    }

    return result;
  }, {} as ParsedDeepFormData) as T;
};

export const formatCustomField = <T extends { custom_fields: unknown }>(input: T) => {
  if (isArray(input.custom_fields)) {
    input.custom_fields = (input.custom_fields as string[]).reduce(
      (acc, field) => {
        if (typeof field === 'string') {
          const parts = field.split(/:(.*)/s).map((v) => v.trim());
          const [key, value] = parts;
          if (key.trim().length !== 0 && typeof value === 'string') {
            acc[key] = value;
          }
        }
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  return input;
};
