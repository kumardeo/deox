import { createElement, Fragment, isValidElement, type Key, type ReactElement } from 'react';
import styleToJS from 'style-to-js';
import { attrToPropMap, noTextChildNodes } from './shared';

export type Output = ReactElement | string | number | bigint | boolean | null;

export type FilterAction = (
  node: Node,
  info: {
    level: number;
    index: number;
  },
) => boolean;

export type ModifyAction = (
  node: Node,
  info: {
    level: number;
    index: number;
  },
) => Node | null | undefined;

export type TransformAction = (
  node: Node,
  info: {
    level: number;
    index: number;
    key: Key;
    props: () => Record<string, unknown> | null;
    children: () => (ReactElement | string | number | bigint)[] | null;
  },
) => Output | undefined;

export interface Actions {
  filter?: FilterAction;
  modify?: ModifyAction;
  transform?: TransformAction;
}

export interface Options extends Actions {
  key?: Key;
}

export interface FromNodeOptions extends Options {}

export interface FromHTMLOptions extends Options {
  body?(body: HTMLBodyElement): void;
}

function isOutput(value: unknown): value is Output {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean' ||
    isValidElement(value)
  );
}

function createKey(level: number, index: number) {
  return `{{__[level:${level}][index:${index}]__}}`;
}

function parseName(nodeName: string): string {
  if (/[a-z]+[A-Z]+[a-z]+/.test(nodeName)) {
    return nodeName;
  }

  return nodeName.toLowerCase();
}

function parseAttributes(attributes: NamedNodeMap): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (let i = 0; i < attributes.length; i++) {
    const { name, value } = attributes[i];
    const prop = typeof attrToPropMap[name] === 'string' ? attrToPropMap[name] : name;

    switch (name) {
      case 'class': {
        props.className = value;
        break;
      }
      case 'style': {
        try {
          props.style = styleToJS(value, { reactCompat: true });
        } catch (_) {}
        break;
      }
      case 'allowfullscreen':
      case 'allowpaymentrequest':
      case 'async':
      case 'autofocus':
      case 'autoplay':
      case 'checked':
      case 'controls':
      case 'default':
      case 'defer':
      case 'disabled':
      case 'formnovalidate':
      case 'hidden':
      case 'ismap':
      case 'itemscope':
      case 'loop':
      case 'multiple':
      case 'muted':
      case 'nomodule':
      case 'novalidate':
      case 'open':
      case 'readonly':
      case 'required':
      case 'reversed':
      case 'selected':
      case 'typemustmatch': {
        props[prop] = true;
        break;
      }
      default: {
        if (name.startsWith('data-') || name.startsWith('aria-')) {
          props[name] = value;
        } else if (!/^on[a-z]+$/i.test(name)) {
          props[prop] = value;
        }
      }
    }
  }

  return props;
}

function parseChildren(nodes: NodeList, { level, filter, modify, transform }: { level: number } & Actions) {
  const children: (ReactElement | string | number | bigint)[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const element = convertToReact(nodes[i], {
      level,
      index: children.length,
      filter,
      modify,
      transform,
    });

    if (typeof element !== 'boolean' && element !== null) {
      children.push(element);
    }
  }

  return children;
}

function convertToReact(
  input: Node,
  { level, index, key, filter, modify, transform }: { level: number; index: number; key?: Key } & Actions,
): Output {
  let node = input;

  if (typeof filter === 'function') {
    const result = filter(node, { level, index });
    if (typeof result !== 'boolean') {
      throw new TypeError("Callback 'filter' must return `boolean`");
    }
    if (!result) {
      return null;
    }
  }

  if (typeof modify === 'function') {
    const result = modify(node, { level, index });
    if (typeof result !== 'undefined') {
      if (result === null) {
        return null;
      }
      if (!(result instanceof Node)) {
        throw new TypeError("Callback 'modify' must return `Node | null | undefined`");
      }
      node = result;
    }
  }

  const reactKey = typeof key !== 'undefined' ? key : createKey(level, index);

  if (typeof transform === 'function') {
    const result = transform(node, {
      level,
      index,
      key: reactKey,
      props: () => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return parseAttributes((node as Element).attributes);
        }
        return null;
      },
      children() {
        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
          return parseChildren(node.childNodes, {
            level: level + 1,
            filter,
            modify,
            transform,
          });
        }
        return null;
      },
    });
    if (typeof result !== 'undefined') {
      if (result === null) {
        return null;
      }
      if (!isOutput(result)) {
        throw new TypeError("Callback 'transform' must return `ReactElement | string | number | bigint | boolean | null | undefined`");
      }
      return result;
    }
  }

  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      return createElement(
        parseName(node.nodeName),
        Object.assign(parseAttributes((node as Element).attributes), {
          key: reactKey,
        }),
        ...parseChildren(node.childNodes, {
          level: level + 1,
          filter,
          modify,
          transform,
        }),
      );
    }
    case Node.DOCUMENT_FRAGMENT_NODE: {
      return createElement(
        Fragment,
        {
          key: reactKey,
        },
        ...parseChildren(node.childNodes, {
          level: level + 1,
          filter,
          modify,
          transform,
        }),
      );
    }
    case Node.TEXT_NODE: {
      const nodeText = node.nodeValue;

      if (typeof nodeText !== 'string') {
        return null;
      }

      if (/^\s+$/.test(nodeText) && !/[\u00A0\u202F]/.test(nodeText)) {
        return null;
      }

      if (!node.parentNode) {
        return nodeText;
      }

      const parentNodeName = node.parentNode.nodeName.toLowerCase();

      if (noTextChildNodes.includes(parentNodeName)) {
        return null;
      }

      return nodeText;
    }
    default: {
      return null;
    }
  }
}

export function convertFromNode(node: Node, options: FromNodeOptions = {}): Output {
  const { key } = options;

  if (!node || !(node instanceof Node)) {
    throw new TypeError("Argument 'input' must be of type `Node`");
  }

  return convertToReact(node, {
    level: 0,
    index: 0,
    key,
  });
}

export function convertFromHTML(html: string, options: FromHTMLOptions = {}): Output {
  const { key, filter, modify, transform, body } = options;

  if (typeof html !== 'string') {
    throw new TypeError("Argument 'input' must be of type `string`");
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  const root = document.body as HTMLBodyElement;

  if (typeof body === 'function') {
    body(root);
  }

  const nodes = root.childNodes;

  if (nodes.length === 0) {
    return null;
  }

  const children = parseChildren(nodes, {
    level: 0,
    filter,
    modify,
    transform,
  });

  if (children.length === 0) {
    return null;
  }

  return createElement(Fragment, { key }, ...children);
}

export function convert(input: string | Node, options: Options = {}): Output {
  if (typeof input === 'string') {
    return convertFromHTML(input, options);
  }

  if (input instanceof Node) {
    return convertFromNode(input, options);
  }

  throw new TypeError("Argument 'input' must be of type `string | Node`");
}
