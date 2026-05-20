import { describe, expect, it } from 'vitest';
import { BloggerFeed } from './blogger-feed';
import { SDKError, SDKRequestError } from './errors';

describe('BloggerFeed', () => {
  it('exports static helpers and error classes', () => {
    expect(typeof BloggerFeed.parseFeed).toBe('function');
    expect(BloggerFeed.SDKError).toBe(SDKError);
    expect(BloggerFeed.SDKRequestError).toBe(SDKRequestError);
  });

  it('can parse a minimal feed using static parseFeed', () => {
    const feed = BloggerFeed.parseFeed({
      feed: {
        id: { $t: 'tag:blogger.com,1999:blog-12345' },
        title: { $t: 'Example Blog' },
        updated: { $t: '2026-05-20T00:00:00.000Z' },
        author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
        link: [{ rel: 'alternate', href: 'https://example.com', type: 'text/html' }],
      },
    });

    expect(feed.blog).not.toBeNull();
    expect(feed.blog).toEqual(
      expect.objectContaining({
        id: '12345',
        url: 'https://example.com',
        title: 'Example Blog',
        author: { name: 'Author Name', url: 'https://example.com/author', image: null },
        updated: '2026-05-20T00:00:00.000Z',
      }),
    );
    expect(feed.posts).toBeNull();
    expect(feed.comments).toBeNull();
  });

  it('constructs a BloggerFeed instance with a blog URL and exposes methods', () => {
    const client = new BloggerFeed('https://blogger.googleblog.com');

    expect(client).toBeInstanceOf(BloggerFeed);
    expect(client.posts).toBeDefined();
    expect(client.pages).toBeDefined();
    expect(client.comments).toBeDefined();
    expect(client.blog).toBeDefined();
  });

  it('fetches a live Blogger blog and post using client methods', async () => {
    const client = new BloggerFeed('https://blogger.googleblog.com');

    const blog = await client.blog.get();
    expect(blog).not.toBeNull();
    expect(blog).toEqual(
      expect.objectContaining({
        id: '2399953',
        url: 'https://blogger.googleblog.com/',
        title: 'Official Blogger Blog',
        labels: expect.arrayContaining(['Blogger', 'gadgets', 'blogspot']),
      }),
    );

    const posts = await client.posts.list({ maxResults: 1 });
    expect(posts.items).toHaveLength(1);
    expect(posts.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        url: expect.stringContaining('https://blogger.googleblog.com/'),
      }),
    );
    expect(posts.selfUrl).toEqual(expect.stringContaining('https://www.blogger.com/feeds/2399953/'));
  });
});
