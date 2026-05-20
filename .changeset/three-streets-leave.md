---
"@deox/blogger-feed": minor
---

**`get` methods now return `null`**

`get` methods now return `null` when an entity is not found instead of throwing `SDKInputNotFoundError`.

The `SDKInputNotFoundError` class has been removed.

Before:

```ts
const feed = new BloggerFeed(url);

try {
  const post = await feed.posts.get(id);
} catch (error) {
  if (error instanceof SDKInputNotFoundError) {
    // handle not found
  }
}
```

Now:

```ts
const feed = new BloggerFeed(url);
const post = await feed.posts.get(id);

if (post === null) {
  // handle not found
}
```

This affects:

- `BloggerFeed.blog.get`
- `BloggerFeed.posts.get`
- `BloggerFeed.pages.get`
- `BloggerFeed.comments.get`
