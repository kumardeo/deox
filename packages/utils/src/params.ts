import { isPlainObject } from './predicate';

export type Serializable = string | number | boolean | null | undefined | Blob | Date | Serializable[] | { [key: string]: Serializable };

const VALID_SEGMENT = /^[^[\]]+$/;
const VALID_KEY = /^[^[\]]+(\[\]|\[[^[\]]+\])*$/;
const BLOCKED_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);

function assertValidSegment(segment: string): void {
  if (!VALID_SEGMENT.test(segment)) {
    throw new SyntaxError(`Invalid key segment '${segment}': characters [ and ] are not allowed`);
  }
}

function assertUnblockedSegment(segment: string): void {
  if (BLOCKED_SEGMENTS.has(segment)) {
    throw new SyntaxError(`Disallowed key segment '${segment}': reserved prototype property`);
  }
}

function assertValidKey(key: string): void {
  if (!VALID_KEY.test(key)) {
    throw new SyntaxError(`Invalid key '${key}': expected format is 'key', 'key[]', or 'key[segment]'`);
  }
}

function describeValue(value: Serializable): string {
  if (value instanceof Blob) {
    return 'Blob';
  }
  if (value instanceof Date) {
    return 'Date';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

export function serialize<T extends URLSearchParams | FormData>(input: Record<string, Serializable>, target: T): T {
  if (!isPlainObject(input)) {
    throw new TypeError(`Argument 'input' must be a plain object`);
  }

  const walk = (key: string, value: Serializable): void => {
    if (value === undefined) {
      return;
    }
    if (value === null) {
      target.append(key, '');
      return;
    }
    if (typeof value === 'string') {
      target.append(key, value);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      target.append(key, String(value));
      return;
    }
    if (value instanceof Date) {
      target.append(key, value.toISOString());
      return;
    }
    if (value instanceof Blob) {
      if (target instanceof FormData) {
        target.append(key, value);
        return;
      }
      throw new TypeError(`Key '${key}': Blob values require FormData`);
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(`${key}[]`, item);
      }
      return;
    }

    if (isPlainObject(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        assertValidSegment(nestedKey);
        assertUnblockedSegment(nestedKey);
        walk(`${key}[${nestedKey}]`, nestedValue);
      }
      return;
    }

    throw new TypeError(`Key '${key}': unsupported value type`);
  };

  for (const [key, value] of Object.entries(input)) {
    assertValidSegment(key);
    assertUnblockedSegment(key);
    walk(key, value);
  }

  return target;
}

export function deserialize(input: URLSearchParams | FormData): Record<string, Serializable> {
  const target: Record<string, Serializable> = {};

  for (const [rawKey, rawValue] of input.entries()) {
    const segments = parseKey(rawKey);
    const value = typeof rawValue === 'string' ? parseValue(rawValue) : rawValue;

    setPath(target, segments, value);
  }

  return target;
}

function parseKey(key: string): string[] {
  assertValidKey(key);

  const segments: string[] = [];
  const regex = /([^[\]]+)|\[([^\]]*)\]/g;

  let match = regex.exec(key);
  while (match !== null) {
    const segment = match[1] ?? match[2];
    if (segment !== '') {
      assertValidKey(segment);
      assertUnblockedSegment(segment);
    }
    segments.push(segment);
    match = regex.exec(key);
  }

  return segments;
}

function parseValue(value: string): Serializable {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (value === '') {
    return null;
  }
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}

function setPath(target: Record<string, Serializable>, segments: string[], value: Serializable): void {
  let current: Record<string, Serializable> | Serializable[] = target;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    const isLast = i === segments.length - 1;
    const shouldBeArray = nextSegment === '';

    if (segment === '') {
      if (!Array.isArray(current)) {
        throw new TypeError(`Expected array at segment [${i}] but got object`);
      }

      if (isLast) {
        current.push(value);
        return;
      }

      const lastItem = current[current.length - 1];

      if (!lastItem || typeof lastItem !== 'object' || Array.isArray(lastItem) !== shouldBeArray || (nextSegment && nextSegment in lastItem)) {
        const next: Record<string, Serializable> | Serializable[] = shouldBeArray ? [] : {};
        current.push(next);
        current = next;
      } else {
        current = lastItem as Record<string, Serializable> | Serializable[];
      }
    } else {
      if (Array.isArray(current)) {
        throw new TypeError(`Expected object at segment '${segment}' but got array`);
      }

      if (isLast) {
        if (segment in current) {
          const existing = current[segment];
          current[segment] = Array.isArray(existing) ? [...existing, value] : [existing, value];
        } else {
          current[segment] = value;
        }
        return;
      }

      if (segment in current) {
        const existing = current[segment];
        const isCompatible = shouldBeArray ? Array.isArray(existing) : isPlainObject(existing);

        if (!isCompatible) {
          throw new TypeError(
            `Type conflict at segment '${segment}': expected ${shouldBeArray ? 'array' : 'object'} but found ${describeValue(existing)}`,
          );
        }
      } else {
        current[segment] = shouldBeArray ? [] : {};
      }

      current = current[segment] as Record<string, Serializable> | Serializable[];
    }
  }
}
