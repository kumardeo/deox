---
"@deox/blogger-feed": minor
---

**Pagination API has changed**

List methods now return a pagination object instead of an array with mixed pagination properties.

Before:

```ts
const feed = new BloggerFeed(url);
const posts = await feed.posts.list();

posts[0];
posts.next();
```

Now:

```ts
const feed = new BloggerFeed(url);
const posts = await feed.posts.list();

posts.items[0];
posts.next();
```

This affects all list methods:

- `BloggerFeed.posts.list`
- `BloggerFeed.pages.list`
- `BloggerFeed.comments.list`
