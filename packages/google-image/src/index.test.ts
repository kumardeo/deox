import { describe, expect, test } from 'vitest';
import { GoogleImage } from './index';

const supportedUrl = 'https://1.bp.blogspot.com/-abc/s1600/placeholder.jpg';
const unsupportedUrl = 'https://example.com/image.jpg';

describe('GoogleImage', () => {
  test('recognizes supported image URLs and preserves existing params', () => {
    const image = new GoogleImage(supportedUrl);

    expect(image.isSupported()).toBe(true);
    expect(image.size()).toBe(1600);
    expect(image.url()).toContain('s1600');
  });

  test('sets width and updates the generated URL', () => {
    const image = new GoogleImage(supportedUrl).width(120);

    expect(image.width()).toBe(120);
    expect(image.url()).toContain('-w120');
    expect(image.url()).toContain('s1600');
  });

  test('removes width when set to null', () => {
    const image = new GoogleImage(supportedUrl).width(120).width(null);

    expect(image.width()).toBeNull();
    expect(image.url()).not.toContain('-w120');
    expect(image.url()).toContain('s1600');
  });

  test('returns original URL when unsupported and pass option is enabled', () => {
    const image = new GoogleImage(unsupportedUrl, { pass: true });

    expect(image.isSupported()).toBe(false);
    expect(image.url()).toBe(unsupportedUrl);
  });

  test('throws when generating URL for unsupported image without pass', () => {
    const image = new GoogleImage(unsupportedUrl);

    expect(() => image.url()).toThrow('Image url is not supported for transformations');
  });
});
