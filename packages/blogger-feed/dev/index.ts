import { BloggerFeed } from '../src';

const feed = new BloggerFeed('https://www.fineshopdesign.com', {
  jsonp: true,
});

(async () => {
  // Blog.get
  const _blog_get = await feed.blog.get();
  console.info('.blog.get():', _blog_get);

  // Posts.list
  const _posts_list = await feed.posts.list({
    maxResults: 4,
    startIndex: 2,
    orderBy: 'updated',
    summary: true,
  });
  console.info('.posts.list():', _posts_list);

  // Posts.list => .previous()
  const _posts_list_previous = await _posts_list.previous();
  console.info('.posts.list() => .previous():', _posts_list_previous);

  // Posts.list => .next()
  const _posts_list_next = await _posts_list.next();
  console.info('.posts.list() => .next():', _posts_list_next);

  // Posts.list label
  const _posts_list_label = await feed.posts.list({ label: 'Cloudflare' });
  console.info('.posts.list({ label })', _posts_list_label);

  // Posts.get
  const _posts_get = await feed.posts.get(_posts_list[0].id);
  console.info('.posts.get():', _posts_get);

  // Posts.query
  const _posts_query = await feed.posts.query('Adsense');
  console.info('.posts.query():', _posts_query);

  // Pages.list
  const _pages_list = await feed.pages.list();
  console.info('.pages.list():', _pages_list);

  // Pages.get
  const _pages_get = await feed.pages.get(_pages_list[0].id);
  console.info('.pages.get():', _pages_get);

  // Comments.list
  const _comments_list = await feed.comments.list({
    maxResults: 50,
    postId: '4990960623216260259',
  });
  console.info('.comments.list():', _comments_list);

  // Comments.get
  const _comments_get = await feed.comments.get(_comments_list[0].post.id, _comments_list[0].id);
  console.info('.comments.get():', _comments_get);
})().catch(console.error);

// Expose to window
(window as unknown as { feed: BloggerFeed }).feed = feed;
