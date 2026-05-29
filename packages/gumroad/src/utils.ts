import { SDKRequestError } from './errors';

export function addProperties<O extends NonNullable<unknown>, I extends NonNullable<unknown>, M extends NonNullable<unknown>>(
  target: O,
  immutable: I,
  mutable?: M,
): O & M & Readonly<I> {
  if (mutable) {
    Object.assign(target, mutable);
  }

  const descriptorMap: PropertyDescriptorMap = {};
  for (const [key, value] of Object.entries(immutable)) {
    descriptorMap[key] = { value };
  }

  Object.defineProperties(target, descriptorMap);

  return target as O & M & Readonly<I>;
}

/** asserts: input must be string */
export function assertString(input: unknown, name: string): asserts input is string {
  if (typeof input !== 'string') {
    throw new TypeError(`${name} must be of type string, current type is ${typeof input}`);
  }
}

/** asserts: string must not be empty */
export function assertNonEmptyString(input: unknown, name: string): asserts input is string {
  assertString(input, name);

  if (input.length === 0) {
    throw new TypeError(`${name} cannot be an empty string`);
  }
}

/** asserts: string must not be blank */
export function assertNonBlankString(input: unknown, name: string): asserts input is string {
  assertString(input, name);

  if (input.trim().length === 0) {
    throw new TypeError(`${name} cannot be a blank string`);
  }
}

/** asserts: input must be number */
export function assertNumber(input: unknown, name: string): asserts input is number {
  if (typeof input !== 'number') {
    throw new TypeError(`${name} must be of type number, current type is ${typeof input}`);
  }
}

/** asserts: input must be array */
export function assertArray(input: unknown, name: string): asserts input is any[] {
  if (!Array.isArray(input)) {
    throw new TypeError(`${name} must be an Array, current type is ${typeof input}`);
  }
}

/** asserts: input must be object */
export function assertObject(input: unknown, name: string): asserts input is NonNullable<object> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new TypeError(`${name} must be an Object`);
  }
}

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

  isCoverNotFound(e: unknown) {
    const result = {
      error: 'The cover was not found.',
      code: 'cover_not_found' as const,
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

  isOfferCodeNotFound(e: unknown) {
    const result = {
      error: 'The offer_code was not found.',
      code: 'offer_code_not_found' as const,
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

  isPayoutNotFound(e: unknown) {
    const result = {
      error: 'The payout was not found.',
      code: 'payout_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isTaxFormNotFound(e: unknown) {
    const result = {
      error: 'Tax form not found.',
      code: 'tax_form_not_found' as const,
    };
    return this.inGumroadRequest(e, result.error) ? result : false;
  },

  isAnyNotFound(e: unknown) {
    return (
      this.isProductNotFound(e) ||
      this.isCoverNotFound(e) ||
      this.isVariantCategoryNotFound(e) ||
      this.isOfferCodeNotFound(e) ||
      this.isLicenseNotFound(e) ||
      this.isSubscriberNotFound(e) ||
      this.isResourceSubscriptionNotFound(e) ||
      this.isSaleNotFound(e) ||
      this.isPayoutNotFound(e) ||
      this.isTaxFormNotFound(e)
    );
  },
};

export function formatCustomField<T extends { custom_fields: unknown }>(input: T): T {
  if (Array.isArray(input.custom_fields)) {
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
}
