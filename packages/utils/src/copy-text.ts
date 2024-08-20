import { isString } from './predicate';

/**
 * A function to copy text contents to clipboard
 *
 * @param text The text content to copy
 *
 * @returns Promise which resolves with the same input string
 */
export const copyText = async (text: string) => {
  if (!isString(text)) {
    throw new TypeError('Argument 1 must be a string.');
  }

  if ('clipboard' in navigator) {
    await navigator.clipboard.writeText(text);
    return text;
  }

  const textarea = document.createElement('textarea');
  textarea.setAttribute('style', 'position: fixed; left: 100%; width: 0; height: 0; opacity: 0');
  textarea.textContent = text;

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = !!document.execCommand('copy');
  textarea.remove();

  if (copied) {
    return text;
  }

  throw new Error('Failed to copy text.');
};
