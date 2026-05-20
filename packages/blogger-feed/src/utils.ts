export function isString(input: unknown): input is string {
  return typeof input === 'string';
}

export function isUndefined(input: unknown): input is undefined {
  return typeof input === 'undefined';
}

export function isArray(input: unknown): input is any[] {
  return Array.isArray(input);
}

export function isObject(input: unknown): input is NonNullable<object> {
  return typeof input === 'object' && input !== null && !isArray(input);
}

export function getNested(obj: unknown, ...levels: string[]): unknown {
  let current = obj;

  for (let i = 0; i < levels.length; i += 1) {
    if (!current || !Object.hasOwn(current, levels[i])) {
      return undefined;
    }
    current = current[levels[i] as never];
  }

  return current;
}

/** asserts: input must be string */
export function assertString(input: unknown, name: string): asserts input is string {
  if (!isString(input)) {
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

  if ((input as string).trim().length === 0) {
    throw new TypeError(`${name} cannot be a blank string`);
  }
}

let lastTime = 0;
let counter = 0;

export function generateId() {
  const now = Date.now();

  if (now === lastTime) {
    counter++;
  } else {
    lastTime = now;
    counter = 0;
  }

  return `${now}_${counter}`;
}
