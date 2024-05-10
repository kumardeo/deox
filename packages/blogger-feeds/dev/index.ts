/* eslint-disable no-console */

import { BloggerFeed } from "../src";

const feed = new BloggerFeed("https://www.fineshopdesign.com", {
	jsonp: true
});

(async () => {
	// Blog.get
	await feed.blog.get().then((blog) => {
		console.info(".blog.get():", blog);
	});

	// Posts.list
	const _posts = await feed.posts
		.list({
			maxResults: 4,
			startIndex: 2,
			summary: true
		})
		.then((posts) => {
			console.info(".posts.list():", posts);
			return posts;
		});

	// Posts.get
	await feed.posts.get(_posts[0].id).then((post) => {
		console.info(".posts.get():", post);
	});

	// Posts.query
	await feed.posts.query("Adsense").then((posts) => {
		console.info(".posts.query():", posts);
	});

	// Pages.list
	const _pages = await feed.pages.list().then((pages) => {
		console.info(".pages.list():", pages);
		return pages;
	});

	// Pages.get
	await feed.pages.get(_pages[0].id).then((page) => {
		console.info(".pages.get():", page);
	});

	// Comments.list
	const _comments = await feed.comments
		.list({ maxResults: 50, post_id: "4990960623216260259" })
		.then((comments) => {
			console.info(".comments.list():", comments);
			return comments;
		});

	// Comments.get
	await feed.comments
		.get(_comments[0].post.id, _comments[0].id)
		.then((comment) => {
			console.info(".comments.get():", comment);
		});
})().catch(console.error);

// Expose to window
(window as unknown as { feed: BloggerFeed }).feed = feed;
