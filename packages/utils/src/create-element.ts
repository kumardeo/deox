import { isFunction, isNull, isString, isUndefined } from './predicate';
import type { OmitFunction, PickString, WritableKeys } from './types';

export type Attributes = Record<string, string | number | boolean | null>;
export type Dataset = Record<string, string | number | boolean | null>;
export type Style = Partial<PickString<Pick<CSSStyleDeclaration, WritableKeys<CSSStyleDeclaration>>>>;

export type UpdateElementOptions<T extends HTMLElement> = Partial<
  Omit<OmitFunction<Pick<T, WritableKeys<T>>>, 'class' | 'attributes' | 'dataset' | 'style'>
> & {
  class?: string | string[];
  attributes?: Attributes;
  dataset?: Dataset;
  style?: string | Style;
};

export type CreateElementOptions<T extends keyof HTMLElementTagNameMap> = UpdateElementOptions<HTMLElementTagNameMap[T]>;

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
const insertAfterendOrLastInHead = <T extends Element>(element: T, tagName: keyof HTMLElementTagNameMap): T => {
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

const tokenize = (name: string): string[] => name.trim().split(/\s+/).filter(Boolean);

export const setClass = (element: HTMLElement, value: string | string[], keepExisting = true): void => {
  const names = Array.isArray(value)
    ? value.filter((item) => isString(item)).flatMap((name) => tokenize(name))
    : isString(value)
      ? tokenize(value)
      : [];

  if (keepExisting) {
    if (names.length) {
      element.classList.add(...names);
    }
  } else {
    element.className = names.join(' ');
  }
};

export const setAttributes = (element: HTMLElement, attributes: Attributes): void => {
  for (const name in attributes) {
    const value = attributes[name];
    if (isNull(value)) {
      element.removeAttribute(name);
    } else if (!isUndefined(value)) {
      element.setAttribute(name, isString(value) ? value : `${value}`);
    }
  }
};

export const setDataset = (element: HTMLElement, dataset: Dataset): void => {
  for (const name in dataset) {
    const value = dataset[name];
    if (isNull(value)) {
      delete element.dataset[name];
    } else if (!isUndefined(value)) {
      element.dataset[name] = isString(value) ? value : `${value}`;
    }
  }
};

export const setStyle = (element: HTMLElement, style: Style): void => {
  for (const property in style) {
    const value = style[property];
    if (!isUndefined(value)) {
      const trimmedProperty = property.trim();
      const stringValue = isString(value) ? value : `${value}`;
      if (trimmedProperty.includes('-') || !(property in element.style)) {
        element.style.setProperty(trimmedProperty, stringValue);
      } else {
        element.style[property] = stringValue;
      }
    }
  }
};

export const updateElement = <T extends HTMLElement>(element: T, options: UpdateElementOptions<T>): T => {
  if (options) {
    if (options.class) {
      setClass(element, options.class);
    }
    if (options.attributes) {
      setAttributes(element, options.attributes);
    }
    if (options.dataset) {
      setDataset(element, options.dataset);
    }
    if (options.style) {
      if (isString(options.style)) {
        element.setAttribute('style', options.style);
      } else {
        setStyle(element, options.style);
      }
    }

    for (const property in options) {
      const value = options[property as keyof typeof options];

      if (property !== 'class' && property !== 'attributes' && property !== 'dataset' && property !== 'style' && property in element) {
        // @ts-expect-error we can assign
        element[option] = value;
      }
    }
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
  return options ? updateElement(element, options) : element;
};

/**
 * Creates a HTMLScriptElement with given contents and append it to head
 *
 * @param javascript The content of element
 * @param options Options for element
 *
 * @returns The created HTMLScriptElement
 */
export const createJavascript = (
  javascript: string,
  options?: CreateJavaScriptOptions | ((element: HTMLScriptElement) => void),
): HTMLScriptElement => {
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
export const createStylesheet = (css: string, options?: CreateStylesheetOptions | ((element: HTMLStyleElement) => void)): HTMLStyleElement => {
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
