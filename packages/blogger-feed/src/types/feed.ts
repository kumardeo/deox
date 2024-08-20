export interface Author {
  /**
   * The name of the author if available otherwise null
   */
  name: string | null;

  /**
   * The profile url of the author if available otherwise null
   */
  url: string | null;

  /**
   * The image url of the author if available otherwise null
   */
  image: string | null;

  /**
   * Indicates whether author profile is publicly accessible
   */
  public: boolean;
}

export interface Extended {
  /**
   * The unique css class for the author (can be null)
   */
  class: string | null;

  /**
   * The formatted time when the comment was published (can be null)
   */
  time: string | null;

  /**
   * Indicates whether comment is removed
   */
  removed: boolean;
}

export interface Link {
  rel: string;
  href: string;
  type: string | null;
  title: string | null;
}

export type Links = Record<string, Link[] | undefined>;

export type Geo = {
  box: string | null;
  featureName: string | null;
  point: string | null;
};

export interface Blog {
  /**
   * The title of the blog
   */
  title: string;

  /**
   * The subtitle of the blog
   */
  subtitle: string | null;

  /**
   * An array of string
   * representing all the available labels in the blog
   */
  labels: string[];

  /**
   * The url of the blog
   */
  url: string;

  links: Links;

  /**
   * The id of the blog
   */
  id: string;

  /**
   * The time as string when the blog was last updated
   */
  updated: string;

  /**
   * Contains information about the author of the blog
   */
  author: Author;
}

export interface PostCommentInfo {
  feed: string | null;
  number: number | null;
  title: string | null;
}

export interface Post {
  /**
   * The title of the post
   */
  title: string;

  /**
   * The published time of the post
   */
  published: string;

  /**
   * The updated time of the post
   */
  updated: string;

  /**
   * An Array of string
   * representing labels of the post
   */
  labels: string[];

  /**
   * The url of the post
   */
  url: string;

  links: Links;

  /**
   * The id of the post
   */
  id: string;

  /**
   * Contains information about the author of the post
   */
  author: Author;

  /**
   * The thumbnail of the post if available
   * (it can be image from content) otherwise null
   */
  thumbnail: string | null;

  /**
   * The thumbnail of the post
   * (selected by blogger) if available otherwise null
   */
  thumbnailAlt: string | null;

  /**
   * The summary of the post if available otherwise null
   */
  summary: string | null;

  /**
   * The full content of the post if available otherwise null
   */
  content: string | null;

  /**
   * Contains information about comments of the post
   */
  comments: PostCommentInfo;

  /**
   * Contains information about geolocation of the post
   */
  geo: Geo;
}

export interface Comment {
  /**
   * The title of the comment
   */
  title: string;

  /**
   * The published time of the comment
   */
  published: string;

  /**
   * The last updated time of the comment
   */
  updated: string;

  /**
   * The url of the comment
   */
  url: string;

  links: Links;

  id: string;

  /**
   * Contains information about the author of the comment
   */
  author: Author;

  /**
   * The summary of the comment if available otherwise null
   */
  summary: string | null;

  /**
   * The content of the comment if available otherwise null
   */
  content: string | null;

  /**
   * Contains more information about the comment
   */
  extended: Extended;

  /**
   * Contains information about the post
   * on which the comment was posted
   */
  post: {
    /**
     * The id of the post
     */
    id: string;

    /**
     * The url of the post
     */
    url: string;
  };

  /**
   * If the comment is reply to another comment,
   * it will be the id of that comment otherwise null
   */
  inReplyTo: string | null;
}

export interface Pagination {
  self: string;
  previous: string | null;
  next: string | null;
}

export interface Feed {
  blog: Blog | null;
  links: Links;
  posts: Post[] | null;
  comments: Comment[] | null;
  itemsPerPage: number | null;
  startIndex: number | null;
  totalResults: number | null;
  pagination: Pagination;
}
