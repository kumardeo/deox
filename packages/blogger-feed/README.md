# @deox/blogger-feed

A blogger feed API client.

## Installation

Install the package by running the following command in terminal:

```shell
npm install @deox/blogger-feed
```

## Usage

The module can be imported using `import` in ES Modules and `require` in Common JS as shown below:

ES Modules:

```ts
// index.ts
import { BloggerFeed } from "@deox/blogger-feed";

// ...
```

Common JS:

```cjs
// index.cjs
const { BloggerFeed } = require("@deox/blogger-feed");

// ...
```

## API

Some examples are:

```ts
// index.ts
import { BloggerFeed } from "@deox/blogger-feed";

const feed = new BloggerFeed("https://blogger-blog.blogspot.com");

(async () => {
  const blog = await feed.blog.get(); // type: Blog

  const posts = await feed.posts.list({ maxResults: 5 }); // type: Post[]

  const pages = await feed.pages.list(); // type: Post[]

  const comments = await feed.comments.list({ maxResults: 20 }); // type: Comment[]

  // ...
})();
```

There are more methods. You can explore it by installing the package!
