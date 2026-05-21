import { describe, expect, it } from 'vitest';
import { parseFeed } from './feed-parser';

describe('parseFeed', () => {
  const richFeedInput = {
    feed: {
      id: { $t: 'tag:blogger.com,1999:blog-12345' },
      title: { $t: 'Example Blog' },
      subtitle: { $t: 'A sample blog' },
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
        { rel: 'previous', href: 'https://example.com/feeds/posts/default?start-index=1', type: 'application/atom+xml' },
        { rel: 'next', href: 'https://example.com/feeds/posts/default?start-index=2', type: 'application/atom+xml' },
      ],
      category: [{ term: 'blogging' }, { term: 'seo' }, { term: 'javascript' }],
      openSearch$itemsPerPage: { $t: '25' },
      openSearch$startIndex: { $t: '1' },
      openSearch$totalResults: { $t: '100' },
      entry: [
        {
          id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-111' },
          title: { $t: 'First Post' },
          published: { $t: '2026-05-20T01:00:00.000Z' },
          updated: { $t: '2026-05-20T02:00:00.000Z' },
          summary: { $t: 'This is a summary.' },
          content: { $t: '<p>Post content</p>' },
          media$thumbnail: { url: 'https://example.com/thumbnail.jpg' },
          link: [
            { rel: 'alternate', href: 'https://example.com/2026/05/first-post.html', type: 'text/html' },
            { rel: 'self', href: 'https://example.com/feeds/posts/default/111', type: 'application/atom+xml' },
            { rel: 'replies', href: 'https://example.com/2026/05/first-post.html#comments', type: 'text/html', title: '5 comments' },
            { rel: 'replies', href: 'https://example.com/feeds/posts/default/post-111/comments', type: 'application/atom+xml' },
          ],
          author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
          category: [{ term: 'test' }],
          georss$box: { $t: '1 2 3 4' },
          georss$featurename: { $t: 'Sample Location' },
          georss$point: { $t: '10.0 20.0' },
        },
        {
          id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-222' },
          title: { $t: 'Second Post' },
          published: { $t: '2026-05-21T01:00:00.000Z' },
          updated: { $t: '2026-05-21T02:00:00.000Z' },
          content: { $t: '<p><img src="https://example.com/content-image.png" /></p>' },
          link: [{ rel: 'alternate', href: 'https://example.com/2026/05/second-post.html', type: 'text/html' }],
          author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
          category: [{ term: 'second' }],
        },
        {
          id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.comment-333' },
          title: { $t: 'Comment Title' },
          published: { $t: '2026-05-20T03:00:00.000Z' },
          updated: { $t: '2026-05-20T03:30:00.000Z' },
          summary: { $t: 'A comment summary.' },
          content: { $t: 'A comment content.' },
          'thr$in-reply-to': {
            href: 'https://example.com/2026/05/first-post.html?m=1',
            ref: 'tag:blogger.com,1999:blog-1234567890123456789.post-111',
          },
          link: [
            { rel: 'alternate', href: 'https://example.com/2026/05/first-post.html?m=1#comment-333', type: 'text/html' },
            { rel: 'related', href: 'https://example.com/feeds/posts/default/comments/post-111/333', type: 'application/atom+xml' },
          ],
          author: [{ name: { $t: 'Commenter Name' }, uri: { $t: 'https://example.com/commenter' } }],
          gd$extendedProperty: [
            { name: 'blogger.itemClass', value: 'User' },
            { name: 'blogger.displayTime', value: 'May 20, 2026' },
            { name: 'blogger.contentRemoved', value: 'true' },
          ],
        },
      ],
    },
  };

  it('parses a blogger feed object with posts, comments, pagination, and metadata', () => {
    const feed = parseFeed(richFeedInput);

    expect(feed.blog).toEqual(
      expect.objectContaining({
        id: '12345',
        title: 'Example Blog',
        subtitle: 'A sample blog',
        url: 'https://example.com',
        labels: ['blogging', 'seo', 'javascript'],
        author: { name: 'Author Name', url: 'https://example.com/author', image: 'https://example.com/avatar.png' },
      }),
    );

    expect(feed.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rel: 'alternate', href: 'https://example.com' }),
        expect.objectContaining({ rel: 'self', href: 'https://example.com/feeds/posts/default' }),
        expect.objectContaining({ rel: 'previous', href: 'https://example.com/feeds/posts/default?start-index=1' }),
        expect.objectContaining({ rel: 'next', href: 'https://example.com/feeds/posts/default?start-index=2' }),
      ]),
    );
    expect(feed.selfUrl).toBe('https://example.com/feeds/posts/default');
    expect(feed.previousUrl).toBe('https://example.com/feeds/posts/default?start-index=1');
    expect(feed.nextUrl).toBe('https://example.com/feeds/posts/default?start-index=2');
    expect(feed.itemsPerPage).toBe(25);
    expect(feed.startIndex).toBe(1);
    expect(feed.totalResults).toBe(100);

    expect(feed.posts).toHaveLength(2);
    expect(feed.comments).toHaveLength(1);

    expect(feed.posts?.[0]).toEqual(
      expect.objectContaining({
        id: '111',
        title: 'First Post',
        url: 'https://example.com/2026/05/first-post.html',
        thumbnail: 'https://example.com/thumbnail.jpg',
        thumbnailAlt: 'https://example.com/thumbnail.jpg',
        summary: 'This is a summary.',
        content: '<p>Post content</p>',
        labels: ['test'],
        comments: { feed: 'https://example.com/feeds/posts/default/post-111/comments', number: 5, title: '5 comments' },
        geo: { box: '1 2 3 4', featureName: 'Sample Location', point: '10.0 20.0' },
      }),
    );

    expect(feed.posts?.[1]).toEqual(
      expect.objectContaining({
        id: '222',
        title: 'Second Post',
        url: 'https://example.com/2026/05/second-post.html',
        thumbnail: null,
        thumbnailAlt: 'https://example.com/content-image.png',
        summary: null,
        content: '<p><img src="https://example.com/content-image.png" /></p>',
        labels: ['second'],
      }),
    );

    expect(feed.comments?.[0]).toEqual(
      expect.objectContaining({
        id: 'tag:blogger.com,1999:blog-1234567890123456789.comment-333',
        title: 'Comment Title',
        url: 'https://example.com/2026/05/first-post.html?m=1#comment-333',
        summary: 'A comment summary.',
        content: 'A comment content.',
        author: { name: 'Commenter Name', url: 'https://example.com/commenter', image: null },
        extended: { class: 'User', time: 'May 20, 2026', removed: true },
        post: { id: '111', url: 'https://example.com/2026/05/first-post.html' },
        inReplyTo: '333',
      }),
    );
  });

  it('returns empty posts and comments arrays for an empty feed entry array', () => {
    const feed = parseFeed({ feed: { entry: [] } });

    expect(feed.blog).toBeNull();
    expect(feed.posts).toEqual([]);
    expect(feed.comments).toEqual([]);
    expect(feed.selfUrl).toBeNull();
    expect(feed.nextUrl).toBeNull();
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
    expect(feed.posts?.[0]).toEqual(
      expect.objectContaining({
        id: '222',
        title: 'Second Post',
        url: 'https://example.com/2026/05/second-post.html',
        author: { name: 'Author Name', url: 'https://example.com/author', image: null },
      }),
    );
    expect(feed.selfUrl).toBeNull();
    expect(feed.nextUrl).toBeNull();
  });

  it('returns null payload arrays when feed entry is missing', () => {
    const feed = parseFeed({ feed: {} });

    expect(feed.blog).toBeNull();
    expect(feed.posts).toBeNull();
    expect(feed.comments).toBeNull();
    expect(feed.itemsPerPage).toBeNull();
    expect(feed.startIndex).toBeNull();
    expect(feed.totalResults).toBeNull();
    expect(feed.selfUrl).toBeNull();
    expect(feed.nextUrl).toBeNull();
  });

  it('extracts an image thumbnail from summary when no media thumbnail exists', () => {
    const feed = parseFeed({
      entry: {
        id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-333' },
        title: { $t: 'Summary Image Post' },
        published: { $t: '2026-05-22T01:00:00.000Z' },
        updated: { $t: '2026-05-22T02:00:00.000Z' },
        summary: { $t: '<p><img src="https://example.com/summary-image.png" /></p>' },
        link: [{ rel: 'alternate', href: 'https://example.com/2026/05/summary-image-post.html', type: 'text/html' }],
        author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
      },
    });

    expect(feed.posts).toHaveLength(1);
    expect(feed.posts?.[0]).toEqual(
      expect.objectContaining({
        id: '333',
        thumbnail: null,
        thumbnailAlt: 'https://example.com/summary-image.png',
      }),
    );
  });

  it('returns a comment count of zero when replies title contains no digits', () => {
    const feed = parseFeed({
      entry: {
        id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-444' },
        title: { $t: 'No Count Post' },
        published: { $t: '2026-05-22T03:00:00.000Z' },
        updated: { $t: '2026-05-22T04:00:00.000Z' },
        link: [
          { rel: 'alternate', href: 'https://example.com/2026/05/no-count-post.html', type: 'text/html' },
          { rel: 'replies', href: 'https://example.com/2026/05/no-count-post.html#comments', type: 'text/html', title: 'Replies' },
        ],
        author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
      },
    });

    expect(feed.posts?.[0]?.comments).toEqual({ feed: null, number: 0, title: 'Replies' });
  });

  it('treats the default Blogger avatar as missing for the blog author', () => {
    const feed = parseFeed({
      feed: {
        id: { $t: 'tag:blogger.com,1999:blog-12345' },
        title: { $t: 'Example Blog' },
        updated: { $t: '2026-05-20T00:00:00.000Z' },
        author: [
          {
            name: { $t: 'Author Name' },
            uri: { $t: 'https://example.com/author' },
            gd$image: { src: 'https://img1.blogblog.com/img/b16-rounded.gif' },
          },
        ],
        link: [
          { rel: 'alternate', href: 'https://example.com', type: 'text/html' },
          { rel: 'self', href: 'https://example.com/feeds/posts/default', type: 'application/atom+xml' },
        ],
        entry: [
          {
            id: { $t: 'tag:blogger.com,1999:blog-1234567890123456789.post-555' },
            title: { $t: 'Fallback Avatar Post' },
            published: { $t: '2026-05-22T05:00:00.000Z' },
            updated: { $t: '2026-05-22T06:00:00.000Z' },
            link: [{ rel: 'alternate', href: 'https://example.com/2026/05/fallback-avatar-post.html', type: 'text/html' }],
            author: [{ name: { $t: 'Author Name' }, uri: { $t: 'https://example.com/author' } }],
          },
        ],
      },
    });

    expect(feed.blog).toEqual(
      expect.objectContaining({
        author: { name: 'Author Name', url: 'https://example.com/author', image: null },
      }),
    );
  });
});
