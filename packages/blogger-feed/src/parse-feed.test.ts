import { describe, expect, it } from 'vitest';
import { parseFeed } from './feed-parser';

describe('parseFeed', () => {
  const feedInput = {
    feed: {
      id: { $t: 'tag:blogger.com,1999:blog-12345' },
      title: { $t: 'Example Blog' },
      updated: { $t: '2026-05-20T00:00:00.000Z' },
      author: [
        {
          name: { $t: 'Author Name' },
          uri: { $t: 'https://example.com/author' },
          gd$image: { src: 'https://example.com/avatar.png' },
        },
      ],
      link: [
        { rel: 'alternate', href: 'https://example.com', type: 'text/html' },
        { rel: 'self', href: 'https://example.com/feeds/posts/default', type: 'application/atom+xml' },
        { rel: 'next', href: 'https://example.com/feeds/posts/default?start-index=2', type: 'application/atom+xml' },
      ],
      category: [{ term: 'blogging' }, { term: 'seo' }, { term: 'javascript' }],
      entry: [
        {
          id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-111' },
          title: { $t: 'First Post' },
          published: { $t: '2026-05-20T01:00:00.000Z' },
          updated: { $t: '2026-05-20T02:00:00.000Z' },
          summary: { $t: 'This is a summary.' },
          content: { $t: '<p>Post content</p>' },
          link: [
            { rel: 'alternate', href: 'https://example.com/2026/05/first-post.html', type: 'text/html' },
            { rel: 'self', href: 'https://example.com/feeds/posts/default/111', type: 'application/atom+xml' },
          ],
          author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
          category: [{ term: 'test' }],
        },
      ],
    },
  };

  it('parses a blogger feed object into a structured Feed', () => {
    const feed = parseFeed(feedInput);

    expect(feed.blog).toEqual(
      expect.objectContaining({
        id: '12345',
        title: 'Example Blog',
        url: 'https://example.com',
        labels: ['blogging', 'seo', 'javascript'],
        author: { name: 'Author Name', url: 'https://example.com/author', image: 'https://example.com/avatar.png' },
      }),
    );
    expect(feed.posts).toHaveLength(1);
    expect(feed.posts?.[0]).toEqual(
      expect.objectContaining({
        id: '111',
        title: 'First Post',
        url: 'https://example.com/2026/05/first-post.html',
        author: { name: 'Author Name', url: 'https://example.com/author', image: null },
        labels: ['test'],
        summary: 'This is a summary.',
        content: '<p>Post content</p>',
        published: '2026-05-20T01:00:00.000Z',
        updated: '2026-05-20T02:00:00.000Z',
      }),
    );
    expect(feed.selfUrl).toBe('https://example.com/feeds/posts/default');
    expect(feed.nextUrl).toBe('https://example.com/feeds/posts/default?start-index=2');
  });

  it('parses a single blog entry object when provided directly', () => {
    const feed = parseFeed({
      entry: {
        id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-222' },
        title: { $t: 'Second Post' },
        published: { $t: '2026-05-21T01:00:00.000Z' },
        updated: { $t: '2026-05-21T02:00:00.000Z' },
        link: [{ rel: 'alternate', href: 'https://example.com/2026/05/second-post.html', type: 'text/html' }],
        author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
      },
    });

    expect(feed.blog).toBeNull();
    expect(feed.posts).toHaveLength(1);
    expect(feed.posts?.[0].id).toBe('222');
    expect(feed.posts?.[0].url).toBe('https://example.com/2026/05/second-post.html');
    expect(feed.selfUrl).toBeNull();
    expect(feed.nextUrl).toBeNull();
  });
});
