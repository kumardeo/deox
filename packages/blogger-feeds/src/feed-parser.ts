import { isString, isArray, isObject, getNested } from "./utils";
import type {
	Links,
	Post,
	Geo,
	PostCommentInfo,
	Author,
	Extended,
	Blog,
	Comment,
	Feed
} from "./types";

/**
 * Gets the links details from link array
 *
 * @param linkArray The link array
 *
 * @returns An object containing link and links
 */
const getLink = (linkArray: unknown) => {
	const links: Links = {};
	let href: string | null = null;

	if (isArray(linkArray) && linkArray.length > 0) {
		for (let i = 0; i < linkArray.length; i += 1) {
			const link: unknown = linkArray[i];

			const linkRelLike = getNested(link, "rel");
			const linkHrefLike = getNested(link, "href");
			const linkTypeLike = getNested(link, "type");
			const linkTitleLike = getNested(link, "title");

			if (isString(linkRelLike) && isString(linkHrefLike)) {
				if (!isArray(links[linkRelLike])) {
					links[linkRelLike] = [];
				}
				links[linkRelLike]!.push({
					rel: linkRelLike,
					href: linkHrefLike,
					type: isString(linkTypeLike) ? linkTypeLike : null,
					title: isString(linkTitleLike) ? linkTitleLike : null
				});

				if (linkRelLike === "alternate" && linkTypeLike === "text/html") {
					href = linkHrefLike;
				}
			}
		}
	}

	return { link: href, links };
};

/**
 * Gets pagination urls from feed
 *
 * @param feed The feed object
 *
 * @returns An object containing `self`, `previous` and `next` url
 */
const getPagination = (feed: unknown) => {
	const result: {
		self: string;
		previous: string | null;
		next: string | null;
	} = {
		self: "",
		previous: null,
		next: null
	};

	const { links } = getLink(getNested(feed, "link"));

	if (links) {
		links.self?.forEach((link) => {
			if (link.type !== "text/html") result.self = link.href;
		});
		links.previous?.forEach((link) => {
			if (link.type !== "text/html") result.previous = link.href;
		});
		links.next?.forEach((link) => {
			if (link.type !== "text/html") result.next = link.href;
		});
	}

	return result;
};

/**
 * Gets category from category array
 *
 * @param categoryArray The category array
 *
 * @returns An Array of string representing categories
 */
const getCategory = (categoryArray: unknown) => {
	const categories: string[] = [];

	if (isArray(categoryArray) && categoryArray.length > 0) {
		for (let i = 0; i < categoryArray.length; i += 1) {
			const category: unknown = categoryArray[i];

			const categoryTermLike = getNested(category, "term");
			if (isString(categoryTermLike)) {
				categories.push(categoryTermLike);
			}
		}
	}

	return categories;
};

/**
 * Gets Geo details from post entry
 *
 * @param postEntry The post entry object
 *
 * @returns An object containing `box`, `featureName` and `point`
 */
const getGeo = (postEntry: unknown): Geo => {
	const [box, featureName, point] = [
		"georss$box",
		"georss$featurename",
		"georss$point"
	].map((key) => {
		const valueLike = getNested(postEntry, key, "$t");
		if (isString(valueLike)) {
			return valueLike;
		}
		return null;
	});

	return { box, featureName, point };
};

/**
 * Gets comments details from link array of a post entry object
 *
 * @param linkArray The link array
 *
 * @returns An object containing `feed`, `number` and `title`
 */
const getPostComments = (linkArray: unknown): PostCommentInfo => {
	const result: PostCommentInfo = {
		feed: null,
		number: null,
		title: null
	};

	const {
		links: { replies }
	} = getLink(linkArray);
	if (replies) {
		replies.forEach(({ title, type, href }) => {
			if (type === "text/html" && isString(title)) {
				const numberMatches = title.match(/\d+/);
				result.title = title;
				result.number =
					numberMatches && numberMatches[0]
						? parseInt(numberMatches[0], 10)
						: 0;
			} else if (type === "application/atom+xml" && isString(href)) {
				result.feed = href;
			}
		});
	}

	return result;
};

/**
 * Gets author information from author array
 *
 * @param authorArray The author array
 *
 * @returns An object containing `name`, `url`, `image` and `public`
 */
const getAuthors = (authorArray: unknown) => {
	const authors: Author[] = [];

	if (isArray(authorArray) && authorArray.length > 0) {
		for (let i = 0; i < authorArray.length; i += 1) {
			const author: unknown = authorArray[0];
			const authorNameLike = getNested(author, "name", "$t");
			const authorImageLike = getNested(author, "gd$image", "$t");
			const authorUriLike = getNested(author, "uri", "$t");

			const name = isString(authorNameLike) ? authorNameLike : "Unknown";
			const image =
				isString(authorImageLike) &&
				authorImageLike.trim().toLowerCase() !==
					"https://img1.blogblog.com/img/b16-rounded.gif"
					? authorImageLike
					: null;
			const url = isString(authorUriLike) ? authorUriLike : null;

			authors.push({ name, url, image, public: url !== null });
		}
	}

	return authors;
};

/**
 * Gets extended details from a comment entry object
 *
 * @param commentEntry The comment entry object
 *
 * @returns An object containing `class`, `time`, `removed`
 */
const getExtended = (commentEntry: unknown): Extended => {
	const result: Extended = {
		class: null,
		time: null,
		removed: false
	};

	const extendedArray = getNested(commentEntry, "gd$extendedProperty");

	if (
		isObject(commentEntry) &&
		isArray(extendedArray) &&
		extendedArray.length > 0
	) {
		for (let i = 0; i < extendedArray.length; i += 1) {
			const extended = (extendedArray[i] || {}) as Record<string, unknown>;
			const { name, value } = extended;
			if (isString(name) && isString(value)) {
				const data: {
					[key: string]: ["class" | "time" | "removed", string | boolean];
				} = {
					"blogger.itemClass": ["class", value],
					"blogger.displayTime": ["time", value],
					"blogger.contentRemoved": ["removed", value === "true"]
				};
				const dataArray = data[name];
				if (isArray(dataArray)) {
					const [key, val] = dataArray;
					if (key in result) {
						result[key] = val as never;
					}
				}
			}
		}
	}

	return result;
};

/**
 * Gets thumbnail urls from a post entry object
 *
 * @param postEntry The post entry object
 *
 * @returns An Array having 2 elements.
 * Element at index 0 will be thumbnail url or null from post entry.
 * Element at index 1 will be thumbnail url or null from post content otherwise post entry
 */
const getThumbnail = (postEntry: unknown) => {
	const postContentLike = getNested(postEntry, "content", "$t");
	const postSummaryLike = getNested(postEntry, "summary", "$t");
	const postMediaThumbnailLike = getNested(postEntry, "media$thumbnail", "url");

	let content: string | null = null;
	if (isString(postContentLike)) {
		content = postContentLike;
	} else if (isString(postSummaryLike)) {
		content = postSummaryLike;
	}

	const thumb: string | null = isString(postMediaThumbnailLike)
		? postMediaThumbnailLike
		: null;

	const result = [thumb, thumb] as [string | null, string | null];

	if (thumb !== null) {
		return result;
	}

	const matches = content
		? /<img +(.*?)src=([""])([^""]+?)([""])(.*?) *\/?>/i.exec(content)
		: null;

	if (matches && matches[3]) {
		result[1] = matches[3];
	}

	return result;
};

/**
 * Gets items per page number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The items per page number or `null`
 */
const getItemsPerPage = (feedObject: unknown): number | null => {
	const resultString = getNested(feedObject, "openSearch$itemsPerPage", "$t");

	if (isString(resultString)) {
		return Number(resultString);
	}

	return null;
};

/**
 * Gets start index number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The start index or `null`
 */
const getStartIndex = (feedObject: unknown): number | null => {
	const resultString = getNested(feedObject, "openSearch$startIndex", "$t");

	if (isString(resultString)) {
		return Number(resultString);
	}

	return null;
};

/**
 * Gets total result number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The total result or `null`
 */
const getTotalResult = (feedObject: unknown): number | null => {
	const resultString = getNested(feedObject, "openSearch$totalResults", "$t");

	if (isString(resultString)) {
		return Number(resultString);
	}

	return null;
};

/**
 * Gets blog details from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The {@link Blog} if available otherwise `null`
 */
const getBlog = (feedObject: unknown): Blog | null => {
	const feedIdLike = getNested(feedObject, "id", "$t");
	const feedTitleLike = getNested(feedObject, "title", "$t");
	const feedSubtitleLike = getNested(feedObject, "subtitle", "$t");
	const feedUpdatedLike = getNested(feedObject, "updated", "$t");
	const feedLinkLike = getNested(feedObject, "link");
	const { link, links } = getLink(feedLinkLike);

	if (
		isObject(feedObject) &&
		isString(feedIdLike) &&
		isString(feedTitleLike) &&
		isString(feedUpdatedLike) &&
		isString(link)
	) {
		const feedCategoryLike = getNested(feedObject, "category");

		const blog = {
			id: feedIdLike.replace(/^.*blog-(\d+).*$/, "$1"),
			title: feedTitleLike,
			subtitle: isString(feedSubtitleLike) ? feedSubtitleLike : null,
			category: getCategory(feedCategoryLike),
			link,
			links,
			updated: feedUpdatedLike,
			author: getAuthors(getNested(feedObject, "author"))[0]
		};

		return blog;
	}

	return null;
};

/**
 * Gets post details from post entry object
 *
 * @param postEntry The post entry object
 *
 * @returns The {@link Post} if available otherwise `null`
 */
const getPost = (postEntry: unknown): Post | null => {
	const postIdLike = getNested(postEntry, "id", "$t");
	const postTitleLike = getNested(postEntry, "title", "$t");
	const postPublishedLike = getNested(postEntry, "published", "$t");
	const postUpdatedLike = getNested(postEntry, "updated", "$t");
	const postSummaryLike = getNested(postEntry, "summary", "$t");
	const postContentLike = getNested(postEntry, "content", "$t");
	const postLinkLike = getNested(postEntry, "link");
	const { link, links } = getLink(postLinkLike);

	if (
		isObject(postEntry) &&
		isString(link) &&
		isString(postIdLike) &&
		isString(postTitleLike) &&
		isString(postPublishedLike) &&
		isString(postUpdatedLike)
	) {
		const [thumbnail, thumbnailAlt] = getThumbnail(postEntry);

		const post: Post = {
			id: postIdLike.replace(/^.*(?:page|post)-(\d+)$/, "$1"),
			title: postTitleLike,
			published: postPublishedLike,
			updated: postUpdatedLike,
			category: getCategory(getNested(postEntry, "category")),
			link,
			links,
			author: getAuthors(getNested(postEntry, "author"))[0],
			thumbnail,
			thumbnailAlt,
			summary: isString(postSummaryLike) ? postSummaryLike : null,
			content: isString(postContentLike) ? postContentLike : null,
			comments: getPostComments(postLinkLike),
			geo: getGeo(postEntry)
		};

		return post;
	}

	return null;
};

/**
 * Gets comment details from comment entry object
 *
 * @param commentEntry The comment entry object
 *
 * @returns The {@link Comment} if available otherwise `null`
 */
const getComment = (commentEntry: unknown): Comment | null => {
	const commentIdLike = getNested(commentEntry, "id", "$t");
	const commentTitleLike = getNested(commentEntry, "title", "$t");
	const commentPublishedLike = getNested(commentEntry, "published", "$t");
	const commentUpdatedLike = getNested(commentEntry, "updated", "$t");
	const commentInReplyToLike = getNested(commentEntry, "thr$in-reply-to");
	const commentInReplyToHrefLike = getNested(commentInReplyToLike, "href");
	const commentInReplyToRefLike = getNested(commentInReplyToLike, "ref");
	const commentSummaryLike = getNested(commentEntry, "summary", "$t");
	const commentContentLike = getNested(commentEntry, "content", "$t");
	const commentLinkLike = getNested(commentEntry, "link");
	const { link, links } = getLink(commentLinkLike);

	if (
		isObject(commentEntry) &&
		isString(link) &&
		isString(commentIdLike) &&
		isString(commentTitleLike) &&
		isString(commentPublishedLike) &&
		isString(commentUpdatedLike) &&
		isString(commentInReplyToHrefLike) &&
		isString(commentInReplyToRefLike)
	) {
		const inReplyToMatches = links.related?.[0].href.match(
			/\/feeds\/(.*)\/comments\/[^/]+\/(\d+)/
		);

		const comment: Comment = {
			title: commentTitleLike,
			published: commentPublishedLike,
			updated: commentUpdatedLike,
			link,
			links,
			author: getAuthors(getNested(commentEntry, "author"))[0],
			summary: isString(commentSummaryLike) ? commentSummaryLike : null,
			content: isString(commentContentLike) ? commentContentLike : null,
			extended: getExtended(commentEntry),
			id: commentIdLike.replace(/^.*(?:page|post)-(\d+)$/, "$1"),
			post: {
				id: commentInReplyToRefLike.replace(/^.*(?:page|post)-(\d+)$/, "$1"),
				link: commentInReplyToHrefLike.split("?")[0]
			},
			inReplyTo:
				inReplyToMatches && inReplyToMatches[2] ? inReplyToMatches[2] : null
		};

		return comment;
	}

	return null;
};

/**
 * Gets the posts and comments from entry array
 *
 * @param entryArray The array of entry object
 *
 * @returns An object containing `posts` and `comments`
 */
const getEntries = (entryArray: unknown) => {
	let posts: Post[] | null = null;
	let comments: Comment[] | null = null;

	if (isArray(entryArray)) {
		posts = [];
		comments = [];

		if (entryArray.length > 0) {
			for (let i = 0; i < entryArray.length; i += 1) {
				const post: unknown = entryArray[i];
				if (isObject(post)) {
					if ("thr$in-reply-to" in post) {
						const commentLike = getComment(post);
						if (commentLike) {
							comments.push(commentLike);
						}
					} else {
						const postLike = getPost(post);
						if (postLike) {
							posts.push(postLike);
						}
					}
				}
			}
		}
	}

	return { posts, comments };
};

/**
 * Gets all possible information from entry object and feed object
 *
 * @param entryArray The entry array
 * @param feed The feed object
 *
 * @returns An object
 */
const getFeedFromEntry = (entryArray: unknown, feedObject?: unknown) => {
	const { posts, comments } = getEntries(entryArray);

	const feed: Feed = {
		blog: getBlog(feedObject),
		links: getLink(getNested(feedObject, "link")).links,
		posts,
		comments,
		itemsPerPage: getItemsPerPage(feedObject),
		startIndex: getStartIndex(feedObject),
		totalResults: getTotalResult(feedObject),
		pagination: getPagination(feedObject)
	};

	return feed;
};

/**
 * Get entry array from input
 *
 * @param input The input
 *
 * if input is an object add it to an array
 * else if input is an array use it
 * otherwise null
 *
 * @returns Array of entry object
 */
const getEntryArray = (input: unknown) => {
	if (isArray(input)) {
		return input as unknown[];
	}
	if (isObject(input)) {
		return [input];
	}
	return null;
};

/**
 * Get the information from Blogger feed json object
 *
 * @param input A feed object
 *
 * Possible inputs:
 *
 * ```ts
 * type Input =
 *   | { feed: { entry?: object | unknown[] } }
 *   | { entry?: object | unknown[] }
 * ```
 *
 * @returns An object containing information from feed
 */
export const parseFeed = (input: unknown) => {
	const inputFeedLike = getNested(input, "feed");

	// Check if input.feed is an object
	if (isObject(inputFeedLike)) {
		const inputFeedEntryLike = getNested(inputFeedLike, "entry");
		return getFeedFromEntry(getEntryArray(inputFeedEntryLike), inputFeedLike);
	}

	const inputEntryLike = getNested(input, "entry");
	return getFeedFromEntry(getEntryArray(inputEntryLike));
};
