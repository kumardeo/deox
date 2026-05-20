import type { Author, Blog, Comment, Extended, Feed, Geo, Link, Post, PostCommentInfo } from './types';
import { getNested, isArray, isObject, isString } from './utils';

/**
 * Gets the links details from link array
 *
 * @param linkArray The link array
 *
 * @returns An object containing link and links
 */
function getLinks(linkArray: unknown): { alternate: string | null; links: Link[] } {
  const links: Link[] = [];
  let href: string | null = null;

  if (isArray(linkArray) && linkArray.length > 0) {
    for (let i = 0; i < linkArray.length; i += 1) {
      const link: unknown = linkArray[i];

      const linkRelLike = getNested(link, 'rel');
      const linkHrefLike = getNested(link, 'href');
      const linkTypeLike = getNested(link, 'type');
      const linkTitleLike = getNested(link, 'title');

      if (isString(linkRelLike) && isString(linkHrefLike)) {
        links.push({
          rel: linkRelLike,
          href: linkHrefLike,
          type: isString(linkTypeLike) ? linkTypeLike : null,
          title: isString(linkTitleLike) ? linkTitleLike : null,
        });

        if (linkRelLike === 'alternate' && linkTypeLike === 'text/html') {
          href = linkHrefLike;
        }
      }
    }
  }

  return { alternate: href, links };
}

/**
 * Gets pagination urls from feed
 *
 * @param feed The feed object
 *
 * @returns An object containing `self`, `previous` and `next` url
 */
function getPagination(feed: unknown): Record<'self' | 'previous' | 'next', string | null> {
  const result: Record<'self' | 'previous' | 'next', string | null> = { self: null, previous: null, next: null };

  const { links } = getLinks(getNested(feed, 'link'));

  for (let i = 0; i < links.length; i += 1) {
    const { rel, href, type } = links[i];
    if (type === 'text/html') {
      continue;
    }
    if (rel === 'self') {
      result.self = href;
    } else if (rel === 'previous') {
      result.previous = href;
    } else if (rel === 'next') {
      result.next = href;
    }
  }

  return result;
}

/**
 * Gets category from category array
 *
 * @param categoryArray The category array
 *
 * @returns An Array of string representing categories
 */
function getLabels(categoryArray: unknown): string[] {
  const labels: string[] = [];

  if (isArray(categoryArray) && categoryArray.length > 0) {
    for (let i = 0; i < categoryArray.length; i += 1) {
      const category: unknown = categoryArray[i];

      const categoryTermLike = getNested(category, 'term');
      if (isString(categoryTermLike)) {
        labels.push(categoryTermLike);
      }
    }
  }

  return labels;
}

/**
 * Gets Geo details from post entry
 *
 * @param postEntry The post entry object
 *
 * @returns An object containing `box`, `featureName` and `point`
 */
function getGeo(postEntry: unknown): Geo {
  const [box, featureName, point] = ['georss$box', 'georss$featurename', 'georss$point'].map((key) => {
    const valueLike = getNested(postEntry, key, '$t');
    if (isString(valueLike)) {
      return valueLike;
    }
    return null;
  });

  return { box, featureName, point };
}

/**
 * Gets comments details from link array of a post entry object
 *
 * @param linkArray The link array
 *
 * @returns An object containing `feed`, `number` and `title`
 */
function getPostComments(linkArray: unknown): PostCommentInfo {
  const result: PostCommentInfo = { feed: null, number: null, title: null };

  const replies = getLinks(linkArray).links.filter((link) => link.rel === 'replies');
  if (replies) {
    for (const { title, type, href } of replies) {
      if (type === 'text/html' && isString(title)) {
        const numberMatches = title.match(/\d+/);
        result.title = title;
        result.number = numberMatches?.[0] ? Number.parseInt(numberMatches[0], 10) : 0;
      } else if (type === 'application/atom+xml' && isString(href)) {
        result.feed = href;
      }
    }
  }

  return result;
}

/**
 * Gets authors from author array
 *
 * @param authorArray The author array
 *
 * @returns An object containing `name`, `url`, `image` and `public`
 */
function getAuthors(authorArray: unknown): Author[] {
  const authors: Author[] = [];

  if (isArray(authorArray) && authorArray.length > 0) {
    for (let i = 0; i < authorArray.length; i += 1) {
      const author: unknown = authorArray[0];
      const authorNameLike = getNested(author, 'name', '$t');
      const authorUriLike = getNested(author, 'uri', '$t');
      const authorImageLike = getNested(author, 'gd$image', 'src');

      const name = isString(authorNameLike) ? authorNameLike : 'Unknown';
      const image =
        isString(authorImageLike) && authorImageLike.trim().toLowerCase() !== 'https://img1.blogblog.com/img/b16-rounded.gif'
          ? authorImageLike
          : null;
      const url = isString(authorUriLike) ? authorUriLike : null;

      authors.push({ name, url, image });
    }
  }

  return authors;
}

/**
 * Gets extended details from a comment entry object
 *
 * @param commentEntry The comment entry object
 *
 * @returns An object containing `class`, `time`, `removed`
 */
function getExtended(commentEntry: unknown): Extended {
  const result: Extended = { class: null, time: null, removed: false };

  const extendedArray = getNested(commentEntry, 'gd$extendedProperty');

  if (isObject(commentEntry) && isArray(extendedArray) && extendedArray.length > 0) {
    for (let i = 0; i < extendedArray.length; i += 1) {
      const extended = (extendedArray[i] || {}) as Record<string, unknown>;
      const { name, value } = extended;
      if (isString(name) && isString(value)) {
        const data: Record<string, ['class' | 'time' | 'removed', string | boolean]> = {
          'blogger.itemClass': ['class', value],
          'blogger.displayTime': ['time', value],
          'blogger.contentRemoved': ['removed', value === 'true'],
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
}

/**
 * Gets thumbnail urls from a post entry object
 *
 * @param postEntry The post entry object
 *
 * @returns An Array having 2 elements.
 * Element at index 0 will be thumbnail url or null from post entry.
 * Element at index 1 will be thumbnail url or null from post content otherwise post entry
 */
function getThumbnail(postEntry: unknown): [string | null, string | null] {
  const postMediaThumbnailLike = getNested(postEntry, 'media$thumbnail', 'url');

  const thumbnail: string | null = isString(postMediaThumbnailLike) ? postMediaThumbnailLike : null;

  const result: [string | null, string | null] = [thumbnail, thumbnail];

  if (thumbnail !== null) {
    return result;
  }

  const postContentLike = getNested(postEntry, 'content', '$t');
  const postSummaryLike = getNested(postEntry, 'summary', '$t');

  let content: string | null = null;
  if (isString(postContentLike)) {
    content = postContentLike;
  } else if (isString(postSummaryLike)) {
    content = postSummaryLike;
  }

  const matches = content ? /<img +(.*?)src=([""])([^""]+?)([""])(.*?) *\/?>/i.exec(content) : null;

  if (matches?.[3]) {
    result[1] = matches[3];
  }

  return result;
}

/**
 * Gets items per page number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The items per page number or `null`
 */
function getItemsPerPage(feedObject: unknown): number | null {
  const resultString = getNested(feedObject, 'openSearch$itemsPerPage', '$t');

  if (isString(resultString)) {
    return Number(resultString);
  }

  return null;
}

/**
 * Gets start index number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The start index or `null`
 */
function getStartIndex(feedObject: unknown): number | null {
  const resultString = getNested(feedObject, 'openSearch$startIndex', '$t');

  if (isString(resultString)) {
    return Number(resultString);
  }

  return null;
}

/**
 * Gets total result number from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The total result or `null`
 */
function getTotalResult(feedObject: unknown): number | null {
  const resultString = getNested(feedObject, 'openSearch$totalResults', '$t');

  if (isString(resultString)) {
    return Number(resultString);
  }

  return null;
}

/**
 * Gets blog details from feed object
 *
 * @param feedObject The feed object
 *
 * @returns The {@link Blog} if available otherwise `null`
 */
function getBlog(feedObject: unknown): Blog | null {
  const feedIdLike = getNested(feedObject, 'id', '$t');
  const feedTitleLike = getNested(feedObject, 'title', '$t');
  const feedSubtitleLike = getNested(feedObject, 'subtitle', '$t');
  const feedUpdatedLike = getNested(feedObject, 'updated', '$t');
  const feedLinkLike = getNested(feedObject, 'link');
  const { alternate, links } = getLinks(feedLinkLike);

  if (isObject(feedObject) && isString(feedIdLike) && isString(feedTitleLike) && isString(feedUpdatedLike) && isString(alternate)) {
    const feedCategoryLike = getNested(feedObject, 'category');

    return {
      id: feedIdLike.replace(/^.*blog-(\d+).*$/, '$1'),
      title: feedTitleLike,
      subtitle: isString(feedSubtitleLike) ? feedSubtitleLike : null,
      labels: getLabels(feedCategoryLike),
      url: alternate,
      links,
      updated: feedUpdatedLike,
      author: getAuthors(getNested(feedObject, 'author'))[0],
    };
  }

  return null;
}

/**
 * Gets post details from post entry object
 *
 * @param postEntry The post entry object
 *
 * @returns The {@link Post} if available otherwise `null`
 */
function getPost(postEntry: unknown): Post | null {
  const postIdLike = getNested(postEntry, 'id', '$t');
  const postTitleLike = getNested(postEntry, 'title', '$t');
  const postPublishedLike = getNested(postEntry, 'published', '$t');
  const postUpdatedLike = getNested(postEntry, 'updated', '$t');
  const postSummaryLike = getNested(postEntry, 'summary', '$t');
  const postContentLike = getNested(postEntry, 'content', '$t');
  const postLinkLike = getNested(postEntry, 'link');
  const { alternate, links } = getLinks(postLinkLike);

  if (
    isObject(postEntry) &&
    isString(alternate) &&
    isString(postIdLike) &&
    isString(postTitleLike) &&
    isString(postPublishedLike) &&
    isString(postUpdatedLike)
  ) {
    const [thumbnail, thumbnailAlt] = getThumbnail(postEntry);

    return {
      id: postIdLike.replace(/^.*(?:page|post)-(\d+)$/, '$1'),
      title: postTitleLike,
      published: postPublishedLike,
      updated: postUpdatedLike,
      labels: getLabels(getNested(postEntry, 'category')),
      url: alternate,
      links,
      author: getAuthors(getNested(postEntry, 'author'))[0],
      thumbnail,
      thumbnailAlt,
      summary: isString(postSummaryLike) ? postSummaryLike : null,
      content: isString(postContentLike) ? postContentLike : null,
      comments: getPostComments(postLinkLike),
      geo: getGeo(postEntry),
    };
  }

  return null;
}

/**
 * Gets comment details from comment entry object
 *
 * @param commentEntry The comment entry object
 *
 * @returns The {@link Comment} if available otherwise `null`
 */
function getComment(commentEntry: unknown): Comment | null {
  const commentIdLike = getNested(commentEntry, 'id', '$t');
  const commentTitleLike = getNested(commentEntry, 'title', '$t');
  const commentPublishedLike = getNested(commentEntry, 'published', '$t');
  const commentUpdatedLike = getNested(commentEntry, 'updated', '$t');
  const commentInReplyToLike = getNested(commentEntry, 'thr$in-reply-to');
  const commentInReplyToHrefLike = getNested(commentInReplyToLike, 'href');
  const commentInReplyToRefLike = getNested(commentInReplyToLike, 'ref');
  const commentSummaryLike = getNested(commentEntry, 'summary', '$t');
  const commentContentLike = getNested(commentEntry, 'content', '$t');
  const commentLinkLike = getNested(commentEntry, 'link');
  const { alternate, links } = getLinks(commentLinkLike);

  if (
    isObject(commentEntry) &&
    isString(alternate) &&
    isString(commentIdLike) &&
    isString(commentTitleLike) &&
    isString(commentPublishedLike) &&
    isString(commentUpdatedLike) &&
    isString(commentInReplyToHrefLike) &&
    isString(commentInReplyToRefLike)
  ) {
    const inReplyToMatches = links.find((link) => link.rel === 'related')?.href.match(/\/feeds\/(.*)\/comments\/[^/]+\/(\d+)/);

    return {
      title: commentTitleLike,
      published: commentPublishedLike,
      updated: commentUpdatedLike,
      url: alternate,
      links,
      author: getAuthors(getNested(commentEntry, 'author'))[0],
      summary: isString(commentSummaryLike) ? commentSummaryLike : null,
      content: isString(commentContentLike) ? commentContentLike : null,
      extended: getExtended(commentEntry),
      id: commentIdLike.replace(/^.*(?:page|post)-(\d+)$/, '$1'),
      post: {
        id: commentInReplyToRefLike.replace(/^.*(?:page|post)-(\d+)$/, '$1'),
        url: commentInReplyToHrefLike.split('?')[0],
      },
      inReplyTo: inReplyToMatches?.[2] ?? null,
    };
  }

  return null;
}

/**
 * Gets the posts and comments from entry array
 *
 * @param entryArray The array of entry object
 *
 * @returns An object containing `posts` and `comments`
 */
function getEntries(entryArray: unknown): { posts: Post[] | null; comments: Comment[] | null } {
  let posts: Post[] | null = null;
  let comments: Comment[] | null = null;

  if (isArray(entryArray)) {
    posts = [];
    comments = [];

    if (entryArray.length > 0) {
      for (let i = 0; i < entryArray.length; i += 1) {
        const post: unknown = entryArray[i];
        if (isObject(post)) {
          if ('thr$in-reply-to' in post) {
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
}

/**
 * Gets all possible information from entry object and feed object
 *
 * @param entryArray The entry array
 * @param feed The feed object
 *
 * @returns An object
 */
function getFeedFromEntry(entryArray: unknown, feedObject?: unknown): Feed {
  const { posts, comments } = getEntries(entryArray);

  const pagination = getPagination(feedObject);

  return {
    blog: getBlog(feedObject),
    links: getLinks(getNested(feedObject, 'link')).links,
    posts,
    comments,
    itemsPerPage: getItemsPerPage(feedObject),
    startIndex: getStartIndex(feedObject),
    totalResults: getTotalResult(feedObject),
    selfUrl: pagination.self,
    previousUrl: pagination.previous,
    nextUrl: pagination.next,
  };
}

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
function getEntryArray(input: unknown): unknown[] | null {
  if (isArray(input)) {
    return input as unknown[];
  }
  if (isObject(input)) {
    return [input];
  }
  return null;
}

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
export function parseFeed(input: unknown): Feed {
  const inputFeedLike = getNested(input, 'feed');

  // Check if input.feed is an object
  if (isObject(inputFeedLike)) {
    const inputFeedEntryLike = getNested(inputFeedLike, 'entry');
    return getFeedFromEntry(getEntryArray(inputFeedEntryLike), inputFeedLike);
  }

  const inputEntryLike = getNested(input, 'entry');
  return getFeedFromEntry(getEntryArray(inputEntryLike));
}
