import { describe, expect, test } from 'vitest';
import { GoogleImage } from './index';

const supportedUrl = 'https://1.bp.blogspot.com/-abc/s1600/placeholder.jpg';
const supportedUrlWithParams = 'https://1.bp.blogspot.com/-abc/s500-w200-h100-c/placeholder.jpg';
const unsupportedUrl = 'https://example.com/image.jpg';

describe('GoogleImage', () => {
  test('recognizes supported image URLs and preserves existing params', () => {
    const image = new GoogleImage(supportedUrl);

    expect(image.isSupported()).toBe(true);
    expect(image.size()).toBe(1600);
    expect(image.url()).toContain('s1600');
  });

  test('parses existing size, width, height and crop params', () => {
    const image = new GoogleImage(supportedUrlWithParams);

    expect(image.isSupported()).toBe(true);
    expect(image.size()).toBe(500);
    expect(image.width()).toBe(200);
    expect(image.height()).toBe(100);
    expect(image.crop()).toBe(true);
    expect(image.url()).toContain('s500');
    expect(image.url()).toContain('-w200');
    expect(image.url()).toContain('-h100');
    expect(image.url()).toContain('-c');
  });

  test('removes all existing params when existing option is disabled', () => {
    const image = new GoogleImage(supportedUrlWithParams, { existing: false });

    expect(image.isSupported()).toBe(true);
    expect(image.size()).toBeNull();
    expect(image.width()).toBeNull();
    expect(image.height()).toBeNull();
    expect(image.crop()).toBe(false);
    expect(image.url()).toContain('/s0/placeholder.jpg');
    expect(image.url()).not.toContain('s500');
    expect(image.url()).not.toContain('-w200');
  });

  test('supports URL object input', () => {
    const image = new GoogleImage(new URL(supportedUrl));

    expect(image.isSupported()).toBe(true);
    expect(image.url()).toContain('s1600');
  });

  test('returns s0 when no params remain after clearing', () => {
    const image = new GoogleImage(supportedUrlWithParams).width(null).height(null).size(null).crop(false);

    expect(image.width()).toBeNull();
    expect(image.height()).toBeNull();
    expect(image.size()).toBeNull();
    expect(image.crop()).toBe(false);
    expect(image.url()).toContain('/s0/placeholder.jpg');
  });

  test('sets output format and removes previous format flags', () => {
    const image = new GoogleImage(supportedUrlWithParams).png(true).gif(true);

    expect(image.png()).toBe(false);
    expect(image.gif()).toBe(true);
    expect(image.url()).toContain('-rg');
    expect(image.url()).not.toContain('-rp');
    expect(image.url()).not.toContain('-rw');
  });

  test('checks mutually exclusive crop flags and keeps only the last set crop style', () => {
    const image = new GoogleImage(supportedUrlWithParams).crop(true).circularCrop(true).alternateCrop(true);

    expect(image.crop()).toBe(false);
    expect(image.circularCrop()).toBe(false);
    expect(image.alternateCrop()).toBe(true);
    expect(image.url()).toContain('-p');
    expect(image.url()).not.toContain('-c');
    expect(image.url()).not.toContain('-cc');
    expect(image.url()).not.toContain('-ci');
  });

  test('sets and removes hex color values correctly', () => {
    const image = new GoogleImage(supportedUrlWithParams).color('0xFFAABB').backgroundColor('0xaabbccdd').padColor('0x000000');

    expect(image.color()).toBe('0xFFAABB');
    expect(image.backgroundColor()).toBe('0xaabbccdd');
    expect(image.padColor()).toBe('0x000000');

    image.backgroundColor(null);

    expect(image.backgroundColor()).toBeNull();
    expect(image.url()).toContain('-c0xFFAABB');
    expect(image.url()).toContain('-pc0x000000');
    expect(image.url()).not.toContain('-bc0xaabbccdd');
  });

  test('toggles button and noButton flags with removal behavior', () => {
    const image = new GoogleImage(supportedUrlWithParams).button(true).noButton(true);

    expect(image.button()).toBe(false);
    expect(image.noButton()).toBe(true);
    expect(image.url()).toContain('-no');
    expect(image.url()).not.toContain('-o');
  });

  test('throws for invalid numeric, boolean, and hex inputs', () => {
    const image = new GoogleImage(supportedUrl);

    expect(() => image.width('100' as any)).toThrow(TypeError);
    expect(() => image.noUpscaling('true' as any)).toThrow(Error);
    expect(() => image.color('ff0000' as any)).toThrow("Argument 'value' must be of format '0xrrggbb' or '0xaarrggbb'");
  });

  test('throws when generating URL for unsupported image without pass', () => {
    const image = new GoogleImage(unsupportedUrl);

    expect(image.isSupported()).toBe(false);
    expect(() => image.url()).toThrow('Image url is not supported for transformations');
  });

  test('returns original URL and default getters when unsupported and pass option is enabled', () => {
    const image = new GoogleImage(unsupportedUrl, { pass: true });

    expect(image.isSupported()).toBe(false);
    expect(image.width()).toBeNull();
    expect(image.crop()).toBe(false);
    expect(image.noUpscaling()).toBe(false);
    expect(image.color()).toBeNull();
    expect(image.url()).toBe(unsupportedUrl);
  });

  test('sets multiple numeric and boolean transformation params', () => {
    const image = new GoogleImage(supportedUrlWithParams)
      .noUpscaling(true)
      .forceScaling(true)
      .rotate(90)
      .symbol(3)
      .border(5)
      .borderRadius(15)
      .pad(true)
      .padColor('0x112233')
      .cacheDays(30)
      .disableAnimation(true)
      .frame(2);

    expect(image.noUpscaling()).toBe(true);
    expect(image.forceScaling()).toBe(true);
    expect(image.rotate()).toBe(90);
    expect(image.symbol()).toBe(3);
    expect(image.border()).toBe(5);
    expect(image.borderRadius()).toBe(15);
    expect(image.pad()).toBe(true);
    expect(image.padColor()).toBe('0x112233');
    expect(image.cacheDays()).toBe(30);
    expect(image.disableAnimation()).toBe(true);
    expect(image.frame()).toBe(2);
    expect(image.url()).toContain('-nu');
    expect(image.url()).toContain('-s');
    expect(image.url()).toContain('-r90');
    expect(image.url()).toContain('-ba3');
    expect(image.url()).toContain('-b5');
    expect(image.url()).toContain('-br15');
    expect(image.url()).toContain('-pd');
    expect(image.url()).toContain('-pc0x112233');
    expect(image.url()).toContain('-e30');
    expect(image.url()).toContain('-k');
    expect(image.url()).toContain('-a2');
  });

  test('uses the constructor error path for invalid url types', () => {
    expect(() => new GoogleImage(123 as any)).toThrow(TypeError);
  });
});
