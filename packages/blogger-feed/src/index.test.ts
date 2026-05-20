import { describe, expect, it } from 'vitest';
import { BloggerFeed, parseFeed, SDKError, SDKRequestError } from './index';

describe('@deox/blogger-feed index', () => {
  it('exports the package public API', () => {
    expect(typeof BloggerFeed).toBe('function');
    expect(typeof parseFeed).toBe('function');
    expect(typeof SDKError).toBe('function');
    expect(typeof SDKRequestError).toBe('function');
    expect(BloggerFeed.parseFeed).toBe(parseFeed);
    expect(BloggerFeed.SDKError).toBe(SDKError);
    expect(BloggerFeed.SDKRequestError).toBe(SDKRequestError);
  });

  it('can be constructed with a blog URL and exposes methods', () => {
    const client = new BloggerFeed('https://example.com');

    expect(client).toBeInstanceOf(BloggerFeed);
    expect(client.posts).toBeDefined();
    expect(client.pages).toBeDefined();
    expect(client.comments).toBeDefined();
    expect(client.blog).toBeDefined();
  });
});
