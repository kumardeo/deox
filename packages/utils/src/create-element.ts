import { isFunction, isString } from './predicate';

/* utilities types */
type IfEquals<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B;

type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>;
}[keyof T];

type KeysOfType<O, T> = {
  [K in keyof O]: O[K] extends T ? K : never;
}[keyof O];

type RemoveFunctions<T> = Omit<T, KeysOfType<T, (...args: unknown[]) => unknown>>;

type SelectStrings<T> = Pick<T, KeysOfType<T, string>>;

/* types */

type StyleOptions = Partial<SelectStrings<Pick<CSSStyleDeclaration, WritableKeys<CSSStyleDeclaration>>>>;

export type CreateElementOptions<T extends keyof HTMLElementTagNameMap> = Partial<
  RemoveFunctions<Pick<HTMLElementTagNameMap[T], WritableKeys<HTMLElementTagNameMap[T]>>>
> & {
  class?: string | string[];
  attributes?: Record<string, string | number | boolean>;
  styles?: string | StyleOptions;
  datasets?: Record<string, string | number | boolean>;
};

export type CreateJavaScriptOptions = Omit<CreateElementOptions<'script'>, 'textContent' | 'innerHTML' | 'innerText'>;

export type CreateStylesheetOptions = Omit<CreateElementOptions<'style'>, 'textContent' | 'innerHTML' | 'innerText'>;

export type LoadJavascriptOptions = Omit<CreateElementOptions<'script'>, 'src'>;

/** Represents ScriptResult which contains source and element */
export interface ScriptResult {
  /** The resource url of the Script */
  source: string;

  /** The HTMLScriptElement used to load resource */
  element: HTMLScriptElement;
}

export type LoadStylesheetOptions = Omit<CreateElementOptions<'link'>, 'href' | 'rel'>;

/** Represents StyleResult which contains source and element */
export interface StyleResult {
  /** The resource url of the Stylesheet */
  source: string;

  /** The HTMLScriptElement used to load resource */
  element: HTMLLinkElement;
}

/**
 * A helper function to get the last element
 * of the array like object which returns true for a condition
 *
 * @param array The array like object
 * @param condition The condition function
 *
 * @returns The last element with condition true
 */
const getLast = <T>(array: ArrayLike<T>, condition: (element: T) => unknown) => {
  for (let i = array.length - 1; i >= 0; i -= 1) {
    if (condition(array[i])) {
      return array[i];
    }
  }
  return undefined;
};

/**
 * Appends a given node to the last element in a list of elements, or appends it to a fallback element if no suitable target is found.
 *
 * @param node - The HTMLElement to be appended.
 * @param elements - A collection of HTML elements or an array containing HTMLElements, possibly with undefined or null values.
 * @param fallback - The fallback HTMLElement where the node will be appended if no suitable target is found.
 *
 * @returns The appended node.
 */
const appendToLast = (
  node: HTMLElement,
  elements: HTMLCollection | NodeListOf<HTMLElement> | (HTMLElement | undefined | null)[],
  fallback: HTMLElement,
): HTMLElement => {
  // Retrieve the last element that meets the specified condition
  const lastElement = getLast(elements, (e) => e && e.parentElement === document.head);

  // Get the next sibling and parent element of the last element
  const nextSibling = lastElement?.nextElementSibling;
  const parentElement = lastElement?.parentElement;

  // If a suitable position is found, insert the node before the next sibling
  // Otherwise, append the node to the fallback element
  if (lastElement && 'insertAdjacentElement' in lastElement) {
    lastElement.insertAdjacentElement('afterend', node);
  } else if (nextSibling && parentElement) {
    parentElement.insertBefore(node, nextSibling);
  } else {
    fallback.appendChild(node);
  }

  return node;
};

/**
 * Creates an instance of the element for the specified tag.
 *
 * @param tagName The name of an element.
 * @param options Optional. Sets element instance properties
 *
 * @returns The created HTMLElement
 */
export const createElement = <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: CreateElementOptions<K>): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  if (options) {
    for (const option in options) {
      const optionValue = options[option as keyof typeof options];
      switch (option) {
        case 'class':
          {
            let classes: string[];
            if (Array.isArray(optionValue)) {
              classes = (optionValue as string[]).filter((className) => isString(className) && className.trim());
            } else if (isString(optionValue) && option.trim()) {
              classes = optionValue.split(' ');
            } else {
              classes = [];
            }
            if (classes.length !== 0) {
              element.classList.add(...classes);
            }
          }
          break;
        case 'datasets':
        case 'styles':
        case 'attributes':
          if (option === 'styles' && isString(optionValue)) {
            element.setAttribute('style', optionValue);
          } else if (optionValue) {
            for (const key in optionValue as object) {
              const value = optionValue[key as keyof typeof optionValue];
              if (value !== undefined) {
                const string = String(value);
                switch (option) {
                  case 'datasets':
                    element.dataset[key] = string;
                    break;
                  case 'styles':
                    if (key in element.style) {
                      // @ts-expect-error we can set style
                      element.style[key] = string;
                    }
                    break;
                  default:
                    element.setAttribute(key, string);
                }
              }
            }
          }
          break;
        default: {
          if (option in element) {
            // @ts-expect-error we can assign
            element[option] = optionValue;
          }
        }
      }
    }
  }
  return element;
};

/**
 * Creates a HTMLScriptElement with given contents and append it to head
 *
 * @param javascript The content of element
 * @param options Options for element
 *
 * @returns The created HTMLScriptElement
 */
export const createJavascript = (javascript: string, options?: CreateJavaScriptOptions | ((element: HTMLScriptElement) => void)) => {
  const script = createElement('script', {
    ...(!isFunction(options) && options ? options : undefined),
    textContent: javascript,
  });

  if (isFunction(options)) {
    options(script);
  }

  appendToLast(script, document.querySelectorAll('head > script'), document.head);

  return script;
};

/**
 * Creates a HTMLStyleElement with given contents and append it to head
 *
 * @param css The content of element
 * @param options Options for element
 *
 * @returns The created HTMLStyleElement
 */
export const createStylesheet = (css: string, options?: CreateStylesheetOptions | ((element: HTMLStyleElement) => void)) => {
  const style = createElement('style', {
    ...(!isFunction(options) && options ? options : undefined),
    textContent: css,
  });

  if (isFunction(options)) {
    options(style);
  }

  appendToLast(style, document.querySelectorAll('head > style'), document.head);

  return style;
};

/** Represents an error that occurs during loading, associated with an HTML element and a source. */
export class ResourceLoadingError extends Error {
  /** The resource url of the loading error. */
  source: string;

  /** The HTML element associated with the loading error. */
  element: HTMLElement;

  /**
   * Creates a new LoadingError instance.
   *
   * @param element - The HTML element associated with the loading error.
   * @param source - The resource url of the loading error.
   * @param message - Optional. A message describing the loading error.
   */
  constructor(element: HTMLElement, source: string, message?: string) {
    // Call the Error constructor with the provided message
    super(message);

    // Set the source and element properties
    this.source = source;
    this.element = element;

    // Set the name property to identify the type of error
    this.name = 'ResourceLoadingError';
  }
}

/**
 * Function to load external javascript
 *
 * @param source Source of the javascript file, can be a string or URL object
 * @param options Options for the script tag
 *
 * @returns A promise which resolves with {@linkcode ScriptResult} on load
 */
export const loadJavascript = (
  source: URL | string,
  options?: LoadJavascriptOptions | ((element: HTMLScriptElement) => void),
): Promise<ScriptResult> => {
  const url = source instanceof URL ? source.href : source;

  if (!isString(url)) {
    return Promise.reject(new TypeError('Argument source must be URL or string'));
  }

  if (!url.trim()) {
    return Promise.reject(new TypeError('Argument source is not valid'));
  }

  return new Promise<ScriptResult>((resolve, reject) => {
    const config = {
      defer: true,
      async: true,
      ...(!isFunction(options) && options ? options : undefined),
      src: url,
    };

    const script = createElement('script', config);

    if (isFunction(options)) {
      options(script);
    }

    const result = {
      source: config.src,
      element: script,
    };
    const events = [] as ['load' | 'error', () => void][];
    const remove = () => {
      for (const [e, h] of events) {
        script.removeEventListener(e, h);
      }
    };
    const onLoad = () => {
      remove();
      resolve(result);
    };
    const onError = () => {
      remove();
      reject(new ResourceLoadingError(result.element, result.source, `Failed to load Javascript from ${result.source}`));
    };
    events.push(['load', onLoad], ['error', onError]);
    for (const [e, h] of events) {
      script.addEventListener(e, h);
    }

    appendToLast(script, document.querySelectorAll('head > script'), document.head);
  });
};

/**
 * Function to load external stylesheet
 *
 * @param source Source of the stylesheet file, can be a string or URL object
 * @param options Options for the link tag
 *
 * @returns A promise which resolves with {@linkcode StyleResult} on load
 */
export const loadStylesheet = (
  source: URL | string,
  options?: LoadStylesheetOptions | ((element: HTMLLinkElement) => void),
): Promise<StyleResult> => {
  const url = source instanceof URL ? source.href : source;

  if (!isString(url)) {
    return Promise.reject(new TypeError('Argument source must be URL or string'));
  }

  if (!url.trim()) {
    return Promise.reject(new TypeError('Argument source is not valid'));
  }

  return new Promise<StyleResult>((resolve, reject) => {
    const config = {
      ...(!isFunction(options) && options ? options : undefined),
      rel: 'stylesheet',
      href: url,
    };

    const link = createElement('link', config);

    if (isFunction(options)) {
      options(link);
    }

    const result = {
      source: config.href,
      element: link,
    };

    const events = [] as ['load' | 'error', () => void][];
    const remove = () => {
      for (const [e, h] of events) {
        link.removeEventListener(e, h);
      }
    };
    const onLoad = () => {
      remove();
      resolve(result);
    };
    const onError = () => {
      remove();
      reject(new ResourceLoadingError(result.element, result.source, `Failed to load Stylesheet from ${result.source}`));
    };
    events.push(['load', onLoad], ['error', onError]);
    for (const [e, h] of events) {
      link.addEventListener(e, h);
    }

    appendToLast(link, document.querySelectorAll('head > link'), document.head);
  });
};
