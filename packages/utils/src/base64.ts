import { isString, isUndefined } from './predicate';

const fromCharCode = String.fromCharCode;

/**
 * Class representing a Base64 encoder/decoder.
 */
export class Base64 {
  /** The default Base64 key used for encoding and decoding. */
  static readonly DEFAULT_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  /** Instance with the default key used for encoding and decoding. */
  static readonly WITH_DEFAULT_KEY = new Base64();

  /** Instance with another key variant used for encoding and decoding. */
  static readonly WITH_KEY_1 = new Base64('FINEUiBYDevSagARlwXVuCGzbdjMHQcnKypsZhoWLxfkOmrTPtJq3508749216+/=');

  /** Instance with yet another key variant used for encoding and decoding. */
  static readonly WITH_KEY_2 = new Base64('MBDRTNFJCAPOSQEIGWLHVYZUKXmbdrtnfjcaposqeigwlhvyzukx3508749216+/=');

  /**
   * Converts a string to its UTF-8 representation.
   *
   * @param string - The input string to encode.
   *
   * @returns The UTF-8 encoded string.
   *
   * @private
   */
  private static eU8(string: string): string {
    const replaced = string.replace(/\r\n/g, '\n');
    let utfText = '';

    for (let i = 0; i < replaced.length; i += 1) {
      const code = replaced.charCodeAt(i);

      if (code < 128) {
        utfText += fromCharCode(code);
      } else if (code > 127 && code < 2048) {
        utfText += fromCharCode((code >> 6) | 192);
        utfText += fromCharCode((code & 63) | 128);
      } else {
        utfText += fromCharCode((code >> 12) | 224);
        utfText += fromCharCode(((code >> 6) & 63) | 128);
        utfText += fromCharCode((code & 63) | 128);
      }
    }
    return utfText;
  }

  /**
   * Decodes a UTF-8 encoded string to its original form.
   *
   * @param utfText - The UTF-8 encoded string to decode.
   *
   * @returns The decoded string.
   *
   * @private
   */
  private static dU8(utfText: string): string {
    let string = '';
    let i = 0;
    let c = 0;
    let c2 = c;
    let c3 = c;

    while (i < utfText.length) {
      c = utfText.charCodeAt(i);

      if (c < 128) {
        string += fromCharCode(c);
        i += 1;
      } else if (c > 191 && c < 224) {
        c2 = utfText.charCodeAt(i + 1);
        string += fromCharCode(((c & 31) << 6) | (c2 & 63));
        i += 2;
      } else {
        c2 = utfText.charCodeAt(i + 1);
        c3 = utfText.charCodeAt(i + 2);
        string += fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      }
    }
    return string;
  }

  /** The key used for encoding and decoding. Defaults to DEFAULT_KEY. */
  key: string = Base64.DEFAULT_KEY;

  /**
   * Creates a Base64 instance.
   *
   * @param key - Optional. The key used for encoding and decoding. Defaults to DEFAULT_KEY
   */
  constructor(key?: string) {
    if (!isUndefined(key)) {
      if (!isString(key)) {
        throw new TypeError('Argument key is not type of string.');
      }
      this.key = key;
    }
  }

  /**
   * Encodes a string using Base64.
   *
   * @param input - The input string to encode.
   *
   * @returns The Base64 encoded string.
   */
  encode(input: string): string {
    if (!isString(input)) {
      throw new TypeError('Argument input is not type of string.');
    }

    const { key } = this;
    const string = Base64.eU8(input);

    let output = '';
    let i = 0;

    while (i < string.length) {
      const chr1 = string.charCodeAt(i);
      i += 1;
      const chr2 = string.charCodeAt(i);
      i += 1;
      const chr3 = string.charCodeAt(i);
      i += 1;

      const enc1 = chr1 >> 2;
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      let enc4 = chr3 & 63;

      if (Number.isNaN(chr2)) {
        enc3 = 64;
        enc4 = enc3;
      } else if (Number.isNaN(chr3)) {
        enc4 = 64;
      }

      output += key.charAt(enc1) + key.charAt(enc2) + key.charAt(enc3) + key.charAt(enc4);
    }
    return output;
  }

  /**
   * Decodes a Base64 encoded string.
   *
   * @param input - The Base64 encoded string to decode.
   *
   * @returns The decoded string.
   */
  decode(input: string): string {
    if (!isString(input)) {
      throw new TypeError('Argument input is not type of string.');
    }

    const { key } = this;
    let output = '';
    let i = 0;

    const string = input.replace(/[^A-Za-z0-9+\\=]/g, '');

    while (i < input.length) {
      const enc1 = key.indexOf(string.charAt(i));
      i += 1;
      const enc2 = key.indexOf(string.charAt(i));
      i += 1;
      const enc3 = key.indexOf(string.charAt(i));
      i += 1;
      const enc4 = key.indexOf(string.charAt(i));
      i += 1;

      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;

      output += fromCharCode(chr1);

      if (enc3 !== 64) {
        output += fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output += fromCharCode(chr3);
      }
    }

    output = Base64.dU8(output);

    const encoded = this.encode(output);
    if (encoded !== input) {
      throw new Error('The string to be decoded is not correctly encoded.');
    }

    return output;
  }
}
