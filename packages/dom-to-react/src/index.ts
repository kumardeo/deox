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
  this: Transformer,
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

export class Transformer {
  protected filter?: FilterAction;
  protected modify?: ModifyAction;
  protected transform?: TransformAction;

  static fromNode(node: Node, options: FromNodeOptions = {}): Output {
    const { key, filter, modify, transform } = options;

    if (!node || !(node instanceof Node)) {
      throw new TypeError("Argument 'node' must be of type `Node`");
    }

    return new Transformer({ filter, modify, transform }).nodeToReact(node, {
      level: 0,
      index: 0,
      key,
    });
  }

  static fromHTML(html: string, options: FromHTMLOptions = {}): Output {
    const { key, filter, modify, transform, body } = options;

    if (typeof html !== 'string') {
      throw new TypeError("Argument 'html' must be of type `string`");
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

    const children = new Transformer({
      filter,
      modify,
      transform,
    }).parseNodes(nodes, {
      level: 0,
    });

    if (children.length === 0) {
      return null;
    }

    return createElement(Fragment, { key }, ...children);
  }

  constructor(actions: Actions = {}) {
    this.filter = actions.filter;
    this.modify = actions.modify;
    this.transform = actions.transform;
  }

  protected isOutput(value: unknown): value is Output {
    return (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean' ||
      isValidElement(value)
    );
  }

  protected createKey(level: number, index: number) {
    return `{{__[level:${level}][index:${index}]__}}`;
  }

  parseName(nodeName: string): string {
    if (/[a-z]+[A-Z]+[a-z]+/.test(nodeName)) {
      return nodeName;
    }

    return nodeName.toLowerCase();
  }

  parseAttributes(attributes: NamedNodeMap): Record<string, unknown> {
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

  parseNodes(nodes: ArrayLike<Node>, { level }: { level: number }) {
    const children: (ReactElement | string | number | bigint)[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const element = this.nodeToReact(nodes[i], {
        level,
        index: children.length,
      });

      if (typeof element !== 'boolean' && element !== null) {
        children.push(element);
      }
    }

    return children;
  }

  nodeToReact(input: Node, { level, index, key }: { level: number; index: number; key?: Key }): Output {
    let node = input;

    if (typeof this.filter === 'function') {
      const result = this.filter(node, { level, index });
      if (typeof result !== 'boolean') {
        throw new TypeError("Callback 'filter' must return `boolean`");
      }
      if (!result) {
        return null;
      }
    }

    if (typeof this.modify === 'function') {
      const result = this.modify(node, { level, index });
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

    const reactKey = typeof key !== 'undefined' ? key : this.createKey(level, index);

    if (typeof this.transform === 'function') {
      const result = this.transform(node, {
        level,
        index,
        key: reactKey,
        props: () => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return this.parseAttributes((node as Element).attributes);
          }
          return null;
        },
        children: () => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            return this.parseNodes(node.childNodes, {
              level: level + 1,
            });
          }
          return null;
        },
      });
      if (typeof result !== 'undefined') {
        if (result === null) {
          return null;
        }
        if (!this.isOutput(result)) {
          throw new TypeError("Callback 'transform' must return `ReactElement | string | number | bigint | boolean | null | undefined`");
        }
        return result;
      }
    }

    switch (node.nodeType) {
      case Node.ELEMENT_NODE: {
        return createElement(
          this.parseName(node.nodeName),
          Object.assign(this.parseAttributes((node as Element).attributes), {
            key: reactKey,
          }),
          ...this.parseNodes(node.childNodes, {
            level: level + 1,
          }),
        );
      }
      case Node.DOCUMENT_FRAGMENT_NODE: {
        return createElement(
          Fragment,
          {
            key: reactKey,
          },
          ...this.parseNodes(node.childNodes, {
            level: level + 1,
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
}

export function convertFromNode(node: Node, options: FromNodeOptions = {}): Output {
  return Transformer.fromNode(node, options);
}

export function convertFromHTML(html: string, options: FromHTMLOptions = {}): Output {
  return Transformer.fromHTML(html, options);
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
