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

export type LoadStylesheetOptions = Omit<CreateElementOptions<'link'>, 'href' | 'rel'>;

/**
 * Appends new element to head after specified tag name if found otherwise append it in head
 *
 * @param element The element to append
 * @param tagName The tag name to target
 */
const insertAfterendOrLastInHead = <T extends Element>(element: T, tagName: keyof HTMLElementTagNameMap) => {
  const elements = document.head.getElementsByTagName(tagName);
  const lastElement = elements.length ? elements[elements.length - 1] : null;
  const appendToHead = () => document.head.appendChild(element);

  if (lastElement) {
    const nextSibling = lastElement.nextElementSibling;
    const parentElement = lastElement.parentElement;
    if ('insertAdjacentElement' in lastElement) {
      lastElement.insertAdjacentElement('afterend', element);
    } else if (nextSibling && parentElement) {
      parentElement.insertBefore(element, nextSibling);
    } else {
      appendToHead();
    }
  } else {
    appendToHead();
  }

  return element;
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
            const classes: string[] = (
              Array.isArray(optionValue) ? (optionValue as string[]) : isString(optionValue) && optionValue.trim() ? optionValue.split(' ') : []
            ).filter((name) => isString(name) && name.trim());
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

  return insertAfterendOrLastInHead(script, 'script');
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

  return insertAfterendOrLastInHead(style, 'style');
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
 * @returns A promise which resolves with `HTMLScriptElement`
 */
export const loadJavascript = (
  source: URL | string,
  options?: LoadJavascriptOptions | ((element: HTMLScriptElement) => void),
): Promise<HTMLScriptElement> => {
  const url = source instanceof URL ? source.href : source;

  if (!isString(url)) {
    return Promise.reject(new TypeError('Argument source must be URL or string'));
  }

  if (!url.trim()) {
    return Promise.reject(new TypeError('Argument source is not valid'));
  }

  return new Promise<HTMLScriptElement>((resolve, reject) => {
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

    const events = {
      load: () => {
        removeEvents();
        resolve(script);
      },
      error: () => {
        removeEvents();
        reject(new ResourceLoadingError(script, script.src, `Failed to load Javascript from ${script.src}`));
      },
    };
    const removeEvents = () => {
      for (const event in events) {
        script.removeEventListener(event, events[event as keyof typeof events]);
      }
    };
    for (const event in events) {
      script.addEventListener(event, events[event as keyof typeof events]);
    }

    insertAfterendOrLastInHead(script, 'script');
  });
};

/**
 * Function to load external stylesheet
 *
 * @param source Source of the stylesheet file, can be a string or URL object
 * @param options Options for the link tag
 *
 * @returns A promise which resolves with `HTMLLinkElement`
 */
export const loadStylesheet = (
  source: URL | string,
  options?: LoadStylesheetOptions | ((element: HTMLLinkElement) => void),
): Promise<HTMLLinkElement> => {
  const url = source instanceof URL ? source.href : source;

  if (!isString(url)) {
    return Promise.reject(new TypeError('Argument source must be URL or string'));
  }

  if (!url.trim()) {
    return Promise.reject(new TypeError('Argument source is not valid'));
  }

  return new Promise<HTMLLinkElement>((resolve, reject) => {
    const config = {
      ...(!isFunction(options) && options ? options : undefined),
      rel: 'stylesheet',
      href: url,
    };

    const link = createElement('link', config);

    if (isFunction(options)) {
      options(link);
    }

    const events = {
      load: () => {
        removeEvents();
        resolve(link);
      },
      error: () => {
        removeEvents();
        reject(new ResourceLoadingError(link, link.href, `Failed to load Stylesheet from ${link.href}`));
      },
    };
    const removeEvents = () => {
      for (const event in events) {
        link.removeEventListener(event, events[event as keyof typeof events]);
      }
    };
    for (const event in events) {
      link.addEventListener(event, events[event as keyof typeof events]);
    }

    insertAfterendOrLastInHead(link, 'link');
  });
};
