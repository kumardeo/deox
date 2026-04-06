import { isBoolean, isFunction, isNull, isNumber, isObjectLike, isString, isUndefined } from './predicate';
import type { OmitFunction, PickString, PickWritable } from './types';

export type Attributes = Record<string, string | number | boolean | null>;
export type Dataset = Record<string, string | number | boolean | null>;
export type Style = Partial<PickString<PickWritable<CSSStyleDeclaration>> & Record<string, string | number>>;
export type Listeners<O extends EventListenerOptions = EventListenerOptions> = {
  [K in keyof HTMLElementEventMap]?:
    | ((this: HTMLElement, event: HTMLElementEventMap[K]) => void)
    | (O & { handler: (event: HTMLElementEventMap[K]) => void });
};

export type UpdateElementOptions<T extends HTMLElement> = Partial<
  Omit<OmitFunction<PickWritable<T>>, 'class' | 'attributes' | 'dataset' | 'style'>
> & {
  class?: string | string[];
  attributes?: Attributes;
  dataset?: Dataset;
  style?: string | Style;
  listeners?: Listeners<AddEventListenerOptions>;
};

export type CreateElementOptions<T extends HTMLElement> = UpdateElementOptions<T>;

export type CreateJavaScriptOptions = Omit<CreateElementOptions<HTMLScriptElement>, 'textContent' | 'innerHTML' | 'innerText'>;

export type CreateStylesheetOptions = Omit<CreateElementOptions<HTMLStyleElement>, 'textContent' | 'innerHTML' | 'innerText'>;

export type LoadJavascriptOptions = Omit<CreateElementOptions<HTMLScriptElement>, 'src'>;

export type LoadStylesheetOptions = Omit<CreateElementOptions<HTMLLinkElement>, 'href' | 'rel'>;

/**
 * Appends new element to head after specified tag name if found otherwise append it in head
 *
 * @param element The element to append
 * @param tagName The tag name to target
 */
function insertAfterendOrLastInHead<T extends Element>(element: T, tagName: keyof HTMLElementTagNameMap): T {
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
}

function tokenize(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

export function setClass(element: HTMLElement, value: string | string[], keepExisting = true): void {
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
}

export function setAttributes(element: HTMLElement, attributes: Attributes): void {
  for (const [name, value] of Object.entries(attributes)) {
    if (isNull(value)) {
      element.removeAttribute(name);
    } else if (!isUndefined(value)) {
      element.setAttribute(name, isString(value) ? value : `${value}`);
    }
  }
}

export function setDataset(element: HTMLElement, dataset: Dataset): void {
  for (const [name, value] of Object.entries(dataset)) {
    if (isNull(value)) {
      delete element.dataset[name];
    } else if (!isUndefined(value)) {
      element.dataset[name] = isString(value) ? value : `${value}`;
    }
  }
}

export function setStyle(element: HTMLElement, style: Style): void {
  for (const [property, value] of Object.entries(style)) {
    if (!isUndefined(value)) {
      const trimmedProperty = property.trim();
      const stringValue = isString(value) ? value : `${value}`;
      if (trimmedProperty.includes('-') || !(property in element.style)) {
        element.style.setProperty(trimmedProperty, stringValue);
      } else {
        (element.style as unknown as Style)[property] = stringValue;
      }
    }
  }
}

export function removeListeners(target: HTMLElement, listeners: Listeners) {
  for (const [type, value] of Object.entries(listeners)) {
    if (isFunction(value)) {
      target.removeEventListener(type, value as EventListener);
    } else if (isObjectLike(value) && isFunction(value.handler)) {
      target.removeEventListener(type, value.handler as EventListener, value);
    }
  }
}

export function addListeners(target: HTMLElement, listeners: Listeners<AddEventListenerOptions>) {
  for (const [type, value] of Object.entries(listeners)) {
    if (isFunction(value)) {
      target.addEventListener(type, value as EventListener);
    } else if (isObjectLike(value) && isFunction(value.handler)) {
      target.addEventListener(type, value.handler as EventListener, value);
    }
  }

  return () => {
    removeListeners(target, listeners);
  };
}

export function updateElement<T extends HTMLElement>(element: T, options: UpdateElementOptions<T>): T {
  if (options) {
    const { class: classes, attributes, dataset, style, listeners } = options;

    if (classes) {
      setClass(element, classes);
    }
    if (attributes) {
      setAttributes(element, attributes);
    }
    if (dataset) {
      setDataset(element, dataset);
    }
    if (style) {
      if (isString(style)) {
        element.setAttribute('style', style);
      } else {
        setStyle(element, style);
      }
    }
    if (listeners) {
      addListeners(element, listeners);
    }

    for (const [property, value] of Object.entries(options)) {
      if (
        property !== 'class' &&
        property !== 'attributes' &&
        property !== 'dataset' &&
        property !== 'style' &&
        property !== 'listeners' &&
        property in element
      ) {
        // @ts-expect-error we can assign
        element[property] = value;
      }
    }
  }

  return element;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: CreateElementOptions<HTMLElementTagNameMap[K]>,
  children?: (Node | string | number)[],
): HTMLElementTagNameMap[K];
export function createElement(tagName: string, options?: CreateElementOptions<HTMLElement>, children?: (Node | string | number)[]): HTMLElement;
/**
 * Creates an instance of the element for the specified tag.
 *
 * @param tagName The name of an element.
 * @param options Optional. Sets element instance properties
 *
 * @returns The created HTMLElement
 */
export function createElement(tagName: string, options?: CreateElementOptions<HTMLElement>, children?: (Node | string | number)[]): HTMLElement {
  const element = document.createElement(tagName);

  if (options) {
    updateElement(element, options);
  }

  if (children && children.length > 0) {
    for (const child of children) {
      if (isNull(child) || isBoolean(child) || isUndefined(children)) {
        continue;
      }
      if (isString(child) || isNumber(child)) {
        const node = document.createTextNode(isNumber(child) ? `${child}` : child);
        element.appendChild(node);
      } else {
        element.appendChild(child);
      }
    }
  }

  return element;
}

export function createFragment(html?: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (isString(html)) {
    const element = document.createElement('div');
    element.innerHTML = html;
    while (element.firstChild) {
      fragment.appendChild(element.firstChild);
    }
  }
  return fragment;
}

/**
 * Creates a HTMLScriptElement with given contents and append it to head
 *
 * @param javascript The content of element
 * @param options Options for element
 *
 * @returns The created HTMLScriptElement
 */
export function createJavascript(javascript: string, options?: CreateJavaScriptOptions | ((element: HTMLScriptElement) => void)): HTMLScriptElement {
  const script = createElement('script', {
    ...(!isFunction(options) && options ? options : undefined),
    textContent: javascript,
  });

  if (isFunction(options)) {
    options(script);
  }

  return insertAfterendOrLastInHead(script, 'script');
}

/**
 * Creates a HTMLStyleElement with given contents and append it to head
 *
 * @param css The content of element
 * @param options Options for element
 *
 * @returns The created HTMLStyleElement
 */
export function createStylesheet(css: string, options?: CreateStylesheetOptions | ((element: HTMLStyleElement) => void)): HTMLStyleElement {
  const style = createElement('style', {
    ...(!isFunction(options) && options ? options : undefined),
    textContent: css,
  });

  if (isFunction(options)) {
    options(style);
  }

  return insertAfterendOrLastInHead(style, 'style');
}

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
export function loadJavascript(
  source: URL | string,
  options?: LoadJavascriptOptions | ((element: HTMLScriptElement) => void),
): Promise<HTMLScriptElement> {
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

    const unsubscribe = addListeners(script, {
      load: () => {
        unsubscribe();
        resolve(script);
      },
      error: () => {
        unsubscribe();
        reject(new ResourceLoadingError(script, script.src, `Failed to load Javascript from ${script.src}`));
      },
    });

    insertAfterendOrLastInHead(script, 'script');
  });
}

/**
 * Function to load external stylesheet
 *
 * @param source Source of the stylesheet file, can be a string or URL object
 * @param options Options for the link tag
 *
 * @returns A promise which resolves with `HTMLLinkElement`
 */
export function loadStylesheet(
  source: URL | string,
  options?: LoadStylesheetOptions | ((element: HTMLLinkElement) => void),
): Promise<HTMLLinkElement> {
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

    const unsubscribe = addListeners(link, {
      load: () => {
        unsubscribe();
        resolve(link);
      },
      error: () => {
        unsubscribe();
        reject(new ResourceLoadingError(link, link.href, `Failed to load Stylesheet from ${link.href}`));
      },
    });

    insertAfterendOrLastInHead(link, 'link');
  });
}
