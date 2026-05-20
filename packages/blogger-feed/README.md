# @deox/blogger-feed

A lightweight, type-safe Blogger feed API client for fetching Blogger blog metadata, posts, pages, comments, and pagination data.

## Features

- Fetch blog metadata, recent posts, pages, and comments
- Strong TypeScript support with exported response models
- Built for Node.js and browser environments
- Supports ESM and CommonJS imports
- Automatic pagination handling with `next()` and `previous()` helpers
- Optional JSONP mode for browser usage

## Installation

Install the package using your preferred package manager:

```bash
npm install @deox/blogger-feed
```

```bash
yarn add @deox/blogger-feed
```

```bash
pnpm add @deox/blogger-feed
```

## Quick Start

Import the client and create a new `BloggerFeed` instance with a blog URL or Blogger blog ID.

```ts
import { BloggerFeed } from "@deox/blogger-feed";

const feed = new BloggerFeed("https://example-blog.blogspot.com");
```

## API Reference

### `new BloggerFeed(urlOrId, options?)`

Creates a new Blogger feed client.

- `urlOrId: string | URL` — Blogger blog URL or numeric blog ID
- `options.jsonp?: boolean` — enable JSONP callbacks in browser environments

Example:

```ts
const feed = new BloggerFeed("https://example-blog.blogspot.com", {
  jsonp: false,
});
```

### Static exports

- `BloggerFeed.SDKError` — SDK error type
- `BloggerFeed.SDKRequestError` — request error type
- `BloggerFeed.parseFeed` — parse raw Blogger feed objects

### `feed.blog.get()`

Fetch blog metadata.

```ts
const blog = await feed.blog.get();
if (!blog) {
  console.log("Blog not found");
  return;
}
console.log(blog.title, blog.url);
```

If the blog cannot be found, this method returns `null`.

### `feed.posts.list(options?)`

List posts with optional filters.

```ts
const postsPage = await feed.posts.list({
  maxResults: 5,
  orderBy: "published",
  label: "javascript",
});
```

Supported options:

- `maxResults?: number`
- `startIndex?: number`
- `orderBy?: 'published' | 'updated'`
- `publishedMin?: Date | string`
- `publishedMax?: Date | string`
- `updatedMin?: Date | string`
- `updatedMax?: Date | string`
- `label?: string`
- `summary?: boolean`

### `feed.posts.get(postId, options?)`

Retrieve a single post by ID.

```ts
const post = await feed.posts.get("12345");
if (!post) {
  console.log("Post not found");
}
```

If the post is not found, this method returns `null`.

Supported options:

- `summary?: boolean`

### `feed.posts.query(query, options?)`

Search posts with query.

```ts
const searchPage = await feed.posts.query("hello", { maxResults: 10 });
```

### `feed.pages.list(options?)`

List pages for the blog.

```ts
const pagesPage = await feed.pages.list({ maxResults: 10 });
```

Supported options:

- `maxResults?: number`
- `startIndex?: number`
- `orderBy?: 'published' | 'updated'`
- `publishedMin?: Date | string`
- `publishedMax?: Date | string`
- `updatedMin?: Date | string`
- `updatedMax?: Date | string`
- `summary?: boolean`

### `feed.pages.get(pageId, options?)`

Retrieve a single page by ID.

```ts
const page = await feed.pages.get("67890");
if (!page) {
  console.log("Page not found");
}
```

If the page is not found, this method returns `null`.

Supported options:

- `summary?: boolean`

### `feed.comments.list(options?)`

List comments for the blog or a specific post.

```ts
const commentsPage = await feed.comments.list({
  maxResults: 20,
  postId: "12345",
});
```

Supported options:

- `maxResults?: number`
- `startIndex?: number`
- `orderBy?: 'published' | 'updated'`
- `publishedMin?: Date | string`
- `publishedMax?: Date | string`
- `updatedMin?: Date | string`
- `updatedMax?: Date | string`
- `summary?: boolean`
- `postId?: string`

### `feed.comments.get(postId, commentId, options?)`

Retrieve a single comment by post and comment ID.

```ts
const comment = await feed.comments.get("12345", "67890");
if (!comment) {
  console.log("Comment not found");
}
```

If the comment is not found, this method returns `null`.

Supported options:

- `summary?: boolean`

## Pagination

List methods return a pagination object, not a bare array. The returned object includes:

- `items` — the current page of entries
- `itemsPerPage` — number of items returned in this page
- `startIndex` — index of the first item in the current page
- `totalResults` — total available entries
- `selfUrl` — current page URL
- `previousUrl` — previous page URL, if available
- `nextUrl` — next page URL, if available
- `next()` — fetch the next page or `null`
- `previous()` — fetch the previous page or `null`

Example:

```ts
const postsPage = await feed.posts.list({ maxResults: 5 });
console.log(postsPage.items.length);

const nextPage = await postsPage.next();
if (nextPage) {
  console.log(nextPage.items.length, "more posts");
}
```

## Types

The package exports helpful type definitions for TypeScript users, including:

- `Blog`
- `Post`
- `Comment`
- `Author`
- `Link`
- `Extended`
- `PostCommentInfo`
- `Feed`

These types describe the structure of Blogger feed responses and are available from the package exports.

## Browser Usage

To use the library in browser environments where CORS prevents direct JSON requests, enable JSONP mode:

```ts
const feed = new BloggerFeed("https://example-blog.blogspot.com", {
  jsonp: true,
});
```

> Note: JSONP mode is only supported in browser environments.
